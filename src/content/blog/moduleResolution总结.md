---
title: moduleResolution 总结
pubDatetime: 2023-04-14
modDatetime: 2023-04-15
featured: true
---

模块化之争的在 ESM 标准出来的时候已成为定局，这两年前端界也在进行 ESM 大迁移。关于 ESM 个人感觉可以聊的并不多，最近讨论最多的可能还是到底该不该用 default import 以及它俩互相转换的各种坑。前不久 TS 发布了 5.0，引入了新的 moduleResolution：`bundler`。官方文档对此的描述非常简单，阅读完本文，你会对它的产生有更深刻的理解。

## 什么是 moduleResolution

当我们讨论**模块化标准**（对应的英文术语 `module`），我们更多的是讨论一个模块是如何声明使用导入/导出的语法。具体来说：

- commonjs 使用 require 来导入，exports.xxx 来导出
- esm 使用 import/export，使用 import('xxx') 来动态导入模块

而**模块解析策略**（ moduleResolution）更多描述的是一个模块包括相对路径以及非相对路径（也就是第三方库，亦或者说 npm 包）是按照怎样的规则去查找的。相对路径没什么复杂的，不做讨论，本文主要聊聊第三方库的解析。

我们最熟悉的模块解析策略其实是 nodejs 的模块解析策略。第一次了解到还有别的模块解析策略还是在我刚学习 `typescript` 的时候。模块解析策略可以使用 `tsconfig.json` 的 `moduleResolution` 选项来配置，最早只支持两个值：`classic` 和 `node`。`node` 策略在 `typescript` 中又称之为`node10` 的解析策略。

### moduleResolution: classic

> You can use the [`moduleResolution`](https://www.typescriptlang.org/tsconfig#moduleResolution) option to specify the module resolution strategy. If not specified, the default is [Node](https://www.typescriptlang.org/docs/handbook/module-resolution.html#node) for `--module commonjs`, and [Classic](https://www.typescriptlang.org/docs/handbook/module-resolution.html#classic) otherwise (including when [`module`](https://www.typescriptlang.org/tsconfig#module) is set to `amd`, `system`, `umd`, `es2015`, `esnext`, etc.).

其实 `classic` 策略才是普通人最容易想到的模块解析策略，例如对于下面这个导入第三方依赖 `pkg` 的代码：

```typescript
// 文件：/root/src/folder/index.js
import "pkg";
```

会经历下面的步骤来查找 `pkg`:

1. `/root/src/folder/pkg.js`
2. `/root/src/pkg.js`
3. `/root/pkg.js`
4. `/pkg.js`

简单来说这种模块解析策略就是一直递归往上找同名文件，当前目录找不到同名文件就往父级目录找。不过这种策略目前前端界用得不多。

### moduleResolution: node

写过 nodejs 的人应当非常熟悉了这个模块解析策略了，这个模块解析策略其实就是 nodejs 解析模块的策略，其实也就是 `require.resolve` 实现。

```java
console.log(require.resolve('lodash'));
// => /xxx/node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/lodash.js
```

这也是各种前端构建工具如 `webpack`, `vite` 所采用的模块解析策略。这里没说 `rollup` 是因为`rollup` 默认没有内置模块解析策略，`rollup` 默认所有`npm` 包都是 `external` 的，你需要使用 node 模块解析策略的插件：[@rollup/plugin-node-resolve](https://github.com/rollup/plugins/tree/master/packages/node-resolve)。虽然说 `vite` 用的 nodejs 模块解析策略，但 `vite` 的实现并不完全和 nodejs 一致，其它工具也一样，你可以认为是对 nodejs 模块解析策略的扩展。不过如果说一个模块在 nodejs 中能正常解析，但它们解析不了，那肯定就算是 bug 了。

很多前端工具的 node 模块解析策略都不太一样：

- `vite` 用的是第三方库 [resolve.exports](https://github.com/lukeed/resolve.exports)
- `rollup` 在 [@rollup/plugin-node-resolve](https://github.com/rollup/plugins/tree/master/packages/node-resolve) 自己实现的
- `webpack` 用的 [enhanced-resolve](https://www.npmjs.com/package/enhanced-resolve)
- 不过还是 [ljharb](https://github.com/ljharb) 大佬的 [resolve](https://www.npmjs.com/package/resolve) 下载量最高，但有个很大的问题是[不支持 package.json 的 exports](https://github.com/browserify/resolve/issues/222)

其实也有框架想通过优化这个解析速度来优化构建速度的，例如 rspack 用的 rust 模块 [nodejs_resolver](https://github.com/web-infra-dev/nodejs_resolver)，其实也很好理解：

- 查找模块是构建过程的高频操作了，基本上每个文件都需要解析模块 id
- nodejs 的模块解析规则又比较复杂，并且是偏计算型的

用 rust 重写一遍大概率能得到比较可观的收益，[rspack 核心作者给出的数据是速度 enhance-resolve 的 15 倍](https://twitter.com/boshen_c/status/1625694791014187009)。

完整的 nodejs 解析策略可以看官方文档：[module#all-together](https://nodejs.org/api/modules.html#all-together)。

对于下面这段 nodejs 代码：

```javascript
// 文件 /root/src/index.js
require("pkg");
```

会按照下面的步骤来查找 `pkg`：

1. 同级目录的 `node_modules` 找同名的 js 文件： `/root/src/node_modules/pkg.js`
2. 同级目录 `node_modules` 里面找包含 `package.json` 的名为 `pkg` 文件夹：`/root/src/node_modules/pkg/package.json`
3. 同级目录 `node_modules` 里面找包含 `index.js` 的名为 `pkg` 文件夹 `/root/src/node_modules/pkg/index.js`
4. 还是找不到的话，那就往上一级目录重复前面的查找步骤
5. `/root/node_modules/pkg.js`
6. `/root/node_modules/pkg/package.json`
7. `/root/node_modules/pkg/index.js`

需要说明的是实际的查找过程还有很多细节我没写出来，例如解析 `package.json` 的 `main` 和 `exports` 字段等，这里只是为了大致描述 node 的解析过程。

其实上面的过程主要对应 nodejs 官方文档中的下面这段，不过要读懂官方文档还是需要一定的背景知识，有经验的读者还是建议完整阅读一下官方文档的。

```javascript
LOAD_NODE_MODULES(X, START)
1. let DIRS = NODE_MODULES_PATHS(START)
2. for each DIR in DIRS:
   a. LOAD_PACKAGE_EXPORTS(X, DIR)
   b. LOAD_AS_FILE(DIR/X)
   c. LOAD_AS_DIRECTORY(DIR/X)

NODE_MODULES_PATHS(START)
1. let PARTS = path split(START)
2. let I = count of PARTS - 1
3. let DIRS = []
4. while I >= 0,
   a. if PARTS[I] = "node_modules" CONTINUE
   b. DIR = path join(PARTS[0 .. I] + "node_modules")
   c. DIRS = DIR + DIRS
   d. let I = I - 1
5. return DIRS + GLOBAL_FOLDERS
```

相比于 `classic` 策略的区别在于：

- 递归查找的目录是 `node_modules`，不是父级文件夹
- 引入了 `package.json`，各种配置项尤其是后面会展开说的 `exports` 字段使得 node 模块解析策略的变得非常复杂
- 支持文件夹模块，也就是 `pkg/index.js`，文件夹中包含 index.js，这个文件夹就是一个模块。

其它需要注意的点：

- 在讨论模块解析策略时，查找的文件类型不重要。`css`, `png`，`html`, `wasm` 文件都可以视为一个模块。
- 在哪个工具中查找模块也不重要。 `tsc`, `nodejs`, `vite`, `esbuild`, `webpack`, `rspack` 都需要处理 import/require，都需要解析模块，都需要选择一个查找模块的策略，而绝大多数都是使用 node 策略
- node 的模块解析策略本身是不断变化的。例如说早期的 node 并不支持 `package.json` 的 `exports` 字段

### 调试模块解析

#### nodejs

当然最准确的还是看 nodejs 源码，debug nodejs 源码。菜鸡如我觉得太麻烦可以退而求其次 debug 一个实现 nodejs 解析策略的 npm package：

- [resolve.exports](https://github.com/lukeed/resolve.exports)
- [@rollup/plugin-node-resolve](https://github.com/rollup/plugins/tree/master/packages/node-resolve)
- [enhanced-resolve](https://www.npmjs.com/package/enhanced-resolve)
- [resolve](https://www.npmjs.com/package/resolve)

我写这篇博客时用来做各种测试的项目：[module-resolution](https://github.com/tjx666/module-resolution/tree/main)

#### typescript

tsc 有一个参数 `--traceResolution` 可以用来调试 tsc 查找 ts 文件的步骤。nodejs 没有找到类似的工具，有机会我来自己手动实现一遍 node 的解析策略，并输出每一步它在查找什么。tsc 虽然用的是 node 的解析策略，但是它还是有它自己的一些特殊性的，例如 ts 支持 `node_modules/types` 目录，package.json 支持 `types`, `typings`, `typesVersions` 等字段。

```typescript
import { pow } from "math/pow";

console.log(pow(1, 2));
```

```bash
❯ tsc --traceResolution
======== Resolving module 'math/pow' from '/Users/yutengjing/code/module-resolution/apps/commonjs-ts-app/src/index.ts'. ========
Explicitly specified module resolution kind: 'NodeNext'.
Resolving in CJS mode with conditions 'require', 'types', 'node'.
File '/Users/yutengjing/code/module-resolution/apps/commonjs-ts-app/src/package.json' does not exist according to earlier cached lookups.
File '/Users/yutengjing/code/module-resolution/apps/commonjs-ts-app/package.json' exists according to earlier cached lookups.
Loading module 'math/pow' from 'node_modules' folder, target file types: TypeScript, JavaScript, Declaration.
Directory '/Users/yutengjing/code/module-resolution/apps/commonjs-ts-app/src/node_modules' does not exist, skipping all lookups in it.
Found 'package.json' at '/Users/yutengjing/code/module-resolution/apps/commonjs-ts-app/node_modules/math/package.json'.
Entering conditional exports.
Matched 'exports' condition 'types'.
Using 'exports' subpath './*' with target './src/pow.ts'.
File '/Users/yutengjing/code/module-resolution/apps/commonjs-ts-app/node_modules/math/src/pow.ts' exists - use it as a name resolution result.
Resolved under condition 'types'.
Exiting conditional exports.
Resolving real path for '/Users/yutengjing/code/module-resolution/apps/commonjs-ts-app/node_modules/math/src/pow.ts', result '/Users/yutengjing/code/module-resolution/packages/math/src/pow.ts'.
======== Module name 'math/pow' was successfully resolved to '/Users/yutengjing/code/module-resolution/packages/math/src/pow.ts'. ========
```

## 模块主入口

`package.json` 是前端绕不开的东西，很多前端工具都支持通过 `package.json` 来写配置。而在 `node_modules` 下，一个包含 `package.json` 的文件夹可以视为一个模块，我们可以通过 `package.json`来定义这个模块在被另一个模块导入时的解析规则。

### main 字段

通过 main 字段来定义一个模块如何导出是目前最常见的做法了。拿全球下载量第一的 npm 包 lodash 来举例，[它的 package.json](https://npmview.vercel.app/lodash) 简化一下是这样的：

```json
{
  "name": "lodash",
  "version": "4.17.21",
  "main": "lodash.js"
}
```

当没有其它字段时，node 在解析不含子路径的模块时就会找到 `main` 字段对应的文件。

那如果模块包含子路径时会怎样处理呢？例如：

```javascript
const add = require("lodash/add");
```

```plaintext
lodash
├── add.js
├── fp
│   └── add.js
└── package.json
```

nodejs 会直接查找 `node_modules/lodash/add.js`，也就是说查找模块子路径非常简单粗暴。但如果你的项目不是像 `lodash` 那样把所有源码平铺到 `package.json` 同级，只使用 `main` 字段的情况下就没办法通过 `lodash/add` 来引用了。例如你把所有源码都丢到 `src` 目录，那你使用的时候就要写成：

```javascript
const add = require("lodash/src/add");
```

这也解释了我一直以来的一个困惑：为啥 `lodash` 要把所有源码平铺到 `package.json` 同级，每次打开它的 `github` 主页就要等很长时间，找 `package.json` 也找半天，很不方便。原因我想就是为了处理导入子路径。

### module 字段

为了解决某些库想同时提供 cjs 和 esm 两份 js 代码，我们可以使用 `module` 字段来指定 esm 版本的入口。例如 [redux](https://npmview.vercel.app/redux)，简化后的 package.json：

```json
{
  "name": "redux",
  "version": "4.2.1",
  "main": "lib/redux.js",
  "unpkg": "dist/redux.js",
  "module": "es/redux.js",
  "typings": "./index.d.ts",
  "files": ["dist", "lib", "es", "src", "index.d.ts"]
}
```

类似的字段还有很多，像上面写到的：

- `typings`：和 `types` 是一样的作用，用来给 tsc 说明模块的类型声明入口。它俩相比我更建议用 `typings:`
  - 首先 `types` 和另一个字段`type` 很接近，容易拼错。
  - 另外，我们 ts 项目里面的 .d.ts 一般也放 `typings` 文件夹
  - `ts-node` 查找 .d.ts 默认也只找 `typings` 目录。
- `unpkg`： 和 `jsdeliver`, `cdn`, `browser` 字段一样都是给 cdn 厂家用的，细节可以参考这个 issue: [[What about `cdn` entry?](https://github.com/stereobooster/package.json/issues/14#top)](https://github.com/stereobooster/package.json/issues/14)

### vite 如何选择模块入口

`vite` 使用 `esbuild` 将 ts 文件转成 js 文件，`esbuild` 在转换时会直接丢弃 ts 类型，并不会做类型检查，所以它不用管类型怎样解析，也就不用处理 `typings` 等字段。

当同时存在 `main` 和 `module`入口，各种构建工具尤其是 `rollup`, `vite` 这些基于 ESM 的都是优先使用 `module` 字段。那如果只有 1 个 `main` 字段，使用 `vite` 会发生啥呢？

首先 `vite` 打包情况分很多种：

- pre bundling: 使用 esbuild 预构建
- esm dev server: `vite` 内置插件 `vite:resolve` 处理模块 id 解析
- prod build: 生产环境构建，本质是 `rollup` + `vite:resolve` 插件 + `@rollup/plugin-commonjs` 插件

默认情况下，`vite` 预构建不管你第三方依赖支不支持 esm，都会给你打包。你可能会认为如果一个模块声明了 `"type": "module"`，`vite` 就不会给你预构建，但实际上 `vite` 会的，应该是考虑类似 `lodash-es` 这样模块数量特多的依赖不预构建的话 http 请求数就太多了。

如果你不想预构建，就得手动将依赖添加到预构建 exclude 列表。当把一个依赖添加到预构建 exclude 列表，`vite` 就不会对它进行 `commonjs` -> `esm` 转换，即便把 `main` 字段指向一个 `commonjs` 模块，`vite` 还是会傻傻的把那个模块当 esm 模块处理。

`vite` 和 `rollup` 都是通过插件系统来增加自身的能力，它们都是先通过 resolve 插件确定一个模块的最终文件路径，再下一步使用 `@rollup/plugin-commonjs` 插件在需要转换的情况下给你转成 esm。如果同时存在 esm 的入口和通用入口，都会优先使用 esm 入口。

一些人可能会认为 `main` 入口是给 `commonjs` 专用的，其实不是，`main` 入口也可以给 `esm` 用，它是一个通用入口。另一个类似的还有 `exports` 中的 `default` 字段。

```json
{
  "exports": {
    ".": {
      "import": {
        "development": "./src",
        "import": "./dist/es/index.mjs",
        "require": "./dist/cjs/index.cjs",
        "default": "./dist/es/index.mjs"
      }
    }
  }
}
```

### typesVersions

2023 年了，typescript 已然成为前端 er 的标配，即便你写的是 js，也能通过 jsdoc 充分感受的 ts 的强大和魅力。曾在知乎上看到有人吐槽说 ts 的类型系统过于复杂，在我看来，所谓的复杂其实某种程度上反映的是 TS 的强大和灵活。对于 ts，我现在最感到沮丧的反倒是它的性能，也不是说 tsc 构建性能，tsc 现在每个月还在投入精力优化的构建模式我也不是很感兴趣。我更希望优化的是编辑器代码提示的速度，稍微大点的项目有时能卡上好几秒才出提示。如果你没体过 vscode ts 代码提示的慢，可以试试在 VSCode 打开这个项目 <https://github.com/nicoespeon/abracadabra>，sematic token 的速度也不尽人意。写 vue 时经常肉眼可见一个变量从普通文本变成变量。最近一个消息挺有意思的，svelte 据说下一个大版本要从 ts 全面切回 js...

由于 ts 的流行，发布 npm 包的类型声明文件自然也成为了一个问题。目前主要有两种形式：

- 发布 types 包到 <https://github.com/DefinitelyTyped/DefinitelyTyped>，目前有 8000+ 包采用这个方式
- 发布 npm 包时捆绑类型文件

使用 pnpm 安装依赖的时候有时候会看到这个警告：

```bash
 WARN  deprecated @types/markdownlint@0.18.0: This is a stub types definition. markdownlint provides its own type definitions, so you do not need this installed.
```

其实就是说这个 `markdownlint` 已经自己带了类型声明文件，你不用手动安装 `@types/markdownlint` 了。

我们可以观察一下它的 `package.json` 看看它是如何通知包管理器去做出这个提示的：

```json
{
  "name": "@types/markdownlint",
  "version": "0.18.0",
  "typings": null,
  "description": "Stub TypeScript definitions entry for markdownlint, which provides its own types definitions",
  "main": "",
  "dependencies": {
    "markdownlint": "*"
  }
}
```

我猜可能是根据一个 types 包 `@types/xxx` 有没有 `xxx` 在 `dependencies` 中。

当我们发布一个 npm 包并且想要把类型声明文件一起发布的时候，一般情况下我们使用 `typings` 字段指向我们入口类型文件即可，例如 [moment](https://npmview.vercel.app/moment)：

```json
{
  "name": "moment",
  "version": "2.29.4",
  "main": "./moment.js",
  "typings": "./moment.d.ts"
}
```

#### 子路径导出类型声明

如果你选择使用 types 包发布类型声明，那问题倒简单，你只需要像 [@types/lodash](https://npmview.vercel.app/@types/lodash) 那样将类型声明文件按照导入的路径一样组织目录即可。

```plaintext
@types/lodash
├── add.d.ts
├── fp
│   └── add.d.ts
└── package.json
```

具体来说你导入语句是：

```javascript
import add from "lodash/add";
```

就需要存在 `node_modules/@types/lodash/add.d.ts` 这样的文件。如果你是像 `node_modules/@types/lodash/src/add.d.ts` 这样组织，把代码都放到 src 目录下，tsc 肯定是找不到的。

但如果你是选择类型声明和源码一起捆绑发布，还采用这种方式，把源码和类型声明混在一起，维护起来便会相当难受。

```plaintext
lodash
├── add.d.ts
├── add.js
├── fp
│   ├── add.d.ts
│   └── add.js
└── package.json
```

我们来看看 [unplugin-auto-import](https://npmview.vercel.app/unplugin-auto-import) 是怎样做的，首先它的目录结构是这样：

```plaintext
.
├── auto-imports.d.ts
├── dist
│   ├── astro.d.ts
│   ├── esbuild.d.ts
│   ├── index.d.ts
│   ├── nuxt.d.ts
│   ├── rollup.d.ts
│   ├── types.d.ts
│   ├── vite.d.ts
│   ├── webpack.d.ts
└── package.json
```

可以看到它的 .d.ts 没有平铺到 package.json 同级，那么现在问题就是怎样把类型声明从 `unplugin-auto-import/vite` 重定向到 `unplugin-auto-import/dist/vite.d.ts` 了。这就用到了 `typesVersions` 字段：

```json
{
  "name": "unplugin-auto-import",
  "version": "0.15.2",
  "types": "dist/index.d.ts",
  "typesVersions": {
    "*": {
      "*": ["./dist/*"]
    }
  }
}
```

- 外层的 `*` 表示 typescript 的版本范围是任意版本
- 内层的 `*` 表示任意子路径，例如 `unplugin-auto-import/vite` 就对应 `vite`
- 整体表示在任意版本的 typescript 下，查找 `unplugin-auto-import` 的类型时，将查找路径重定向到 dist 目录。更详细的解释可以看官方文档：[Version selection with`typesVersions`](https://www.typescriptlang.org/docs/handbook/declaration-files/publishing.html#version-selection-with-typesversions)。
- 注意我们这里 `./dist/*` 没有写扩展名，如果 `tsconfig.json` 设置的 `moduleResolution` 是 `node16` / `nodenext`，那就要改成 `./dist/*.d.ts`

其实 `typesVersions` 设计目的并不是用来处理子路径导出的，这一点从它的名字就可以看出来，它是用来解决同一个包在不同版本的 typescript 下使用不同的类型声明，例如我们看 `@types/node`：

```json
{
  "name": "@types/node",
  "version": "18.15.11",
  "typesVersions": {
    "<=4.8": {
      "*": ["ts4.8/*"]
    }
  }
}
```

也就是说当你使用的 `typescript` 版本不大于 4.8，`tsc` 就会使用 `@types/node/ts4.8` 文件夹内的类型说明，否则就用 `@types/node` 包根目录的类型声明：

```plaintext
// node_modules/@types/node
.
├── fs
│   └── promises.d.ts
├── fs.d.ts
├── package.json
├── ts4.8
│   ├── fs
│   │   └── promises.d.ts
│   ├── fs.d.ts
│   └── zlib.d.ts
└── zlib.d.ts
```

对于下面的导入语句：

```typescript
import fs from "node:fs/promises";
```

- 当 ts 版本为 4.7，会找到 `@types/node/ts4.8/fs/promises`
- 当 ts 版本为 5.0，会找到 `@types/node/fs/promises`

## exports

如果说 ESM 是模块化标准的最终解决方案，那么 `package.json` 的 `exports` 便是模块解析策略的最终解决方案。nodejs 官方文档[Modules: Packages](https://nodejs.org/dist/latest-v18.x/docs/api/packages.html) 章节其实大部分内容主要就是在讲 `exports`。换句话说就是花了一整个章节专门讲 `exports`。

### 主入口导出

类似 `main` 和 `module` 字段，我们可以使用下面的写法来配置一个模块没有写子路径时怎样导出的，也叫主入口：

```json
{
  "name": "xxx",
  "exports": {
    ".": "./index.js"
  }
}
```

- `exports` 中所有的路径都必须以 `.` 开头
- 可以把 `.` 简单理解为就是模块名

对于上面的例子，可以把对象简化为一个路径：

```json
{
  "name": "xxx",
  "exports": "./index.js"
}
```

例如 `import x from 'xxx'` 其实会被解析到 `node_modules/xxx/index.js`

### 子路径导出

你可以像下面这样定义子路径模块的映射规则：

```json
{
  "name": "es-module-package",
  "exports": {
    "./submodule.js": "./src/submodule.js"
  }
}
```

没有声明的子路径不能使用：

```javascript
// Loads ./node_modules/es-module-package/src/submodule.js
import submodule from "es-module-package/submodule.js";

// Throws ERR_PACKAGE_PATH_NOT_EXPORTED
import submodule from "es-module-package/private-module.js";
```

#### 导出多个子路径

例如我们重构 `lodash`，把所有的子路径模块，也就是 `package.json` 同级的的那一堆 js 模块放到 lib 文件夹。一种选择就是声明所有子路径：

```json
{
  "name": "lodash",
  "exports": {
    "./add": "./lib/add.js",
    "./multiply": "./lib/multiply.js",
    "...": "..."
  }
}
```

但是由于 lodash 的模块非常多，这样处理会导致 `package.json` 非常臃肿。

通过在子路径中使用通配符可以处理任意的嵌套子路径：

```json
{
  "name": "lodash",
  "exports": {
    "./*": "./lib/*.js"
  }
}
```

在 node 官方文档中：

- `exports` 可以写通配符 `*` 的路径例如 `./*` 在英文术语里叫 pattern，也就是模式
- `exports` 的 value `./lib/*.js` 的英文术语叫 target pattern，也就是目标模式

注意我们这里的 `*` 用的不是 glob 语法，在 glob 语法里面 `*` 表示任意的一层目录，但是在 exports pattern 中可以表示无限层任意路径。

要读懂这个映射规则，我们可以这样理解：

1. 给定一个模块 id `lodash/add`
2. 使用模块名 `lodash` 替换左侧的 pattern `./*` 中的 `.` ，得到 `lodash/*`
3. 把 pattern `lodash/*` 和模块 id `lodash/add` 做模式匹配，得到 `*` 的值就是 `add`
4. 将 target pattern `./lib/*.js` 中的 `*` 替换第三步得到的 `*` 的值得到 `./lib/add.js`，也就是相对于 `lodash` package 的相对路径
5. 把相对路径中的 `.` 替换为 `lodash` package 的绝对路径就能得到模块 id `lodash/add` 的绝对路径：`/xxx/node_modules/lodash/lib/add.js`

#### 禁止模块导出

你可以用通过将一个模块的 target pattern 设置为 `null` 来禁止某个子路径被另一个模块导入：

```json
{
  "name": "xxx",
  "exports": {
    "./forbidden": null
  }
}
```

```javascript
import "xxx/forbidden";
// 报错：Error [ERR_PACKAGE_PATH_NOT_EXPORTED]: Package subpath './hello' is not defined by "exports"
```

#### 扩展名和文件夹模块问题

需要注意的是 nodejs 在通过 exports 解析模块时是不会做自动添加扩展名的操作，例如你写成下面这样是有问题的：

```json
{
  "name": "lodash",
  "exports": {
    "./*": "./lib/*"
  }
}
```

使用上面的配置， `lodash/add` 会被解析到 `xxx/node_modules/lodash/add`，如果是在 nodejs esm 环境下，由于模块必须带扩展名，它显然是有问题的。

有些人可能认为在 cjs 下它就能正常工作了，因为 nodejs 在 cjs 情况下不需要写扩展名。但事实上也是不能工作的，exports 配置的映射规则已经到底了，也就是说不会处理扩展名，nodejs 会把 `xxx/node_modules/lodash/add` 当做一个绝对路径，而这个文件在文件系统并不存在。

也就是说下面这样的目录结构是不会正常工作的：

```plaintext
.
├── add
│   └── index.js
├── add.js
├── index.js
└── package.json
```

下面这样的目录结构反倒是正常工作的，其中 add 是一个没有 `.js` 扩展名的 js 代码文件。

```plaintext
.
├── add
├── index.js
└── package.json
```

如果你要处理文件夹模块，例如有一个组件库，需要将 `ui/xxx` 解析到 `node_modules/ui/dist/xxx/index.js`，那就需要写成：

```json
{
  "name": "ui",
  "exports": {
    // 写成 ./dist/* 是不行的，./dist/xxx 并不是一个 js 文件
    "./*": "./dist/*/index.js"
  }
}
```

#### 优先级

如果 `exports` 映射左侧的多个 pattern 都能匹配当前导入模块，最终会选择哪个呢?

当 package.json 为：

```json
{
  "name": "xxx",
  "export": {
    "./*": "./*",
    "./a/*": "./a/*.js",
    "./a/b": "./a/b.js",
    "./*.js": "./*.js"
  }
}
```

例如模块 id 是：`xxx/a/b`，其实最终会使用最具体的 `./a/b`。

> 短路匹配：从前到后匹配，当一个 key pattern 匹配成功，不管 target pattern 对应的文件能否找到都结束匹配

`./*`, `./a/*`, `./a/b` 都能匹配这个模块 id，显然短路匹配时是不合理的，因为如果采用短路匹配，那么就是采用 `./*` 这个规则了，我们就没办法去设置一个更具体的规则，也就是说 `./a/b` 这个规则就没用了。

再看另一个例子：

package.json:

```json
{
  "name": "xxx",
  "exports": {
    "./*": null,
    "./a/*/c": null,
    "./a/b/*": "./dist/hello.js"
  }
}
```

当模块 id 是 `xxx/a/b/c`，nodejs 会采用 `"./a/b/*"`。尴尬的是：目前主流的几个 node 模块解析库都不能正确解析这个例子，只有 webpack 用的 [enhanced-resolve](https://github.com/webpack/enhanced-resolve) 是可以解析的，下面三全跪：

- `vite` 内置插件 `vite:resolve` 使用的 `resolve.exports`：[resolve priority incorrectly](https://github.com/lukeed/resolve.exports/issues/29)
- `rollup` 官方插件 `@rollup/plugin-node-resolve`：[[node-resolve] \* in exports key can't correctly resolved](https://github.com/rollup/plugins/issues/1476)
- `rspack` 使用的 `nodejs-resolver`: [can't deal with priority correctly](https://github.com/web-infra-dev/nodejs_resolver/issues/177)

虽然 `enhanced-resolve` 可以处理上面给出的用例，但是它却处理不了下面这个例子：

```json
// issue: https://github.com/webpack/enhanced-resolve/issues/376
{
  "name": "xxx",
  "exports": {
    "./*/c": "./dist/hello.js"
  }
}
```

```javascript
import "xxx/a/b/c";
```

对于这个例子 `enhanced-resolve` 的结果是 `undefined`, 但是 nodejs 是可以正确解析到 `./dist/hello.js` 这个 target。可见 nodejs 的模块解析策略之复杂远超常人想象，以至于主流的解析库在处理一些特殊情况都或多或少有些 bug，尤其是在处理优先级的时候。

那么所谓的**更具体**到底是怎样的算法呢？参考 [enhanced-resolve 的源码](https://github.com/webpack/enhanced-resolve/blob/main/lib/util/entrypoints.js#L565) ，我们可以这样做：

1. 首先遍历所有 pattern，筛选出和模块 id 可以匹配的 pattern。在我们之前的例子就是 `./*`, `./a/*/c`, `./a/b/*`
2. 根据所有匹配的 pattern 构造一颗树，每一个节点对应 `pattern.split('/')` 的一个元素
3. 采用层级遍历顺序，优先取当前层非通配符的节点。这个例子中就在第二层把 `./*` pass 掉了，在第三层把 `./a/*/c` pass
4. 最终遍历到叶子节点的这条路径表示的 pattern 就是最特殊的 pattern，也就是 `./a/b/*`

![path tree](https://github.com/tjx666/blog/blob/main/images/module-resolution/path-tree.png?raw=true)

### 条件导出

为了能够在不同条件下使用不同的模块解析规则，你可以使用条件导出。

```json
{
  "exports": {
    ".": {
      // node-addons, node, import 这些 key 表示条件
      "node-addons": "./c-plus-native.node",
      "node": "./can-be-esm-or-cjs.js",
      "import": "./index-module.mjs",
      "require": "./index-require.cjs",
      "default": "./fallback-to-this-pattern.js"
    }
  }
}
```

上面这个例子演示的是 nodejs 内置支持的条件，导入模块 `xxx`：

- 在 nodejs esm 情况下，会使用 `"import": "./index-module.mjs"`
- 在 commonjs 情况下，会使用 `"require": "./index-require.cjs"`
- 在各种情况不满足的情况下，会使用 `"default": "./fallback-to-this-pattern.js"`

语法糖简写版本：

```json
{
  "exports": {
    "node-addons": "./c-plus-native.node",
    "node": "./can-be-esm-or-cjs.js",
    "import": "./index-module.mjs",
    "require": "./index-require.cjs",
    "default": "./fallback-to-this-pattern.js"
  }
}
```

自然而然，子路径导出也是支持条件导出的：

```json
{
  "exports": {
    "./feature.js": {
      "node": "./feature-node.js",
      "default": "./feature.js"
    }
  }
}
```

#### 优先级

条件导出的各个条件的优先级取决于它声明的顺序，越前面的越高。

换句话说它是从前到后短路匹配的，因此，在 node 使用 `commonjs` 情况下导入下面这个模块会报错：

```json
{
  "name": "xxx",
  "exports": {
    ".": {
      "default": null,
      "require": "./dist/hello.js"
    }
  }
}
```

这就要求我们使用条件导出的时候注意按照优先级顺序去编写，**将越特殊的条件放越前面**。

#### 自定义 condition

显然，nodejs 不可能内置支持所有条件，例如社区广泛使用的下列条件

- `"types"`
- `"deno"`
- `"browser"`
- `"react-native"`
- `"development"`
- `"production"`

如果你想让 nodejs 能够处理 `xxx` 条件，你可以在运行 node 指定 `conditions` 参数：

```json
{
  "name": "xxx",
  "exports": {
    ".": {
      "xxx": "./dist/hello.js",
      "require": null,
      "default": null
    }
  }
}
```

```bash
node --conditions=xxx apps/commonjs-app/index.js
```

注意这里条件 `xxx` 我放到了 `require` 前面了，因为 commonjs 下 `require` 条件也能匹配，所以为了 `xxx` 能优先匹配，需要将它放到 `require` 前面。

#### 内嵌条件

在 `monorepo` 越来越流行的今天，一个 `app` package 引用另一个在 `workspace` 中的 `library` package 的场景是非常常见的。如果直接使用 `library` package 对外发布时的 `exports` 规则（例如都指向 dist 文件夹的文件），就不方便通过修改 `library` src 下的源码来利用热更新。

```plaintext
monorepo-project
├── apps
│   └── app1
│       ├── package.json
│       ├── src
│       │   └── main.ts
│       └── vite.config.ts
└── packages
    └── library1
        ├── dist
        │   └── index.mjs // 发布时的代码
        ├── package.json
        └── src
            └── index.ts // 希望修改代码热更新能生效
```

为了实现 `vite` 开发环境下 `library` package 能热更新，我们一般会这样组织它的 `exports`：

```json
{
  "type": "module",
  "exports": {
    ".": {
      "import": {
        // 开发环境使用 src 下的源码，因此我们修改源码也能热更新
        "development": "./src",
        // 生产环境下，也就是在 app 运行 vite build 时使用打包编译的 dist
        "default": "./dist/es/index.mjs"
      }
    }
  },
  "publishConfig": {
    // 发布出去时我们不需要保留 development 这个 condition
    // 如果保留，会导致使用这个库的用户也走 src
    "exports": {
      ".": {
        "import": "./dist/es/index.mjs"
      }
    }
  }
}
```

在上面的例子中，首先我们使用了 `development` 条件，这个条件 `vite` 是[默认支持](https://vitejs.dev/config/shared-options.html#resolve-conditions)的。然后你会发现我们是在 `import` 条件中使用的 `development` 条件，也就是说 `exports` 是支持内嵌条件的。

值得注意的是我们使用了 `publishConfig` 配置来在 `npm publish` 时覆盖我们的 `exports` 配置。

并不是所有的字段都支持在 `publicConfig` 覆盖，例如 [npm](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#publishconfig) 不支持覆盖 `typesVersion`，但是我平时使用的 [pnpm](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#publishconfig) 是支持的。

#### types 条件

前面我们提到过可以使用 `typesVersions` 字段处理子路径模块的 typescript 类型，但是 `typesVersions` 正如它的名字所表达的是用来表示不同的版本下使用不同的类型。聪明的你应该很容易想到要是能统一用 `exports` 来管理类型就好了，`types`条件就是用来描述 typescript 类型的解析规则。

看一个实际的例子：

```json
{
  "name": "unplugin-auto-import",
  "version": "0.15.2",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "require": "./dist/index.cjs",
      "import": "./dist/index.js"
    },
    "./*": "./*",
    "./nuxt": {
      "types": "./dist/nuxt.d.ts",
      "require": "./dist/nuxt.cjs",
      "import": "./dist/nuxt.js"
    },
    "./astro": {
      "types": "./dist/astro.d.ts",
      "require": "./dist/astro.cjs",
      "import": "./dist/astro.js"
    },
    "./rollup": {
      "types": "./dist/rollup.d.ts",
      "require": "./dist/rollup.cjs",
      "import": "./dist/rollup.js"
    },
    "./types": {
      "types": "./dist/types.d.ts",
      "require": "./dist/types.cjs",
      "import": "./dist/types.js"
    },
    "./vite": {
      "types": "./dist/vite.d.ts",
      "require": "./dist/vite.cjs",
      "import": "./dist/vite.js"
    },
    "./webpack": {
      "types": "./dist/webpack.d.ts",
      "require": "./dist/webpack.cjs",
      "import": "./dist/webpack.js"
    },
    "./esbuild": {
      "types": "./dist/esbuild.d.ts",
      "require": "./dist/esbuild.cjs",
      "import": "./dist/esbuild.js"
    }
  },
  "main": "dist/index.cjs",
  "module": "dist/index.js",
  "types": "dist/index.d.ts",
  "typesVersions": {
    "*": {
      "*": ["./dist/*"]
    }
  }
}
```

注意点：

- `types` 条件应该放到其它条件也就是 `require` 和 `import` 前面
- 这里声明 `main`, `module`,`typesVersions` 是为了兼容性，在理想情况下，一个 `exports` 对象能解决所有问题，它们都可以不写。

#### 通用类型配置方法

typescript 在所有模块解析策略下查找类型时都支持相邻文件扩展名匹配。也就是说在其它配置不使用的情况下（例如不使用 `exports`，设置 `typings`）：

- 如果你是使用 `node` 策略，对于 `./dist/index.js`，只要存在相邻的 `./index/index.d.ts` 即可。

- 如果你使用的 `node16`/`nodenext` 策略，对于 `./dist/index.mjs` 需要存在 `./dist/index.d.mts`，对于 `./dist/index.cjs`，需要存在 `./dist/index.cts`。

#### 细说 typescript 中的 moduleResolution

最新的 `typescript` v5.1， `tsconfig.json` 的 `moduleResolution` 选项支持 5 个值：

- `classic`
- `node`
- `node16`
- `nodenext` 表示最新的 nodejs 模块解析策略，所以是兼容 `node16` 的
- `bundler`

`classic` 和 `node` 这两个从 ts 诞生支持就存在，但它们不支持 `exports`，后来新增的 `node16`, `nodenext`, `bundler` 都支持。

有意思的是 `typescript` 第一个支持 `exports` 配置模块类型解析策略是 `node16`，就是我不太理解为啥要叫 `node16`：

- nodejs 支持 `esm` 的最低版本是 v8.5.0
- nodejs 支持 `exports` 的最低版本是 v12.11

那叫 `node12` 不是刚好？

`node16` 策略主要是增加了 `esm` 的限制，例如文件必须带扩展名：

```typescript
// file: src/index,ts
import add from "./add";

add(1, 2);
```

会报错：

```plaintext
Relative import paths need explicit file extensions in EcmaScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean './add.js'?
```

需要注意的是：你要设置 `package.json` 中 `"type": "module"` 来明确开启 `esm`，否则即便你配置了 `"module": "ESNext"`，那些 `esm` 限制也不会生效。

#### 优先级

可以看到它同时配置了 `typesVersion` 和 `exports`，那 `tsc` 以哪个为标准呢？

首先这和当前配置的 `moduleResolution` 有关，如果是 node，那它根本不认识 `exports` 字段，所以使用的是 `typesVersions`。也因为这个原因，`unplugin-auto-import` 为了兼容用户使用的`moduleResolution` 是 node 的情况，还是配置了 `typesVersions`。

在使用 `node16` 之后新增的模块解析策略时，`tsc` 会优先取 `exports` 配置的类型解析规则，忽略 `typesVersions`。不过如果你不使用 `exports` 配置 ts 类型，`tsc` 还是支持`typesVersions` 的。需要注意的是这个时候 `typesVersions` 需要写扩展名：

```json
{
  "name": "math",
  "exports": {
    "./*": {
      "types": "./src/*.ts"
    }
  },
  // moduleResolution: node16 情况下，没写 exports, typesVersions 还是有用的
  "typesVersions": {
    "*": {
      "*": [
        // 如果是 moduleResolution: node，不用写扩展名 .ts
        "./src/*.ts"
      ]
    }
  }
}
```

#### bundler

`bundler` 是 TypeScript5.0 新增的一个模块解析策略，它是一个对现实妥协的产物，社区倒逼标准。为啥么这么说呢？因为最理想最标准的模块解析策略其实是 `node16` / `nodenext`：严格遵循 ESM 标准并且支持 `exports`。

现实情况：拿 `vite` 来举个例子，`vite` 宣称是一个基于 `ESM` 的前端开发工具，但是声明相对路径模块的时候却不要求写扩展名。

问题就出在现有的几个模块解析策略都不能完美适配 `vite` + `ts` + `esm` 开发场景：

- node：不支持 `exports`
- `node16` / `nodenext`: 强制要求使用相对路径模块时必须写扩展名

这就导致 `node16` / `nodenext` 这俩策略几乎没人用，用的最多的还是 node。

于是乎，ts5.0 新增了个新的模块解析策略：`bundler`。它的出现解决的最大痛点就是：可以让你使用 `exports` 声明类型的同时，使用相对路径模块可以不写扩展名。

#### nodenext

这个模块策略比 `bundler` 出的早，但是我放到最后说，因为它最复杂也不推荐使用。

目前前端界大部分库都不能正常的在 `moduleResolution: nodenext` 下使用，例如 [@vitejs/plugin-vue2](https://npmview.vercel.app/@vitejs/plugin-vue2)：

```json
{
  "name": "@vitejs/plugin-vue2",
  "version": "2.2.0",
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    }
  }
}
```

```typescript
// vite.config.mts
import vitePluginVue2 from "@vitejs/plugin-vue2";

vitePluginVue2();

// This expression is not callable.
// Type 'typeof import("/xxx/node_modules/.pnpm/@vitejs+plugin-vue2@2.2.0_vite@4.2.1_vue@2.7.14/node_modules/@vitejs/plugin-vue2/dist/index")' has no call signatures
```

详细的解释你可以看 ts 团队在 github 上的一个回复：[ts error when moduleResolution is "node16"](https://github.com/vitejs/vite-plugin-react/issues/104#issuecomment-1485806985)

我说下我自己的理解：`nodenext` 模块解析策略严格按照最新的 `nodejs` 模块解析算法判断一个 ts 文件是 `commonjs` 模块还是 esm 模块。也就是瞒住下面两个条件一个 js 模块会被 nodejs 视为 esm 模块：

1. 最近的 `package.json` 设置了 `"type": "module"`
2. 扩展名是 `.mjs`

上面的例子中，`vite.config.mts` 是一个 esm 模块，因此 `@vitejs/plugin-vue2` 会匹配到 `import` 条件，最终解析到 `/xxx/node_modules/@vitejs/plugin-vue2/dist/index.d.ts`。

但是这个文件会被识别为一个 `commonjs` 的 ts 模块，因为离它最近 `/xxx/@vitejs/plugin-vue2/package.json` 中没有声明 `"type": "module"`，它的扩展名也不是 `.d.mts`，所以它是一个 `commonjs` 的 ts 模块。从实际的报错信息来看，在 `moduleResolution` 是 `node16` / `nodenext` 情况下，**ts 是不支持对一个 commonjs 的 ts 模块使用默认导出**，即便是 `index.d.ts` 中存在 `export default` 也没有用。

实测如果你是使用**命名导出**是没问题的，例如：

```typescript
import { parseVueRequest } from "@vitejs/plugin-vue2";

parseVueRequest("");
```

如果你想正确配置，需要改成这样：

```json
{
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.mts",
        "default": "./dist/index.mjs"
      },
      "require": {
        "types": "./dist/index.d.cts",
        "default": "./dist/index.cjs"
      }
    }
  }
}
```

所以为啥没人愿意用 `node16` / `nodenext`：

1. 相对路径需要要扩展名
2. 写类型要写两套

尽管它是理论上最符合最新的 nodejs 模块解析规则的。

## 最佳实践

对于项目结构：

```plaintext
pkg
├── dist
│   ├── cjs
│   │   ├── index.cjs
│   │   └── utils.cjs
│   ├── es
│   │   ├── index.mjs
│   │   └── utils.mjs
│   └── types
│       ├── index.d.ts
│       └── utils.d.ts
├── package.json
├── src
│   ├── index.ts
│   └── utils.ts
├── tsconfig.json
└── vite.config.ts
```

### 理想情况

- 只发布 `esm` 模块，`package.json` 设置 `"type": "module"`
- 使用类似 vite/rollup 可以不写模块扩展名的打包工具
- `typescript` 版本 >= 5.0，`tsconfig.json` 设置`"moduleResolution": "bundler"`

`package.json`:

```json
{
  "type": "module",
  "exports": {
    // 新的第三方库大可不必考虑 cjs
    ".": {
      "types": "./src/index.ts",
      // 如果用的是 vite, 也可以直接写 "./src"，其实这也是 vite 和 node 标准不完全一致的地方
      // vite dev
      "development": "./src/index.ts",
      // 用 production 条件也行
      // vite build
      "default": "./dist/es/index.mjs"
    },
    "./*": {
      "types": "./src/*.ts",
      // 使用 vite 可以不写扩展名，可能是为了方便用户引用 css，图片等模块
      // 但是如果你是执行 node 脚本引用这个模块就会报错
      "development": "./src/*",
      "default": "./dist/es/*"
    }
  },
  "publishConfig": {
    // 发布出去的包都要写扩展名，因为这个库的使用环境可能要求写扩展名，例如 nodejs
    "exports": {
      ".": {
        "types": "./dist/types/index.d.ts",
        "import": "./dist/es/index.mjs"
      },
      "./*": {
        "types": "./dist/types/*.d.ts",
        "import": "./dist/es/*.mjs"
      }
    }
  }
}
```

其它字段像 `main`, `typings` 都不用写。

### 考虑兼容性

```json
{
  "type": "module",
  // 兼容不支持 exports 的打包器，例如 webpack4
  // 也是挺离谱的，最新版的 webpack4 现在下载量还是最新版的 webpack5 的接近 50 倍
  // https://github.com/webpack/webpack/issues/9509#issuecomment-1381896299
  "module": "./dist/es/index.mjs",
  "main": "./dist/cjs/index.cjs",
  "typings": "./dist/types/index.d.ts",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "development": "./src/index.ts",
      "default": "./dist/es/index.mjs"
    },
    "./*": {
      "types": "./src/*.ts",
      "development": "./src/*",
      "default": "./dist/es/*"
    }
  },
  // 兼容用户 ts moduleResolution: node
  // 开发环境使用源码目录 src 下的 .ts
  "typesVersions": {
    "*": {
      "*": ["./src/*"]
    }
  },
  "publishConfig": {
    "exports": {
      ".": {
        "types": "./dist/types/index.d.ts",
        "import": "./dist/es/index.mjs",
        "require": "./dist/cjs/index.cjs"
      },
      "./*": {
        "types": "./dist/types/*.d.ts",
        "import": "./dist/es/*.mjs",
        "require": "./dist/cjs/*.cjs"
      }
    },
    // 生产环境使用 .d.ts
    // npm 不支持覆盖 typesVersions，但是 pnpm 支持
    "typesVersions": {
      "*": {
        "*": ["./dist/types/*"]
      }
    }
  }
}
```

### exports 规范检测工具

- [publint](https://github.com/bluwy/publint) cli 工具，可以帮你检测出 target pattern 对应的文件是否存在，以及是否出现 `import` 条件却指向一个扩展名是 `.cjs` 的模块
- [Are the types wrong?](https://arethetypeswrong.github.io/) 在线网站，帮你检测一个 npm package 的 `typescript` 类型配置在各种 `moduleResolution` 是否会出现问题

## 总结

JS 在设计之初并没有模块这个概念，ESM 也才这两年正式落地，而模块解析策略随着`exports` 的出现有了统一的并且能够满足各种场景需求的标准。估计过个一两年很多新发布的 npm 包连`main` 字段都不写了。

- `exports` 是一个强大并且被各种前端工具广泛支持的模块解析标准，我们开发 npm 包时，应该使用 `exports`来管理它的解析规则
- `exports` 的解析规则较为复杂，社区的很多第三方实现或多或少有些 bug，尤其是和优先级相关的
- 对于很多不想写扩展名的 typescript 项目来说，应该使用 `bundler` 解析策略，这样的话第三方库就可以只写 `exports`，不写 `typesVersions`
- `typescript` 的很多设计都是对现实妥协的产物，除了 `bundler` 解析策略，再例如装饰器，早期的装饰器并没有进到 ECMAScript stage3 标准，TS 还是自己实现了一套。换句话说就是 typescript 在开发效率和 ECMAScript 标准之间在当时选择了开发效率。
