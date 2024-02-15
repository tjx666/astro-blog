---
title: '使用 nodejs 写爬虫 (一): 常用模块和 js 语法'
tags:
  - node
  - spider
  - package
  - module
  - javascript
categories:
  - 后端
author: 余腾靖
pubDatetime: 2019-04-01 12:14:00
---

本篇是使用 nodejs 写爬虫系列教程的第一篇，介绍了使用 nodejs 写爬虫过程中常用的模块和一些必须掌握的 js 语法

<!-- more -->

## 常用模块

常用模块有以下几个：

1. [fs-extra](https://github.com/jprichardson/node-fs-extra)
2. [superagent](https://github.com/visionmedia/superagent)
3. [cheerio](https://github.com/cheeriojs/cheerio)
4. [log4js](https://github.com/log4js-node/log4js-node)
5. [sequelize](https://github.com/sequelize/sequelize)
6. [chalk](https://github.com/chalk/chalk)
7. [puppeteer](https://github.com/GoogleChrome/puppeteer)

### fs-extra

使用 async/await 的前提是必须将接口封装成 promise, 看一个简单的例子：

```javascript
const sleep = (milliseconds) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(), milliseconds);
  });
};

const main = async () => {
  await sleep(5000);
  console.log('5 秒后...');
};

main();
```

通过在 async 函数中使用 await + promise 的方式来组织异步代码就像是同步代码一般，非常的自然和有助于我们分析代码的执行流程。

在 node 中，fs 模块是一个很常用的操作文件的 native 模块，fs (file system) 模块提供了和文件系统相关的一些同步和异步的 api, 有时候使用同步 api 非常有必要，比如你要在一个自己写的模块中的在访问文件后导出一些接口时，这个时候用同步的 api 就很实用。看个例子：

```javascript
const path = require('path');
const fs = require('fs-extra');
const { log4js } = require('../../config/log4jsConfig');
const log = log4js.getLogger('qupingce');

const createModels = () => {
  const models = {};
  const fileNames = fs.readdirSync(path.resolve(__dirname, '.'));

  fileNames
    .filter((fileName) => fileName !== 'index.js')
    .map((fileName) => fileName.slice(0, -3))
    .forEach((modelName) => {
      log.info(`Sequelize define model ${modelName}!`);
      models[modelName] = require(path.resolve(__dirname, `./${modelName}.js`));
    });
  return models;
};

module.exports = createModels();
```

这个模块访问了当前目录下所有的 model 模块并导出 models, 如果是使用异步接口也就是 fs.readdir, 这样的话你在别的模块导入这个模块是获取不到 models 的，原因是 require 是同步操作，而接口是异步的，同步代码无法立即获得异步操作的结果。

为了充分发挥 node 异步的优势，我们还是应该尽量使用异步接口。

我们完全可以使用 fs-extra 模块来代替 fs 模块，类似的模块还有 [mz](https://github.com/normalize/mz)。fs-extra 包含了所有的 fs 模块的接口，还对每个异步接口提供了 promise 支持，更棒的是 fs-extra 还提供了一些其它的实用文件操作函数，比如删除移动文件的操作。更详细的介绍请查看官方仓库 [fs-extra](https://github.com/jprichardson/node-fs-extra)。

### superagent

superagent 是一个 node 的 http client, 可以类比 java 中的 httpclient 和 okhttp, python 中的 requests。可以让我们模拟 http 请求。superagent 这个库有很多实用的特点。

1. superagent 会根据 response 的 content-type 自动序列化，通过 response.body 就可以获取到序列化后的返回内容

2. 这个库会自动缓存和发送 cookies, 不需要我们手动管理 cookies

3. 再来就是它的 api 是链式调用风格的，调用起来很爽，不过使用的时候要注意调用顺序

4. 它的异步 api 都是返回 promise 的。

非常方便有木有 😋。官方文档就是很长的一页，目录清晰，很容易就搜索到你需要的内容。最后，superagent 还支持插件集成，比如你需要在超时后自动重发，可以使用 superagent-retry。更多插件可以去 npm 官网上搜索关键字 `superagent-`。更多详情查看官方文档[superagent](https://visionmedia.github.io/superagent/)

```javascript
// 官方文档的一个调用示例
request
  .post('/api/pet')
  .send({ name: 'Alice', species: 'cat' })
  .set('X-API-Key', 'foobar')
  .set('Accept', 'application/json')
  .then((res) => {
    alert('yay got ' + JSON.stringify(res.body));
  });
```

### cheerio

写过爬虫的人都知道，我们经常会有解析 html 的需求，从网页源代码中爬取信息应该是最基础的爬虫手段了。python 中有 beautifulsoup, java 中有 jsoup, node 中有 cheerio。

cheerio 是为服务器端设计的，给你近乎完整的 jquery 体验。使用 cheerio 来解析 html 获取元素，调用方式和 jquery 操作 dom 元素用法完全一致。而且还提供了一些方便的接口，比如获取 html, 看一个例子：

```javascript
const cheerio = require('cheerio');
const $ = cheerio.load('<h2 class="title">Hello world</h2>');

$('h2.title').text('Hello there!');
$('h2').addClass('welcome');

$.html();
//=> <h2 class="title welcome">Hello there!</h2>
```

官方仓库：[cheerio](https://github.com/cheeriojs/cheerio)

### log4js

log4j 是一个为 node 设计的日志模块。场景简单情况下可以考虑使用 debug 模块。log4js 比较符合我对日志库的需求，其实他俩定位也不一样，debug 模块是为调试而设计的，log4js 则是一个日志库，肯定得提供文件输出和分级等常规功能。

log4js 模块看名字有点向 java 中很有名的日志库 log4j 看齐的节奏。log4j 有以下特点：

1. 可以自定义 appender(输出目标)，lo4js 甚至提供了输出到邮件等目标的 appender
2. 通过组合不同的 appender, 可以实现不同目的的 logger(日志器)
3. 提供了日志分级功能，官方的 FAQ 中提到了如果要对 appender 实现级别过滤，可以使用 **logLevelFilter**
4. 提供了滚动日志和自定义输出格式

下面通过我最近一个爬虫项目的配置文件来感受以下这个库的特点：

```javascript
const log4js = require('log4js');
const path = require('path');
const fs = require('fs-extra');

const infoFilePath = path.resolve(__dirname, '../out/log/info.log');
const errorFilePath = path.resolve(__dirname, '../out/log/error.log');
log4js.configure({
  appenders: {
    dateFile: {
      type: 'dateFile',
      filename: infoFilePath,
      pattern: 'yyyy-MM-dd',
      compress: false,
    },
    errorDateFile: {
      type: 'dateFile',
      filename: errorFilePath,
      pattern: 'yyyy-MM-dd',
      compress: false,
    },
    justErrorsToFile: {
      type: 'logLevelFilter',
      appender: 'errorDateFile',
      level: 'error',
    },
    out: {
      type: 'console',
    },
  },
  categories: {
    default: {
      appenders: ['out'],
      level: 'trace',
    },
    qupingce: {
      appenders: ['out', 'dateFile', 'justErrorsToFile'],
      level: 'trace',
    },
  },
});

const clear = async () => {
  const files = await fs.readdir(path.resolve(__dirname, '../out/log'));
  for (const fileName of files) {
    fs.remove(path.resolve(__dirname, `../out/log/${fileName}`));
  }
};

module.exports = {
  log4js,
  clear,
};
```

### sequelize

写项目我们往往会有持久化的需求，简单的场景可以使用 JSON 保存数据，如果数据量比较大还要便于管理，那么我们就要考虑用数据库了。如果是操作 mysql 和 sqlite 建议使用 sequelize, 如果是 mongodb, 我更推荐用专门为 mongodb 设计的 [mongoose](https://github.com/Automattic/mongoose)

sequelize 有几点我觉得还是有点不太好，比如默认生成 `id` (primary key), `createdAt` 和 `updatedAt`。

抛开一些自作主张的小毛病，sequelize 设计的还是很好的。内置的操作符，hooks, 还有 validators 很有意思。sequelize 还提供了 promise 和 typescript 支持。如果是使用 typescript 开发项目，还有另外一个很好的 orm 选择 : [typeorm](https://github.com/typeorm/typeorm)。更多内容可以查看官方文档：[sequelize](http://docs.sequelizejs.com/)

### chalk

chalk 中文意思是粉笔的意思，这个模块是 node 很有特色和实用的一个模块，它可以为你输出的内容添加颜色，下划线，背景色等装饰。当我们写项目的时候往往需要记录一些步骤和事件，比如打开数据库链接，发出 http 请求等。我们可以适当使用 chalk 来突出某些内容，例如请求的 url 加上下划线。

```javascript
const logRequest = (response, isDetailed = false) => {
  const URL = chalk.underline.yellow(response.request.url);
  const basicInfo = `${response.request.method} Status: ${response.status} Content-Type: ${response.type} URL=${URL}`;
  if (!isDetailed) {
    logger.info(basicInfo);
  } else {
    const detailInfo = `${basicInfo}\ntext: ${response.text}`;
    logger.info(detailInfo);
  }
};
```

调用上面的 logRequest 效果：

![chalk](https://i.loli.net/2019/04/02/5ca3724e74da1.png)

更多内容查看官方仓库[chalk](https://github.com/chalk/chalk)

### puppeteer

如果这个库没听说过，你可能听说过 selenium。puppeteer 是 Google Chrome 团队开源的一个通过 devtools 协议操纵 chrome 或者 Chromium 的 node 模块。Google 出品，质量有所保证。这个模块提供了一些高级的 api, 默认情况下，这个库操纵的浏览器用户是看不到界面的，也就是所谓的无头 (headless) 浏览器。当然可以通过配置一些参数来启动有界面的模式。在 chrome 中还有一些专门录制 puppeteer 操作的扩展，比如[Puppeteer Recorder](https://chrome.google.com/webstore/detail/puppeteer-recorder/djeegiggegleadkkbgopoonhjimgehda)。使用这个库我们可以用来抓取一些通过 js 渲染而不是直接存在于页面源代码中的信息。比如 spa 页面，页面内容都是 js 渲染出来的。这个时候 puppeteer 就为我们解决了这个问题，我们可以调用 puppeteer 在页面某个标签出现时获取到页面当时的渲染出来的 html。事实上，往往很多比较困难的爬虫解决的最终法宝就是操纵浏览器。

## 前置的 js 语法

### async/await

首先要提的就是 async/await, 因为 node 在很早的时候 (node 8 LTS) 就已经支持 async/await, 现在写后端项目没理由不用 async/await 了。使用 async/await 可以让我们从回调炼狱的困境中解脱出来。这里主要提一下关于使用 async/await 时可能会碰到的问题

#### 使用 async/await 怎样并发？

来看一段测试代码：

```javascript
const sleep = (milliseconds) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(), milliseconds);
  });
};

const test1 = async () => {
  for (let i = 0, max = 3; i < max; i++) {
    await sleep(1000);
  }
};

const test2 = async () => {
  Array.from({ length: 3 }).forEach(async () => {
    await sleep(1000);
  });
};

const main = async () => {
  console.time('测试 for 循环使用 await');
  await test1();
  console.timeEnd('测试 for 循环使用 await');

  console.time('测试 forEach 调用 async 函数');
  await test2();
  console.timeEnd('测试 forEach 调用 async 函数');
};

main();
```

运行结果是：

```plaintext
测试 for 循环使用 await: 3003.905ms
测试 forEach 调用 async 函数: 0.372ms
```

我想可能会有些人会认为测试 forEach 的结果会是 1 秒左右，事实上测试 2 等同于以下代码：

```javascript
const test2 = async () => {
  // Array.from({length: 3}).forEach(async () => {
  //     await sleep(1000);
  // });

  Array.from({ length: 3 }).forEach(() => {
    sleep(1000);
  });
};
```

从上面的运行结果也可以看出直接在 for 循环中使用 await + promise, 这样等同于**同步**调用，所以耗时是 3 秒左右。如果要并发则应该直接调用 promise, 因为 forEach 是不会帮你 await 的，所以等价于上面的代码，三个任务直接异步并发了。

#### 处理多个异步任务

上面的代码还有一个问题，那就是测试 2 中并没有等待三个任务都执行完就直接结束了，有时候我们需要等待多个并发任务结束之后再执行后续任务。其实很简单，利用下 Promise 提供的几个工具函数就可以了。

```javascript
const sleep = (milliseconds, id = '') => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      console.log(`任务${id}执行结束`);
      resolve(id);
    }, milliseconds);
  });
};

const test2 = async () => {
  const tasks = Array.from({ length: 3 }).map((ele, index) => sleep(1000, index));
  const resultArray = await Promise.all(tasks);
  console.log({ resultArray });
  console.log('所有任务执行结束');
};

const main = async () => {
  console.time('使用 Promise.all 处理多个并发任务');
  await test2();
  console.timeEnd('使用 Promise.all 处理多个并发任务');
};

main();
```

运行结果：

```plaintext
任务0执行结束
任务1执行结束
任务2执行结束
{ resultArray: [ 0, 1, 2 ] }
所有任务执行结束
使用 Promise.all 处理多个并发任务: 1018.628ms
```

除了 Promise.all, Promise 还有 race 等接口，不过最常用应该就是 all 和 race 了。

### 正则表达式

正则表达式是处理字符串强有力的工具。核心是匹配，由此衍生出提取，查找，替换的等操作。

有时候我们通过 cheerio 中获取到某个标签内的文本时，我们需要提取其中的部分信息，这个时候正则表达式就该上场了。正则表达式的相关语法这里就不详细说明了，入门推荐看[廖雪峰的正则表达式教程](https://www.liaoxuefeng.com/wiki/001434446689867b27157e896e74d51a89c25cc8b43bdb3000/001434499503920bb7b42ff6627420da2ceae4babf6c4f2000)。来看个实例：

```javascript
// 服务器返回的 img url 是：/GetFile/getUploadImg?fileName=9b1cc22c74bc44c8af78b46e0ca4c352.png
// 现在我只想提取文件名，后缀名也不要
const imgUrl = '/GetFile/getUploadImg?fileName=9b1cc22c74bc44c8af78b46e0ca4c352.png';
const imgReg = /\/GetFile\/getUploadImg\?fileName=(.+)\..+/;
const imgName = imgUrl.match(imgReg)[1];
console.log(imgName); // => 9b1cc22c74bc44c8af78b46e0ca4c352
```

暂时先介绍到这里了，后续有更多内容会继续补充。

本文为原创内容，首发于[个人博客](http://www.lyreal666.com), 转载请注明出处。如果有问题欢迎邮件骚扰 <ytj2713151713@gmail.com>。
