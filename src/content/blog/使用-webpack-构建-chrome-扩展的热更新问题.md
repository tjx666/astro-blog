---
title: 使用 webpack 构建 chrome 扩展的热更新问题
tags:
  - webpack
  - typescript
  - express
  - chrome extension
categories:
  - 前端
author: 余腾靖
pubDatetime: 2020-01-15 22:02:00
---

前不久我写了一个 chrome 扩展，作为一个前端弄潮儿，我当然想用上各种前端界最 fashion 的开发工具。于是乎，折腾到最后使用了 webpack + TypeScript + react 这么一套技术栈。在 github 上研究了几个模板项目之后，发现大多数都太初级了，功能太简单，而且有一个我觉应当提供的很基础的功能始终没发现有哪个项目支持，也就是当修改了 content script 之后自动 reload 扩展和刷新注入了 content script 的页面这个问题。这个问题如果解决了，你就不需要每次修改了扩展代码还去 chrome 扩展列表页面点下刷新按钮刷新扩展。最后在研究了 webpack 的热更新机制和查阅了 webpack 和 chome 扩展官方文档之后解决了这个问题。在开发完我那个扩展之后，我便将其提取成了一个模板项目 [awesome-chrome-extension-boilerplate](https://github.com/tjx666/awesome-chrome-extension-boilerplate)。

其实我在使用 webpack + TypeScript + react 这套技术栈开发 chrome 扩展时碰到的问题真不少，如果全拿出来讲没个两万字我估计是写不完。这篇文章主要聊聊 webpack 开发 chrome 扩展的热更新问题，并重点讲解我是如何实现修改了 content script 之后自动 reload 扩展和刷新注入了 content script 的页面的，这也是我那个模板的最大特色，也算是给它的 README 做个补充。

在阅读文章之前，希望读者对 webpack 和 chrome 扩展开发有基本的了解。本文的主要内容分为：

1. 我对 chrome 扩展的理解
2. 各种页面的热更新问题分析
3. 如何实现修改了 content script 之后自动 reload 扩展和刷新注入了 content script 的页面

<!-- more -->

## 我对 chrome 扩展的理解

> chrome 扩展其实本质就是一个包含了 manifest.json 文件的文件夹。

其实就像 npm 包一样，包含 package.json 文件的文件夹我们就可以将其视为一个 npm 包。这是从静态的角度也就从文件的角度来说的。

从扩展运行时来看，chrome 扩展是一个被 chrome 以 `chrome://` 协议托管的一个静态服务器。当我们访问了 chrome 扩展种的各种资源，其实就是向这个服务器请求了以 `chrome://` 协议头开始的某个 URL 。例如请求 background 页面其实就是访问了下图中 URL 对应的 HTML 文件：

![background](https://i.loli.net/2020/01/16/yZc17nGaDwLsKqU.png)

扩展中有各种各样的页面，最常见的例如 background 页面，也就是上面这张图中的页面，options 页面也就是选项页面，popup 页面也就是点击图标后的弹窗页面，其实还有很多其它的如书签页面，浏览历史页面，新标签页面等这些页面本质上就是 chrome 扩展中的一个 HTML 文件，当然有些页面你不指定一个自定义的 HTML 文件，chrome 扩展会为你自动生成。既然它们都是由 HTML 文件渲染的，那我们其实可以直接用开发 SPA 的方式来渲染它们。

SPA 也就是 Single Page Application 单页面应用，现在的前端三大框架其实都是主要用于开发 SPA。通过前端路由，我们可以在一个 HTML 文件上就能像 App 一样访问不同的页面，借助于组件化和框架的能力实现切换不同的页面，并且只会局部刷新，不像以前 jsp，asp 的时候切个页面整个网页都刷新一遍，从性能和体验上都是进步。而熟悉前端路由的人都知道，前端路由也有好多种，最常用也就是 BrowserRouter 和 HashRouter。而 BrowserRouter 它是需要服务器配合的，将所有的 HTML URL 重定向到一个 HTML 文件。我们使用 webpack 开发的时候访问的是 webpack-dev-server，如果你需要使用 BrowserRouter，那么就要修改 webpack 配置：

```javascript
// webpack.config.js
module.exports = {
  //...
  devServer: {
    historyApiFallback: true,
  },
};
```

但是，chrome 扩展这个静态服务器我们没法给它设置重定向啊，chrome 本身我们是没法编程的。好在我们还有其它的 Router 方案，使用 HashRouter 就刚刚好，既不会因为 URL 带 hash 值比较丑（因为看不到），又实现了前端路由的功能。

具体在使用 webpack 将 background，options，popup 页面当作 SPA 开发的时候还会有一些小问题。我们在以开发者模式加载测试的扩展时是要加载磁盘上的文件，所以我们需要配置 webpack devServer 将 bundle 写到磁盘上。除此之外，我们还要配置 CORS 跨域，因为我们访问的 chrome 扩展页面协议时是： `chrome://` 和我们 devServer `HTTP` 协议不同，会有跨域问题：

```typescript
import { Express } from 'express';
import { Compiler } from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import devConfig from '../configs/webpack.dev';

export default (app: Express, compiler: Compiler): void => {
  const devMiddlewareOptions: webpackDevMiddleware.Options = {
    publicPath: devConfig!.output!.publicPath!,
    headers: {
      // 配置 cors 跨域
      'Access-Control-Allow-Origin': '*',
    },
    lazy: false,
    stats: 'minimal',
    // 将 bundle 写到磁盘而不是内存
    writeToDisk: true,
  };
  app.use(webpackDevMiddleware(compiler, devMiddlewareOptions));
  app.use(webpackHotMiddleware(compiler, { path: '/__webpack_HMR__' }));
};
```

上面是我模板项目中使用到的 devServer 中间件配置，配置 webpack devServer 我总结有四种方式：

1. webpack-dev-server 命令行工具
2. webpack-dev-server node API
3. express + webpack devServer 中间件
4. koa + webpack devServer 中间件

我最终采用的是第三种，不选前两者是因为灵活度不够，因为我需要配置 content scripts 的 webpack entry 不加载 hot reload 脚本以及修改默认拉取热更新补丁的 path，只有通过 webpack devServer 中间件才能配置。又因为 koa 配置 devServer 资料不多，感觉不如 express 成熟稳定，所以不选择第四种。至于为什么需要配置 content scripts 的 webpack entry 不加载 hot reload 脚本以及修改默认拉取热更新补丁的 path，后面会提到。

## 各种页面的热更新问题分析

我们从`非content scripts` 和 `content scripts` 这两类脚本来讨论。

### 非 content scripts 的热更新问题

前面一部分内容我就讲了，bacngound, options, popup 等页面其实我们可以直接当作普通的 SPA 页面来开发，也就是说可以直接使用 webpack devServer 自身提供的热更新能力。因此我们还可以配置 react 的 hot reload 等。从配置 webpack 的角度来说，相对与普通的前端项目的区别就是配置多入口，跨域，devServer bundle 写到磁盘等，有一定的复杂度。不喜欢折腾的可以考虑直接用我那个模板，而且我那个模板项目还做了各方面的优化。

前面提到需要修改默认拉取热更新补丁的 path，这是因为：默认情况下，在向 webpack devServer 拉取热更新补丁的 path 是 `/__webpack_hmr`。

![webpack-hot-middleware.png](https://i.loli.net/2020/01/16/TCtFHdwlDZ8Uz46.png)

如果你不设置 path 为你的 devServser 地址就会出现下面的问题，也就是直接向 chrome 扩展请求热更新数据了：

![webpack-hmr.png](https://i.loli.net/2020/01/16/MnwvBASWHskTY76.png)

所以还是要使用 node API 配置 devServer 的 `webpack-hot-middleware` 中间件才行：

```typescript
// 部分 webpack entry 配置
import { resolve } from 'path';
import serverConfig from '../configs/server.config';
import { isProd } from './env';

const src = resolve(__dirname, '../../src');
const HMRSSEPath = encodeURIComponent(
  `http://${serverConfig.HOST}:${serverConfig.PORT}/__webpack_HMR__`,
);
// 指定 path 为我们的 devServer 的地址
const HMRClientScript = `webpack-hot-middleware/client?path=${HMRSSEPath}&reload=true`;

const devEntry: Record<string, string[]> = {
  background: [HMRClientScript, resolve(src, './background/index.ts')],
  options: [HMRClientScript, 'react-hot-loader/patch', resolve(src, './options/index.tsx')],
};
```

### content scripts 的热更新问题

首先我下个结论：**使用 webpack devServer 自带的热更新机制是不可能对 content scripts 起作用的。**

根本原因是因为：由于 chrome 限制了 content script 内无法访问其它 content script，inject script，以及网页本身的 js 脚本内的变量。又因为 webpack devServer 热更新是以 jsonp 的方式来拉取更新补丁的，注入网页的 content scrpit 中包含的实现热更新机制的代码会调用 jsonp 插入页面的热更新补丁中的更新函数，但是由于 chrome 限制，无法调用，也就无法应用热更新补丁。

查看 wbpack 源码，可以看到 webpack devServer 用的就是 jsonp 进行热更新的：

![webpack-json.png](https://i.loli.net/2020/01/16/argztvoCY7bBTNh.png)

## 如何实现修改了 content script 之后自动 reload 扩展和刷新注入了 content script 的页面

这是本文的重点，其实思路还是很清晰的：

1. 监听 webpack 修改 content script 事件
2. devServer 通过 SSE 主动推送事件给 background
3. background 监听推送事件
4. 调用扩展 API reload 扩展，并发送消息给所有注入了 content script 的页面让它们刷新页面

下面我们来一步一步实现;

### 监听 webpack 修改 content script 事件

查阅 webpack 官方文档发现在使用 node API 的时候可以通过 compiler.hooks.done 这个钩子在 webpack 每次编译结束时执行一些操作。本质上 webpack 插件也是通过给 webpack 各种事件挂钩子来实现各种功能。

```typescript
// plugin 包含我们的处理编译完成这一事件的逻辑
compiler.hooks.done.tap('extension-auto-reload-plugin', plugin);
```

监听到编译成功还不够，我们还需要判断是否编译成功，以及通过此次编译的统计信息 stats 拿到此次编译涉及到的 chunks 来判断是否修改了 content scripts 的 chunks：

```typescript
const contentScriptsChunks = fs.readdirSync(resolve(__dirname, '../../src/contents'));
const plugin = (stats: Stats) => {
  const { modules } = stats.toJson({ all: false, modules: true });
  const shouldReload =
    !stats.hasErrors() &&
    modules &&
    modules.length === 1 &&
    contentScriptsChunks.includes(modules[0].chunks[0] as string);

  if (shouldReload) {
    // 发送消息给 background
  }
};
```

### devServer 通过 SSE 主动推送事件给 background

服务器端实时主动推送现在最常用应该是 WebSocket 协议了。不过既然我们已经有了一个 express 服务器，就没必要再启动一个 WebSocket 服务器，利用 SSE（Server Side Event) 的话只需要给 express 加个路由即可。整合上一节内容，我们可以实现一个 express 中间件在监听到修改了 content script 时推送 `compiled-successfully` 事件给 background：

```typescript
import fs from 'fs';
import { resolve } from 'path';
import chalk from 'chalk';
import { debounce } from 'lodash';
import { RequestHandler } from 'express';
import { Compiler, Stats } from 'webpack';
import SSEStream from 'ssestream';

export default function (compiler: Compiler) {
  const extAutoReload: RequestHandler = (req, res, next) => {
    console.log(chalk.yellow('Received a SSE client connection!'));

    res.header('Access-Control-Allow-Origin', '*');
    const sseStream = new SSEStream(req);
    sseStream.pipe(res);
    let closed = false;

    const contentScriptsModules = fs.readdirSync(resolve(__dirname, '../../src/contents'));
    const compileDoneHook = debounce((stats: Stats) => {
      const { modules } = stats.toJson({ all: false, modules: true });
      const shouldReload =
        !stats.hasErrors() &&
        modules &&
        modules.length === 1 &&
        contentScriptsModules.includes(modules[0].chunks[0] as string);

      if (shouldReload) {
        console.log(chalk.yellow('Send extension reload signal!'));

        sseStream.write(
          {
            event: 'compiled-successfully',
            data: {
              action: 'reload-extension-and-refresh-current-page',
            },
          },
          'UTF-8',
          (error) => {
            if (error) {
              console.error(error);
            }
          },
        );
      }
    }, 1000);

    // 断开链接后之前的 hook 就不要执行了
    const plugin = (stats: Stats) => !closed && compileDoneHook(stats);
    compiler.hooks.done.tap('extension-auto-reload-plugin', plugin);

    res.on('close', () => {
      closed = true;
      console.log(chalk.yellow('SSE connection closed!'));
      sseStream.unpipe(res);
    });

    next();
  };

  return extAutoReload;
}
```

#### background 监听推送事件

监听 devServer 推送的 `compiled-successfully` 事件很简单，使用 SSE 客户端对 express 服务器也就是我们的 devServer 上指定的 SSE 路由建立 SSE 链接即可：

```typescript
const source = new EventSource('http://127.0.0.1:3000/__extension_auto_reload__');

source.addEventListener('compiled-successfully', (event: EventSourceEvent) => {
    const shouldReload = JSON.parse(event.data).action === 'reload-extension-and-refresh-current-page';

    if (shouldReload) {
    	// 刷新扩展等后续步骤
    }
)
```

#### 调用扩展 API reload 扩展，并发送消息给所有注入了 content script 的页面让它们刷新页面

查阅 chrome extension 官方文档，发现官方提供了一个 [reload API](https://developer.chrome.com/extensions/runtime#method-reload) 可以在扩展中直接让扩展重载。在 background 的 webpack entry 数组添加 autoReloadPatch.ts ：

```typescript
if (!isProd) {
  entry.background.unshift(resolve(__dirname, './autoReloadPatch.ts'));
}
```

autoReloadPatch.ts 这个脚本在监听到服务器推送的指定消息时会先发送刷新页面的消息给所有 tab 页面，在接收到任意一个来自 content script 的响应后再 reload 扩展（如果我们的扩展都没有 content script 就没必要刷新了）。

```typescript
import tiza from 'tiza';

const source = new EventSource('http://127.0.0.1:3000/__extension_auto_reload__');

source.addEventListener(
  'compiled-successfully',
  (event: EventSourceEvent) => {
    const shouldReload =
      JSON.parse(event.data).action === 'reload-extension-and-refresh-current-page';

    if (shouldReload) {
      tiza
        .color('green')
        .bold()
        .text(`Receive the signal to reload chrome extension as modify the content script!`)
        .info();
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          if (tab.id) {
            let received = false;
            chrome.tabs.sendMessage(
              tab.id,
              {
                from: 'background',
                action: 'refresh-current-page',
              },
              ({ from, action }) => {
                if (!received && from === 'content script' && action === 'reload extension') {
                  source.close();
                  tiza.color('green').bold().text(`Reload extension`).info();
                  chrome.runtime.reload();
                  received = true;
                }
              },
            );
          }
        });
      });
    }
  },
  false,
);
```

上面的代码会发送刷新页面的消息给所有页面，为了实现自动刷新页面，我们必须想办法注入一段监听刷新页面的代码到所有注入了 content script 的页面。我采取的做法是：默认添加一个 content script 也就是 all.ts，这个 all.ts 的代码必须注入到所有的其他 content script 注入到的页面。所以需要我们在配置 manifest.json 的时候注意一下，将 all.ts 的 matches 设置为其它所有 content scripts 的 matches 的父集。例如：

```json
 "content_scripts": [
    {
        "matches": ["https://github.com/*"],
        "css": ["css/all.css"],
        "js": ["js/all.js"]
    },
    {
        "matches": ["https://github.com/pulls"],
        "css": ["css/pulls.css"],
        "js": ["js/pulls.js"]
    }
]
```

all.ts 中的代码很简单，就是监听 background 发送的刷新页面的消息刷新当前页面：

```typescript
import tiza from 'tiza';

chrome.runtime.onMessage.addListener((request, sender, sendResp) => {
  const shouldRefresh = request.from === 'background' && request.action === 'refresh-current-page';

  if (shouldRefresh) {
    tiza
      .color('green')
      .bold()
      .text('Receive signal to refresh current page as modify the content script!')
      .info();
    setTimeout(() => {
      window.location.reload();
    }, 500);
    sendResp({
      from: 'content script',
      action: 'reload extension',
    });
  }
});
```

我本人平时很喜欢收集各种实用的扩展，也看过不少扩展的源码。发现其实它们大多是还是使用最原始的开发方式。没有模块化，很容易导致后期维护性非常差，而且还不能方便得调用 npm 包。人生苦短，直接用轮子不好吗？当然其实我是知道有一些工具例如 [crx-hotreload](https://github.com/xpl/crx-hotreload) 可以实现自动刷新扩展，不过相比于我的模板来说功能上太简陋了。

实际上使用 webpack + react + TypeScript 开发 chrome 扩展，你可能还会遇到各种问题。这个时候不妨打开我的这个[模板项目](https://github.com/tjx666/awesome-chrome-extension-boilerplate)，去看看我是怎么配置项目去解决这些问题的。其实我学习编程从来就没人带过，都是靠自己慢慢摸索。我碰到问题也经常去 github 去搜索技术栈类似的项目，直接分析源码来找到解决办法。或者你也可以在评论区提问，一般来说我都会积极回复。如果本文内容对你有所帮助或者觉得这个模板项目可能用得上，请不要吝啬你的 star 😂。

最后，快过年了，祝大家新年快乐，2020 事业更上一层楼。

本文为原创内容，首发于[个人博客](https://lyreal666.com/)，转载请注明出处。
