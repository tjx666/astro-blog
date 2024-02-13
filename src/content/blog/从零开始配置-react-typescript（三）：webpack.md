---
title: 从零开始配置 react + typescript（三）：webpack
tags:
  - typescript
  - react
  - webpack
  - babel
  - express
categories:
  - 前端
author: 余腾靖
pubDatetime: 2020-02-14 20:15:56
---

本篇为 `从零开始配置 react + typescript` 系列第三篇，将带大家完成模板项目的 webpack 配置。整个项目的配置我力求达到以下目标：

**灵活：** 我在配置 eslint 是选择使用 js 格式而不是 json，就是为了灵活性，使用 js 文件可以让你使用导入其它模块，根据开发环境动态配置，充分发挥 js 语言的能力。

**新潮：** 我觉得时刻保持对新事物的关注和尝试去使用它是一个优秀的素质。当然，追新很容易碰到坑，但是，没关系，我已经帮你们踩过了，踩不过去我也不会写出来 😂。从我 eslint `parserOptions.ecmaVersion` 设置为 2020，还有经常来一发 `yarn upgrade --latest` 都可以体现出来。

**严格：** 就像我平时判断相等性我大多数情况都是使用严格等 `===`，而不是非严格等 `==`，我觉得越严格，分析起来就越清晰，越早能发现问题。例如我么后面会使用一些 webpack 插件来严格检查模块大小写，检查是否有循环依赖。

**安逸：** 项目中会尽量集成当前前端生态界实用的和能提高开发愉悦性的（换个词就是花里胡哨）工具。

**生产 ready**：配置的时候针对不同的打包环境针对性优化，并确保能够投入生产环境使用。

本篇将分三大部分介绍：

1. dev server
2. 开发环境优化
3. 生产环境优化

如果读者是初次看到这篇文章，建议先看下前两篇：

1. [从零开始配置 react + typescript（一）：dotfiles](https://lyreal666.com/从零开始配置-react-typescript（一）：dotfiles/)
2. [从零开始配置 react + typescript（二）：linters 和 formatter](https://lyreal666.com/从零开始配置-react-typescript（二）：linters-和-formatter/)

项目地址：[react-typescript-boilerplate](https://github.com/tjx666/react-typescript-boilerplate)

<!-- more -->

## dev server

想当初我刚开始学前端框架的那时候，也是被 webpack 折磨的欲仙欲死，我是先自学的 node 才开始写前端，写 nodejs 很方便，自带的模块化方案 `commonjs`，写前端项目就要配置打包工具。当时最火的打包工具已经是 webpack 了，其次就是 `gulp`。配置 webpack 总是记不住 webpack 配置有哪些字段，还要扯到一堆相关的工具像 ES6 编译器 `babel`，CSS 预处理器 `sass`/`less`，CSS 后处理器 `postcss`，以及各种 webpack 的 loader 和 plugin。然后嫌麻烦就有一段时间都是用官方的脚手架，react 就用 `cra`，也就是 `create-react-app`，vue 就用 `vue-cli`。其实也挺好用的，不过说实话，我个人觉得，`cra` 没 `vue-cli` 设计的好，无论是易用性和扩展性都完败，cra 不方便用户修改 webpack 配置，vue-cli 不但易于用户修改 webpack 配置，还能让用户保存模板以及自带插件系统。我感觉 react 官方也意识到了这点，所以官方声称近期将会重点优化相关工具链。现在的话，如果我新建一个前端项目，我会选择自己配，不会去采用官方的 cli，因为我觉得我自己已经相当熟悉前端各种构建工具了，等我上半年忙完毕业和找工作的事情我应该会将一些常用的配置抽成一个 npm 包，现在每次写一个项目都 copy 改太累了，一个项目的构建配置有优化点，其它项目都要手动同步一下，效率太低。

### 技术选型

TypeScript 作为静态类型语言，相对于 js 而言，在类型提示上带来的提升无疑是巨大的。借助 IDE 的类型提示和代码补全，我们需要知道 webpack 配置对象有哪些字段就不用去查官方文档了，而且还不会敲错，很安逸，所以开发语言就选择 **TypeScript**。

官方文档上有专门一节 [Configuration Languages](https://webpack.js.org/configuration/configuration-languages/) 介绍 webpack 命令行工具怎么使用 ts 格式的配置文件，我觉得 `webpack-dev-server` 命令行工具应该是一样的。

但是我不打算使用官方文档介绍的方式，我压根不打算使用命令行工具，用 node API 才是**最灵活**的配置方式。配置 `webpack devServer` 总结一下有以下方式：

1. `webpack-dev-server`，这是最不灵活的方式，当然使用场景简单的情况下还是很方便的
2. `webpack-dev-server` node API，在 node 脚本里面调用 `web-dev-server` 包提供的 node API 来启动 devServer
3. `express` + `webpack devServer 相关中间件`，实际上 `webpack-dev-server` 就是使用 `express` 以及一些 devServer 相关的中间件开发的。在这种方式下，各种中间件直接暴露出来了，我们可以灵活配置各个中间件的选项。
4. `koa` + `webpack devServer 相关中间件`，我在 github 上还真的搜到了和 webpack devServer 相关的 webpack 中间件。其实 webpack devServer 就是一个 node server 嘛，用什么框架技术实现不重要，能实现我们需要的功能就行。

我最终采用 `express` + `webpack devServer 相关中间件`的方式，为什么不选择用 `koa` ？因为我觉得官方用的就是 `express`，用 `express` 肯定要比 `koa` 更成熟稳定，坑要少一些。

### 实现最基本的打包功能

从简到繁，我们先来实现最基本的打包功能使其能够打包 `tsx` 文件，在此基础上一步一步丰富，优化我们的配置。

#### 配置入口文件

先安装 TypeScript：

```bash
# 本地安装开发依赖 typescript
yarn add typescript -D
```

每个 TypeScript 项目都需要有一个 `tsconfig.json` 配置文件，使用下面的命令在 `src` 目录下新建 `tsconfig.json` 文件：

```bash
cd src && npx tsc --init && cd ..
```

我们暂时调整成这样：

```javascript
{
    "compilerOptions": {
        /* Basic Options */
        "jsx": "react",
        "isolatedModules": true,

        /* Strict Type-Checking Options */
        "strict": true,

        /* Additional Checks */
        "noUnusedLocals": true,
        "noUnusedParameters": true,
        "noImplicitReturns": true,
        "noFallthroughCasesInSwitch": true,

        /* Module Resolution Options */
        "moduleResolution": "node",
        "esModuleInterop": true,
        "resolveJsonModule": true,
        "baseUrl": "./",
        "paths": {
            // 配置模块路径映射
            "@/*": ["./*"],
        },

        /* Experimental Options */
        "experimentalDecorators": true,
        "emitDecoratorMetadata": true,

        /* Advanced Options */
        "forceConsistentCasingInFileNames": true,
        "skipLibCheck": true,

        // 下面这些选项对 babel 编译 TypeScript 没有作用但是可以让 VSCode 等编辑器正确提示错误
        "target": "ES2019",
        "module": "ESNext"
    }
}
```

我们将使用 babel 去编译 TypeScript，babel 在编译 TypeScript 代码是直接去掉 TypeScript 的类型，然后当成普通的 javascript 代码使用各种插件进行编译，tsc 并没有介入编译过程，因此 `tsconfig.json` 中很多选项例如 `target` 和 `module` 是没有用的。

启用 `isolatedModules` 选项会在 babel 编译代码时提供一些额外的检查，`esModuleInterop` 这个选项是用来为了让没有 default 属性的模块也可以使用默认导入，举个简单的例子，如果这个选项没开启，那你导入 fs 模块只能像下面这样导入：

```javascript
import * as fs from 'fs';
```

开启了以后，可以直接使用默认导入：

```javascript
import fs from 'fs';
```

本质上 ESM 默认导入是导入模块的 default 属性：

```javascript
import fs from 'fs';
// 等同于
import * as __module__ from 'fs';
let fs = __module__.default;
```

但是 node 内建模块 fs 是没有 default 属性的，开启 `isolatedModules` 选项就会在没有 default 属性的情况下自动转换：

```javascript
import fs, { resolve } from 'fs';
// 转换成
import * as fs from 'fs';
let { resolve } = fs;
```

我们添加一个入口文件 `src/index.tsx`，内容很简单：

```javascript
import plus from './plus';

console.log(plus(404, 404, 404, 404, 404)); // => 2020
```

`src/plus.ts` 内容为：

```javascript
export default function plus(...nums: number[]) {
  return nums.reduce((pre, current) => pre + current, 0);
}
```

#### 编译 TypeScript

我们知道 webpack 默认的模块化系统只支持 js 文件，对于其它类型的文件如 jsx, ts, tsx, vue 以及图片字体等文件类型，我们需要安装对应的 loader。对于 ts 文件，目前存在比较流行的方案有三种：

1. babel + [@babel/preset-typescript](https://babeljs.io/docs/en/babel-preset-typescript)

2. [ts-loader](https://github.com/TypeStrong/ts-loader)

3. [awesome-typescript-loader](https://github.com/s-panferov/awesome-typescript-loader)

awesome-typescript-loader 就算了，作者已经放弃维护了。首先 babel 我们一定要用的，因为 babel 生态有很多实用的插件。虽然 babel 是可以和 ts-loader 一起用，ts-loader 官方给了一个例子 [react-babel-karma-gulp](https://github.com/TypeStrong/ts-loader/tree/master/examples/react-babel-karma-gulp)，但是我觉得既然 babel 已经能够编译 TypeScript 我们就没必要再加一个 ts-loader，所以我选择方案一。需要指出的一点就是就是 babel 默认不会检查 TypeScript 的类型，后面 webpack 插件部分我们会通过配置 `fork-ts-checker-webpack-plugin` 来解决这个问题。

#### 添加 webpack 配置

我们将把所有 node 脚本放到项目根目的 `scripts` 文件夹，因为 `src` 文件夹是前端项目，而 `scripts` 文件夹是 node 项目，我们应该分别配置 `tsconfig.json`，通过下面的命令在其中生成初始的 `tsconfig.json` 文件：

```bash
cd ./scripts && npx tsc --init && cd ..
```

我们调整成酱：

```javascript
// scripts/tsconfig.json
{
    "compilerOptions": {
        /* Basic Options */
        "target": "ES2019",
        "module": "commonjs",

        /* Strict Type-Checking Options */
        "strict": true,

        /* Additional Checks */
        "noUnusedLocals": true,
        "noUnusedParameters": true,
        "noImplicitReturns": true,
        "noFallthroughCasesInSwitch": true,

        /* Module Resolution Options */
        "moduleResolution": "node",
        "esModuleInterop": true,
        "resolveJsonModule": true,

        /* Experimental Options */
        "experimentalDecorators": true,
        "emitDecoratorMetadata": true,

        /* Advanced Options */
        "forceConsistentCasingInFileNames": true,
        "skipLibCheck": true
    }
}
```

提几个需要注意的地方：

- `"target": "ES2019"`，其实编译级别你调的很低是没问题的，你用高级语法 tsc 就转码呗，缺点就是转码后代码体积一般会变大，执行效率也会降低，原生语法一般都是被优化过的。我喜欢调高一点，一般来说只要不用那些在代码运行平台还不支持的语法就没问题。自从 TypeScript3.7 支持了可选链，我就开始尝试在 TypeScript 使用它，但是问题来了，我之前编译级别一直都是调成最高，也就是 `ESNext`，因为可选链在 `ES2020` 已经是标准了，所以 tsc 对于可选链不会转码的。然后 node 12 还不支持可选链，就会报语法错误，于是我就降到 `ES2019` 了。

- `Strict Type-Checking Options`，这部分全开，既然上了 TypeScript 的船，就用最严格的类型检查，拒绝 AnyScript

接着我们新建 `scripts/configs`文件夹，里面用来存放包括 webpack 的配置文件。在其中新建三个 webpack 的配置文件 `webpack.common.ts`， `webpack.dev.ts`和 `webpack.prod.ts`。`webpack.common.ts` 保存一些公共的配置文件，`webpack.dev.ts` 是开发环境用的，会被 devServer 读取，`webpack.prod.ts` 是我们在构建生产环境的 bundle 时用的。

我们接着安装 webpack 和 webpack-merge 以及它们的类型声明文件：

```bash
yarn add webpack webpack-merge @types/webpack @types/webpack-merge -D
```

[webpack-merge](https://github.com/survivejs/webpack-merge) 是一个为 merge webpack 配置设计的 merge 工具，提供了一些高级的 merge 方式。不过我目前并没有用到那些高级的 merge 方式，就是当成普通的 merge 工具使用，后续可以探索一下这方面的优化。

为了编译 tsx，我们需要安装 `babel-loader` 和相关插件：

```bash
yarn add babel-loader @babel/core @babel/preset-typescript -D
```

新建 babel 配置文件 `babel.config.js`，现在我们只添加一个 TypeScript preset：

```javascript
// babel.config.js
module.exports = function (api) {
  api.cache(true);

  const presets = ['@babel/preset-typescript'];
  const plugins = [];

  return {
    presets,
    plugins,
  };
};
```

添加 babel-loader 到 `webpack.common.ts`：

```javascript
// webpack.common.ts`
import { Configuration } from 'webpack';
import { projectName, projectRoot, resolvePath } from '../env';

const commonConfig: Configuration = {
  context: projectRoot,
  entry: resolvePath(projectRoot, './src/index.tsx'),
  output: {
    publicPath: '/',
    path: resolvePath(projectRoot, './dist'),
    filename: 'js/[name]-[hash].bundle.js',
    // 加盐 hash
    hashSalt: projectName || 'react typescript boilerplate',
  },
  resolve: {
    // 我们导入 ts 等模块一般不写后缀名，webpack 会尝试使用这个数组提供的后缀名去导入
    extensions: ['.ts', '.tsx', '.js', '.json'],
  },
  module: {
    rules: [
      {
        // 导入 jsx 的人少喝点
        test: /\.(tsx?|js)$/,
        loader: 'babel-loader',
        // 开启缓存
        options: { cacheDirectory: true },
        exclude: /node_modules/,
      },
    ],
  },
};
```

我觉得这个 react + ts 项目不应该会出现 jsx 文件，如果导入了 jsx 文件 webpack 就会报错找不到对应的 loader，可以让我们及时处理掉这个有问题的文件。

#### 使用 express 开发 devServer

我们先安装 `express` 以及和 webpack devServer 相关的一些中间件：

```bash
yarn add express webpack-dev-middleware webpack-hot-middleware @types/express @types/webpack-dev-middleware @types/webpack-hot-middleware -D
```

[webpack-dev-middleware](https://github.com/webpack/webpack-dev-middleware) 这个 `express` 中间件的主要作用：

1. 作为一个静态文件服务器，使用内存文件系统托管 webpack 编译出的 bundle
2. 如果文件被修改了，会延迟服务器的请求直到编译完成
3. 配合 [webpack-hot-middleware](https://github.com/webpack-contrib/webpack-hot-middleware) 实现热更新功能

[webpack-hot-middleware](https://github.com/webpack-contrib/webpack-hot-middleware) 这个 express 中间件会将自己注册为一个 webpack 插件，监听 webpack 的编译事件。你哪个 entry 需要实现热更新，就要在那个 entry 中导入这个插件提供的 `webpack-hot-middleware/client.js` 客户端补丁。这个前端代码会获取 devServer 的 [Server Sent Events](http://www.html5rocks.com/en/tutorials/eventsource/basics/) 连接，当有编译事件发生，devServer 会发布通知给这个客户端。客户端接受到通知后，会通过比对 hash 值判断本地代码是不是最新的，如果不是就会向 devServer 拉取更新补丁借助一些其它的工具例如 [react-hot-loader](https://github.com/gaearon/react-hot-loader) 实现热更新。

下面是我另外一个还在开发的 electron 项目修改了一行代码后，client 补丁发送的两次请求：

![hash](https://i.loli.net/2020/02/16/QS1lFJt7fbIYEcG.png)

![update](https://i.loli.net/2020/02/16/PVpnHNC9G7rEtQT.png)

第一次请求返回的那个 h 值动动脚趾头就能猜出来就是 hash 值，发现和本地的 hash 值比对不上后，再次请求更新补丁。

我们新建文件 `scripts/start.ts` 用来启动我们的 devServer：

```javascript
import chalk from 'chalk';
import getPort from 'get-port';
import logSymbols from 'log-symbols';
import open from 'open';
import { argv } from 'yargs';
import express, { Express } from 'express';
import webpack, { Compiler, Stats } from 'webpack';
import historyFallback from 'connect-history-api-fallback';
import cors from 'cors';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';

import proxy from './proxy';
import devConfig from './configs/webpack.dev';
import { hmrPath } from './env';

function openBrowser(compiler: Compiler, address: string) {
    if (argv.open) {
        let hadOpened = false;
        // 编译完成时执行
        compiler.hooks.done.tap('open-browser-plugin', async (stats: Stats) => {
            // 没有打开过浏览器并且没有编译错误就打开浏览器
            if (!hadOpened && !stats.hasErrors()) {
                await open(address);
                hadOpened = true;
            }
        });
    }
}

function setupMiddlewares(compiler: Compiler, server: Express) {
    const publicPath = devConfig.output!.publicPath!;

    // 设置代理
    proxy(server);

    // 使用 browserRouter 需要重定向所有 html 页面到首页
    server.use(historyFallback());

    // 开发 chrome 扩展的时候可能需要开启跨域，参考：https://juejin.im/post/5e2027096fb9a02fe971f6b8
    server.use(cors());

    const devMiddlewareOptions: webpackDevMiddleware.Options = {
        // 保持和 webpack 中配置一致
        publicPath,
        // 只在发生错误或有新的编译时输出
        stats: 'minimal',
        // 需要输出文件到磁盘可以开启
        // writeToDisk: true
    };
    server.use(webpackDevMiddleware(compiler, devMiddlewareOptions));

    const hotMiddlewareOptions: webpackHotMiddleware.Options = {
        // sse 路由
        path: hmrPath,
        // 编译出错会在网页中显示出错信息遮罩
        overlay: true,
        // webpack 卡住自动刷新页面
        reload: true,
    };
    server.use(webpackHotMiddleware(compiler, hotMiddlewareOptions));
}

async function start() {
    const HOST = '127.0.0.1';
    // 4 个备选端口，都被占用会使用随机端口
    const PORT = await getPort({ port: [3000, 4000, 8080, 8888] });
    const address = `http://${HOST}:${PORT}`;

    // 加载 webpack 配置
    const compiler = webpack(devConfig);
    openBrowser(compiler, address);

    const devServer = express();
    setupMiddlewares(compiler, devServer);

    const httpServer = devServer.listen(PORT, HOST, err => {
        if (err) {
            console.error(err);
            return;
        }
        // logSymbols.success 在 windows 平台渲染为 √ ，支持的平台会显示 ✔
        console.log(
            `DevServer is running at ${chalk.magenta.underline(address)} ${logSymbols.success}`,
        );
    });

    // 我们监听了 node 信号，所以使用 cross-env-shell 而不是 cross-env
    // 参考：https://github.com/kentcdodds/cross-env#cross-env-vs-cross-env-shell
    ['SIGINT', 'SIGTERM'].forEach((signal: any) => {
        process.on(signal, () => {
            // 先关闭 devServer
            httpServer.close();
            // 在 ctrl + c 的时候随机输出 'See you again' 和 'Goodbye'
            console.log(
                chalk.greenBright.bold(`\n${Math.random() > 0.5 ? 'See you again' : 'Goodbye'}!`),
            );
            // 退出 node 进程
            process.exit();
        });
    });
}

// 写过 python 的人应该不会陌生这种写法
// require.main === module 判断这个模块是不是被直接运行的
if (require.main === module) {
    start();
}

```

`webpackHotMiddleware` 的 `overlay` 选项是用于是否开启错误遮罩：

![overlay](https://i.loli.net/2020/02/20/lLQEXfwgY5khOeM.png)

很多细节我都写到注释里面了，安装其中用到的一些工具库：

```bash
yarn add get-port log-symbols open yarg -D
```

前三个都是 [sindresorhus](https://github.com/sindresorhus) 大佬的作品，`get-port` 用于获取可用端口，`log-symbols` 提供了下面四个 log 字符，`open` 用于系统应用打开 `uri` （`uri` 包括文件和网址大家应该都知道）, `yargs` 用于解析命令行参数。

![log-symbols](https://github.com/sindresorhus/log-symbols/raw/master/screenshot.png)

`webpack-dev-middleware` 并不支持 `webpack-dev-server` 中的 `historyFallback` 和 `proxy` 功能，其实无所谓，我们可以通过 **DIY** 我们的 express server 来实现，我们甚至可以使用 `express` 来集成 `mock` 功能。安装对应的两个中间件：

```bash
yarn add connect-history-api-fallback http-proxy-middleware @types/connect-history-api-fallback @types/http-proxy-middleware -D
```

`connect-history-api-fallback` 可以直接作为 `express` 中间件集成到 express server，封装一下 `http-proxy-middleware`，可以在 `proxyTable` 中添加自己的代理配置：

```javascript
import { createProxyMiddleware } from 'http-proxy-middleware';
import chalk from 'chalk';

import { Express } from 'express';
import { Options } from 'http-proxy-middleware/dist/types';

interface ProxyTable {
    [path: string]: Options;
}

const proxyTable: ProxyTable = {
    // 示例配置
    '/path_to_be_proxy': { target: 'http://target.domain.com', changeOrigin: true },
};

// 修饰链接的辅助函数，修改颜色并添加下划线
function renderLink(str: string) {
    return chalk.magenta.underline(str);
}

function proxy(server: Express) {
    Object.entries(proxyTable).forEach(([path, options]) => {
        const from = path;
        const to = options.target as string;
        console.log(`proxy ${renderLink(from)} ${chalk.green('->')} ${renderLink(to)}`);

        // eslint-disable-next-line no-param-reassign
        if (!options.logLevel) options.logLevel = 'warn';
        server.use(path, createProxyMiddleware(options));

        // 如果需要更灵活的定义方式，请在下面直接使用 server.use(path, proxyMiddleware(options)) 定义
    });
    process.stdout.write('\n');
}

export default proxy;
```

为了启动 devServer，我们还需要安装两个命令行工具：

```bash
yarn add ts-node cross-env -D
```

[ts-node](https://github.com/TypeStrong/ts-node) 可以让我们直接运行 TypeScript 代码，[cross-env](https://github.com/kentcdodds/cross-env/) 是一个跨操作系统的设置环境变量的工具，添加启动命令到 npm script：

```javascript
// package.json
{
    "scripts": {
        "start": "cross-env-shell NODE_ENV=development ts-node --files -P ./scripts/tsconfig.json ./scripts/start.ts --open",
    }
}
```

[cross-env](https://github.com/kentcdodds/cross-env/#cross-env-vs-cross-env-shell) 官方文档提到如果要在 windows 平台处理 node 信号例如 `SIGINT`，也就是我们 `ctrl + c` 时触发的信号应该使用 `cross-env-shell` 命令而不是 `cross-env` 。

ts-node 为了提高执行速度，默认不会读取 `tsconfig.json` 中的 `files`, `include` 和 `exclude` 字段，而是基于模块依赖读取的。这会导致我们后面写的一些全局的 `.d.ts` 文件不会被读取，为此，我们需要指定 `--files` 参数，详情可以查看 [help-my-types-are-missing](https://github.com/TypeStrong/ts-node#help-my-types-are-missing)。我们的 node 代码并不多，而且又不是经常性重启项目，直接让 ts-node 扫描整个 `scripts` 文件夹没多大影响。

启动我们的 dev server，通过 ctrl + c 退出：

```bash
npm start
```

![dev server](https://i.loli.net/2020/02/16/DevliamMEKy1hTt.gif)

## 开发环境优化

### plugins

每个 webpack plugin 都是一个包含 apply 方法的 class，在我们调用 `compiler.run` 或者 `compiler.watch` 的时候它就会被调用，并且把 compiler 作为参数传它。compiler 对象提供了各个时期的 hooks，我们可以通过这些 hooks 挂载回调函数来实现各种功能，例如压缩，优化统计信息，在在编译完弹个编译成功的通知等。

![hooks](https://i.loli.net/2020/02/17/kqngMuoNQWj2CyG.png)

#### 显示打包进度

`webpack-dev-server` 在打包时使用 `--progress` 参数会在控制台实时输出百分比表示当前的打包进度，但是从上面的图中可以看出只是输出了一些统计信息（stats）。想要实时显示打包进度我了解的有三种方式：

1. webpack 内置的 [webpack.ProgressPlugin](https://webpack.docschina.org/plugins/progress-plugin) 插件

2. [progress-bar-webpack-plugin](https://github.com/clessg/progress-bar-webpack-plugin)

3. [webpackbar](https://github.com/nuxt/webpackbar)

内置的 `ProgressPlugin` 非常的原始，你可以在回调函数获取当前进度，然后按照自己喜欢的格式去打印：

```javascript
const handler = (percentage, message, ...args) => {
  // e.g. Output each progress message directly to the console:
  console.info(percentage, message, ...args);
};
new webpack.ProgressPlugin(handler);
```

`progress-bar-webpack-plugin` 这个插件不是显示百分比，而是显示一个用字符画出来的进度条：

![progress-bar-webpack-plugin](https://camo.githubusercontent.com/cb9c82719765ad966a2771f084175c9ec935124e/687474703a2f2f692e696d6775722e636f6d2f4f495031676e6a2e676966)

这个插件其实还是挺简洁实用的，但是有个 bug，如果在打印进度条的时候输出了其它语句，进度条就会错位，我们的 devServer 会在启动后会输出地址：

```javascript
console.log(`DevServer is running at ${chalk.magenta.underline(address)} ${logSymbols.success}`);
```

使用这个进度条插件就会出问题下面的问题，遂放弃。

![progress-bar-webpack-plugin](https://i.loli.net/2020/02/16/MvEgi4sw7WkjbnT.png)

`webpackbar` 是 nuxt project 下的库，背靠 [nuxt](https://github.com/nuxt)，质量绝对有保证。我之前有段时间用的是 `progress-bar-webpack-plugin`，因为我在 npm 官网搜索 `webpack progress`，综合看下来就它比较靠谱，`webpackbar` 都没搜出来。看了下 `webpackbar` 的 `package.json`，果然 `keywords` 都是空的。`webpackBar` 还是我在研究 `ant design` 的 webpack 配置看到它用了这个插件，才发现了这个宝藏：

![webpackbar](https://i.loli.net/2020/02/19/MGDZLJBcK2yToN6.png)

安装 `webpackbar`：

```bash
yarn add webpackbar @types/webpackbar -D
```

添加配置到 `webpack.common.ts` 的 plugins 数组，颜色我们使用 react 蓝：

```javascript
import { Configuration } from 'webpack';

const commonConfig: Configuration = {
  plugins: [
    new WebpackBar({
      name: 'react-typescript-boilerplate',
      // react 蓝
      color: '#61dafb',
    }),
  ],
};
```

#### 优化控制台输出

我们使用 [friendly-errors-webpack-plugin](https://github.com/geowarin/friendly-errors-webpack-plugin) 插件让控制台的输出更加友好，下面使用了之后编译成功时的效果：

![build successful](https://i.loli.net/2020/02/19/bj9hRKeUBMG1Hmv.png)

```bash
yarn add friendly-errors-webpack-plugin @types/friendly-errors-webpack-plugin -D
```

```javascript
// webpack.common.ts
import FriendlyErrorsPlugin from 'friendly-errors-webpack-plugin';

const commonConfig: Configuration = {
  plugins: [new FriendlyErrorsPlugin()],
};
```

#### 构建通知

![build notification](https://i.loli.net/2020/02/19/wsWuPkh3x9GlL4a.png)

在我大四实习之前，我就没完整写过 vue 项目的，在上家公司实习的那段时间主要就是写 vue，当时我对 vue-cli 那个频繁的错误通知很反感，我和同事说我想去掉这个通知，没曾想同事都是比较喜欢那个通知，既然有人需要，那我们这个项目也配一下。

我们使用 [webpack-build-notifier](https://github.com/RoccoC/webpack-build-notifier) 来支持错误通知，这个插件是 TypeScript 写的，不需要安装 types：

```bash
yarn add webpack-build-notifier -D
```

```javascript
// webpack.common.ts
import WebpackBuildNotifierPlugin from 'webpack-build-notifier';

const commonConfig: Configuration = {
  plugins: [
    // suppressSuccess: true 设置只在第一次编译成功时输出成功的通知，rebuild 成功的时候不通知
    new WebpackBuildNotifierPlugin({ suppressSuccess: true }),
  ],
};
```

> 因为我不喜欢弹通知，所以模板项目中的我注释掉了这个插件，有需要的自己打开就行了。

#### 严格检查路径大小写

下面的测试表明 webpack 默认对路径的大小写不敏感：

![path case](https://i.loli.net/2020/02/16/czN2UDhGiXb3TJ5.png)

我们使用 [case-sensitive-paths-webpack-plugin](https://github.com/Urthen/case-sensitive-paths-webpack-plugin) 对路径进行严格的大小写检查：

```bash
yarn add case-sensitive-paths-webpack-plugin @types/case-sensitive-paths-webpack-plugin -D
```

```javascript
// webpack.common.ts
import CaseSensitivePathsPlugin from 'case-sensitive-paths-webpack-plugin';

const commonConfig: Configuration = {
  plugins: [new CaseSensitivePathsPlugin()],
};
```

![path-case-check](https://i.loli.net/2020/02/16/FWdazBElvG8Mq4U.png)

实际打包测试中发现这个插件非常耗时，并且因为 `eslint-import-plugin` 默认会对只是大小写不一样的模块路径会报错，因此我们这个项目就不集成了。

![case sensitive](https://i.loli.net/2020/04/03/3fLepM1GSBAPjh4.png)

#### 循环依赖检查

![circle-dependencies](https://i.loli.net/2020/02/16/bHQEPLK1WiCXlBA.png)

webpack 默认不会对循环依赖报错，通过 [circular-dependency-plugin](https://github.com/aackerman/circular-dependency-plugin) 这个 webpack 插件可以帮我们及时发现循环依赖的问题：

```bash
yarn add circular-dependency-plugin @types/circular-dependency-plugin -D
```

```javascript
// webpack.common.ts
import CircularDependencyPlugin from 'circular-dependency-plugin';

import { projectRoot, resolvePath } from '../env';

const commonConfig: Configuration = {
  plugins: [
    new CircularDependencyPlugin({
      exclude: /node_modules/,
      failOnError: true,
      allowAsyncCycles: false,
      cwd: projectRoot,
    }),
  ],
};
```

![circle dependencies error](https://i.loli.net/2020/02/16/VOxjym6zZFftkhr.png)

这里顺便提一下 `cwd` 也就是工作路径的问题，官方文档直接用 `process.cwd()`，这是一种不好的做法，项目路径和工作路径是不同的两个概念。在 node 中表示项目路径永远不要用 `process.cwd()`，因为总会有些沙雕用户不去项目根目录启动。`process.cwd()` 也就是工作路径返回的是你运行 node 时所在的路径，假设说项目在 `/code/projectRoot`，有些用户直接在系统根目录打开 terminal，来一句 `node ./code/projectRoot/index.js`，这时 `index.js` 中 `process.cwd()` 返回的是就是系统根路径 `/`，不是有些人认为的还是 `/code/projectRoot`。

获取项目路径应该使用 `path.resolve`：

![project root](https://i.loli.net/2020/02/19/4wW75dVszApkQGe.png)

这个问题 eslint-import-plugin 也会报错，并且在 TypeScript 项目中有时候就是需要循环导入文件，因此也不集成。

#### 清理上次打包的 bundle

前面介绍了一些花里胡哨的插件，也介绍了一些让我们项目保持健康的插件，现在我们开始介绍一些打包用的插件。

[clean-webpack-plugin](https://github.com/johnagan/clean-webpack-plugin) 它会在第一次编译的时候删除 `dist` 目录中所有的文件，不过会保留 `dist` 文件夹，并且再每次 `rebuild` 的时候会删除所有不再被使用的文件。

这个项目也是 TypeScript 写的，总感觉 TypeScript 写的项目有种莫名的踏实感：

```bash
yarn add clean-webpack-plugin -D
```

```javascript
// webpack.common.ts
import { CleanWebpackPlugin } from 'clean-webpack-plugin';

const commonConfig: Configuration = {
  plugins: [new CleanWebpackPlugin()],
};
```

#### 自动生成 index.html

众所周知，腾讯的前端面试很喜欢考计算机网络，我曾多次被问到过如何更新强缓存的问题。解决强缓存立即更新的问题我们一般就是采取在文件名中插入文件内容的 hash 值，然后首页不使用强缓存。这样只要你更新了某个被强缓存的资源文件，由于更新后内容的 hash 值会变化，生成的文件名也会变化，这样你请求首页的时候由于访问的是一个新的资源路径，就会向服务器请求最新的资源。关于浏览器 HTTP 缓存可以看我另一篇文章：[通过-koa2-服务器实践探究浏览器 HTTP 缓存机制](https://lyreal666.com/通过-koa2-服务器实践探究浏览器HTTP缓存机制/)。

我们后续优化生产环境构建的时候会对将 CSS 拆分成单独的文件，如果 index.html 中插入的引入外部样式的 `link` 标签的 `href` 是我们手动设置的，那每次修改样式文件，都会生成一个新的 hash 值，我们都要手动去修改这个路径，太麻烦了，更不要说在开发环境下文件是保存在内存文件系统的，你都看不到文件名。

![build hash](https://i.loli.net/2020/02/19/8OnBuWedj5z2CFP.png)

使用 [html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin) 可以自动生成 index.html，并且插入引用到的 bundle 和被拆分的 CSS 等资源路径。

参考 `create-react-app` 的模板，我们新建 `public` 文件夹，并在其中加入 `index.html`，`favicon.ico`，`manifest.json` 等文件。`public` 文件夹用于存放一些将被打包到 `dist` 文件夹一同发布的文件。

安装并配置 [html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin)：

```bash
yarn add html-webpack-plugin @types/html-webpack-plugin -D
```

```javascript
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { __DEV__, projectName, resolvePath, projectRoot, hmrPath } from '../env';

const htmlMinifyOptions: HtmlMinifierOptions = {
    collapseWhitespace: true,
    collapseBooleanAttributes: true,
    collapseInlineTagWhitespace: true,
    removeComments: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    minifyCSS: true,
    minifyJS: true,
    minifyURLs: true,
    useShortDoctype: true,
};

const commonConfig: Configuration = {
    output: {
        publicPath: '/',
    },
    plugins: [
        new HtmlWebpackPlugin({
            // HtmlWebpackPlugin 会调用 HtmlMinifier 对 HTMl 文件进行压缩
            // 只在生产环境压缩
            minify: __DEV__ ? false : htmlMinifyOptions,
            // 指定 html 模板路径
            template: resolvePath(projectRoot, './public/index.html'),
            // 类型不好定义，any 一时爽...
            // 定义一些可以在模板中访问的模板参数
            templateParameters: (...args: any[]) => {
                const [compilation, assets, assetTags, options] = args;
                const rawPublicPath = commonConfig.output!.publicPath!;
                return {
                    compilation,
                    webpackConfig: compilation.options,
                    htmlWebpackPlugin: {
                        tags: assetTags,
                        files: assets,
                        options,
                    },
           // 除掉 publicPath 的反斜杠，让用户在模板中拼接路径更自然
                    PUBLIC_PATH: rawPublicPath.endsWith('/')
                        ? rawPublicPath.slice(0, -1)
                        : rawPublicPath,
                };
            },
        }),
    ],
};
```

为了让用户可以像 `create-react-app` 一样在 `index.html` 里面通过 `PUBLIC_PATH` 访问发布路径，需要配置 `templateParameters` 选项添加 `PUBLIC_PATH` 变量到模板参数，[html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin) 默认支持部分 ejs 语法，我们可以通过下面的方式动态设置 `favicon.ico` , `manifest.json` 等资源路径：

```html
<!doctype html>
<html lang="en">
  <head>
    <link rel="icon" href="<%= `${PUBLIC_PATH}/favicon.ico` %>" />
    <link rel="apple-touch-icon" href="<%= `${PUBLIC_PATH}/logo192.png` %>" />
    <link rel="manifest" href="<%= `${PUBLIC_PATH}/manifest.json` %>" />
    <title>React App</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
```

#### 拷贝文件到 dist

`public` 文件夹中有一些文件例如 `favicon.icon` 和 `manifest.json` 需要被拷贝到 `dist` 文件夹，我们可以使用 [copy-webpack-plugin](https://github.com/webpack-contrib/copy-webpack-plugin) 在使用 devServer 的情况下将文件拷贝到内存文件系统，在生产环境构建的时拷贝到磁盘：

```bash
yarn add copy-webpack-plugin @types/copy-webpack-plugin -D
```

```javascript
// webpack.common.ts
import CopyPlugin from 'copy-webpack-plugin';

const commonConfig: Configuration = {
  plugins: [
    new CopyPlugin(
      [
        {
          // 所有一级文件
          from: '*',
          to: resolvePath(projectRoot, './dist'),
          // 目标类型是文件夹
          toType: 'dir',
          // index.html 会通过 html-webpack-plugin 自动生成，所以需要被忽略掉
          ignore: ['index.html'],
        },
      ],
      { context: resolvePath(projectRoot, './public') }
    ),
  ],
};
```

#### 检查 TypeScript 类型

babel 为了提高编译速度只支持 TypeScript 语法编译而不支持类型检查，为了在 webpack 打包的同时支持 ts 类型检查，我们会使用 webpack 插件 [fork-ts-checker-webpack-plugin](https://github.com/TypeStrong/fork-ts-checker-webpack-plugin)，这个 webpack 插件会在一个单独的进程并行的进行 TypeScript 的类型检查，这个项目也是 TypeScript 写的，我们不需要安装 types。

```bash
yarn add fork-ts-checker-webpack-plugin -D
```

添加到 `webpack.dev.ts`，限制使用的内存为 1G：

```javascript
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';

const devConfig = merge(commonConfig, {
  mode: 'development',
  plugins: [
    new ForkTsCheckerWebpackPlugin({
      memoryLimit: 1024,
      // babel 转换的是我们前端代码，所以是指向前端代码的 tsconfig.json
      tsconfig: resolvePath(projectRoot, './src/tsconfig.json'),
    }),
  ],
});
```

同时修改 `webpack.prod.ts`，因为我们生产环境构建并不会长时间的占用内存，所以可以调大点，我们就默认限制生产环境的构建使用的内存为 2G：

```javascript
// webpack.prod.ts
const prodConfig = merge(commonConfig, {
  mode: 'production',
  plugins: [
    new ForkTsCheckerWebpackPlugin({
      memoryLimit: 1024 * 2,
      tsconfig: resolvePath(projectRoot, './src/tsconfig.json'),
    }),
  ],
});
```

#### 缓存神器

[hard-source-webpack-plugin](https://github.com/mzgoddard/hard-source-webpack-plugin) 是一个给 `modules` 提供中间缓存步骤的 webpack 插件，为了看到效果我们可能需要运行两次，第一次就是正常的编译速度，第二次可能会快上很多倍，拿我开发的一个 [VSCode 插件](https://github.com/tjx666/view-github-repository)来测试一下：

我先把 `node_modules/.cache/hard-source` 缓存文件夹删掉，看看没有缓存的时候编译速度：

![no cache](https://i.loli.net/2020/02/17/ZucCU1dEev372bS.png)

耗时 3.075 秒，重新编译：

![cache](https://i.loli.net/2020/02/17/q5B6kUFSm3TyiLl.png)

哇 🚀，直接快了 3.6 倍多...

实测发现这个插件在初次打包会耗时严重，并且即将发布的 webpack5 将内置这个功能，具体可以看这个 issue: [[spec: webpack 5] - A module disk cache between build processes ](https://github.com/webpack/webpack/issues/6527)。因此我们这个项目就不集成这个插件了。

好了，插件部分介绍完了，接下来开始配置 loaders ！

### loaders

webpack 默认只支持导入 js，处理不了其它文件，需要配置对应的 loader，像 `excel-loader` 就可以解析 excel 为一个对象，`file-loader` 可以解析 png 图片为最终的发布路径。loader 是作用于一类文件的，plugin 是作用于 webpack 编译的各个时期。

前面我们只配置了 `babel-loader`， 使得 webpack 能够处理 TypeScript 文件，实际的开发中我们还需要支持导入样式文件，图片文件，字体文件等。

#### 处理样式文件

我们最终要达到的目标是支持 css/less/sass 三种语法，以及通过 `postcss` 和 `autoprefixer` 插件实现自动补齐浏览器头等功能。

##### CSS

处理 css 文件我们需要安装 [style-loader](https://github.com/webpack-contrib/style-loader) 和 [css-loader](https://github.com/webpack-contrib/css-loader)：

```bash
yarn add css-loader style-loader -D
```

`css-loader` 作用是处理 CSS 文件中的 `@import` 和 `url()` 返回一个合并后的 CSS 字符串，而 `style-loader` 负责将返回的 CSS 字符串用 `style` 标签插到 DOM 中，并且还实现了 webpack 的热更新接口。

`style-loader` 官方示例配置是这样的：

```javascript
module.exports = {
  module: {
    rules: [
      {
        // i 后缀忽略大小写
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
};
```

可以看到匹配正则用了 `i` 后缀，我觉得这样不好，不应该提高一些无意义的容错率，用`.CSS` 做后缀就不应该让 webpack 编译通过。我们知道 webpack 的 loaders 加载顺序是从右到左的，所以需要先执行的 `css-loader` 应该在后执行的 `style-loader` 后面：

```javascript
// webpack.common.ts
const commonConfig: Configuration = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              // CSS modules 比较耗性能，默认就是禁用的
              modules: false,
              // 开启 sourcemap
              sourceMap: true,
              // 指定在 CSS loader 处理前使用的 loader 数量
              importLoaders: 0,
            },
          },
        ],
      },
    ],
  },
};
```

##### less

`less-loader` 依赖 `less`：

```bash
yarn add less less-loader -D
```

```javascript
// webpack.common.ts
const commonConfig: Configuration = {
  module: {
    rules: [
      {
        test: /\.less$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: false,
              sourceMap: true,
              // 需要先被 less-loader 处理，所以这里设置为 1
              importLoaders: 1,
            },
          },
          {
            // 先让 less-loader 将 less 文件转换成 css 文件
            // 再交给 css-loader 处理
            loader: 'less-loader',
            options: {
              sourceMap: true,
            },
          },
        ],
      },
    ],
  },
};
```

##### sass

其实我本人从来不用 `less` 和 `stylus`，我一直用的是 `sass`。`sass` 有两种语法格式，通过后缀名区分。`.sass` 后缀名是类似 `yml` 的缩进写法，`.scss` 是类似于 CSS 的花括号写法，不过支持嵌套和变量等特性。鉴于我基本上没看过哪个项目用 `yml` 格式的写法，用的人太少了，我们模板就只支持 `scss` 后缀好了。`sass-loader` 同样依赖 `node-sass`，`node-sass` 真是个碧池，没有代理还安装不了，所以我在系列第一篇就在 `.npmrc` 就配置了 `node-sass` 的镜像：

```bash
yarn add node-sass sass-loader -D
```

```javascript
// webpack.common.ts
const commonConfig: Configuration = {
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: false,
              sourceMap: true,
              importLoaders: 1,
            },
          },
          {
            loader: 'sass-loader',
            options: {
              // 中间每个 loader 都要开启 sourcemap，才能生成正确的 sourcemap
              sourceMap: true,
            },
          },
        ],
      },
    ],
  },
};
```

##### postcss

![browser prefix](https://i.loli.net/2020/02/20/Mxsl8rQdU1tNiYm.png)

记得我在大一上网页设计课学到 CSS3 的时候，很多属性都要加浏览器头处理兼容性，当时就对 CSS 兴趣大减，太麻烦了。自从 node 的出现，前端工程化开始飞速发展，以前前端老被叫做切图仔，现在前端工程师也可以用 node 做伪全栈开发了。

**postcss** 是 CSS 后处理器工具，因为先有 CSS，`postcss` 后去处理它，所以叫后处理器。

**less/sass** 被称之为 CSS 预处理器，因为它们需要被 `less` 或 `node-sass` 预先编译代码到 CSS 嘛。

参考 [create-react-app 对 postcss 的配置](https://github.com/facebook/create-react-app/blob/master/packages/react-scripts/config/webpack.config.js#L96)，安装以下插件：

```bash
yarn add postcss-loader postcss-flexbugs-fixes postcss-preset-env autoprefixer postcss-normalize -D
```

添加 `postcss.config.js` 用于配置 `postcss`：

```javascript
module.exports = {
  plugins: [
    // 修复一些和 flex 布局相关的 bug
    require('postcss-flexbugs-fixes'),
    // 参考 browserslist 的浏览器兼容表自动对那些还不支持的现代 CSS 特性做转换
    require('postcss-preset-env')({
      // 自动添加浏览器头
      autoprefixer: {
        // will add prefixes only for final and IE versions of specification
        flexbox: 'no-2009',
      },
      stage: 3,
    }),
    // 根据 browserslist 自动导入需要的 normalize.css 内容
    require('postcss-normalize'),
  ],
};
```

我们还需要添加 `browserslist` 配置到 `package.json`

```javascript
// package.json
{
 "browserslist": [
        "last 2 versions",
        // ESR（Extended Support Release） 长期支持版本
        "Firefox ESR",
        "> 1%",
        "ie >= 11"
    ],
}
```

回顾 CSS， less，sass 的配置可以看到有大量的重复，我们重构并修改 `importLoaders` 选项：

```javascript
function getCssLoaders(importLoaders: number) {
  return [
    'style-loader',
    {
      loader: 'css-loader',
      options: {
        modules: false,
        sourceMap: true,
        importLoaders,
      },
    },
    {
      loader: 'postcss-loader',
      options: { sourceMap: true },
    },
  ];
}

const commonConfig: Configuration = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: getCssLoaders(1),
      },
      {
        test: /\.less$/,
        use: [
          // postcss-loader + less-loader 两个 loader，所以 importLoaders 应该设置为 2
          ...getCssLoaders(2),
          {
            loader: 'less-loader',
            options: {
              sourceMap: true,
            },
          },
        ],
      },
      {
        test: /\.scss$/,
        use: [
          ...getCssLoaders(2),
          {
            loader: 'sass-loader',
            options: { sourceMap: true },
          },
        ],
      },
    ],
  },
};
```

#### 处理图片和字体

一般来说我们的项目在开发的时候会使用一些图片来测试效果，正式上线再替换成 CDN 而不是使用 webpack 打包的本地图片。处理文件的常用 loader 有俩，`file-loader` 和 `url-loader`，`file-loader` 用于解析导入的文件为发布时的 url， 并将文件输出到指定的位置，而后者是对前者的封装，提供了将低于阈值体积(下面就设置为 8192 个字节）的图片转换成 base64。我忽然想起以前腾讯的一个面试官问过这么个问题：使用 base64 有什么坏处吗？其实我觉得 base64 好处就是不用二次请求，坏处就是图片转 base64 体积反而会变大，变成原来的三分之四倍。

![base64](https://i.loli.net/2020/02/20/IouO1Kvt5wFAWVl.png)

```bash
yarn add url-loader -D
```

```javascript
const commonConfig: Configuration = {
  module: {
    rules: [
      {
        test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
        use: [
          {
            loader: 'url-loader',
            options: {
              // 图片低于 10k 会被转换成 base64 格式的 dataUrl
              limit: 10 * 1024,
              // [hash] 占位符和 [contenthash] 是相同的含义
              // 都是表示文件内容的 hash 值，默认是使用 md5 hash 算法
              name: '[name].[contenthash].[ext]',
              // 保存到 images 文件夹下面
              outputPath: 'images',
            },
          },
        ],
      },
      {
        test: /\.(ttf|woff|woff2|eot|otf)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              name: '[name]-[contenthash].[ext]',
              outputPath: 'fonts',
            },
          },
        ],
      },
    ],
  },
};
```

注意到我这里文件名中都插入了文件内容 hash 值，这样就可以解决**强缓存需要立即更新**的问题。

### sourcemap

| devtool                        | 构建速度 | 重新构建速度 | 生产环境 | 品质(quality)          |
| ------------------------------ | -------- | ------------ | -------- | ---------------------- |
| (none)                         | +++      | +++          | yes      | 打包后的代码           |
| eval                           | +++      | +++          | no       | 生成后的代码           |
| cheap-eval-source-map          | +        | ++           | no       | 转换过的代码（仅限行） |
| cheap-module-eval-source-map   | o        | ++           | no       | 原始源代码（仅限行）   |
| eval-source-map                | --       | +            | no       | 原始源代码             |
| cheap-source-map               | +        | o            | yes      | 转换过的代码（仅限行） |
| cheap-module-source-map        | o        | -            | yes      | 原始源代码（仅限行）   |
| inline-cheap-source-map        | +        | o            | no       | 转换过的代码（仅限行） |
| inline-cheap-module-source-map | o        | -            | no       | 原始源代码（仅限行）   |
| source-map                     | --       | --           | yes      | 原始源代码             |
| inline-source-map              | --       | --           | no       | 原始源代码             |
| hidden-source-map              | --       | --           | yes      | 原始源代码             |
| nosources-source-map           | --       | --           | yes      | 无源代码内容           |

> `+++` 非常快速, `++` 快速, `+` 比较快, `o` 中等, `-` 比较慢, `--` 慢

sourcemap 是现在前端界很多工具必不可缺的一个功能，webpack，TypeScript，babel，power-assert 等转换代码的工具都要提供 sourcemap 功能，源代码被压缩，混淆，polyfill，没有 sourcemap，根本没办法调试定位问题。

考虑到编译速度，调式友好性，我选择 `eval-source-map`，如果用户在打包时觉得慢，而且能够忍受没有列号，可以考虑调成 `cheap-eval-source-map`。

我们修改 `webpack.dev.ts` 的 devtool 为 `eval-source-map`：

```javascript
// webpack.dev.ts
import commonConfig from './webpack.common';

const devConfig = merge(commonConfig, {
  devtool: 'eval-source-map',
});
```

这里顺便提一下 webpack 插件 [error-overlay-webpack-plugin](https://github.com/smooth-code/error-overlay-webpack-plugin)，它提供了和 create-react-app 一样的错误遮罩：

![error overlay](https://raw.githubusercontent.com/smooth-code/error-overlay-webpack-plugin/master/docs/example.png)

但是它有一个限制就是不能使用任何一种基于 `eval` 的 sourcemap，感兴趣的读者可以尝试以下。

### 热更新

我们前面给 devServer 添加了 [webpack-hot-middleware](https://github.com/webpack-contrib/webpack-hot-middleware) 中间件，参考它的文档我们需要先添加 webpack 插件`webpack.HotModuleReplacementPlugin`：

```javascript
// webpack.dev.ts
import { HotModuleReplacementPlugin, NamedModulesPlugin } from 'webpack';

const devConfig = merge(commonConfig, {
  plugins: [new HotModuleReplacementPlugin()],
});
```

还要添加 `'webpack-hot-middleware/client'` 热更新补丁到我们的 bundle，加入 entry 数组即可：

```javascript
// webpack.common.ts
import { __DEV__, hmrPath } from '../env';


const commonConfig: Configuration = {
    entry: [resolvePath(projectRoot, './src/index.tsx')],
};

if (__DEV__) {
    (commonConfig.entry as string[]).unshift(`webpack-hot-middleware/client?path=${hmrPath}`);
}
```

通过在 entry 后面加 `queryString` 的方式可以让我们配置一些选项，它是怎么实现的呢？查看 `'webpack-hot-middleware/client'` 源码可以看到，webpack 会将 `queryString` 作为全局变量注入这个文件：

![entry query](https://i.loli.net/2020/02/18/h1njS2olHADUV8R.png)

其实到这我们也就支持了 CSS 的热更新（style-loader 实现了热更新接口），如果要支持 react 组件的热更新我们还需要配置 [react-hot-loader](https://github.com/gaearon/react-hot-loader) ，配置它之前我们先来优化我们的 babel 配置。

### babel 配置优化

前面我们在前面只配置了一个 `@babel/preset-typescript` 插件用于编译 TypeScript，其实还有很多可以优化的点。

#### @babel/preset-env

在 babel 中，**preset 表示 plugin 的集合**，`@babel/preset-env` 可以让 babel 根据我们配置的 browserslist 只添加需要转换的语法和 polyfill。

安装 `@babel/preset-env`：

```bash
yarn add @babel/preset-env -D
```

#### @babel/plugin-transform-runtime

我们知道默认情况下， babel 在编译每一个模块的时候在需要的时候会插入一些辅助函数例如 `_extend`，每一个需要的模块都会生成这个辅助函数会造成没必要的代码膨胀，`@babel/plugin-transform-runtime` 这个插件会将所有的辅助函数都从 `@babel/runtime` 导入，来减少代码体积。

```bash
yarn add @babel/plugin-transform-runtime -D
```

#### @babel/preset-react

虽然 `@babel/preset-typescript` 就能转换 tsx 成 js 代码，但是 `@babel/preset-react` 还集成了一些针对 react 项目的实用的插件。

`@babel/preset-react` 默认会开启下面这些插件:

- [@babel/plugin-syntax-jsx](https://babeljs.io/docs/en/babel-plugin-syntax-jsx)
- [@babel/plugin-transform-react-jsx](https://babeljs.io/docs/en/babel-plugin-transform-react-jsx)
- [@babel/plugin-transform-react-display-name](https://babeljs.io/docs/en/babel-plugin-transform-react-display-name)

如果设置了 `development: true` 还会开启:

- [@babel/plugin-transform-react-jsx-self](https://babeljs.io/docs/en/babel-plugin-transform-react-jsx-self)
- [@babel/plugin-transform-react-jsx-source](https://babeljs.io/docs/en/babel-plugin-transform-react-jsx-source)

安装依赖 `@babel/preset-react`：

```bash
yarn add @babel/preset-react -D
```

#### react-hot-loader

为了实现组件的局部刷新，我们需要安装 `react-hot-loader` 这个 babel 插件。

```bash
yarn add react-hot-loader
```

这个插件不需要安装成 `devDependencies`，它在生产环境下不会被执行并且会确保它占用的体积最小。其实官方正在开发下一代的 react 热更新插件 [React Fast Refresh](https://github.com/facebook/react/issues/16604)，不过目前还不支持 webpack。

为了看到测试效果，我们安装 react 全家桶并且调整一下 `src` 文件夹下的默认内容：

```bash
yarn add react react-dom react-router-dom
yarn add @types/react @types/react-dom @types/react-router-dom -D
```

`react` 是框架核心接口，`react-dom` 负责挂载我们的 react 组件到真实的 DOM 上， `react-dom-router` 是实现了 `react-router` 接口的 web 平台的路由库。

让 `react-hot-loader` 接管我们的 react 根组件，其实这个 hot 函数就是一个 **hoc** 嘛：

```javascript
// App.ts
import React from 'react';
import { hot } from 'react-hot-loader/root';

import './App.scss';

const App = () => {
  return (
    <div className="app">
      <h2 className="title">react typescript boilerplate</h2>
    </div>
  );
};

export default hot(App);
```

在 webpack entry 加入热更新补丁：

```javascript
const commonConfig: Configuration = {
  entry: ['react-hot-loader/patch', resolvePath(projectRoot, './src/index.tsx')],
};
```

官方文档提到如果需要支持 `react hooks` 的热更新，我们还需要安装 `@hot-loader/react-dom`，使用它来替换默认的 `react-dom` 来添加一些额外的热更新特性，为了替换 `react-dom` 我们需要配置 webpack alias：

```javascript
// webpack.common.ts
module.exports = {
  resolve: {
    alias: {
      'react-dom': '@hot-loader/react-dom',
    },
  },
};
```

结合前面提到 babel 插件，最终修改 `babel.config.js` 成：

```javascript
const envPreset = [
  '@babel/preset-env',
  {
    // 只导入需要的 polyfill
    useBuiltIns: 'usage',
    // 指定 corejs 版本
    corejs: 3,
    // 禁用模块化方案转换
    modules: false,
  },
];

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['@babel/preset-typescript', envPreset],
    plugins: ['@babel/plugin-transform-runtime'],
    env: {
      // 开发环境配置
      development: {
        presets: [['@babel/preset-react', { development: true }]],
        plugins: ['react-hot-loader/babel'],
      },
      // 生产环境配置
      production: {
        presets: ['@babel/preset-react'],
        plugins: [
          '@babel/plugin-transform-react-constant-elements',
          '@babel/plugin-transform-react-inline-elements',
        ],
      },
    },
  };
};
```

注意到我们生产环境下还安装了两个插件进行生产环境的优化：

```bash
yarn add @babel/plugin-transform-react-constant-elements @babel/plugin-transform-react-inline-elements -D
```

`@babel/plugin-transform-react-constant-elements` 的作用是像下面样将函数组件中的变量提升到函数外来避免每次重新调用函数组件重复声明和没必要的垃圾回收：

```javascript
const Hr = () => {
  return <hr className="hr" />;
};

// 转换成

const _ref = <hr className="hr" />;

const Hr = () => {
  return _ref;
};
```

`@babel/plugin-transform-react-inline-elements` 的作用读者可以参考 react 的这个 issue：[Optimizing Compiler: Inline ReactElements](https://github.com/facebook/react/issues/3228)。

## 生产环境优化

### 添加版权声明

这个直接用 webpack 内置的 `BannerPlugin` 即可:

```javascript
import { BannerPlugin } from 'webpack';

const mergedConfig = merge(commonConfig, {
  mode: 'production',
  plugins: [
    new BannerPlugin({
      raw: true,
      banner: `/** @preserve Powered by react-typescript-boilerplate (https://github.com/tjx666/react-typescript-boilerplate) */`,
    }),
  ],
});
```

![copyright](https://i.loli.net/2020/02/20/DusmAYnTV2JL4Xv.png)

需要注意的是我们在版权声明的注释中加了 `@preserve` 标记，我们后面会使用 `terser` 在生产环境构建时压缩代码，压缩代码时会去掉所有注释，除了一些包含特殊标记的注释，例如我们添加的 `@preserve`。

### CSS 拆分

如果 CSS 是包含在我们打包的 JS bundle 中那会导致最后体积很大，严重情况下访问首页会造成短暂的白屏。拆分 CSS 我们直接使用 [mini-css-extract-plugin](https://github.com/webpack-contrib/mini-css-extract-plugin)：

```bash
yarn add mini-css-extract-plugin -D
```

修改生产环境配置：

```javascript
// webpack.prod.ts
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

const prodConfig = merge(commonConfig, {
  mode: 'production',
  plugins: [
    new MiniCssExtractPlugin({
      // 文件名中插入文件内容的 hash 值
      filename: 'css/[name].[contenthash].css',
      chunkFilename: 'css/[id].[contenthash].css',
      ignoreOrder: false,
    }),
  ],
});
```

[mini-css-extract-plugin](https://github.com/webpack-contrib/mini-css-extract-plugin) 还提供了 `mini-css-extract-plugin.loader`，它不能和 `style-loader` 共存，所以我们修改 `webpack.common.ts` 的配置使得开发环境下使用 `style-loader` 生产环境下使用 `mini-css-extract-plugin.loader`：

```javascript
import { loader as MiniCssExtractLoader } from 'mini-css-extract-plugin';
import { __DEV__ } from '../env';

function getCssLoaders(importLoaders: number) {
  return [
    __DEV__ ? 'style-loader' : MiniCssExtractLoader,
    {
      loader: 'css-loader',
      options: {
        modules: false,
        sourceMap: true,
        importLoaders,
      },
    },
    {
      loader: 'postcss-loader',
      options: { sourceMap: true },
    },
  ];
}
```

### 代码压缩

#### JavaScript 压缩

网上很多教程在讲 webpack 压缩代码的时候都是使用 [uglifyjs-webpack-plugin](https://github.com/webpack-contrib/uglifyjs-webpack-plugin)，其实这个仓库早就放弃维护了，而且它不支持 ES6 语法，webpack 的核心开发者 [evilebottnawi](https://github.com/evilebottnawi) 都转向维护 [terser-webpack-plugin](https://github.com/webpack-contrib/terser-webpack-plugin) 了。我们使用 [terser-webpack-plugin](https://github.com/webpack-contrib/terser-webpack-plugin) 在生产环境对代码进行压缩，并且我们可以利用 webpack4 新增的 [tree-shaking](https://www.webpackjs.com/guides/tree-shaking/) 去除代码中的死代码，进一步减小 bundle 体积：

```bash
yarn add terser-webpack-plugin @types/terser-webpack-plugin -D
```

treeshake 需要在 `package.json` 中配置 `sideEffects` 字段，详情可以阅读官方文档：[Tree Shaking](https://webpack.js.org/guides/tree-shaking/)。

#### CSS 压缩

压缩 CSS 使用 [optimize-css-assets-webpack-plugin](https://github.com/NMFR/optimize-css-assets-webpack-plugin)：

```bash
yarn add optimize-css-assets-webpack-plugin @types/optimize-css-assets-webpack-plugin -D
```

修改 `webpack.prod.ts`：

```javascript
import TerserPlugin from 'terser-webpack-plugin';
import OptimizeCSSAssetsPlugin from 'optimize-css-assets-webpack-plugin';

const prodConfig = merge(commonConfig, {
  mode: 'production',
  optimization: {
    // 使用 minimizer 而不是默认的 uglifyJS
    minimize: true,
    // 两个 minimizer：TerserPlugin 和 OptimizeCSSAssetsPlugin
    minimizer: [new TerserPlugin({ extractComments: false }), new OptimizeCSSAssetsPlugin()],
  },
});
```

### 构建分析

我们添加一些 webpack 插件用来进行构建分析

#### 时间统计

![speed measure](https://i.loli.net/2020/02/19/c1vdoqsT34WCSHX.png)

我们使用 [speed-measure-webpack-plugin](https://github.com/stephencookdev/speed-measure-webpack-plugin) 对打包时间进行统计：

```bash
yarn add speed-measure-webpack-plugin -D
```

项目进行到这，我们终于碰到第一个没有 TypeScript 类型声明文件的库了，新建 `scripts/typings/index.d.ts` 文件，因为需要编写的类型很少，`index.d.ts` 就作为一个全局声明文件，在其中添加 `speed-measure-webpack-plugin` 的外部模块声明：

```javascript
// scripts/typings/index.d.ts
declare module 'speed-measure-webpack-plugin' {
    import { Configuration, Plugin } from 'webpack';

    // 查看官方文档，需要哪些选项就声明哪些选项就行
   // 可以看出 TypeScript 是非常灵活的
    interface SpeedMeasurePluginOptions {
        disable: boolean;
        outputFormat: 'json' | 'human' | 'humanVerbose' | ((outputObj: object) => void);
        outputTarget: string | ((outputObj: string) => void);
        pluginNames: object;
        granularLoaderData: boolean;
    }

    // 继承 Plugin 类, Plugin 类都有 apply 方法
    class SpeedMeasurePlugin extends Plugin {
        constructor(options?: Partial<SpeedMeasurePluginOptions>);
        wrap(webpackConfig: Configuration): Configuration;
    }

    export = SpeedMeasurePlugin;
}
```

修改 `webpack.prod.ts`：

```javascript
import SpeedMeasurePlugin from 'speed-measure-webpack-plugin';

const mergedConfig = merge(commonConfig, {
  // ...
});

const smp = new SpeedMeasurePlugin();
const prodConfig = smp.wrap(mergedConfig);
```

#### bundle 分析

![bundle analyze](https://i.loli.net/2020/02/19/Plifd7e9b2WOxsF.png)

```bash
yarn add webpack-bundle-analyzer @types/webpack-bundle-analyzer -D
```

我们添加一个 npm script 用于带 bundle 分析的构建，因为有些时候我们并不想打开一个浏览器去分析各个模块的大小和占比：

```javascript
"scripts": {
    "build": "cross-env-shell NODE_ENV=production ts-node --files -P scripts/tsconfig.json scripts/build",
    "build-analyze": "cross-env-shell NODE_ENV=production ts-node --files -P scripts/tsconfig.json scripts/build --analyze",
},
```

修改 `webpack.prod.ts`：

```javascript
// 添加
import { isAnalyze } from '../env';

if (isAnalyze) {
    mergedConfig.plugins!.push(new BundleAnalyzerPlugin());
}
```

这样当我们想看各个模块在 bundle 中的大小和占比的时候可以运行 `npm run build-analyze`，将会自动在浏览器中打开上图中的页面。

#### 准备 gzip 压缩版本

我们使用官方维护的 [compression-webpack-plugin](https://github.com/webpack-contrib/compression-webpack-plugin) 来为打包出来的各个文件准备 gzip 压缩版：

```bash
yarn add compression-webpack-plugin @types/compression-webpack-plugin -D
```

#### 跟踪 gzip 后的资源大小

![trace size](https://i.loli.net/2020/02/19/Oteqp9js3DPFrCS.png)

[size-plugin](https://github.com/GoogleChromeLabs/size-plugin) 是谷歌出品的一个显示 webpack 各个 chunk gzip 压缩后的体积大小以及相比于上一次的大小变化，上图中红框中的部分显示了我加了一句 log 之后 gzip 体积增加了 11B。

```bash
yarn add size-plugin -D
```

这个库有没有官方的 types 文件，我们添加 `size-plugin` 的外部模块声明：

```javascript
// scripts/typings/index.d.ts
declare module 'size-plugin' {
    import { Plugin } from 'webpack';

    interface SizePluginOptions {
        pattern: string;
        exclude: string;
        filename: string;
        publish: boolean;
        writeFile: boolean;
        stripHash: Function;
    }

    class SizePlugin extends Plugin {
        constructor(options?: Partial<SizePluginOptions>);
    }

    export = SizePlugin;
}
```

```javascript
// webpack.prod.ts
const mergedConfig = merge(commonConfig, {
  plugins: [
    // 不输出文件大小到磁盘
    new SizePlugin({ writeFile: false }),
  ],
});
```

## 总结

最近刚学会一个词 `TL; DR`，其实就是：

> Too long; didn't read.

其实我自己也是经常这样，哈哈。到这里已经有 1 万多字了，我估计应该没几个人会看到这。整个流程走下来我觉得是还是非常自然的，从开发环境到生产环境，从基本的配置到优化控制台显示，准备 gzip 压缩版本这些锦上添花的步骤。写这篇文章其实大部分的时间都花费在了查阅资料上，每一个插件我都尽量描述好它们的作用，如果有值得注意的地方我也会在代码注释中或者文字描述中提出来。我知道可能这篇文章对于一些基础比较差或者没怎么手动配置过 webpack 的同学压力比较大，很可能看不下去，这是正常的，我以前也是这样，不过我觉得你如果能够咬咬牙坚持读完，尽管很多地方看不懂，你总是会从中学到一些对你有用的东西，或者你也可以收藏下来当自字典来查。这篇文章很多配置并不是和 react+typescript 强耦合的，你加一个 vue-loader 不就可以正常使用 vue 来开发了吗？**更重要的是我希望一些读者可以从中学到探索精神，可怕不代表不可能，实践探索才能掌握真知。**

最后我们加上我们的构建脚本 `build.ts`：

```javascript
// scripts/build.ts
import webpack from 'webpack';

import prodConfig from './configs/webpack.prod';
import { isAnalyze } from './env';

const compiler = webpack(prodConfig);

compiler.run((error, stats) => {
  if (error) {
    console.error(error);
    return;
  }

  const prodStatsOpts = {
    preset: 'normal',
    modules: isAnalyze,
    colors: true,
  };

  console.log(stats.toString(prodStatsOpts));
});
```

![effect](https://i.loli.net/2020/02/19/ecaJjBtpHIEQoxC.gif)

我最近一直在忙毕业和找工作的事情，下一篇可能要在一个月后左右了。如果读者对文章中有哪些不理解的地方建议先去看下[源代码](https://github.com/tjx666/react-typescript-boilerplate)，还有问题的话可以在 [github issues](https://github.com/tjx666/react-typescript-boilerplate/issues) 或者发布平台的评论区向我提问，如果觉得本文对你有用，不妨赏颗 star 😁。

下一篇应该会讲述如何集成 `ant design`，`lodash` 等流行库并对它们的打包进行优化...

本文为原创内容，首发于[个人博客](http://www.lyreal666.com/)，转载请注明出处。
