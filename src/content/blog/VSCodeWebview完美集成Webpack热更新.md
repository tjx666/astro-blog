---
title: VSCodeWebview完美集成Webpack热更新
description: 待补充描述
pubDatetime: 2022-03-19
modDatetime: 2022-03-19
---

最近在写一个 VSCode 扩展时需要通过一个 Webview 去渲染一些网页内容，作为一个前端配置工程师，自然是忍受不了没有热更新的网页开发。经过了一番折腾，最终实现了让 VSCode Webview 完美集成 webpack 的热更新。

## 开发环境

在正式进入主题之前，先介绍下用来演示的项目开发环境。文章中演示代码仓库：[vscode-webview-webpack-hmr-example](https://github.com/tjx666/vscode-webview-webpack-hmr-example)。

### 技术栈

- VSCode 扩展本身使用 typescript 开发，直接使用 tsc 编译，并未使用 webpack 打包。目前只提供一个命令用于打开测试用的 webview，代码存放在 src 目录
- 前端代码存放在 web 目录下，使用 webpack 打包
- 前端框架：react
- 前端开发语言：typescript
- React 集成组件热更新方式：react-refresh
- 配置 webpack-dev-server 方式：node API

### 版本信息

- VSCode: 1.66.0-insider
- OS: MacOS 12.3
- Webpack: 5.70.0
- webpack-dev-server: 4.7.4
- React: 17.0.2
- react-refresh: 0.11.0
- @pmmmwh/react-refresh-webpack-plugin: 0.5.4

### 演示项目起步情况

截止到第一次提交：[实现加载 webpack 打包内容](https://github.com/tjx666/vscode-webview-webpack-hmr-example/commit/f35e3bd2a16465f2796fbf1cf48c1fed2f928bd9)。已经实现打开 WebView 可以加载 Webpack 打包的 js bundle。如果你按照项目的说明正确的启动项目并打开 webview，不出意外可以看到一下内容：

![实现加载 webpack 打包内容](https://s2.loli.net/2022/03/19/Yr6I4sO8qRUk3bH.png)

VSCode 扩展中加载 Webview 网页内容的方式：

```typescript
// src/MyWebview.ts
private setupHtmlForWebview() {
        const webview = this.panel.webview;
        const localPort = 3000;
        const localServerUrl = `localhost:${localPort}`;
        const scriptRelativePath = 'webview.js';
        const scriptUri = `http://${localServerUrl}/${scriptRelativePath}`;
        const nonce = getNonce()

        this.html = `<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${MyWebview.viewType}</title>
    </head>
    <body>
        <div id="root"></div>
        <script nonce="${nonce}" src="${scriptUri}"></script>
    </body>
</html>`;
        webview.html = this.html;
    }
```

可以看到我们加载 bundle 的方式是直接将 script 的 scr 设置为 webpack-dev-server 托管的 js bundle 地址。

我们采用 node API 的方式配置 webpack-dev-server：

```javascript
// scripts/webpack.config.js
const { resolve } = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

/** @type {import('webpack').Configuration} */
module.exports = {
  mode: "development",
  entry: [resolve(__dirname, "../web/index.tsx")],
  output: {
    path: resolve(__dirname, "../dist/web"),
    filename: "webview.js",
  },
  resolve: {
    extensions: [".js", ".ts", ".tsx", ".json"],
  },
  module: {
    rules: [
      {
        test: /\.(js|ts|tsx)$/,
        loader: "babel-loader",
        options: { cacheDirectory: true },
        exclude: /node_modules/,
      },
      {
        test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/, /\.svg$/],
        type: "asset",
        parser: {
          dataUrlCondition: {
            maxSize: 10 * 1024,
          },
        },
        generator: {
          filename: "images/[hash]-[name][ext][query]",
        },
      },
    ],
  },
  devtool: "eval-source-map",
  plugins: [
    new HtmlWebpackPlugin({
      template: resolve(__dirname, "../web/index.html"),
    }),
  ],
};
```

启动 webpack-dev-server 的代码：

```javascript
// scripts/start.js
const webpack = require("webpack");
const WebpackDevServer = require("webpack-dev-server");

const devConfig = require("./webpack.config");

function start() {
  const compiler = webpack(devConfig);
  const devServerOptions = {
    hot: false,
    client: false,
    liveReload: false,
    host: "localhost",
    port: 3000,
    open: false,
    devMiddleware: {
      stats: "minimal",
    },
  };
  const server = new WebpackDevServer(devServerOptions, compiler);
  server.start();
}

start();
```

截止至目前，并未在 webpack 配置中加入任何热更新的代码。接下来让我们一个一个解决在当前情况下集成 webpack 热更新你会碰到的各种问题。

## WebSocket URL 不合法

当我们按照 webpack 官方文档和 [react-refresh-webpack-plugin](https://github.com/pmmmwh/react-refresh-webpack-plugin) 集成 webpack 热更新和 react 组件的局部刷新后，首先会碰到下面的问题：

![无法构造 WebSocket 对象](https://s2.loli.net/2022/03/19/PIqoew5QxJlrS9B.png)

> Uncaught DOMException: Failed to construct 'WebSocket': The URL's scheme must be either 'ws' or 'wss'. 'vscode-webview' is not allowed

提示已经告诉我们 `new WebSocket()` 的时候，URL 的协议必须是 `ws` 或者是 `wss`，但是你用的是 `vscode-webview`。通过 devtools 查看 VSCode 的 webview，我们可以清楚的看到 VSCode webview 是使用 iframe 实现的，协议是 `vscode-webview`:

![VSCode Webview](https://s2.loli.net/2022/03/19/YVFbaPsEcSHXJg4.png)

我们知道，web-dev-server 会在 bundle 中注入 js 代码创建一个 WebSocket 链接用于与 webpack-dev-server 通信，创建 websocket URL 的源码在: `node_modules/webpack-dev-server/client/utils/createSocketURL.js。` 简言之，由于我们没有手动指定 websocket 链接协议，webpack-dev-server 根据当前协议 `vscode-webview`，推测出 `new WebSocket(URL)` 的 URL 协议也是 `vscode-webview`，而 WebSocket 对象是不允许只接收 `ws` 或者 `wss` 协议。

![WebSocket URL](https://s2.loli.net/2022/03/19/duJyz5UOkYESqHv.png)

当我们使用 node API 配置 webpack-dev-server 时，集成热更新时可以在 entry 中配置 webpack-dev-server 创建 WebSocket Client 的各种选项。

为了解决这个问题，我们只需要手动指定我们建立 WebSocket 链接的协议是 `ws`。

```javascript
const devServerClientOptions = {
  hot: true,
  // !: 指定构造 WebSocket 的协议是 ws
  protocol: "ws",
  hostname: "localhost",
  port: 3000,
  path: "ws",
};
const devServerClientQuery = Object.entries(devServerClientOptions)
  .map(([k, v]) => `${k}=${v}`)
  .join("&");
const devEntries = [
  "webpack/hot/dev-server.js",
  `webpack-dev-server/client/index.js?${devServerClientQuery}`,
];

/** @type {import('webpack').Configuration} */
module.exports = {
  mode: "development",
  entry: [...devEntries, resolve(__dirname, "../web/index.tsx")],
  output: {
    publicPath: "http://localhost:3000/",
    path: resolve(__dirname, "../dist/web"),
    filename: "webview.js",
  },
  resolve: {
    extensions: [".js", ".ts", ".tsx", ".json"],
  },
};
```

除了需要指定协议之外，包括 `hostname`, `port` 都需要指定，不然会出现各种各样的链接错误。

## 无效的 origin host

解决完 WebSocket URL 的问题后还会碰到 WebSocket 建立链接 origin 请求头中 host 不合法的问题:

![无效的 origin host](https://s2.loli.net/2022/03/19/xURSuzbZjB8W5kT.png)

打开 network 面板，查看我们 ws 建立链接时发送的请求头:

![ws请求头](https://s2.loli.net/2022/03/19/XtEhU28SebWpBkM.png)

可以看到 origin 请求头值为：`vscode-webview://180k16ne6bgriaem9878j8lt8el0qnj9uc9uodq31ah3fdgvvea8`，`vscode-webview` 这个 host 对于 webpack-dev-server 的默认策略来说是不合法的，具体可以查看： [What is the purpose of webpack-dev-server's allowedHosts security mechanism?](https://stackoverflow.com/questions/55939525/what-is-the-purpose-of-webpack-dev-servers-allowedhosts-security-mechanism)

解决办法也很简单，配置 devServer 的 `allowedHosts` 选项：

```javascript
function start() {
  const compiler = webpack(devConfig);
  const devServerOptions = {
    hot: false,
    client: false,
    liveReload: false,
    host: "localhost",
    port: 3000,
    open: false,
    devMiddleware: {
      stats: "minimal",
    },
    // 允许任何 host
    allowedHosts: "all",
  };
}

start();
```

## 跨域问题

到目前为止，可以说在 VSCode Webview 中的 webpack-dev-server 的 client 终于和 server 端顺利建立了链接:

![ws顺利建立链接](https://s2.loli.net/2022/03/19/zTLDSIZvpMhRKwJ.png)

但是当我们修改网页代码，例如修改 App 组件中的 `Hello World` 文本内容：

```typescript
// web/App.tsx
import imgSrc from './xiaomai.gif';

export default function App() {
    return (
        <div className="app">
            <img
                src={imgSrc}
                style={{
                    display: 'block',
                    marginBottom: 20,
                }}
            />
            <button>Hello World</button>
        </div>
    );
}
```

控制台就可以看到跨域错误：

![CORS](https://s2.loli.net/2022/03/19/4ZuMBlpLbjTXRYs.png)

解决 CORS 问题对于我们前端同学来说都是小 case 啦：

```javascript
// scripts/start.js
function start() {
  const compiler = webpack(devConfig);
  const devServerOptions = {
    // ...
    allowedHosts: "all",
    // 允许任何域名访问
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  };
}
```

## VSCode webview reload 限制

到目前为止，如果你修改前端代码不触发页面 reload 那么一切看起来会很美好：

![不算完美](https://s2.loli.net/2022/03/19/3TZCozDY1dSu4XK.gif)

一旦触发 reload, 例如我们删掉一个导入语句，webpack 在无法应用热更新的时候默认就会 reload 页面，这会导致 webview 内容空白。

![ VSCode Webview reload 就空白](https://s2.loli.net/2022/03/19/qDswIPcSbEkdWje.png)

我们可以做个更简单的测试，直接在 `index.tsx` 中加入下面代码：

```typescript
import ReactDOM from 'react-dom';
import App from './App';

ReactDOM.render(<App />, document.querySelector('#root'));

// 结果就是开始能看到 hello world，三秒后啥也看不到
setTimeout(() => {
    console.log('ready to reload');
    window.location.reload();
}, 3000);
```

![测试 reload](https://s2.loli.net/2022/03/19/h8rXZf3AnuGCI6P.png)

其实只要你在 VSCode 的 Webview 中调用 `window.location.reload` 就会导致 Webview 空白。那这还搞毛，写前端代码虽然有热更新但还是时不时会触发 reload 的。

要解决这个问题，我们就要搞点骚操作了。

### 聊聊 webpack 和 webpack-dev-server

有些刚接触 webpack 的同学可能对于他俩各自的职责会没有清晰的认识。

webpack 包的定位是一个打包器，并且提供了热更新的接口给外部插件去实现具体的热更新逻辑，通过 webpack 可以打包出一个 bundle。

webpack-dev-server 定位是一个使用内存文件系统的静态服务器，用于托管 webpack 打包出的 bundle。同时。它还是一个 websocket 服务器，负责 webpack 和 bundle 代码的通信。

当我们访问 webpack-dev-server 托管的 SPA 时，修改网页代码，有时候会触发 reload，那么这部分 reload 相关的源代码是在 webpack 中还是 webpack-dev-server 中呢？

其实前面已经说了是 webpack 负责提供热更新的接口，那么在无法应用热更新时，webpack 注入 bundle 中的源代码就会触发 reload。

还记得我们前面配置热更新时需要配置额外的 entry 吗?

```javascript
const devEntries = [
  "webpack/hot/dev-server.js",
  `webpack-dev-server/client/index.js?${devServerClientQuery}`,
];
```

其实 webpack 触发 reload 的逻辑就在这个文件 `webpack/hot/dev-server.js`，代码不多，也就 60 几行：

```javascript
/* globals __webpack_hash__ */
if (module.hot) {
  var lastHash;
  var upToDate = function upToDate() {
    return lastHash.indexOf(__webpack_hash__) >= 0;
  };
  var log = require("./log");
  var check = function check() {
    module.hot
      .check(true)
      .then(function (updatedModules) {
        if (!updatedModules) {
          log("warning", "[HMR] Cannot find update. Need to do a full reload!");
          log(
            "warning",
            "[HMR] (Probably because of restarting the webpack-dev-server)"
          );
          window.location.reload();
          return;
        }

        if (!upToDate()) {
          check();
        }

        require("./log-apply-result")(updatedModules, updatedModules);

        if (upToDate()) {
          log("info", "[HMR] App is up to date.");
        }
      })
      .catch(function (err) {
        var status = module.hot.status();
        if (["abort", "fail"].indexOf(status) >= 0) {
          log(
            "warning",
            "[HMR] Cannot apply update. Need to do a full reload!"
          );
          log("warning", "[HMR] " + log.formatError(err));
          window.location.reload();
        } else {
          log("warning", "[HMR] Update failed: " + log.formatError(err));
        }
      });
  };
  var hotEmitter = require("./emitter");
  hotEmitter.on("webpackHotUpdate", function (currentHash) {
    lastHash = currentHash;
    if (!upToDate() && module.hot.status() === "idle") {
      log("info", "[HMR] Checking for updates on the server...");
      check();
    }
  });
  log("info", "[HMR] Waiting for update signal from WDS...");
} else {
  throw new Error("[HMR] Hot Module Replacement is disabled.");
}
```

可以看到代码中在无法找到热更新代码或者热更新失败就会调用 `window.location.reload();`。

### 骚操作

为了解决 webpack 自动 reload 导致页面空白的问题。

首先我们就得不让 webpack 自动 reload，这好办，直接把 `webpack/hot/dev-server.js` copy 一份，删掉 `window.location.reload();` 就行了。需要注意的是要同时修改里面 require 的相对路径为 webpack-dev-server 包下的路径。

```javascript
// scripts/webpack.config.js
const webpackHotDevServer = resolvePath(
  __dirname,
  "./webpack-hot-dev-server.js"
);
const devEntries = [
  // 替换成改过的文件
  webpackHotDevServer,
  `webpack-dev-server/client/index.js?${devServerClientQuery}`,
];
```

但是没有 reload 也不行啊！既然自己没法 reload，我们可以让 VSCode 去 reload。

具体来说，我们可以修改 `webpack/hot/dev-server.js`，将中 reload 操作改成向我们的 VSCode 扩展通信，让它去 reload Webview。

修改 `webpack/hot/dev-server.js`，加入下面的代码，这个 `window.__reload__` 才是真正可用的 reload。

```javascript
if (!window.__vscode__) {
  window.__vscode__ = acquireVsCodeApi();
  window.__reload__ = function () {
    console.log("post message to vscode to reload!");
    window.__vscode__.postMessage({
      command: "reload",
      text: "from web view",
    });
  };
}
```

再将其中 reload 代码都替换成我们自己实现的 `window.__reload__` 完美集成 webpack 热更新啦！

哦，对了，还要在扩展中要处理 reload 事件：

```javascript
// src/MyWebView.ts
private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this.panel = panel;
        this.extensionUri = extensionUri;

        this.setupHtmlForWebview();

        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

        // Handle messages from the webview
        this.panel.webview.onDidReceiveMessage(
            (message) => {
                switch (message.command) {
                // 处理 reload 实现
                    case 'reload':
                    // 需要修改 html 内容才会 reload，所以每次都替换了 script 的 nonce 为一个随机字符串
                        this.html = this.html.replace(/nonce="\w+?"/, `nonce="${getNonce()}"`);
                        this.panel.webview.html = this.html;
                        return;
                }
            },
            null,
            this.disposables,
        );
    }
```

## 最终效果

![完美实现](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/2fad407b262945ae94b0088ba1e5bbf7~tplv-k3u1fbpfcp-zoom-in-crop-mark:1304:0:0:0.awebp?)

## 总结

自己在折腾 VSCode Webview 和 Webpack 热更新的时候 debug 了很多代码，也翻了很多 webpack 和 webpack-dev-server 的源码看。能够明显感觉到和刚入行前端时的不一样，那时候 debug 都用不利索，源码更是无从下手。其实阅读源码是一门技术活，我也是在看了很多开源项目源代码才变成现在碰到问题就看源码，debug 分析。刚入行那个时候，源码一看就头痛，看着不是自己写的代码就懵逼不知道咋下手。

这是时隔 2 年第一篇公开的博客，以后会陆续分享我在工作中和开源项目中的经验和思考。目前比较想分享的主题还有 ts 类型体操以及 VSCode 相关的一些东西。我感觉一周能写一篇就非常不容易了，有时间还要学习和写开源项目，最近为了写一个 VSCode 扩展又把 rust 的学习耽搁了。

写博客一方面是让自己在写博客中对遇到的问题能有时间更全面更清晰的思考。其实工作两年有非常多的东西都可以分享，但都没有去记录。之前工作了半年的 flutter，现在回想起来写一个 hello world 脑海里都没有清晰的代码，倒不是说写不了，只不过我要是现在去写一个 flutter 项目可能会重蹈以前犯过的很多错误。

最近越发想写博客的另一个原因是感觉自己通过别人写的博客确实学到了很多东西，以至于我都给他的博客打赏了 66 块钱。而且自己之前的一些博客还是能时不时收到一些感谢。也有可能是单身久了，想通过写博客在网络上提升下存在感，通过交流排解下空虚感。

全文完。
