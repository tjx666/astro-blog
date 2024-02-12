---
title: TS 类型体操实例解析
pubDatetime: 2022-03-25
modDatetime: 2022-03-25
---

周会的分享内容，通过解析几个实用或者有趣的类型体操实例给大家分享一些 TypeScript 类型知识。也算是对自己刷了近 100 道 [type-challenges](https://github.com/type-challenges/type-challenges) 学到的知识做个小总结。由于分享时间有限，所有其实还有很多学到的知识没有涉及到。

## 什么是类型体操

- 高阶函数：传入函数，返回另一个函数。
- 高阶组件：传入一个组件，返回另一个组件。
- 高阶类型：传入类型，返回另一个类型。

在 TypeScript 中，我们可以使用 type 去定义一些复杂类型，type 可以声明泛型参数，去让使用者传入类型，通过一系列的转换返回应该新的类型。其实可以简单把 TypeScript 中的 type 理解为类型空间里的函数：

```ts
type MyPartial<T> = {
  [K in keyof T]?: T[K];
};

interface Person {
  name: string;
  age: number;
}

type R = MyPartial<Person>;
/*
type R = {
    name?: string;
    age?: number;
}
*/
```

> 类型体操就是实现一些具有特殊功能的高阶类型

## SimpleVue

实现一个类型，让它可以实现 Vue Options API 的 TS 类型检查。其实需求可以拆分成以下几个问题：

1. data 方法中不能访问到 computed 和 methods 中的属性
2. computed 中的 this 可以访问到 data 的属性
3. methods 中的 this 可以访问到 data 和 computed 的属性
4. methods 中的 this 访问 computed 的属性的值类型是 computed 中方法的返回值类型

```ts
SimpleVue({
  data() {
    // @ts-expect-error
    this.firstname;
    // @ts-expect-error
    this.getRandom();
    // @ts-expect-error
    this.data();

    return {
      firstname: 'Type',
      lastname: 'Challenges',
      amount: 10,
    };
  },
  computed: {
    fullname() {
      return `${this.firstname} ${this.lastname}`;
    },
  },
  methods: {
    getRandom() {
      return Math.random();
    },
    hi() {
      alert(this.amount);
      alert(this.fullname.toLowerCase());
      alert(this.getRandom());
    },
  },
});
```

### 函数的 this 参数

```ts
declare function SimpleVue(options: {
  // 函数的 this 参数是 TS 函数中的一个特殊参数，用来约束函数的 this 类型
  // 声明 this 参数为空类型
  data: (this: {}) => any;
}): any;

SimpleVue({
  data() {
    // @ts-expect-error
    this.firstname;
    // @ts-expect-error
    this.getRandom();
    // @ts-expect-error
    this.data();

    return {
      firstname: 'Type',
      lastname: 'Challenges',
      amount: 10,
    };
  },
});
```

### ThisType

ThisType 是 TypeScript 内置的一个工具类型，它可以用来标记一个对象类型中方法的 this 类型。

例如：

```ts
type ObjectDescriptor<D, M> = {
  data?: D;
  methods?: M & ThisType<D & M>; // Type of 'this' in methods is D & M
};

function makeObject<D, M>(desc: ObjectDescriptor<D, M>): D & M {
  let data: object = desc.data || {};
  let methods: object = desc.methods || {};
  return { ...data, ...methods } as D & M;
}

let obj = makeObject({
  data: { x: 0, y: 0 },
  methods: {
    moveBy(dx: number, dy: number) {
      this.x += dx; // Strongly typed this
      this.y += dy; // Strongly typed this
    },
  },
});

obj.x = 10;
obj.y = 20;
obj.moveBy(5, 5);
```

理解了 TypeType 我们就可以解决第二，三个问题了。

### 模式匹配

在编写一些复杂类型的时候，我们经常需要使用模式匹配来让编译器帮我们推测出一个类型中的子类型。

PromiseValue 类型算是一个常用而且实现上也非常简单的模式匹配的应用。

```ts
type PromiseValue<P extends Promise<unknown>> = P extends Promise<infer V> ? V : never;
type V = PromiseValue<Promise<number>>; // => number
```

注意到这个实现还用到了条件类型和 infer 运算符。

条件类型让 TS 的类型空间有了条件控制流，使用形式：

```ts
// 如果 A 是 B 的子类型，那么返回 C，否则返回 D
A extends B ? C : D
```

infer 运算符用于在模式匹配中定义一个类型变量，这个类型变量的具体类型由编译器根据模式匹配来推断出来。

结合前面提到的函数 this 参数，我们可以使用模式匹配来推出一个函数的 this 类型：

```ts
type GetThisType<F extends (...args: any[]) => void> = F extends (
  this: infer TT,
  ...args: any[]
) => void
  ? TT
  : never;

declare function func(this: { name: string }): void;
type TT = GetThisType<typeof func>;
/*
type TT = {
    name: string;
}
*/
```

为了解决第四个问题，我们需要能够推断出一个函数的返回值类型，实现也很简单，就是利用模式匹配让编译器帮我们 infer 出返回值类型：

```ts
type GetReturnType<F extends (...args: unknown[]) => unknown> = F extends (
  ...args: unknown[]
) => infer RT
  ? RT
  : never;

type RT = GetReturnType<() => 666>; // => 666
```

### 实现

```ts
type GetReturnType<F extends (...args: unknown[]) => unknown> = F extends (
  ...args: unknown[]
) => infer RT
  ? RT
  : never;

type GetComputed<C extends Record<string, any>> = {
  [K in keyof C]: GetReturnType<C[K]>;
};

declare function SimpleVue<D, C, M>(options: {
  data: (this: {}) => D;
  computed: C & ThisType<C & D>;
  methods: M & ThisType<M & D & GetComputed<C>>;
}): any;

SimpleVue({
  data() {
    // @ts-expect-error
    this.firstname;
    // @ts-expect-error
    this.getRandom();
    // @ts-expect-error
    this.data();

    return {
      firstname: 'Type',
      lastname: 'Challenges',
      amount: 10,
    };
  },
  computed: {
    fullname() {
      return `${this.firstname} ${this.lastname}`;
    },
  },
  methods: {
    getRandom() {
      return Math.random();
    },
    hi() {
      alert(this.amount);
      alert(this.fullname.toLowerCase());
      alert(this.getRandom());
    },
  },
});
```

## promiseAll

实现函数 promiseAll 的类型声明，函数的功能和 Promise.all 一样，需要正确处理参数和返回类型：

```ts
const p1 = Promise.resolve(1);
const p2 = Promise.resolve(true);
const p3 = Promise.resolve('good!');
const r = promiseAll([p1, p2, p3]);
// r 类型是：Promise<readonly [number, boolean, string]>
```

第一版实现：

```ts
type PromiseValue<P extends Promise<unknown>> = P extends Promise<infer V> ? V : never;

declare function promiseAll<T extends readonly Promise<unknown>[]>(
  promises: T,
): Promise<{
  readonly [P in keyof T]: T[P] extends Promise<unknown> ? PromiseValue<T[P]> : never;
}>;

const p1 = Promise.resolve(1);
const p2 = Promise.resolve(true);
const p3 = Promise.resolve('good!');
const r = promiseAll([p1, p2, p3]);
// const r: Promise<readonly (string | number | boolean)[]>
```

可以看到 value 数组类型被推断成了 `readonly (string | number | boolean)[]`，并不是我们想要的 `readonly [number, boolean, string]`。

### 上下文类型

会出现上面的问题主要还是因为 typescript 类型的自动推导机制的问题，对于 `[p1, p2, p3]`，tsc 在默认情况下就会把它推断成 `(Promise<number> | Promise<boolean> | Promise<string>)[]`。tsc 的类型推导设计的有一个规律就是默认情况类型推导比较`宽`，例如：`const n = 1`，这个 n 不会被推断成 1 的字面量类型。

为了让 tsc 能将类型推断的更窄，我们需要一些额外的修饰或者说标记让 tsc 将类型推断的更窄。

对于字面量类型大家都知道用 as const：

```ts
const obj = {
  name: 'ly',
} as const;

/**
 * // obj 被推断成 { readonly name: "ly"; }
 */
```

对于 promiseAll 这个问题本身，常见的有两种方式。

一种方式是将数组参数使用数组解构的形式：

```ts
declare function promiseAll<T extends readonly Promise<unknown>[]>(
  // 写成数组解构的形式，这样编译器就会将 T 识别为元组
  promises: [...T],
): Promise<{
  readonly [P in keyof T]: T[P] extends Promise<unknown> ? PromiseValue<T[P]> : never;
}>;
```

另一种方式就是泛型参数约束的时候联合一个空元组：

```ts
// T extends (readonly Promise<unknown>[]) | []
declare function promiseAll<T extends readonly Promise<unknown>[] | []>(
  promises: T,
): Promise<{
  readonly [P in keyof T]: T[P] extends Promise<unknown> ? PromiseValue<T[P]> : never;
}>;
```

## 全排列

前面提到了使用条件类型实现 **条件控制流**，接下来我们通过全排列这个例子使用类型递归来实现 **循环控制流**。

我们要实现的效果：

```ts
type R1 = Permutation<'A' | 'B' | 'C'>;
// 3 x 2 x 1 种
// => "ABC" | "ACB" | "BAC" | "BCA" | "CAB" | "CBA"

type R2 = Permutation<'A' | 'B' | 'C' | 'D'>;
/*
// 应该是 4 x 3 x 2 x 1 = 24 种
"ABCD" | "ABDC" | "ACBD" | "ACDB" |
"ADBC" | "ADCB" | "BACD" | "BADC" |
"BCAD" | "BCDA" | "BDAC" | "BDCA" |
"CABD" | "CADB" | "CBAD" | "CBDA" |
"CDAB" | "CDBA" | "DABC" | "DACB" |
"DBAC" | "DBCA" | "DCAB" | "DCBA"
*/
```

### 模板字符串类型

我们都知道 TS 中有字符串字面量类型，字符串字面量类型其实是 string 类型的子类型：

```ts
type S = '666'
// S 是字符串字面量类型 '666'

const s = '666';
// s 是 string 类型

'666' extends string  ? true : false; // => true
string extends '666' ? true : false; // => false
```

模板字符串类型是 typescript 4.1 新增的一个类型，由 C#，TypeScript, Delphi 之父 **Anders Hejlsberg**（安德斯·海尔斯伯格）亲自实现。结合模式匹配，类型递归等特性极大的增强了字符串类型的可玩性。

在 TS 4.1 以前，由于没有模板字符串类型，下面的代码会报错：

```ts
function dateFormat(pubDatetime: Date, formatStr: string, isUtc: boolean) {
  const getPrefix = isUtc ? 'getUTC' : 'get';
  // eslint-disable-next-line unicorn/better-regex
  return formatStr.replace(/%[YmdHMS]/g, (m: string) => {
    let replaceStrNum: number;
    switch (m) {
      case '%Y':
        // Element implicitly has an 'any' type because expression of type 'string' can't be used to index type 'Date'.
        //No index signature with a parameter of type 'string' was found on type 'Date'
        return String(date[`${getPrefix}FullYear`]()); // no leading zeros required
      case '%m':
        replaceStrNum = 1 + date[`${getPrefix}Month`]();
        break;
      case '%d':
        replaceStrNum = date[`${getPrefix}Date`]();
        break;
      case '%H':
        replaceStrNum = date[`${getPrefix}Hours`]();
        break;
      case '%M':
        replaceStrNum = date[`${getPrefix}Minutes`]();
        break;
      case '%S':
        replaceStrNum = date[`${getPrefix}Seconds`]();
        break;
      default:
        return m.slice(1); // unknown code, remove %
    }
    // add leading zero if required
    return `0${replaceStrNum}`.slice(-2);
  });
}
```

#### 基本使用

使用插值语法，你可以将已有的字符串字面量类型，数字字面量类型插进一个字符串中得到一个新的字符串字面量类型

```ts
type World = 'world';
type Greeting = `hello ${World}`; // => type Greeting = "hello world"
```

如果插值是 never，则整个模板字符串返回就是 never：

```ts
type N = `I ${never} give up`; // => never
```

当插值本身是 union 类型时，结果也是 union 类型：

```ts
type Feeling = 'like' | 'hate';
type R = `I ${Feeling} you`; // => "I like you" | "I hate you"
```

如果插入了多个 union，那么结果就是所有的组合构成的 union。

```ts
type AB = 'A' | 'B';
type CD = 'C' | 'D';
type Combination = `${AB}${CD}`; // => "AC" | "AD" | "BC" | "BD"
```

#### 模板字符串类型在模式匹配中的应用

例如我们要实现一个将传入的字符串语句首字母大写：

```ts
type R1 = CapitalFirstLetter<'a little story'>; // => "A little story"
type R2 = CapitalFirstLetter<''>; // => ""
```

我们可以这样实现：

```ts
type LetterMapper = {
  a: 'A';
  b: 'B';
  c: 'C';
  d: 'D';
  e: 'E';
  f: 'F';
  g: 'G';
  h: 'H';
  i: 'I';
  j: 'J';
  k: 'K';
  l: 'L';
  m: 'M';
  n: 'N';
  o: 'O';
  p: 'P';
  q: 'Q';
  r: 'R';
  s: 'S';
  t: 'T';
  u: 'U';
  v: 'V';
  w: 'W';
  x: 'X';
  y: 'Y';
  z: 'Z';
};

type CapitalFirstLetter<S extends string> = S extends `${infer First}${infer Rest}`
  ? First extends keyof LetterMapper
    ? `${LetterMapper[First]}${Rest}`
    : S
  : S;
```

### 类型递归

例如我们要实现所有给一个字符串，返回所有字符都被大写的字符串：

```ts
type R1 = UpperCase<'a little story'>; // => "A LITTLE STORY"
type R2 = UpperCase<'nb'>; // => "NB"
```

递归的套路就是：

> 将首字母大写，然后对剩下部分递归

实现就是：

```ts
type UpperCase<S extends string> = S extends `${infer First}${infer Rest}`
  ? `${CapitalFirstLetter<First>}${UpperCase<Rest>}`
  : // 当 S 是空串便会走这个分支，直接返回空串即可
    S;
```

### Union 的分布式运算

在 TypeScript 中如果条件类型 extends 左侧是一个 Union 便会触发分布式计算规则:

```ts
type Distribute<U> = U extends 1 ? 1 : 2;
// 不熟悉的人可能会觉得返回 2, 认为走 false 分支
type R = Test<1 | 2>; // => 1 | 2

// 等同于
type R1 = (1 extends 1 ? 1 : 2) | (2 extends 1 ? 1 : 2);
```

我们可以使用 Union extends Union 来遍历 Union 的每一项：

```ts
// 声明一个额外的泛型 E 来标识循环的元素
type AppendDot<U, E = U> = E extends U ? `${E & string}.` : never;
// 使用 Union 来映射
type R1 = AppendDot<'a' | 'b'>; // => "a." | "b."

// 配合 as 来过滤 keys
type Getter<T> = {
  [P in keyof T as P extends `get${infer Rest}` ? P : never]: T[P];
};

const obj = {
  age: 18,
  getName() {
    return 'ly';
  },
  hello() {
    console.log('hello');
  },
};

type R = Getter<typeof obj>;
/*
type R = {
    getName: () => string;
}
 */
```

### 判断一个类型是否为 never

实现一个类型 IsNever，达到一下效果:

```ts
type R1 = IsNever<number>; // => false
type R2 = IsNever<never>; // => true
```

有人会想这还不简单，直接用条件类型判断一下不就行了，刷刷写下下面的代码：

```ts
type IsNever<T> = T extends never ? true : false;

type R1 = IsNever<number>; // => false
// 傻眼了
type R2 = IsNever<never>; // => never
```

原因是 never 默认情况语义是空 union，空 union extends 任何类型返回都是 never。其实这点如果看 TS 的源码就是 TS 看到 extends 左侧就直接返回 never 了。

需要使用额外的标记让 tsc 将 never 识别为独立的类型：

```ts
// 标记的方式很多
type IsNever<T> = [T] extends [never] ? true : false;
type IsNever<T> = T[] extends never[] ? true : false;
type IsNever<T> = (() => T) extends () => never ? true : false;
```

### 全排列的思路

从小到高中我们基本上年年的数学课都会学排列组合，为了在类型系统解决全排列的问题，我们先可以想想用 JS 代码怎么去实现全排列，想想你刷 leetcode 时是怎么实现全排列的。TS 类型只是实现逻辑的一种手段，关键还是思路。

可以使用递归的思路来解决这个问题：

> n 个人算全排队，有 n 个坑位，算全列就是：第一个坑位有 n 种可能，所有的排列就是 Permutation(n) = n \* Permutation(n - 1)

用 JS 实现就这样：

```ts
function permutation(list) {
  if (list.length === 1) return [list[0]];

  const result = [];
  for (const [index, e] of list.entries()) {
    const rest = [...list];
    rest.splice(index, 1);

    for (const item of permutation(rest)) {
      result.push([e, ...item]);
    }
  }
  return result;
}

console.log(permutation(['a', 'b', 'c']));
/*
  [ 'a', 'b', 'c' ],
  [ 'a', 'c', 'b' ],
  [ 'b', 'a', 'c' ],
  [ 'b', 'c', 'a' ],
  [ 'c', 'a', 'b' ],
  [ 'c', 'b', 'a' ]
*/
```

### TS 实现全排列

```ts
type Permutation<U, E = U> = [U] extends [never]
  ? ''
  : E extends U
    ? `${E & string}${Permutation<Exclude<U, E>>}`
    : '';
```

**作业：**

<details>
    <summary>答案</summary>

```ts
// 自底向上，使用递归来循环
type Fibonacci<
  T extends number,
  // 这个数组用来取 length 表示循环下标
  TArray extends ReadonlyArray<unknown> = [unknown, unknown, unknown],
  // 这个数组的 length 就是前一个项的前一项的值
  PrePre extends ReadonlyArray<unknown> = [unknown],
  // 表示前一项的值
  Pre extends ReadonlyArray<unknown> = [unknown],
> = T extends 1
  ? 1
  : T extends 2
    ? 1
    : TArray['length'] extends T // 表示已经循环了 T 次
      ? [...Pre, ...PrePre]['length'] // 前两项相加
      : Fibonacci<T, [...TArray, unknown], Pre, [...Pre, ...PrePre]>; // 使用递归来循环
```

</details>

效果：

```ts
// 斐波那契数列：1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144,
type R1 = Fibonacci<1>; // => 1
type R3 = Fibonacci<3>; // => 2
type R8 = Fibonacci<8>; // => 21
```
