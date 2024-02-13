---
title: 讲清楚 JavaScript 原型
author: 余腾靖
pubDatetime: 2020-01-28
---

记得以前知乎上看到过一个问题：[面试一个 5 年的前端，却连**原型链**也搞不清楚，满口都是 Vue，React 之类的实现，这样的人该用吗？](https://www.zhihu.com/question/60165921) 。写文章的时候又回去看了下这个问题，300 多个回答，有很多大佬都回答了这个问题，说明这个问题还是挺受关注的。最近几年，随着 ES6，TypeScript 及类似的中间语言的流行，我们平时做业务开发很少能接触到原型，基本上都是用 ES6 class 来去更简单的，更直观的实现以前构造器加原型做的事情。

其实在我看来，我觉得原型链是一个非常重要的基础知识。如果一个人说他 C 语言很精通，但是他汇编不熟，你信吗？我觉得 winter 说的挺简洁到位的：

> 这又涉及到我之前讲过的面试官技巧，面试，是对一个人的能力系统性评价，搞清楚一个人擅长什么不会什么，所以问知识性问题，为了避免误判，一定要大量问、系统化地问。
>
> 不会原型很能说明问题，至少他在库的设计方面会有极大劣势，而且可能学习习惯上是有问题的，也有可能他根本就不太会 JS 语言，但是这不意味着凭借一个问题就可以判定这个人不能用。

本文包括以下内容：

1. JavaScript 原型
2. 构造器和 `prototype`
3. 原型链
4. 原型的用途
5. ES6 class 和构造器的关系
6. 原型继承
7. JavaScript 和原型相关语法特性
8. 原型污染
9. 补充一道最近校招面试碰到的和原型相关的面试题

<!-- more -->

## JavaScript 原型

原型的英文应该叫做 `prototype`，任何一个对象都有原型，我们可以通过非标准属性 `__proto__` 来访问一个对象的原型：

```javascript
// 纯对象的原型默认是个空对象
console.log({}.__proto__); // => {}

function Student(name, grade) {
  this.name = name;
  this.grade = grade;
}

const stu = new Student('xiaoMing', 6);
// Student 类型实例的原型，默认也是一个空对象
console.log(stu.__proto__); // => Student {}
```

`__proto__` 是非标准属性，如果要访问一个对象的原型，建议使用 ES6 新增的 `Reflect.getPrototypeOf` 或者 `Object.getPrototypeOf()` 方法。非标准属性意味着未来可能直接会修改或者移除该属性，说不定以后出了个新标准用 `Symbol.proto` 作为 key 来访问对象的原型，那这个非标准属性可能就要被移除了。

```javascript
console.log({}.__proto__ === Object.getPrototypeOf({})); // => true
```

我们可以通过对 `__proto__` 属性直接赋值的方式修改对象的原型，更推荐的做法是使用使用 ES6 的 `Reflect.setPrototypeOf` 或 `Object.setPrototypeOf`。不论哪一种方式，被设置的值的类型只能是对象或者 null，其它类型不起作用：

```javascript
const obj = { name: 'xiaoMing' };
// 原型为空对象
console.log(obj.__proto__); // => {}

obj.__proto__ = 666;
// 非对象和 null 不生效
console.log(obj.__proto__); // => {}

// 设置原型为对象
obj.__proto__ = { a: 1 };
console.log(obj.__proto__); // => { a: 1 }
console.log(Reflect.getPrototypeOf(obj)); // => { a: 1 }
```

如果被设置的值是不可扩展的，将抛出 `TypeError`：

```javascript
const frozenObj = Object.freeze({});
// Object.isExtensible(obj) 可以判断 obj 是不是可扩展的
console.log(Object.isExtensible(frozenObj)); // => false
frozenObj.__proto__ = null; // => TypeError: #<Object> is not extensible
```

如果一个对象的 `__proto__` 被赋值为 null，这种情况比较复杂，看下面的测试，你可能会觉得很匪夷所思：

```javascript
const obj = { name: 'xiaoming' };

obj.__proto__ = null;
// !: 为什么不是 null, 就好像 __proto__ 被 delete 了
console.log(obj.__proto__); // => undefined
// 说明确实将原型设置为 null 了
console.log(Reflect.getPrototypeOf(obj)); // => null

// 再次赋值为 null
obj.__proto__ = null;
// 黑人问号？？？咋不是之前的 undefined 呢？
console.log(obj.__proto__); // => null

obj.__proto__ = { a: 1 };
console.log(obj.__proto__); // => { a: 1 }
// __proto__ 就像一个普通属性一样 obj.xxx = { a: 1 }
// 并没有将原型设置成功
console.log(Reflect.getPrototypeOf(obj)); // => null

Reflect.setPrototypeOf(obj, { b: 2 });
// __proto__ 被设置为 null 后，obj 的 __proto__ 属性和一个普通的属性没有区别
console.log(obj.__proto__); // => { a: 1 }
// 使用 Reflect.setPrototypeOf 是可以设置原型的
console.log(Reflect.getPrototypeOf(obj)); // => { b: 2 }
```

其实 `__proto__` 是个定义在 `Object.prototype` 上的访问器属性，也就是使用`getter` 和 `setter` 定义的属性，通过 `__proto__` 的 `getter` 我们可以获取到对象的`[[Prototype]]`，也就是原型。下面是我模拟的 `__proto__` 行为的代码，注意看下面代码中被设置为 null 的情况：

```javascript
const weakMap = new WeakMap();
Object.prototype = {
  get __proto__() {
    return this['[[prototype]]'] === null ? weakMap.get(this) : this['[[prototype]]'];
  },
  set __proto__(newPrototype) {
    if (!Object.isExtensible(newPrototype))
      throw new TypeError(`${newPrototype} is not extensible`);

    const isObject = typeof newPrototype === 'object' || typeof newPrototype === 'function';
    if (newPrototype === null || isObject) {
      // 如果之前通过 __proto__ 设置成 null
      // 此时再通过给 __proto__ 赋值的方式修改原型都是徒劳
      /// 表现就是 obj.__proto__ = { a: 1 } 就像一个普通属性 obj.xxx = { a: 1 }
      if (this['[[prototype]]'] === null) {
        weakMap.set(this, newPrototype);
      } else {
        this['[[prototype]]'] = newPrototype;
      }
    }
  },
  // ... 其它属性如 toString，hasOwnProperty 等
};
```

总的来说：如果一个对象的 `__proto__` 属性被赋值为 `null`，这个时候它的原型确实已经被修改为 null 了，但是你想再通过对 `__proto__` 赋值的方式设置原型时是无效的，**这个时候 `__proto__` 和一个普通属性没有区别**，只能通过 `Reflect.setPrototypeOf` 或 `Object.setPrototypeOf` 才能修改原型。原型是对象内部的一个属性 `[[prototype]]`，而 `Reflect.setPrototypeOf` 之所以能修改原型是因为它是直接修改对象的原型属性，也就是内部直接对对象的 `[[prototype]]` 属性赋值，而不会通过 `__proto__` 的 `getter`。

## 构造器和 prototype

构造器的英文就是 `constructor`，在 JavaScript 中，**函数都可以用作构造器**。构造器我们也可以称之为类，Student 构造器不就可以称之为 Student 类嘛。我们可以通过 new 构造器来构造一个实例。习惯上我们对用作构造器的函数使用大驼峰命名：

```javascript
function Apple() {}
const apple = new Apple();
console.log(apple instanceof Apple); // => true
```

**任何构造器都有一个 prototype 属性，默认是一个空的纯对象，所有由构造器构造的实例的原型都是指向它。**

```javascript
// 实例的原型即 apple1.__proto__
console.log(apple1.__proto__ === Apple.prototype); // => true
console.log(apple2.__proto__ === Apple.prototype); // => true
```

下面的测试结果可以证明构造器的 prototype 属性默认是个空对象，注意这里说的空对象指的是该对象没有可遍历属性：

```javascript
console.log(Apple.prototype); // => Apple {}
console.log(Object.keys(Apple.prototype)); // => []
console.log(Apple.prototype.__proto__ === {}.__proto__); // true
```

构造器的 `prototype` 有一个 `constructor` 属性，指向构造器本身：

```javascript
console.log(Apple.prototype.constructor === Apple); // => true
```

这个 `constructor` 属性是不可遍历的，可以理解为内部是这样定义该属性的：

```javascript
Object.defineProperty(Apple.prototype, 'constructor', {
  value: Student,
  writable: true,
  // 不可枚举，无法通过 Object.keys() 获取到
  enumerable: fasle,
});
```

`__proto__` ，`prototype`，`constructor`，`Apple`函数，实例 `apple` 和原型对象 `[[prototype]]` 之间的关系：

![relationship.png](https://user-gold-cdn.xitu.io/2020/3/31/1713024f864b67e6?w=1009&h=609&f=png&s=60686)

有些人可能会把 `__proto__` 和 `prototype` 搞混淆。从翻译的角度来说，它们都可以叫原型，但是其实是完全不同的两个东西。

`__proto__` 存在于所有的对象上，`prototype` 存在于所有的函数上，他俩的关系就是：函数的 `prototype` 是所有使用 new 这个函数构造的实例的 `__proto__`。函数也是对象，所以函数同时有 `__proto__` 和`prototype`。

**注意**：如果我文章中提到了构造器的原型，指的是构造器的 `__proto__`，而不是构造器的 prototype 属性。

## 原型链

那么**对象的原型**有什么特点呢？

> 当在一个对象 obj 上访问某个属性时，如果不存在于 obj，那么便会去对象的原型也就是 `obj.__proto__` 上去找这个属性。如果有则返回这个属性，没有则去对象 obj 的原型的原型也就是 `obj.__proto__.__proto__`去找，重复以上步骤。一直到访问**纯对象**的原型也就是 `Object.prototype`，没有的话续往上找也就是 `Object.prototype.__proto__`，其实就是 null，直接返回 undefined。

举个例子：

```javascript
function Student(name, grade) {
  this.name = name;
  this.grade = grade;
}

const stu = new Student();
console.log(stu.notExists); // => undefined
```

访问 `stu.notExists` 的整个过程是：

1. 先看 `stu` 上是否存在 `notExists`，不存在，所以看 `stu.__proto__`
2. `stu.__proto__` 上也不存在 `notExists` 属性，再看 `stu.__proto__.__proto__`，其实就是**纯对象**的原型：`Object.prototype`
3. **纯对象**的原型上也不存在 `notExists` 属性，再往上，到 `stu.__proto__.__proto__.__proto__` 上去找，其实就是 null
4. null 不存在 `notExists` 属性，返回 undefined

可能有读者看了上面会有疑问，对象的原型一直查找最后会找到**纯对象**的原型？测试一下就知道了：

```javascript
console.log(stu.__proto__.__proto__ === {}.__proto__); // => true
```

**纯对象**的原型的原型是 null：

```javascript
console.log(new Object().__proto__.__proto__); // => null
```

> 各个原型之间构成的链，我们称之为原型链。

![prototypeChain1.png](https://user-gold-cdn.xitu.io/2020/3/31/1713024f8658db83?w=1083&h=722&f=png&s=57187)

想想看，函数 `Student` 的原型链应该是怎样的？

![functionPrototypeChain.png](https://user-gold-cdn.xitu.io/2020/3/31/1713024f8658b733?w=964&h=692&f=png&s=35049)

## 原型的用途

在使用构造器定义一个类型的时候，我们一般会将类的方法定义在原型上，和 this 的指向特性简直是绝配。

```javascript
function Engineer(workingYears) {
  this.workingYears = workingYears;
}

// 不能使用箭头函数，箭头函数的 this 在声明的时候就根据上下文确定了
Engineer.prototype.built = function () {
  // this 这里就是执行函数调用者
  console.log(`我已经工作 ${this.workingYears} 年了，我的工作是拧螺丝...`);
};

const engineer = new Engineer(5);
// this 会正确指向实例，所以 this.workingYears 是 5
engineer.built(); // => 我已经工作 5 年了，我的工作是拧螺丝...
console.log(Object.keys(engineer)); // => [ 'workingYears' ]
```

通过这种方式，所有的实例都可以访问到这个方法，并且这个方法只需要占用一份内存，节省内存，this 的指向还能正确指向类的实例。

不过这种方式定义的方法无法通过 Object.keys() 访问，毕竟不是自身的属性：

```javascript
const obj = {
  func() {},
};

console.log(Object.keys(obj)); // => [ 'func' ]

function Func() {}
Func.prototype.func = function () {};
console.log(Object.keys(new Func())); // => []
```

如果你就是要定义实例属性的话还是只能通过 `this.xxx = xxx` 的方式定义实例方法了：

```javascript
function Engineer(workingYears) {
  this.workingYears = workingYears;
  this.built = function () {
    console.log(`我已经工作 ${this.workingYears} 年了，我的工作是拧螺丝...`);
  };
}

const engineer = new Engineer(5);
console.log(Object.keys(engineer)); // => [ 'workingYears', 'built' ]
```

其实 JavaScript 中很多方法都定义在构造器的原型上，例如 Array.prototype.slice，Object.prototype.toString 等。

## ES6 class 和构造器的关系

很多语言都有拥有面向对象编程范式，例如 java, c#, python 等。ES6 class 让从它们转到 JavaScript 的开发者更容易进行面向对象编程。

### ES6 class

其实，**ES6 class 就是构造器的语法糖**。我们来看一下 babel 将 ES6 class 编译成了啥：

原代码：

```javascript
class Circle {
  constructor(x, y, r) {
    this.x = x;
    this.y = y;
    this.r = r;
  }

  draw() {
    console.log(`画个坐标为 (${this.x}, ${this.y})，半径为 ${this.r} 的圆`);
  }
}
```

`babel + babel-preset-es2015-loose` 编译出的结果：

```javascript
'use strict';

// Circle class 可以理解为就是一个构造器函数
var Circle = (function () {
  function Circle(x, y, r) {
    this.x = x;
    this.y = y;
    this.r = r;
  }

  var _proto = Circle.prototype;

  // class 方法定义在 prototype 上
  _proto.draw = function draw() {
    console.log(
      '\u753B\u4E2A\u5750\u6807\u4E3A (' +
        this.x +
        ', ' +
        this.y +
        ')\uFF0C\u534A\u5F84\u4E3A ' +
        this.r +
        ' \u7684\u5706',
    );
  };

  return Circle;
})();
```

一看就明白了，ES6 的 class 就是构造器，class 上的方法定义在构造器的 prototype 上。

### extends 继承

我们再来看一下使用 `extends` 继承时是怎样转换的。

原代码：

```javascript
class Shape {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

class Circle extends Shape {
  constructor(x, y, r) {
    super(x, y);
    this.r = r;
  }

  draw() {
    console.log(`画个坐标为 (${this.x}, ${this.y})，半径为 ${this.r} 的圆`);
  }
}
```

`babel + babel-preset-es2015-loose` 编译出的结果：

```javascript
'use strict';

// 原型继承
function _inheritsLoose(subClass, superClass) {
  subClass.prototype = Object.create(superClass.prototype);
  subClass.prototype.constructor = subClass;
  // 让子类可以访问父类上的静态属性，其实就是定义在构造器自身上的属性
  // 例如父类有 Person.say 属性，子类 Student 通过可以通过 Student.say 访问
  subClass.__proto__ = superClass;
}

var Shape = function Shape(x, y) {
  this.x = x;
  this.y = y;
};

var Circle = (function (_Shape) {
  _inheritsLoose(Circle, _Shape);

  function Circle(x, y, r) {
    var _this;

    // 组合继承
    _this = _Shape.call(this, x, y) || this;
    _this.r = r;
    return _this;
  }

  var _proto = Circle.prototype;

  _proto.draw = function draw() {
    console.log(
      '\u753B\u4E2A\u5750\u6807\u4E3A (' +
        this.x +
        ', ' +
        this.y +
        ')\uFF0C\u534A\u5F84\u4E3A ' +
        this.r +
        ' \u7684\u5706',
    );
  };

  return Circle;
})(Shape);
```

整个 ES6 的 extends 实现的是原型继承 + 组合继承。

子类构造器中调用了父类构造器并将 this 指向子类实例达到**将父类的实例属性组合到子类实例上**：

```javascript
// 组合继承
_this = _Shape.call(this, x, y) || this;
```

`_inheritsLoose` 这个函数就是实现了下一节要讲的原型继承。

## 原型继承

在讲`原型继承` 之前我们先讲讲`继承`这个词。我觉得，通俗意义上的`继承`是说：**如果类 A 继承自类 B，那么 A 的实例继承了 B 的实例属性**。

`原型继承`的这个`继承`和通俗意义上的`继承`还不太一样，它是要：**A 的实例能够继承 B 的原型上的属性**。

给原型继承下个定义：

```javascript
对于类 A 和类 B，如果满足 A.prototype.__proto__ === B.prototype，那么 A 原型继承 B
```

![prototypeExtends.png](https://user-gold-cdn.xitu.io/2020/3/31/1713024f86f61a45?w=913&h=628&f=png&s=39180)

其实上面的定义太严格了，我觉得只要 B 的 prototype 在 A 的原型链上就行了，这样就已经可以在 A 的实例上访问 B 原型上的属性了，上面的定义可以说是直接继承，但是可以二级或更多级的继承嘛。

如何实现原型继承呢？最简单的方式就是直接设置 `A.prototype === new B()`，让 A 的 prototype 是 B 的实例即可：

```javascript
function A() {}
function B() {
  this.xxx = '污染 A 的原型';
}

A.prototype = new B();

console.log(A.prototype.__proto__ === B.prototype); // => true
```

但是这种方式会导致 B 的实例属性污染 A 的原型。解决办法就是通过一个空的函数桥接一下，空的函数总不会有实例属性污染原型链喽：

```javascript
function A(p) {
  this.p = p;
}

function B() {
  this.xxx = '污染原型';
}

// 空函数
function Empty() {}

Empty.prototype = B.prototype;
A.prototype = new Empty();
// 修正 constructor 指向
A.prototype.constructor = A;

// 满足原型继承的定义
console.log(A.prototype.__proto__ === B.prototype); // => true

const a = new A('p');
console.log(a instanceof A); // => true

const b = new B();
console.log(b instanceof B); // => true

// a 也是 B 的实例
console.log(a instanceof B); // => true
console.log(a.__proto__.__proto__ === B.prototype); // => true
```

用 Windows 自带的画图软件画的原型链\_〆(´Д ｀ )：

![prototypeChain.png](https://user-gold-cdn.xitu.io/2020/3/31/1713024f88b2ee55?w=1485&h=492&f=png&s=9726)

利用 `Object.create`，我们可以更简单的实现原型继承，也就是上面的 babel 用到的工具函数 `_inheritsLoose`：

```javascript
function _inheritsLoose(subClass, superClass) {
  // Object.create(prototype) 返回一个以 prototype 为原型的对象
  subClass.prototype = Object.create(superClass.prototype);
  subClass.prototype.constructor = subClass;
  // 我们上面实现的原型继承没有设置这个，但是 class 的继承会设置子类的原型为父类
  subClass.__proto__ = superClass;
}
```

## JavaScript 和原型相关语法特性

其实由很多语法特性是和原型有关系的，讲到原型那么我们就再继续讲讲 JavaScrip 语法特性中涉及到原型的一些知识点。

### new 运算符原理

当我们对函数使用 new 的时候发生了什么。

使用代码来描述就是：

```javascript
function isObject(value) {
  const type = typeof value;
  return value !== null && (type === 'object' || type === 'function');
}

/**
 * Constructor 表示 new 的构造器 args 表示传给构造器的参数
 */
function New(constructor, ...args) {
  // new 的对象不是函数就抛 TypeError
  if (typeof constructor !== 'function') throw new TypeError(`${constructor} is not a constructor`);

  // 创建一个原型为构造器的 prototype 的空对象 target
  const target = Object.create(constructor.prototype);
  // 将构造器的 this 指向上一步创建的空对象，并执行，为了给 this 添加实例属性
  const result = constructor.apply(target, args);

  // 上一步的返回如果是对象就直接返回，否则返回 target
  return isObject(result) ? result : target;
}
```

简单测试一下：

```javascript
function Computer(brand) {
  this.brand = brand;
}

const c = New(Computer, 'Apple');
console.log(c); // => Computer { brand: 'Apple' }
```

### instanceof 运算符原理

instanceof 用于判断对象是否是某个类的实例，如果 obj instance A，我们就说 obj 是 A 的实例。

它的原理很简单，一句话概括就是：**obj instanceof 构造器 A，等同于判断 A 的 prototype 是不是 obj 的原型（也可能是二级原型）**。

代码实现：

```javascript
function instanceOf(obj, constructor) {
  if (!isObject(constructor)) {
    throw new TypeError(`Right-hand side of 'instanceof' is not an object`);
  } else if (typeof constructor !== 'function') {
    throw new TypeError(`Right-hand side of 'instanceof' is not callable`);
  }

  // 主要就这一句
  return constructor.prototype.isPrototypeOf(obj);
}
```

简单测试一下：

```javascript
function A() {}
const a = new A();

console.log(a instanceof A); // => true
console.log(instanceOf(a, A)); // => true
```

## 原型污染

在去年 2019 年秋天我还在国内某大厂实习的时候，lodash 爆出了一个严重的安全漏洞：[Lodash 库爆出严重安全漏洞，波及 400 万 + 项目](https://mp.weixin.qq.com/s/tfZq2PZylGfMjOp8h8eeTw)。这个安全漏洞就是由于**原型污染**导致的。

原型污染指的是：

> 攻击者通过某种手段修改 JavaScript 对象的原型

虽然说任何一个原型被污染了都有可能导致问题，但是我们一般提原型污染说的就是 `Object.prototype` 被污染。

### 原型污染的危害

#### 性能问题

举个最简单的例子：

```javascript
Object.prototype.hack = '污染原型的属性';
const obj = { name: 'xiaoHong', age: 18 };
for (const key in obj) {
  if (obj.hasOwnProperty(key)) {
    console.log(obj[key]);
  }
}

/* =>
xiaoHong
18
*/
```

原型被污染会增加遍历的次数，每次访问对象自身不存在的属性时也要访问下原型上被污染的属性。

#### 导致意外的逻辑 bug

看一个具体的 node 安全漏洞案例：

```javascript
'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');

const isObject = (obj) => obj && obj.constructor && obj.constructor === Object;

function merge(a, b) {
  for (var attr in b) {
    if (isObject(a[attr]) && isObject(b[attr])) {
      merge(a[attr], b[attr]);
    } else {
      a[attr] = b[attr];
    }
  }
  return a;
}

function clone(a) {
  return merge({}, a);
}

// Constants
const PORT = 8080;
const HOST = '127.0.0.1';
const admin = {};

// App
const app = express();
app.use(bodyParser.json());
app.use(cookieParser());

app.use('/', express.static(path.join(__dirname, 'views')));
app.post('/signup', (req, res) => {
  var body = JSON.parse(JSON.stringify(req.body));
  var copybody = clone(body);
  if (copybody.name) {
    res.cookie('name', copybody.name).json({
      done: 'cookie set',
    });
  } else {
    res.json({
      error: 'cookie not set',
    });
  }
});
app.get('/getFlag', (req, res) => {
  var аdmin = JSON.parse(JSON.stringify(req.cookies));
  if (admin.аdmin == 1) {
    res.send('hackim19{}');
  } else {
    res.send('You are not authorized');
  }
});
app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);
```

这段代码的漏洞就在于 merge 函数上，我们可以这样攻击：

```bash
curl -vv --header 'Content-type: application/json' -d '{"__proto__": {"admin": 1}}' 'http://127.0.0.1:4000/signup';

curl -vv 'http://127.0.0.1/getFlag'
```

首先请求 `/signup` 接口，在 NodeJS 服务中，我们调用了有漏洞的 `merge` 方法，并通过 `__proto__` 为 `Object.prototype`（因为 `{}.__proto__ === Object.prototype`）添加上一个新的属性 `admin`，且值为 1。

再次请求 `getFlag` 接口，访问了 Object 原型上的`admin`，条件语句 `admin.аdmin == 1` 为 `true`，服务被攻击。

### 预防原型污染

其实原型污染大多发生在调用会修改或者扩展对象属性的函数时，例如 lodash 的 defaults，jquery 的 extend。预防原型污染最主要还是要有防患意识，养成良好的编码习惯。

#### Object.create(null)

笔者看过一些类库的源码时，经常能看到这种操作，例如 [EventEmitter3](https://github.com/primus/eventemitter3/blob/master/index.js#L23)。通过 Object.create(null) 创建没有原型的对象，即便你对它设置`__proto__` 也没有用，因为它的原型一开始就是 null，没有 `__proro__` 的 `setter`。

```javascript
const obj = Object.create(null);
obj.__proto__ = { hack: '污染原型的属性' };
const obj1 = {};
console.log(obj1.__proto__); // => {}
```

#### Object.freeze(obj)

可以通过 Object.freeze(obj) 冻结对象 obj，被冻结的对象不能被修改属性，成为不可扩展对象。前面也说过不能修改不可扩展对象的原型，会抛 TypeError：

```javascript
const obj = Object.freeze({ name: 'xiaoHong' });
obj.xxx = 666;
console.log(obj); // => { name: 'xiaoHong' }
console.log(Object.isExtensible(obj)); // => false
obj.__proto__ = null; // => TypeError: #<Object> is not extensible
```

距离我从之前实习的公司离职也有将近三个月了，我记得那时候每次 `npm install` 都显示检查出几十个依赖漏洞。肯定是好久都没升级才会积累那么多漏洞，反正我是不敢随便升级，之前一个 bug 查了好半天结果是因为 axios 的升级导致的。也不知道到现在有没有升级过 😄。

## 一道最近校招面试碰到的和原型相关的面试题

最近面试某大厂碰到下面这道面试题：

```javascript
function Page() {
  return this.hosts;
}
Page.hosts = ['h1'];
Page.prototype.hosts = ['h2'];

const p1 = new Page();
const p2 = Page();

console.log(p1.hosts);
console.log(p2.hosts);
```

运行结果是：先输出 `undefiend`，然后报错 `TypeError: Cannot read property 'hosts' of undefined`。

为什么 `console.log(p1.hosts)` 是输出 `undefiend` 呢，前面我们提过 new 的时候如果 return 了对象，会直接拿这个对象作为 new 的结果，因此，`p1` 应该是 `this.hosts` 的结果，而在 `new Page()` 的时候，this 是一个以 `Page.prototype` 为原型的 `target` 对象，所以这里 `this.hosts` 可以访问到 `Page.prototype.hosts` 也就是 `['h2']`。这样 `p1` 就是等于 `['h2']`，`['h2']` 没有 `hosts` 属性所以返回 `undefined`。

为什么 `console.log(p2.hosts)` 会报错呢，`p2` 是直接调用 `Page` 构造函数的结果，直接调用 `page` 函数，这个时候 `this` 指向全局对象，全局对象并没 `hosts` 属性，因此返回 `undefined`，往 `undefined` 上访问 `hosts` 当然报错。

参考资料：

1. [最新：Lodash 严重安全漏洞背后你不得不知道的 JavaScript 知识](https://juejin.im/post/5d271332f265da1b934e2d48)

本文为原创内容，首发于[个人博客](http://www.lyreal666.com)，转载请注明出处。
