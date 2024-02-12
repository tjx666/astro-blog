---
title: 总结下 javascript 中的一些小技巧
tags:
  - javascript
categories:
  - 前端
author: 余腾靖
pubDatetime: 2019-04-03 19:19:00
---

这篇文章主要记录一下平时自己实践得到的, 博客中学习的以及在一些项目源码中看到的 javascript 技巧。有些东西可以说是奇淫技巧，有些可能是 ES6+ 中一些比较具有实用性的新语法。

<!-- more -->

### && 和 || 的妙用

有时候我们需要在某个函数或变量为 true 时执行另外一个函数。例如:

```javascript
const task1 = () => {
  console.log('执行 task1');
  return Math.random() >= 0.5;
};

const task2 = () => console.log('task1 执行成功后执行 task2');
if (task1()) task2();
```

上面的 if 语句可以使用 `&&` 直接简写为:

```javascript
task1() && task2();
```

如果还要在 task1 失败(也就是 task1 返回 false)后执行 task3, 可以使用:

```javascript
const task3 = () => console.log('task1 执行失败后执行 task3');
(task1() && task2()) || task3();
```

本质上还是利用了 `&&` 和 `||` 的短路特性。

其实这里使用条件运算符也是可以的:

```javascript
task1() ? task2() : task3();
```

下面展示的我最近的一个使用 **react hooks** 开发的项目中的一个代码片段，这里利用了 **render props**:

```javascript
const ProfileItem = (props) => {
  const { name, value, render } = props;

  return (
    <div className="profile-item">
      <span className="item-name">{name}</span>
      <form action="">
        {/* 根据是否有 render 这个 props 来返回不同的内容 */}
        {(render && render(props)) || <SimpleProfileItemContent value={value} />}
      </form>
    </div>
  );
};
```

### 函数默认值

#### ES5 版本

使用短路或操作符来设置函数默认值的方式其实很常见。但是有一些坑，下面展示的代码中当默认值参数为一个数字时，传参为 0 还是会使用默认值，必须对 y 为 0 的时候单独进行判断。

```javascript
const pow = (x, y) => {
  y = y || 2;

  let result = 1;
  for (let i = 0, max = y; i < max; i++) {
    result *= x;
  }

  return result;
};

console.log(pow(2)); // => 4
console.log(pow(2, 3)); // => 8

// 当 y 传值为 0 时, y 取值 2
console.log(pow(2, 0)); // => 4
```

#### ES6 版本

ES6 在语法层面提供的默认值语法就靠谱的多了

```javascript
const pow = (x, y = 2) => {
  let result = 1;
  for (let i = 0, max = y; i < max; i++) {
    result *= x;
  }

  return result;
};

console.log(pow(2)); // => 4
console.log(pow(2, 3)); // => 8
console.log(pow(2, 0)); // => 1
```

### 类数组转数组

类数组指的是像 `arguments` ，`jquery` 对象一样可以使用下标访问还有 length 属性的和数组很像但并不是数组的一类对象。

类数组没有 `slice`, `map` 等集合函数，这也是为什么我们有时候需要将类数组转换成数组的原因。

```javascript
function func() {
  for (let i = 0, max = arguments.length; i < max; i++) {
    console.log(arguments[i]);
  }

  console.log(Array.isArray(arguments)); // => false
  // 类数组没有 slice, forEach, map 等集合函数
  console.log(arguments.slice === undefined); // => true
}

func('Google', 'facebook', 'Microsoft');
// =>
// Google
// facebook
// Microsoft
```

#### ES5 中的转换方法

将 Array 原型中的 slice 方法绑定到 arguments 对象上调用，并且不传参数目的为了让其返回所有的元素。

```javascript
function func() {
  const array = Array.prototype.slice.call(arguments);
  console.log(array.slice(0, 1));
}

func('Google', 'facebook', 'Microsoft'); // => [ 'Google' ]
```

#### ES6 中的转换方法

ES6 将类数组转换成数组的方法多一些。

使用扩展运算符

```javascript
function func() {
  console.log([...arguments]);
}

func('Google', 'facebook', 'Microsoft'); // [ 'Google', 'facebook', 'Microsoft' ]
```

使用 Array.from

```javascript
function func() {
  console.log(Array.from(arguments));
}

func('Google', 'facebook', 'Microsoft'); // [ 'Google', 'facebook', 'Microsoft' ]
```

### 构造一个连续整数的数组

这里就直接给出我觉得最好的方法了

```javascript
// 输出 2 开始连续的8个整数
const array = Array.from({ length: 8 }).map((ele, index) => index + 2);
console.log(array); // => [ 2, 3, 4, 5, 6, 7, 8, 9 ]

// 评论区指出有更简洁的版本, Array.from 自带的映射函数
const array = Array.from({ length: 8 }, (ele, index) => index + 2);
console.log(array); // => [ 2, 3, 4, 5, 6, 7, 8, 9 ]

// 还有一个网友指出可以利用 Array.prototype.keys 来构造
const array = [...Array(8).keys()].map((ele, index) => index + 2);
```

### 函数参数使用解构赋值

函数参数比较多的时候我们往往会让参数直接接受一个配置对象。但是使用对象参数我们无法设置默认值，在函数体中使用对象参数时还需要使用通过对象参数来访问，当访问次数比较多或者嵌套比较深就会觉得不方便。在函数参数中使用解构赋值就解决了上面的问题。

```javascript
// 必须给对象参数设置默认值, 不然传参数时因为没有解构对象会报错
const getUsers = ({ offset = 0, limit = 1, orderBy = 'salary' } = {}) => {
  // 根据条件查询数据库返回用户数据
  console.log({ offset, limit, orderBy });
};

getUsers({ offset: 10, limit: 20, orderBy: 'age' }); // => { offset: 10, limit: 20, orderBy: 'age' }
getUsers(); // => { offset: 0, limit: 1, orderBy: 'salary' }
```

### 使用 !! 将其它类型转换成 bool 型

```javascript
console.log(!!{}); // true
console.log(!!0); // false
console.log(!![]); // true
console.log(!!undefined); // false

const httpGet = (url, retry) => {
  if (!!retry) {
    // 超时重发
  }
};
```

### JSON.stringify

#### 深度克隆

使用先序列化再反序列化这种方式来深度克隆对象在一般情况下很方便，缺点就是无法克隆函数以及继承的属性。

如果还要克隆函数属性，推荐使用 lodash 的 cloneDeep。

```javascript
const me = {
  name: 'lyreal666',
  age: 23,
  speak() {
    console.log(`Hello, I'm ly!`);
  },
};

const clonedMe = JSON.parse(JSON.stringify(me));
console.log(clonedMe); // => { name: 'lyreal666', age: 23 }
console.log(clonedMe.speak === undefined); // => true
```

#### 使用第二个和第三参数

JSON.stringify 的第二个参数是用来对属性值进行处理的，第三个参数则是用来指定输出的 json 字符串的缩进长度，可以传数字也可以传字符串。

```javascript
const me = {
  name: 'lyreal666',
  age: 23,
  speak() {
    console.log(`Hello, I'm ly!`);
  },
};

const jsonStr = JSON.stringify(me, (key, value) => (key === 'name' ? '老余' : value), 2);

console.log(jsonStr);
/* =>
{
  "name": "老余",
  "age": 23
}
*/
```

### 优雅的遍历对像

使用解构赋值和 Object.entries。

```javascript
const me = {
  name: 'lyreal666',
  age: 23,
  speak() {
    console.log(`Hello, I'm ly!`);
  },
};

for (const [key, value] of Object.entries(me)) {
  console.log(`${key}: ${value}`);
}

/* =>
name: lyreal666
age: 23
speak: speak() {
        console.log(`Hello, I'm ly!`);
    }
*/
```

### 清空数组的最快方法

评论区有人说这种直接修改 `length` 的做法是有问题的, 我之前也看过关于清空数组的方法的讨论, 但是我觉得一般情况下这样用是没什么问题的, 既简单, 又不用重新分配内存给新数组。

```javascript
const array = [1, 2, 3, 4];
array.length = 0;
console.log(array); // => []

// 网友指出可以更好的方式是直接赋值空数组
let array = [1, 2, 3, 4];
array = [];
```

### 判断一个整数是否是 -1

```javascript
// ~ 操作符的运算规律可以简单记作将加一的结果取反
console.log(~1); // => -2
console.log(~0); // => -1
console.log(~-3); // => 2
console.log(~-1); // => 0

const number = -2;

// 判断一个数是否为 -1
if (!~number) {
  // 当 number 是 -1 的操作...
}
```

### 立即执行函数

立即执行函数可以让我们的代码中的变量不污染外部变量，常见的使用方式是像下面这样的。

```javascript
// 使用括号将函数括起来调用
(function (window, $) {
  // 内部代码
})(window, jQuery);
```

更优雅的方式是下面这种，事实上很多其它的算术运算符比如 +, -, \*, ~ 等也是可以的。

```javascript
! function(window, $) {
    // 内部代码
} (window, jQuery)

// 还可以使用 +, -, * 等
+ function(window, $) {
    // 内部代码
} (window, jQuery)

// 更神奇的是还可以用 new, typeof 等操作符
new function(window, $) {
    // 内部代码
} (window, jQuery)；
```

### 使用 set 来对数组去重复

```javascript
console.log([...new Set([1, 3, 1, 2, 2, 1])]); // => [ 1, 3, 2 ]
```

### 使用 reduce 连乘或连加

```javascript
const array = [1, 2, 3, 4];
// 连加
console.log(array.reduce((p, c) => p + c)); // => 10
// 连乘
console.log(array.reduce((p, c) => p * c)); // => 24
```

### 取整

Math 中的一堆取整函数这里就不说了，主要是提一些比较巧妙地取整方式。

```javascript
console.log(~~3.14); // => 3
console.log(~~-2.5); // => -2

console.log(6.18 | 0); // => 6
console.log(-3.6 | 0); // => -3

console.log(9.9 >> 0); // => 9
console.log(-2.1 >> 0); // => -2

// superagent 是一个很实用的发送 http 请求的 node 模块，它对返回码的处理就用到了 |
var type = (status / 100) | 0;

// status / class
res.status = status;
res.statusType = type;

// basics
res.info = 1 == type;
res.ok = 2 == type;
res.clientError = 4 == type;
res.serverError = 5 == type;
res.error = 4 == type || 5 == type;
```

### 使用 + 将其它类型转换成 number 类型

```javascript
console.log(+'3.14'); // => 3.14
console.log(typeof +'3.14'); // => number

const sleep = (milliseconds) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(), milliseconds);
  });
};

// 当然这里可以考虑使用 console.time 来测试
!(async function main() {
  const start = +new Date();
  await sleep(3000);
  const end = +new Date();
  console.log(`执行了${end - start}`); // 执行了 3002
})();
```

### 使用科学计数法表示大数字

```javascript
const str1 = 'hello';
const str2 = ' world';

console.time('测试 + 拼接字符串');
for (let i = 0; i < 200000000; i++) {
  const joinedStr = str1 + str2;
}
console.timeEnd('测试 + 拼接字符串');

console.time('测试模板字符串拼接字符串');
// 使用科学计数法比打 8 个 0 方便不少
for (let i = 0; i < 2e8; i++) {
  const joinedStr = `${str1}${str2}`;
}
console.timeEnd('测试模板字符串拼接字符串');

/* =>
测试 + 拼接字符串: 3238.037ms
测试模板字符串拼接字符串: 3680.225ms
*/
```

### 交换变量值

直接利用解构赋值

```javascript
let a = 666;
let b = 999;
[a, b] = [b, a];
console.log({ a, b }); // => { a: 999, b: 666 }
```

### 获取随机字符串

截取下标 2 开始后的字符串是因为不需要 Math.random() 返回的小数构成的字符串的 `0.` 这两个字符。使用 36 进制可以制造字符种类更多些的随机字符串

```
console.log(Math.random().toString(16).substring(2)); // 13位 => 45d9d0bb10b31
console.log(Math.random().toString(36).substring(2)); // 11位 => zwcx1yewjvj
```

### 扁平化数组

ES 2019 新增了 Array.prototype.flat，目前 chrome 最新正式版 73.0.3683.103 已经支持了, node 最新的 LTS 10.15.3 还不支持, node 最新开发版 11.13.0 是支持的。这里贴一个在掘金一个兄弟面经里面看到的比较 hack 的方法，这里要注意根据情况做类型转换。

```javascript
const array = [1, [2, [3, 4], 5], 6, 7];
console.log(
  array
    .toString()
    .split(',')
    .map((ele) => Number.parseInt(ele)),
); // => [ 1, 2, 3, 4, 5, 6, 7 ]
```

本文为原创内容，首发于[个人博客](http://www.lyreal666.com)，转载请注明出处。
