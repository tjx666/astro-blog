---
title: 搭建 react + typescript + ant design 开发环境
tags:
  - react
  - typescript
  - webpack
  - ant design
categories:
  - 前端
author: 余腾靖
pubDatetime: 2019-05-09 21:52:00
---

9102 年了，前端工程化发展在 nodejs 的基础上已经发展的非常完善了，各种前端构建辅助工具层出不穷。ES6 编译器 babel，css 辅助工具 postcss / sass / less，代码风格检测工具 eslint / prettier / stylelint，git 辅助工具 husky / lint-staged / commitizen / commitlint，自动化构建工具 webpack / gulp / grunt，测试工具 jest / mocha 等等。

这么多开发辅助工具每次写项目都去配置一遍那也太浪费时间了，自己维护一套模板有得时不时去更新。比较方便的配置开发环境还是使用 cli 或者一些热门的 boilerplate。本篇文章将以 react 官方维护的 cli 工具 create-react-app（简称 cra）为基础，以不 eject 的方式去配置 ant design，以及一些 cra 并没有内置的辅助工具。

<!-- more -->

## 初始化项目并添加 typescript 支持

Typescript 在近两年以惊人的速度被越来越多的开发者和开源项目所采用，我在使用 typescript 开发了一个项目之后也被 typescript 圈粉了。使用 typescript 开发带来的智能提示可以很大程度上杜绝手贱的发生，大多数情况我们都不需要查文档了，以及 typescript 中的一些 javascript 中没有的语法特性如枚举，使得项目组织可以非常的优雅。从 angular2 默认使用 typescript 开发，到如今 vue3 使用 typescript 重写也能看出 typescript 在前端界的地位将越来越重要。9102，除非是非常小的项目，否则上 typescript 绝对是明智之举。

我的开发环境：

> node: 10.15.3 LTS
>
> yarn: 1.15.2
>
> editor: visual studio code

cra 内置了 typescript 支持，只需要在初始化项目时指定 `--typescript` 参数即可。

```sh
npx create-react-app my-app --typescript

# or

yarn create react-app my-app --typescript
```

如果 cra 项目已经存在，先安装以下 ts types 依赖：

```sh
npm install --save typescript @types/node @types/react @types/react-dom @types/jest

# or

yarn add typescript @types/node @types/react @types/react-dom @types/jest
```

然后将 .js 结尾的文件重命名为 .tsx 即可。

更多关于在 cra 中使用 ts 的信息查看官方文档：[Adding TypeScript](https://facebook.github.io/create-react-app/docs/adding-typescript)

## 配置 ant design

### 安装 ant design 依赖

现在从 yarn 或 npm 安装并引入 antd。

```bash
yarn add antd
```

### 配置 ant design css 按需加载

配置 css 按需加载的方式有很多，归根到底就是修改 cra 的 webpack 配置。可以采用暴露 cra webpack 配置的方式，使用 `yarn eject` 命令即可在项目根目录下暴露出项目的 webpack 配置，配置保存在 config 文件夹下面。我记得 cra 早期版本 eject 之后暴露的配置是拆分成两份 `webpack.config.dev.js`，`webpack.config.prod.js`。最新的 cra 配置被合并到一个配置文件里面了，就一个配置文件，通过一个计算出的环境（development/producation）来动态生成 webpack 配置，这种方式我觉得配置起来更麻烦了，而且 eject 是不可逆的，采用 eject 来修改 webpack 配置需要慎重考虑。这种方式的好处就是 webpack 配置你可以直接修改，所以基本上没什么配置不能通过这种方式来加载。

这里我采用社区的 cra 配置解决方案：[react-app-rewired](https://github.com/timarney/react-app-rewired)。

引入 react-app-rewired 并修改 package.json 里的启动配置。由于新的 [react-app-rewired@2.x](https://github.com/timarney/react-app-rewired#alternatives) 版本的关系，你还需要安装 [customize-cra](https://github.com/arackaf/customize-cra)。

```sh
yarn add react-app-rewired customize-cra
```

```diff
/* package.json */
"scripts": {
-   "start": "react-scripts start",
+   "start": "react-app-rewired start",
-   "build": "react-scripts build",
+   "build": "react-app-rewired build",
-   "test": "react-scripts test",
+   "test": "react-app-rewired test",
 "eject": "react-scripts eject"
}
```

在项目根目录新建 `config` 文件夹，并在 package.json 中添加配置：

```json
"config-overrides-path": "config/config-overrides.js"
```

然后再在其中创建一个 `config-overrides.js` 用于修改默认配置。

```js
module.exports = function override(config, env) {
  // do stuff with the webpack config...
  return config;
};
```

### 使用 babel-plugin-import

[babel-plugin-import](https://github.com/ant-design/babel-plugin-import) 是一个用于按需加载组件代码和样式的 babel 插件（[原理](https://ant.design/docs/react/getting-started-cn#按需加载)），现在我们尝试安装它并修改 `config-overrides.js` 文件。

```diff
$ yarn add babel-plugin-import
+ const { override, fixBabelImports } = require('customize-cra');

- module.exports = function override(config, env) {
-   // do stuff with the webpack config...
-   return config;
- };
+ module.exports = override(
+   fixBabelImports('import', {
+     libraryName: 'antd',
+     libraryDirectory: 'es',
+     style: 'css',
+   }),
+ );
```

按下面的格式引入 ant design 组件。

```diff
  // src/App.js
  import React, { Component } from 'react';
- import Button from 'antd/lib/button';
+ import { Button } from 'antd';
  import './App.css';

  class App extends Component {
    render() {
      return (
        <div className="App">
          <Button type="primary">Button</Button>
        </div>
      );
    }
  }

  export default App;
```

最后重启 `yarn start` 访问页面，antd 组件的 js 和 css 代码都会按需加载，你在控制台也不会看到这样的[警告信息](https://zos.alipayobjects.com/rmsportal/vgcHJRVZFmPjAawwVoXK.png)。关于按需加载的原理和其他方式可以阅读[这里](https://ant.design/docs/react/getting-started-cn#按需加载)。

### 自定义主题

按照 [配置主题](https://ant.design/docs/react/customize-theme-cn) 的要求，自定义主题需要用到 less 变量覆盖功能。我们可以引入 `customize-cra` 中提供的 less 相关的函数 [addLessLoader](https://github.com/arackaf/customize-cra#addlessloaderloaderoptions) 来帮助加载 less 样式，同时修改 `config-overrides.js` 文件如下。

```bash
yarn add less less-loader
```

```diff
- const { override, fixBabelImports } = require('customize-cra');
+ const { override, fixBabelImports, addLessLoader } = require('customize-cra');

module.exports = override(
  fixBabelImports('import', {
    libraryName: 'antd',
    libraryDirectory: 'es',
-   style: 'css',
+   style: true,
  }),
+ addLessLoader({
+   javascriptEnabled: true,
+   modifyVars: { '@primary-color': '#1DA57A' },
+ }),
);
```

这里利用了 [less-loader](https://github.com/webpack/less-loader#less-options) 的 `modifyVars` 来进行主题配置，变量和其他配置方式可以参考 [配置主题](https://ant.design/docs/react/customize-theme-cn) 文档。

修改后重启 `yarn start`。

## 添加 [sass](https://www.sass.hk/) 支持

react-scripts@2.0.0 内置了 sass 支持，我们只需要安装 node-sass 依赖即可。

```sh
yarn add node-sass
```

然后就可以把项目模板中的 css 文件后缀改成 `.scss` 了。注意是 `.scss` 不是 `.sass` 哦，`.sass` 是 yml 的写法。

## 添加 [editorconfig](https://editorconfig.org/)

editorconfig 帮助我们约束多个开发者在同一个项目中代码风格，更重要的是它是跨编辑器，IDE 的。

在 vscode 中使用时可以安装 [EditorConfig for VS Code](https://github.com/editorconfig/editorconfig-vscode) 插件，然后 `ctrl + shift + p` 调出命令面板，输入 `editorconfig` 就可以看到 `Generator .editorconfig` 命令，选择命令后根目录就会生成初始的 `.editorconfig` 文件。

## 添加 nvmrc

在项目根目录创建文件 `.nvmrc`，再将 `node -v` 的结果复制进去就可以了。或者直接在项目根目录执行下面的命令。

```sh
node -v > .nvmrc
```

## 添加 .gitignore

cra 默认已经帮我们添加了 `.gitignore`，我们可以再添加一些比如 `src/assets/videos/*`。使用 vscode 的插件 [gitignore](https://marketplace.visualstudio.com/items?itemName=codezombiech.gitignore) 我们可以很方便的追加其它要忽略的文件，比如可以选择再添加 `VisualStudioCode`，`Windows` 的忽略文件。

![gitignore](https://i.loli.net/2019/05/11/5cd6c95ba52a1.gif)

## 配置 linters

### [ESLint](https://cn.eslint.org/)

ESLint 可以约束团队成员的代码风格，并且找出一些容易产生问题的代码。vscode 中安装 ESLint 后可以在 `PROBLEMS` 面板中看到 ESLint 提示的各种错误。ESLint 自带的 `autoFix` 也挺好用的，不过我一般会直接让 `prettier` 去在提交代码时格式化一遍。

cra 默认集成了 ESLint，要让编辑器正确提示 ESLint 错误，需要在项目根目录添加 `.eslintrc.json`。内容如下：

```json
{
  "extends": "react-app"
}
```

为了让 vscode 的 eslint 插件启用 typescript 支持，需要添加下面的配置到 `.vscode/settings.json` 中。

```json
{
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    { "language": "typescript", "autoFix": true },
    { "language": "typescriptreact", "autoFix": true }
  ]
}
```

### 集成 [prettier](https://prettier.io/)

> Prettier is an opinionated code formatter

opinionated 有武断，自以为是的意思，这里应该理解为 prettier 提供的配置很少，有点强制约定代码风格的意思。

使用 prettier 来格式化我们的代码建议在 git commit 时自动触发就好了，要给 git 设置钩子，我们可以使用 [husky](https://github.com/typicode/husky) 工具。

```sh
yarn add -D husky lint-staged prettier
```

[lint-staged](https://github.com/okonet/lint-staged) 是一个提高 lint 工具速度的工具，他的作用就和它的名字一样，lint-staged 可以让 lint 工具只 lint 保存在 stage 区的代码，从而加快 lint 速度。

接着配置 husky 和 lint-staged。在 package.json 中加入下面内容。

```json
"husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "src/**/*.{js,jsx,ts,tsx,json,css,scss,md}": [
      "prettier --single-quote --write",
      "git add"
    ]
  },
```

如果还需要配置 prettier，在项目根目录添加配置文件 .prettierrc.js。就像前面叙述的，prettier 可以配置的选项很少。内容如下：

```json
// prettier.config.js or .prettierrc.js
module.exports = {
    trailingComma: "es5",
    tabWidth: 4,
    semi: false,
    singleQuote: true
};
```

### 集成 [stylelint](https://stylelint.io/)

stylelint 我主要参考了 ant design 的配置。

```sh
yarn add -D stylelint
```

在根目录添加 stylelint 配置文件 `.stylelintrc.json` 或者 package 添加字段 "stylelint"，内容如下：

```json
{
  "extends": [
    "stylelint-config-standard",
    "stylelint-config-rational-order",
    "stylelint-config-prettier"
  ],
  "plugins": ["stylelint-order", "stylelint-declaration-block-no-ignored-properties"],
  "rules": {
    "comment-empty-line-before": null,
    "function-name-case": ["lower"],
    "no-invalid-double-slash-comments": null,
    "no-descending-specificity": null,
    "declaration-empty-line-before": null
  },
  "ignoreFiles": []
}
```

安装上面配置中使用的插件。

```sh
yarn add -D stylelint-config-standard stylelint-config-rational-order stylelint-config-prettier stylelint-order stylelint-declaration-block-no-ignored-properties
```

修改 lint-staged 配置为：

```json
"lint-staged": {
    "src/**/*.{js,jsx,ts,tsx,json,css,scss,md}": [
      "prettier --single-quote --write",
      "git add"
    ],
    "src/**/*.css": "stylelint",
    "src/**/*.scss": "stylelint --syntax=scss"
},
```

## 配置 commitlint

推荐一个可以实现规范的**提交说明**的工具：[commitizen/cz-cli](https://link.juejin.im/?target=https%3A%2F%2Fgithub.com%2Fcommitizen%2Fcz-cli)。全局安装该工具：

```sh
yarn global add commitizen
```

该工具的使用方式可以文章最后的提交代码时的 GIF 图。使用时输入 `git cz` 即可。

安装校验工具 @commitlint/cli。

```sh
yarn add -D @commitlint/cli
```

安装符合 Angular 风格的校验规则。

```sh
yarn add -D @commitlint/config-conventional
```

package.json 添加 "commitlint" 字段并设置：

```json
"commitlint": {
    "extends": [
      "@commitlint/config-conventional"
    ]
}
```

package.json 中 husky 配置修改为：

```json
"husky": {
        "hooks": {
            "pre-commit": "lint-staged",
            "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
        }
},
```

## 调整模板

这篇文章是我边配置我的一个项目边写的，下面部分有些内容是根据我这个项目技术栈来配置的，后面的内容自行斟酌按需配置。比如我打算用 react hooks 写项目，那么可以安装 react-use 这个工具库，不打算使用 react hooks 就不要安装了。

### 添加常用文件夹

项目根目录添加 docs 文件夹用来放文档。在 src 目录下添加 assets（存放资源），components（放组件），pages（页面组件），stores（状态管理工具相关的文件），models（typescript 类或者接口），utils，styles（全局样式主题等）这几个文件夹。assets 文件夹下面还有 images，videos 等，components 和 pages 目录下加入 index.tsx 用来导出所有 component 和 page。

### 删除无用文件和内容

public/manifest.json 是用来做 PWA 的，不搞 PWA 可以删掉。修改 public/index.html 中的首页标题。App.scss 中的内容可以全删了。src/logo.svg 可以删了。删除 App.tsx 的无用代码。cra 生成的默认 README.md 中的内容也全删了，加入自己的项目描述。

### 替换网站图标 favicon.ico

推荐使用 [iconfx](http://blog.sina.com.cn/s/blog_89a729a40102xuy3.html) 工具制作 ico 格式的图标。iconfx 使用方式很简单，打开软件就会用。可以直接将图片转成 ico 格式的图标。将制作好的图标替换 public/favicon.ico 即可设置好网站图标。

### 添加其它依赖

安装 react-router-dom，classnames，lodash，react-use，constate，faker.js 等工具库和对应的 types 文件，有些自带了类型声明的库就不用安装 types 了。像 react-use 和 constate 本身就是 typescript 编写的就不用安装对应的 types 了。安装 normalize.css 并在 index.tsx 直接导入。

做到这里，我的项目的开发环境算是配置好了，然后就可以进行业务开发了。

我的一个完全按照上述步骤配置的项目：[mini-shop](https://github.com/tjx666/mini-shop)。有需要可以直接去看我的配置，一般来说配置不会经常改动。

看看配置了上面那些工具提交代码时是啥样子的：

![commit](https://i.loli.net/2019/05/11/5cd6dc5b8c31f.gif)

本文为原创内容，首发于[个人博客](http://www.lyreal666.com)，转载请注明出处。

参考资料：

1. [create-react-app 官方文档](https://facebook.github.io/create-react-app/docs/getting-started)
2. [在 create-react-app 中使用 ant design](https://ant.design/docs/react/use-with-create-react-app-cn)
3. [Cz 工具集使用介绍 - 规范 Git 提交说明](https://juejin.im/post/5cc4694a6fb9a03238106eb9)
