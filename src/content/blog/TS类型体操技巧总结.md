---
title: TS类型体操技巧总结
description: 待补充描述
pubDatetime: 2024-01-16
modDatetime: 2024-01-16
featured: true
---

最近刷类型体操有点上瘾，本文算是最近刷类型体操的一些思考的集合。刷的时候感觉自己长脑子了，但是过段时间又好像没脑子了，还是得通过博客总结沉淀一下

## 判断是否是 never 类型

```typescript
type IsNever<T> = [T] extends [never] ? true : false;
type IsNever<T> = (() => T) extends () => never ? true : false;
```

核心问题是 `never extends never` 返回是 `never`，之所以会这样是因为这里触发了 `union` 分配特性，左边的 `never` 可以视为一个空 `union`，使用元组或者函数包装一下都能正确判断（阻止触发分配特性）。更多细节建议移步：[Generic conditional type T extends never ? 'yes' : 'no' resolves to never when T is never](https://github.com/microsoft/TypeScript/issues/31751)

```typescript
type IsNever<T> = T extends never ? true : false;
type X = IsNever<never>; // => never
```

## 判断一个类型是否为 unknown

错误做法：

```typescript
type IsUnknown<T> = T extends unknown ? true : false;
type X = IsUnknown<2>; // true
```

`unknown` 类型可以理解为任意类型的父类，top 类型，比 `Object` 还 top。

反过来 `extends` 就可以：

```typescript
type IsUnknown<T> = unknown extends T ? true : false;
```

和这个问题类似的还有判断一个类型是否为 `number`，如果要排除 `number` 字面量类型也应该反过来 `extends`：

```typescript
type IsNumber<T> = number extends T ? true : falsse;
type X = IsNumber<2>; // false
```

这类问题的共性就是要从一个类型中排除它子类，那就反过来 `extends`。

## 判断类型相等

```typescript
type Equals<A, B> =
  (<T>() => T extends A ? 0 : 1) extends <T>() => T extends B ? 0 : 1
    ? true
    : false;
```

多数人都会想到使用双向 `extends` 的方法，它能处理 **子类 extends 父类** 的情况，用元组包一下还能处理 `never`，但是处理不了 `any`：

```typescript
type Equals<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

type A = Equals<any, "1">; // => true
```

更多细节建议移步：[typescript 怎么判断两个类型相等？](https://www.zhihu.com/question/479585640/answer/2705083460)

## 表示键类型

TS 有内置类型 `PropertyKey`：

```typescript
type PropertyKey = string | number | symbol;
```

## 表示一个键值对

麻烦的写法：

```typescript
type TupleToObject<T extends [any, any]> = {
  [K in T[0]]: T[1];
};

type X = TupleToObject<["name", "ly"]>; // => { name: "ly" }
```

可以直接用 `Record`：

```typescript
type TupleToObject<T extends [any, any]> = Record<T[0], T[1]>;
```

## 交叉类型转接口类型

麻烦的写法：

```typescript
type IntersectionToInterface<I> = {
  [K in keyof I]: I[K];
};
type X = IntersectionToInterface<{ name: "ly" } & { age: 27 }>; // => { name: "ly"; age: 27; }
```

简写：

```typescript
type IntersectionToInterface<I> = Omit<I, never>;
```

由此，可以可以把 `Merge` 类型写的非常简单：

```typescript
type IntersectionToInterface<I> = Omit<I, never>;
type Merge<A, B> = IntersectionToInterface<Omit<A, keyof B> & B>;

type A = {
  name: "ly";
  age: 27;
};

type B = {
  name: "YuTengjing";
  height: 170;
};

type C = Merge<A, B>;

/*
type C = {
    name: "YuTengjing";
    age: 27;
    height: 170;
}
*/
```

## 类型映射可以使用 as 对 key 进行过滤

例如不用内置的 `Exclude` 实现一个 `MyOmit` 类型：

```typescript
type MyOmit<T, L extends keyof T> = {
  [K in keyof T as K extends L ? never : K]: T[K];
};

type X = MyOmit<{ name: "ly"; age: 27 }, "name">;
/*
type X = {
    age: 27;
}
*/
```

## 类型映射对数组类型也是适用的

曾经有段时间，我一直以为类型映射只能映射对象类型。

```typescript
type NumsToStrs<Arr extends readonly number[]> = {
  [K in keyof Arr]: `${Arr[K]}`;
};

type Strs = NumsToStrs<[1, 2, 3]>; // => type Strs = ["1", "2", "3"]
```

## ThisType

使用 ThisType 这个内置类型，可以让我们给一个 interface 的方法的 this 混入其它属性。它并不是由其它类型生成的一个工具类型，是一个用于 TS 类型推断的标记类型。查看其源码：

```typescript
/**
 * Marker for contextual 'this' type
 */
interface ThisType<T> {}
```

一个非常贴近我们前端开发的应用：使用 `ThisType` 在 `computed` 和 `methods` 的方法中混入 `data`。

```typescript
type Computed<C extends Record<string, any>> = {
  [K in keyof C]: ReturnType<C[K]>;
};

declare function SimpleVue<D, C extends Record<string, any>, M>(options: {
  data: (this: {}) => D;
  computed: C & ThisType<Computed<C> & D & M>;
  methods: M & ThisType<M & D & Computed<C>>;
}): D & Computed<C> & M;

SimpleVue({
  data() {
    return {
      firstname: "Type",
      lastname: "Challenges",
      amount: 10,
    };
  },
  computed: {
    fullname() {
      return `${this.firstname} ${this.lastname}`;
    },
  },
  methods: {
    hi() {
      alert(this.amount);
      alert(this.fullname.toLowerCase());
      alert(this.getRandom());
    },
  },
});
```

## infer + extends

在模式匹配的时候可以使用 `extends` 来限定 `infer` 推断出的类型

### 模板字符串中匹配数字

```typescript
// TS 没有 NaN 字面量类型
type StringToNumber<S extends string> = S extends `${infer Num extends number}`
  ? Num
  : never;
type A = StringToNumber<"">; // => never
type B = StringToNumber<"1">; // => 1
type C = StringToNumber<"1.2">; // => 1.2
```

### 在对元组使用模式匹配时能正确识别成员类型

```typescript
type Count<
  Nums extends readonly number[],
  Num extends number,
  Result extends readonly unknown[] = [],
> = Nums extends [infer First, ...infer Rest extends readonly number[]]
  ? First extends Num
    ? Count<Rest, Num, [...Result, unknown]>
    : Count<Rest, Num, Result>
  : Result["length"];

type X = Count<[1, 2, 2, 3], 2>; // => type X = 2;
```

默认情况下 TS 推断上面 Rest 类型为 `unknown[]`，可以使用 `extends` 让 TS 只匹配时 `readonly number[]` 的情况。

## 数组参数推断为元组

场景：我们要实现 `Promise.all` 方法的返回值推断

```typescript
declare function PromiseAll<T extends readonly any[]>(
  values: T
): Promise<GetReturn<T>>;

type GetReturn<T extends readonly any[]> = T extends readonly [
  infer First,
  ...infer Rest,
]
  ? [Awaited<First>, ...GetReturn<Rest>]
  : T extends []
    ? []
    : T extends Array<infer E>
      ? Array<Awaited<E>>
      : [];
const R = PromiseAll([1, 2, 3]); // const R: Promise<number[]>
```

理想的推断结果为 `Promise<1, 2, 3>`。这里的核心问题在于，按照我们定义函数参数 values 的方式，推出的 `values` 是 `number[]` 类型。

### 解构一次

```typescript
declare function PromiseAll<T extends readonly any[]>(
  values: readonly [...T]
): Promise<GetReturn<T>>;
// => const R: Promise<[number, number, number]>
```

通过将类型参数 T 解构一次来提示 TS 编译器将 `values` 尽可能推断为元组，但是这种方式没法将 `values` 推断为字面量类型。

### 常量泛型参数

TS 5.0 引进的一个新语法：[const Type Parameters](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html#const-type-parameters)，允许你对泛型参数标记为 `const`，这样 TS 在对函数参数推断时会直接将参数推断为字面类型：

```typescript
declare function PromiseAll<const T extends readonly any[]>(
  values: T
): Promise<GetReturn<T>>;
const R = PromiseAll([1, 2, 3]);
// => const R: Promise<[1, 2, 3]>
```

## 判断是否为 union

[IsUnion](https://typehero.dev/challenge/isunion)

充分利用了 `union` 有多个成员的特性，非 `union` 可以理解为只有一个成员的 `union`。

```typescript
type IsUnion<U, E = U> = [E extends U ? Exclude<U, E> : never] extends [never]
  ? false
  : true;
```

## Union 转 Intersection

```typescript
type UnionToIntersection<U> = (
  U extends unknown ? (arg: U) => void : never
) extends (arg: infer I) => void
  ? I
  : never;
type X = UnionToIntersection<{ name: "ly" } | { age: 18 }>; // => { name: 'ly' } & { age: 18 }
```

1. `U extends unknown ? (arg: U) => void : never` 将 `U` 映射为一个`函数 union`：`(arg: { name: 'ly' }) => void | (arg: { age: 18 }) => void`
1. 函数 `union` 和 `(arg: infer I) => void` 进行模式匹配，这里`函数 union` 不会触发分配特性
1. 由于是 `infer I` [匹配多个处在逆变位置的参数，会取交叉类型](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html#type-inference-in-conditional-types)

## 取 Union 最后一项

```typescript
type LastOfUnion<
  U,
  FU = UnionToIntersection<U extends unknown ? () => U : never>,
> = F extends (...args: any[]) => any ? ReturnType<FU> : never;

type X = LastOfUnion<"a" | "b" | "c">; // c
```

1. 首先将 `U` 转为`函数 union`，通过 `U extends unknown ? () => U : never` 得到 `() => 'a' | () => 'b'`
2. 通过 `UnionToIntersection` 将上一步结果转换为函数交叉类型：`() => 'a' & () => 'b'`
3. `函数交叉类型`在模式匹配时和`函数重载`一样都是取最后一个函数用于匹配，也就是说这里 `ReturnType<() => 'a' & () => 'b'>` 等同于 `ReturnType<() => 'b'>`，返回 `'b'`

```typescript
declare function foo(x: string): number;
declare function foo(x: number): string;
declare function foo(x: string | number): string | number;
type R = ReturnType<typeof foo>; // type R = string | number
type P = Parameters<typeof foo>; // =type P = [x: string | number]
```

由此我们可以结合递归来解答一道 [hard 题](https://github.com/type-challenges/type-challenges/blob/main/questions/00730-hard-union-to-tuple/README.md)：

```typescript
type UnionToTuple<U, Last = LastOfUnion<U>> = [U] extends [never]
  ? []
  : [...UnionToTuple<Exclude<U, Last>>, Last];
type TP = UnionToTuple<"a" | "b">;
// => ['a', 'b]
```

## 递归

在 TS 体操中，递归的使用率非常高。递归按照用途可以分为两类：`循环` 和 `化为子问题`。

### 循环

TS 类型空间没有正儿八经的循环工具，但是我们可以通过递归来实现做循环，通过增加辅助泛型参数来暂存中间计算结果。递归实现循环有下面两种常见方式：

`递归` + `下标` 来循环：

```typescript
type Join<
  Strs extends readonly string[],
  Index extends unknown[] = [],
  Result extends string = "",
> = Index["length"] extends Strs["length"]
  ? Result
  : Join<Strs, [...Index, unknown], `${Result}${Strs[Index["length"]]}`>;

type X = Join<["a", "b", "c"]>; // => 'abc'
```

`递归` + `模式匹配` 来循环：

```typescript
type Join<
  Strs extends readonly string[],
  Result extends string = "",
> = Strs extends [
  infer First extends string,
  ...infer Rest extends readonly string[],
]
  ? Join<Rest, `${Result}${First}`>
  : Result;
```

我喜欢用第二种方式来循环，方便获取第一个元素，不用到处写 `length`。

### 化为子问题

这才是真正是用递归化大问题为小问题，用递归的思路来解决问题：

```typescript
type Join<Strs extends readonly string[]> = Strs extends [
  infer First extends string,
  ...infer Rest extends readonly string[],
]
  ? `${First}${Join<Rest>}`
  : "";
```

## 排列组合问题

### 实现排列组合的手段

1. `extends` 左侧类型是 `union` 具有分配特性，有些文章翻译为分布式特性，我叫分配特性是因为它和乘法分配律很像
2. 对元组使用 `number` 类型索引返回的是成员的 `union`
3. 模板字符串参数为 `union` 会返回所有组合
4. 在元组中对数组 `union` 解构，返回的是数组的 `union`

```typescript
// 1
type NumberToString<U extends number, E = U> = E extends U ? `${E}` : never;
type X = NumberToString<1 | 2 | 3>; // => type X = "1" | "2" | "3"

// 2
type Members = [1, 2, 3, 4][number]; // => type Members = 4 | 1 | 2 | 3

// 3
type S = `${"a" | "b"}${"c" | "d"}`; // type S = "ac" | "ad" | "bc" | "bd"

// 4
type Arr = [1, ...([2] | [3])]; // type Arr = [1, 2] | [1, 3]
```

灵活运用上面四个基本手段，可以解决大多数排列组合问题。

但是这些知识一些类型上的技巧，本质上解决一个类型体操问题还是需要找到问题的思路，多数体操问题可以用递归来解决问题。

### 实战解析

#### 全排列

原题：[permutation](https://typehero.dev/challenge/permutation)

递归思路：第一个坑位可以选取任意一个成员，然后对剩下的元素全排列，和第一个坑位组合的结果就是要的结果。

利用了手段 1 和 4，需要注意的是对 `never` 进行解构会导致整个数组返回 `never` 类型，这里 `Exclude<U, E>` 最后会是 `never`，所以最开始需要判断是否为 `never`。

```typescript
type Permutation<U, E = U> = [U] extends [never]
  ? []
  : E extends U
    ? [E, ...Permutation<Exclude<U, E>>]
    : never;

type X = Permutation<"A" | "B" | "C">;
// type X = ["A", "B", "C"] | ["A", "C", "B"] | ["B", "A", "C"] | ["B", "C", "A"] | ["C", "A", "B"] | ["C", "B", "A"]
```

#### 不去重的组合

原题：[combination](https://typehero.dev/challenge/combination)

递归思路：组合要求至少有一个元素，那第一个坑位可以是任意一个成员，此时有两种选择，要和不和剩余元素组合，要么和剩下的元素的组合进行组合。

利用了手段 1, 2 和 3。

```typescript
type Comb<U extends string, E = U> = E extends U
  ? `${E}${` ${Comb<Exclude<U, E>>}` | ""}`
  : "";
type Combination<T extends readonly string[]> = Comb<T[number]>;
type X = Combination<["foo", "bar", "baz"]>;
// => type X = "foo" | "bar" | "baz" | "bar baz" | "baz bar" | "foo bar" | "foo baz" | "foo bar baz" | "foo baz bar" | "baz foo" | "bar foo" | "bar foo baz" | "bar baz foo" | "baz foo bar" | "baz bar foo"
```

#### 元组全排列

原题：[permutations-of-tuple](https://typehero.dev/challenge/permutations-of-tuple)

测试用例：

```typescript
Expect<
  Equal<
    PermutationsOfTuple<[any, unknown, never]>,
    | [any, unknown, never]
    | [unknown, any, never]
    | [unknown, never, any]
    | [any, never, unknown]
    | [never, any, unknown]
    | [never, unknown, any]
  >
>;
```

这道题难点在于如果使用 `number` 索引元组返回得类型不对，你可能会想说先把数组 map 成每个成员被一个元组包围再去做全排列（也就是 `[[any], [unknown], [never]]`），我试过，很麻烦，而且还其它问题。所以这道题其实不适合用 `number` 去索引元组类型。

```typescript
type Insert<T extends readonly any[], U, E = T> = E extends T
  ? T extends [infer First, ...infer Rest]
    ? [U, ...T] | [First, ...Insert<Rest, U>]
    : [U]
  : never;

type PermutationsOfTuple<T extends unknown[]> = T extends [
  ...infer Front,
  infer L,
]
  ? Insert<PermutationsOfTuple<Front>, L>
  : [];
```

递归思路：例如我们求 `PermutationsOfTuple<[any, unknown, never]>`，其实就是把最后的 `never` 想办法插入到 `PermutationsOfTuple<[any, unknown]>` 的结果中。

和这道题类似的还有另一道题：[Transpose](https://typehero.dev/challenge/transpose)

```typescript
type cases = [
  Expect<Equal<Transpose<[]>, []>>,
  Expect<Equal<Transpose<[[1]]>, [[1]]>>,
  Expect<Equal<Transpose<[[1, 2]]>, [[1], [2]]>>,
  Expect<Equal<Transpose<[[1, 2], [3, 4]]>, [[1, 3], [2, 4]]>>,
  Expect<Equal<Transpose<[[1, 2, 3], [4, 5, 6]]>, [[1, 4], [2, 5], [3, 6]]>>,
  Expect<Equal<Transpose<[[1, 4], [2, 5], [3, 6]]>, [[1, 2, 3], [4, 5, 6]]>>,
  Expect<
    Equal<
      Transpose<[[1, 2, 3], [4, 5, 6], [7, 8, 9]]>,
      [[1, 4, 7], [2, 5, 8], [3, 6, 9]]
    >
  >,
];
```

翻译下这个问题：将矩阵顺时针旋转 90 度，或者说把列变成行

解法和上面类似，递归即可：求 `Transpose<[[1, 2, 3], [4, 5, 6], [7, 8, 9]]`，等同于求把 `[7, 8, 9]` 每一个元素插入到 `Transpose<[[1, 2, 3], [4, 5, 6]>` 的结果中

```typescript
type FallbackTo<T, Fallback> = T extends undefined ? Fallback : T;

type Insert<
  Arr extends ReadonlyArray<ReadonlyArray<number>>,
  Row extends readonly number[],
  Result extends ReadonlyArray<ReadonlyArray<number>> = [],
> = Result["length"] extends Row["length"]
  ? Result
  : Insert<
      Arr,
      Row,
      [
        ...Result,
        [...FallbackTo<Arr[Result["length"]], []>, Row[Result["length"]]],
      ]
    >;

type Transpose<M extends number[][]> = M extends [
  ...infer Front extends number[][],
  infer Last extends number[],
]
  ? Insert<Transpose<Front>, Last>
  : [];
```

## 编码习惯

良好的编码习惯可以让你的代码更易于让别人和自己理解。

### 泛型参数命名

尽量取有意义的泛型参数名称，

- 字符串我们就用 `S`
- 数字可以用 `Num` 或者干脆 `N`
- 字符串数组可以用 `Strs`，数字数组可以用 `Nums`
- 元组的第一个成员用 `First`，最后一个成员用 `Last`，`infer` 出来的 spread 数组用 `Rest`
- `union` 类型用 `U`
- 成员是任意类型的数组可以用 `Arr` 或 `List`
- 循环下标的数组可以用 `Index`
- 结果可以用 `Result` 或者 `Acc`
- 任意类型用 `T`
- 任意的两个类型用 `A` 和 `B`

总之不要一股脑用 `T`，`T1` 和 `T2` 这种。

```typescript
type TrimStart<S extends string> = any;
type JoinUnion<U> = any;
type StrsToNums<Strs extends readonly string[]> = any;
type GetLast<Arr extends readonly unknown[]> = Arr extends [
  ...infer Front,
  infer Last,
]
  ? Last
  : never;
```

在对 `union` 进行映射时，如果直接 `U extends U`，后序无法访问 `union U`，`U` 此时表示成员，原本的 `union` 会被 `shadow`。使用另一个泛型参数 E 保存 U 就没有这个问题，`E` 表示 `Element`。一方面是可读性更好，另一方面有时候确实需要访问原 `union`

```typescript
// bad
type NumsToStrs<U extends number> = U extends U ? `${U}` : never;

// good
type NumsToStrs<U extends number, E = U> = E extends U ? `${E}` : never;
```

### 泛型约束

**泛型约束**不仅是类型需求的一部分，也有助于理解类型。我们不但应该写泛型约束，还要遵循一定的最佳实践。

声明数组的时候尽量声明为**只读**的，因为声明为**可写**的数组那就不能接受**只读**的数组：

```typescript
type Length<Arr extends unknown[]> = Arr["length"];

const array = [1, 2] as const;

type X = Length<typeof array>;
/*
Type 'readonly [1, 2]' does not satisfy the constraint 'unknown[]'.
  The type 'readonly [1, 2]' is 'readonly' and cannot be assigned to the mutable type 'unknown[]'
 */
```

还有一个我思考过的问题：当你声明一个成员类型可以为任意类型的数组时，使用 `readonly any[]` 还是 `readonly unknown[]`?

大多数情况下两种声明方式都可以，少数情况下使用 `readonly unknown[]` 会达不到预期效果，具体案例我没印象了，等我想起来补一下。

### 长类型

TS 实现逻辑毕竟不如 JS 那么方便，有些时候我们一个类型要写很长代码，为了便于理解不至于写到一半看不懂之前写的是啥我们编写的时候要注意：

1. 按照标准格式去缩进
2. 必要时使用括号提高优先级
3. 抽离中间类型，性能一般还会更好
4. 适当增加辅助泛型参数

关于第一点，其实主要想说的是 `extends` 缩进：

```typescript
// ? 和 : 就不要写到一行，每次碰到 extends 就换行加缩进
A extends B
 ? true
 : false
```

关于第四点，还是拿之前的例子说明：

```typescript
type _NumsToStrs<U extends number, E = U> = E extends U ? `${E}` : never;

// 如果题目要求只能有一个泛型参数，那我们直接 alias 下就好了
type NumsToStrs<U extends number> = __NumsToStrs<U>;
```

## 分享几道精妙的体操题

### [Zip](https://typehero.dev/challenge/zip)

这道题就是说给定两个元组 `A` 和 `B`，返回一个元组 `C`， 满足：`C[index] = [A[index], B[index]]`

```typescript
import type { Equal, Expect } from "@type-challenges/utils";

type cases = [
  Expect<Equal<Zip<[], []>, []>>,
  Expect<Equal<Zip<[1, 2], [true, false]>, [[1, true], [2, false]]>>,
  Expect<Equal<Zip<[1, 2, 3], ["1", "2"]>, [[1, "1"], [2, "2"]]>>,
  Expect<Equal<Zip<[], [1, 2, 3]>, []>>,
  Expect<Equal<Zip<[[1, 2]], [3]>, [[[1, 2], 3]]>>,
];
```

正常人的解法：

```typescript
type Zip<
  A extends readonly any[],
  B extends readonly any[],
  R extends readonly any[] = [],
  RL extends number = R["length"],
> = R["length"] extends A["length"] | B["length"]
  ? R
  : Zip<A, B, [...R, [A[RL], B[RL]]]>;
```

牛逼的解法，将模式匹配发挥到极致：

```typescript
type Zip<T extends readonly any[], U extends readonly any[]> = [T, U] extends [
  [infer TF, ...infer TR],
  [infer UF, ...infer UR],
]
  ? [[TF, UF], ...Zip<TR, UR>]
  : [];
```

### [Integer](https://typehero.dev/challenge/integer)

这道题判断给定类型是否为整数。

```typescript
let x = 1;
let y = 1 as const;

type cases1 = [
  Expect<Equal<Integer<1>, 1>>,
  Expect<Equal<Integer<1.1>, never>>,
  Expect<Equal<Integer<1.0>, 1>>,
  Expect<Equal<Integer<1.0>, 1>>,
  Expect<Equal<Integer<0.5>, never>>,
  Expect<Equal<Integer<28.0>, 28>>,
  Expect<Equal<Integer<28.101>, never>>,
  Expect<Equal<Integer<typeof x>, never>>,
  Expect<Equal<Integer<typeof y>, 1>>,
];
```

正常人的解法

```typescript
type Integer<T extends number> =
  `${T}` extends `${infer Int extends number}.${string}`
    ? never
    : number extends T
      ? never
      : T;
```

神的解法：

```typescript
type Integer<T extends number> = `${T}` extends `${bigint}` ? T : never;
```

## 总结

`typescript` 的类型空间有很多刻意为之的设计，例如 `union extends none-union` 会采用分配律返回 `union`，但是 `union extends union` 又会采用判断是否为子集返回 `true/false`，这些设计其实都有其实际意义，也使得 `typescript` 类型非常灵活和强大。

在做类型体操时，我们不应该将一开始就将思路集中到用什么类型技巧，解决问题的思路是通用的，无论是 JS 还是 TS 类型空间，核心还是思路。例如解决类型空间的斐波那契数列，你首先要明确你的思路，是自底向上动态规划去循环，还是自顶向下递归，明确了使用动态规划，那我们就再用类型工具去将思路具象化，使用两个数组的 `length` 去表示迭代变量。

类型体操玩归玩，别上头，平时工作，为了赶进度有些时候还是可以上 `// @ts-expect-error` 的，不建议直接 `any`。当我们时间不是那么紧迫的时候，其实可以稍微再类型声明上多花点时间提高代码的可维护性和可靠性。例如 `method` 不要直接声明为 `string`，而是声明为 `union`，使用模板字符串限制 `url` 必须以 `http` 开头等。

本文算是最近刷类型体操的一些思考的集合，后序还会慢慢补充一些内容。

最近我希望我会更新文章频繁一些，下一篇文章大概率是写前端工程化相关的。

最近还在找前端工作，这是我的在线[简历](https://github.com/tjx666/resume)，觉得合适的请邮件联系我。
