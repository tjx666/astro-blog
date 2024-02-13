---
title: 通过 koa2 服务器实践探究浏览器 HTTP 缓存机制
tags:
  - HTTP
categories:
  - 计算机网络
author: 余腾靖
pubDatetime: 2019-06-17 10:22:00
---

浏览器 HTTP 缓存是一种常见的 web 性能优化的手段，也是在前端面试中经常被考察的一个知识点。本文通过配置 koa2 服务器，在实践中带你探究浏览器的 HTTP 缓存机制。

<!-- more -->

先来直观认识一下浏览器 HTTP 缓存：

![v2EX 首页首次加载](https://i.loli.net/2019/06/17/5d070499177b444422.png)

上面是打开浏览器后直接访问 V2EX 首页后的截图，矩形圈起来的那块也就是 size 部分显示的都是 `from disk cached`，说明这些资源命中了强缓存，强缓存的状态码都是 200。

再来看看我直接访问上面箭头指向的那张图片是什么情况：

![演示协商缓存](https://i.loli.net/2019/06/17/5d070673e1d7c93593.png)可以看到返回码是 304，并且请求的时候带上了协商缓存用于协商的两个请求头 if-modified-since 和 if-none-match，命中了协商缓存。可能有部份读者看到这里不太理解我前面提到的强缓存和协商缓存是什么鬼，没关系，看到最后再回过头来看，你就自然能清晰的看懂我上面圈起来的东西和提到的一些不懂术语。

### 缓存判断规则是怎么实现的

**其实所有的网络协议都是一套规范，客户端和服务器端是怎么只是按照规范来实现而已**。浏览器 HTTP 缓存也是如此，浏览器在开发的时候便按照 HTTP 缓存规范来开发，我们开发的 HTTP 服务器也应该遵守其规范。当然了，服务器是你自己写的，你完全可以不按规范来，但是浏览器不知道你在搞什么名堂啊，HTTP 缓存肯定不会正常工作了。

我们知道浏览器和服务器进行交互的时候会发送一些请求数据和响应数据，我们称之为 HTTP 报文。

![HTTP 报文结构](https://i.loli.net/2019/06/17/5d0756f543e2f45062.png)与缓存相关的规则信息就包含在报文首部中。下面是 chrome network 面板中的信息：

![network 报文结构说明](https://i.loli.net/2019/06/18/5d087d429e22146774.png)

浏览器的 HTTP 缓存协议本质上就通过请求响应过程中在首部中携带那些和缓存相关的字段来实现的。

### 浏览器 HTTP 缓存的分类

浏览器 HTTP 缓存分两钟：

1. 强缓存
2. 协商缓存

**强缓存**指的是浏览器在本地判定缓存有无过期，未过期直接从内存或磁盘读取缓存，整个过程不需要和服务器通信。

**协商缓存**需要向服务器发送一次协商请求，请求时带上和协商缓存相关的请求头，由服务器判断缓存是否过期，未过期就返回状态码 304，浏览器当发现响应的返回码是 304，也直接是读取本地缓存，如果服务器判定过期就直接返回请求资源和 last-modified，状态码为 200。

浏览器请求资源时判定缓存的简略流程如下图：

![浏览器 HTTP 缓存判断过程](https://i.loli.net/2019/06/17/5d0748842436b59302.png)

文字解释一下：当浏览器请求一个资源时，浏览器会先从内存中或者磁盘中查看是否有该资源的缓存。如果没有缓存，可能浏览器之前没访问过这个资源或者缓存被清除了那只能向服务器请求该资源。

如果有缓存，那么就先判断有没有命中强缓存。如果命中了强缓存则直接使用本地缓存。如果没有命中强缓存但是上次请求该资源时返回了和协商缓存相关的响应头如 last-modified 那么就带上和协商缓存相关的请求头发送请求给服务器，根据服务器返回的状态码来判定是否命中了协商缓存，命中了的话是用本地缓存，没有命中则使用请求返回的内容。

#### 强缓存和协商缓存的区别

1. 命中时状态码不同。强缓存返回 200，协商缓存返回 304。
2. 优先级不同。先判定强缓存，强缓存判断失败再判定协商缓存。
3. 强缓存的收益高于协商缓存，因为协商缓存相对于强缓存多了一次协商请求。

### 演示服务器说明

整个 koa2 演示服务器在这：[koa2-browser-HTTP-cache](https://github.com/tjx666/koa2-browser-HTTP-cache)。总共就几个文件，index.js 入口文件，index.html 首页源代码，sunset.jpg 和 style.css 是 index.html 用到的图片和样式。

![目录结构](https://i.loli.net/2019/06/18/5d08b61fe2ee448544.png)

服务器代码代码很简单，使用 koa-router 配了三个路由，目前还没有写缓存相关的代码。

```javascript
// src/index.js
const Koa = require('koa');
const Router = require('koa-router');
const mime = require('mime');
const fs = require('fs-extra');
const Path = require('path');

const app = new Koa();
const router = new Router();

// 处理首页
router.get(/(^\/index(.html)?$)|(^\/$)/, async (ctx, next) => {
  ctx.type = mime.getType('.html');

  const content = await fs.readFile(Path.resolve(__dirname, './index.html'), 'UTF-8');
  ctx.body = content;

  await next();
});

// 处理图片
router.get(/\S*\.(jpe?g|png)$/, async (ctx, next) => {
  const { path } = ctx;
  ctx.type = mime.getType(path);

  const imageBuffer = await fs.readFile(Path.resolve(__dirname, `.${path}`));
  ctx.body = imageBuffer;

  await next();
});

// 处理 css 文件
router.get(/\S*\.css$/, async (ctx, next) => {
  const { path } = ctx;
  ctx.type = mime.getType(path);

  const content = await fs.readFile(Path.resolve(__dirname, `.${path}`), 'UTF-8');
  ctx.body = content;

  await next();
});

app.use(router.routes()).use(router.allowedMethods());

app.listen(3000);
process.on('unhandledRejection', (err) => {
  console.error('有 promise 没有 catch', err);
});
```

访问首页后页面长这样的：

![未配置缓存访问首页](https://i.loli.net/2019/06/18/5d08a6aaed4b785068.png)

当前服务器没有配置缓存，可以看到 size 部分显示了资源的大小，如果是命强缓存就会显示 `from memory cache` 或者 `from disk cache`。

### 强缓存

强缓存是 web 性能优化中收益非常高的一种手段。

#### 强缓存相关的头部字段

前面说过缓存协议本质上是通过请求响应头来实现的。和强缓存相关的头部字段有以下这些：

##### [pragma](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Pragma)

pragma 是 HTTP1.0 时期的产物，和后面要说的 cache-control 作用差不多，它的值只能设置为 `no-cache`。与 Cache-Control: no-cache 效果一致，即禁用强缓存，只能使用协商缓存。

##### [expires](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Expires)

响应头字段，包含日期/时间，表示资源的过期时间。例如 `Thu, 31 Dec 2037 23:55:55 GMT`。无效的日期，比如 0，代表着过去的日期，都表明该资源已经过期。

如果在[`Cache-Control`](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Cache-Control)响应头设置了 "max-age" 或者 "s-max-age" 指令，那么 `Expires` 头会被忽略，也就是说优先级 cacahe-control 大于 expires。

因为 expires 是一个时间值，如果服务器和客户端是系统时间差较大，就会引起缓存混乱。

##### [cache-control](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Cache-Control)

HTTP 1.1 中增加的字段，被设计用来替代 pragma。cache-control 这个头部字段既可以用在请求头也可以用在响应头中。

我们都知道在 chrome 中 shift + F5 或者在 network 面板勾选了 disable cache 时浏览器每次加载资源时都会请求最新的资源而不是使用缓存。仔细观察 network 面板的 request headers，发现当禁用缓存后，浏览器每次请求资源时会带上 cache-control: no-cache 来告诉服务器我不需要协商缓存，你直接把最新的资源返回。

下面是我勾选了禁用缓存之后请求配置了协商缓存的图片的截图：

![禁用缓存](https://i.loli.net/2019/06/18/5d08b2aa904ec34767.png)

cache-control 作为响应头字段其实是对 expires 做了改进，cache-control 其中的一种值形式为 cache-control: max-age=seconds，例如：cache-control: max-age=315360000。seconds 是一个时间差而不是固定的时间，因为是时间差所以不存在上面提到的 expires 的客户端和服务器端时间不同步导致缓存混乱的问题。

#### 强缓存相关的首部字段的优先级

pragma > cache-control > expires。

#### 强缓存的具体流程

前面讲过浏览器 HTTP 缓存的简略流程，这里具体讲讲**强缓存**的判定过程。

首先，当浏览器发现了内存或者磁盘有你请求的资源缓存时，此时浏览器还会检查该资源上一次请求时的有没有返回上面叙述的和强缓存相关的响应头。根据上面说的和强缓存相关的首部字段的优先级，一步一步判断。可能有些字段服务器不会返回，比如 pragma，那就直接往后判断。具体就是：如果 pragma: no-cache，那强缓存直接就判断失败了，只能走协商缓存。如果没有 pragma，但是有 cache-control: no-cache，这就和 pragma: no-cache 一样，强缓存判断失败。如果 cache-control: max-age=seconds，那么此时就根据浏览器上次请求该资源的时间和 seconds 算出过期时间，如果早于过期时间也就是未过期，那么命中强缓存，如果过期了强缓存判定失败。前面说过了如果 control-control 值为 max-age 或者 s-max-age 那么 expires 直接就无效了。当 cache-control 值不是那两个或则没有时，还要根据 expires 值也就是过期时间来判定有没有过期，没有过期就命中强缓存，否则，缓存失效，向服务器请求最新资源。

#### 使用 expires 配置强缓存

修改 src/index.js 中处理图片的路由，其实就是在响应头中加上了 expires 字段，过期时间为 2 分钟后。

```diff
// 处理图片
router.get(/\S*\.(jpe?g|png)$/, async (ctx, next) => {
    const { response, path } = ctx;
    ctx.type = mime.getType(path);

    // 添加 expires 字段到响应头，过期时间 2 分钟
+    response.set('expires', new Date(Date.now() + 2 * 60 * 1000).toString());

    const imageBuffer = await fs.readFile(Path.resolve(__dirname, `.${path}`));
    ctx.body = imageBuffer;

    await next();
});
```

第一次访问：

![expires 配置强缓存第一次访问](https://i.loli.net/2019/06/18/5d09071435c3c54245.png)

注意我上面的箭头指向的地方，鼠标左键长按加载按钮会弹出三个不同的加载选项，尤其是最后一个在开发时很有用，可以清除页面缓存。

然后立即刷新页面：

![expires 配置强缓存生效](https://i.loli.net/2019/06/18/5d0907799f29b67306.png)

2 分钟后再次刷新又是和第一张图一样，我就不放截图了。可以看出，其实配置强缓存很简单，就是按照协议约定配置响应头。

#### 测试 pragram，cache-control，expires 优先级

响应头添加 cache-control: no-cache，即不允许使用强缓存。

```diff
// 处理图片
router.get(/\S*\.(jpe?g|png)$/, async (ctx, next) => {
    const { response, path } = ctx;
    ctx.type = mime.getType(path);

+    response.set('cache-control', 'no-cache');
    // 添加 expires 字段到响应头，过期时间 2 分钟
    response.set('expires', new Date(Date.now() + 2 * 60 * 1000).toString());

    const imageBuffer = await fs.readFile(Path.resolve(__dirname, `.${path}`));
    ctx.body = imageBuffer;

    await next();
});

// 处理 css 文件
router.get(/\S*\.css$/, async (ctx, next) => {
    const { path } = ctx;
    ctx.type = mime.getType(path);

    const content = await fs.readFile(Path.resolve(__dirname, `.${path}`), 'UTF-8');
    ctx.body = content;

    await next();
});
```

设置了 cache-control: no-cache 后，每次刷新都是下面截图一样，浏览器不再使用缓存，如果使用了缓存就会像上面的那张截图一样在 Status Code 部分有说明。得出结论 cache-control 确实优先级比 expires 高。

![](https://i.loli.net/2019/06/22/5d0e28a42085198392.png)

设置 cache-control: max-age=60，理论上效果应该是缓存 1 分钟后失效，事实证明确实如此。

注意观察下面两张图的 expires 时间，第一张截图显示 21:33 失效。然而，由于 cache-control 优先级更高，所以会提前一分钟过期，所以结果就像第二张图 21:22 分钟缓存就失效了。

![max-age1](https://i.loli.net/2019/06/22/5d0e2e1ac157716766.png)

![max-age2](https://i.loli.net/2019/06/22/5d0e2e5095d0115156.png)

再来测试一下 pragma。

```diff
// 处理图片
router.get(/\S*\.(jpe?g|png)$/, async (ctx, next) => {
    const { response, path } = ctx;
    ctx.type = mime.getType(path);

+    response.set('pragma', 'no-cache');
    // max-age 值是精确到秒，设置过期时间为 1 分钟
    response.set('cache-control', `max-age=${1 * 60}`);
    // 添加 expires 字段到响应头，过期时间 2 分钟
    response.set('expires', new Date(Date.now() + 2 * 60 * 1000).toString());

    const imageBuffer = await fs.readFile(Path.resolve(__dirname, `.${path}`));
    ctx.body = imageBuffer;

    await next();
});

// 处理 css 文件
router.get(/\S*\.css$/, async (ctx, next) => {
    const { path } = ctx;
    ctx.type = mime.getType(path);

    const content = await fs.readFile(Path.resolve(__dirname, `.${path}`), 'UTF-8');
    ctx.body = content;

    await next();
});
```

结果和设置 cache-control: no-cache 效果一样，永远不会使用本地缓存。所以结论就是：

> pragma > cache-control > expires。

### 协商缓存

协商缓存由于需要向服务器发送一次请求，所以相比于强缓存来收收益更低，缓存资源体积越大，收益越高。

#### 和协商缓存相关的首部字段

协商缓存中那几个首部字段是**配对使用**的，即：

- 请求头 if-modified-since 和响应头 last-modified
- 请求头 if-none-match 和响应头 etag

##### [if-modified-since](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/If-Modified-Since) 和 [last-modified](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Last-Modified)

它俩的值都是 GMT 格式的**精确到秒**的时间值。从字面上就很好理解它们的含义：`自从某某时间有没有修改过?`，`最后一次修改时间为某某时间`。

他俩有啥关系呢？其实**本次请求头 if-modified-since 的值应该为上一次请求该资源的响应头中 last-modified 的值**。

当浏览器发起资源请求并携带 if-modified-since 字段，服务器会将请求头中的 if-modified-since 值和请求资源的 最后修改时间进行比较，如果资源最后修改时间比 if-modified-since 时间晚，那么资源过期，状态码为 200，响应体为请求资源，响应头中加入最新的 last-modified 的值。没过期就返回状态码 304，命中协商缓存，响应体为空，响应头不需要 last-modified 值。

##### [if-none-match](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/If-None-Match) 和响应头 [etag](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/ETag)

上面两个是 HTTP 1.0 中处理协商缓存的首部字段，这两个是 HTTP 1.1 才出现的。

这里我总结下 MDN 中对 if-none-match 的描述的几个重点（这里只讨论 GET 请求资源）：

1. 当且仅当服务器上没有任何资源的 [`ETag`](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/ETag) 属性值与这个首部中列出的相匹配的时候，服务器端会才返回所请求的资源，响应码为 200。
2. 服务器端在生成状态码为 304 的响应的时候，会存在于对应的 200 响应中的首部：Cache-Control、Content-Location、Date、ETag、Expires 和 Vary。
3. If-none-match 优先级比 if-modified-since 优先级高。

etag 常见的样子是 `etag: "54984c2b-44e"`。和上面那对一样，**本次请求头 if-none-match 的值为上一次请求该资源的响应头中 etag 的值**。

有人可能看到这里会问：etag 到底是个啥玩意？如果你了解哈希摘要我觉得就很好理解了，etag 表示的是所请求资源的唯一标识符，简单来实现就是给请求的资源通过某种 hash 算法取个摘要字符串然后用双引号包起来就好了。

MDN 上对 etag 的描述是：

> 它们是位于双引号之间的 ASCII 字符串（如“675af34563dc-tr34”）。没有明确指定生成 ETag 值的方法。通常，使用内容的散列，最后修改时间戳的哈希值，或简单地使用版本号。例如，MDN 使用 wiki 内容的十六进制数字的哈希值。

使用 if-none-match/etag 这对头部字段来处理协商缓存的过程和 if-modified-since/etag 其实是差不多。只不过比较的是 hash 值而不是日期。

#### 为什么有了 last-modified 还需要 etag？

1. 资源在 1 秒内更新，并且在该一秒内访问，使用 last-modified 处理协商缓存无法获取最新资源。本质上的原因还是因为 last-modified 是精确到秒的，无法反映在 1 秒内的变化。
2. 当资源多次被修改后内容不变，使用 last-modified 来处理有点浪费。多次修改资源，其 last-modified 值肯定是会变的，但是如果内容不变我们其实不需要服务器返回最新资源，直接使用本地缓存。使用 etag 就没这个问题，因为同一个资源多次修改，内容一样，hash 值也一样。
3. 使用 etag 更加灵活，因为 etag 并不一定是我说的就用 hash 值，etag 采用的是弱比较算法，即两个文件除了每个比特都相同外，内容一致也可以认为是相同的。例如，如果两个页面仅仅在页脚的生成时间有所不同，就可以认为二者是相同的。

#### 协商缓存首部字段优先级

**if-none-match > if-modified-since**。

当服务器收到的请求中同时包含 if-modified-since 和 if-none-match 时，服务器会忽略 if-modified-since。

#### 测试 last-modified 配置协商缓存

写到这里时，笔者稍微重构了下服务器代码并使用 last-modified 配置了协商缓存：

```javascript
const Koa = require('koa');
const Router = require('koa-router');
const mime = require('mime');
const fs = require('fs-extra');
const Path = require('path');

const app = new Koa();
const router = new Router();

const responseFile = async (path, context, encoding) => {
  const fileContent = await fs.readFile(path, encoding);
  context.type = mime.getType(path);
  context.body = fileContent;
};

// 处理首页
router.get(/(^\/index(.html)?$)|(^\/$)/, async (ctx, next) => {
  await responseFile(Path.resolve(__dirname, './index.html'), ctx, 'UTF-8');
  await next();
});

// 处理图片
router.get(/\S*\.(jpe?g|png)$/, async (ctx, next) => {
  const { request, response, path } = ctx;
  response.set('pragma', 'no-cache');

  // max-age 值是精确到秒，设置过期时间为 1 分钟
  // response.set('cache-control', `max-age=${1 * 60}`);
  // 添加 expires 字段到响应头，过期时间 2 分钟
  // response.set('expires', new Date(Date.now() + 2 * 60 * 1000).toString());

  const imagePath = Path.resolve(__dirname, `.${path}`);
  const ifModifiedSince = request.headers['if-modified-since'];
  const imageStatus = await fs.stat(imagePath);
  const lastModified = imageStatus.mtime.toGMTString();
  if (ifModifiedSince === lastModified) {
    response.status = 304;
  } else {
    response.lastModified = lastModified;
    await responseFile(imagePath, ctx);
  }

  await next();
});

// 处理 css 文件
router.get(/\S*\.css$/, async (ctx, next) => {
  const { path } = ctx;
  await responseFile(Path.resolve(__dirname, `.${path}`), ctx, 'UTF-8');
  await next();
});

app.use(router.routes()).use(router.allowedMethods());

app.listen(3000);
process.on('unhandledRejection', (err) => {
  console.error('有 promise 没有 catch', err);
});
```

首先是禁用缓存情况下首次访问，可以看到请求头中没有 if-modified-since，服务器返回了 last-modified。

![](https://i.loli.net/2019/06/23/5d0f7bf17fe8b85005.png)

关闭 disable cache 后再次访问图片时，发现带上了 if-modified-since 请求头，值就是上次请求响应的 last-modified 值，因为图片最后修改时间不变，所以 304 Not Modified,。其实上面的代码有点小毛病，在 if-modified-since 不等于 last-modified 时没有设置 content-type，不过这些细节不影响我们探讨协商缓存核心知识。

![last-modified](https://i.loli.net/2019/06/23/5d0f7d383c8c222295.png)

当我把 sunset.jpg 这张图替换成另外一张图后，图片最后修改时间改变了，所以返回了新的图片并且响应头中还加入了最新的 last-modified，下次请求带上的 if-modified-since 就是这次返回后的 last-modified 了。

![](https://i.loli.net/2019/06/23/5d0f7e780cc7448744.png)

#### 测试使用 etag 配置协商缓存

修改处理图片的路由：

```javascript
// 处理图片
router.get(/\S*\.(jpe?g|png)$/, async (ctx, next) => {
  const { request, response, path } = ctx;
  ctx.type = mime.getType(path);
  response.set('pragma', 'no-cache');

  const ifNoneMatch = request.headers['if-none-match'];
  const imagePath = Path.resolve(__dirname, `.${path}`);
  const hash = crypto.createHash('md5');
  const imageBuffer = await fs.readFile(imagePath);
  hash.update(imageBuffer);
  const etag = `"${hash.digest('hex')}"`;
  if (ifNoneMatch === etag) {
    response.status = 304;
  } else {
    response.set('etag', etag);
    ctx.body = imageBuffer;
  }

  await next();
});
```

这里就不放图了，效果和使用 last-modified 差不多。

**注意**：我这里的代码只是为了达到演示的目的，如果是真正要配置一个用于生产的缓存机制，是会对资源的 last-modified 和 etag 值建立索引缓存的，而不是像我代码中那样每次都去访问文件状态和读取文件通过 hash 算法取 hash 值。

### 怎样更新配置了强缓存的资源？

之前面春招实习的时候我在面试腾讯的时候某次 2 面被问过这个问题，然后答不上上来，被挂了。那次面试感觉难度挺大的，影响比较深刻，当时还问了怎样做 dns 优化，也答的不好，日后抽空一定会写一篇怎么做 dns 优化的文章。

更新强缓存这个问题，要是以前没研究过，突然问你，确实有点难。其实想想看，你要更新强缓存，如果请求的是同一个 url，浏览器肯定在没过期的情况下会直接返回缓存了。所以解决办法就是页面中需要更新强缓存的地方对他们的 url 做文章，也就是需要更新强缓存的时候更新 url 就可以了。因为需要可以更新 url，所以当前页面那么就不能使用强缓存了，不然咋更新 url。具体咋更新 url 有很多形式比如使用版本号： "/v1-0-0/sunset.jpg"，还可以在 url 中插入资源内容的 hash 值："/5bed2702-557a-sunset.jpg"。

举个实例：

第一次访问首页 index.html 中 img 标签的 src 为 "/v1-0-0/sunset.jpg"，当服务器上修改了 sunset.jpg 为另外一张图片时。

再次访问 index.html。由于 index.html 本身这个 html 文件没有使用强缓存，每次访问都需要请求服务器，页面中 src 被修改为了 "/v1-0-1/sunset.jpg"，这张配置强缓存的图片就更新过来了。

最后放一张盗来的图，本人实在不擅长画图 (。>︿<)\_θ，这张图比较详细的展示了强缓存和协商缓存的判定流程。

![summary](https://i.loli.net/2019/06/23/5d0f938d920a328031.png)

感谢您的阅读，如果对你有所帮助不妨加个关注，点个赞支持一下 O(∩_∩)O，如果文中有什么错误，欢迎在评论区指出。

本文为原创内容，首发于[个人博客](http://www.lyreal666.com)，转载请注明出处。

参考资源：

1. [浅谈 HTTP 缓存](https://juejin.im/post/5bdeabbbe51d4505466cd741)
2. [面试精选之 http 缓存](https://juejin.im/post/5b3c87386fb9a04f9a5cb037)
3. [理解 http 浏览器的协商缓存和强制缓存](https://www.cnblogs.com/tugenhua0707/p/10807289.html)
