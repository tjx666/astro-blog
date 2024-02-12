---
title: 从零开始配置 react + typescript（二）：linters 和 formatter
tags:
  - eslint
  - stylelint
  - lint-staged
  - commitlint
  - prettier
categories:
  - 前端
author: 余腾靖
pubDatetime: 2020-02-02 18:27:00
---

继 [从零开始配置 react + typescript（一）：dotfiles](https://lyreal666.com/%E4%BB%8E%E9%9B%B6%E5%BC%80%E5%A7%8B%E9%85%8D%E7%BD%AE-react-typescript%EF%BC%88%E4%B8%80%EF%BC%89%EF%BC%9Adotfiles/) 介绍了一些最先配置的 dotfiles，本篇将继续介绍 lint 工具 `eslint`，`stylelint`，代码格式化工具 `prettier`，用 `husky` + `lint-staged` 来实现每次 commit 时只 lint 修改过的代码，以及使用 `commitlint` 来规范化 commit message。

项目地址：[react-typescript-boilerplate](https://github.com/tjx666/react-typescript-boilerplate)

<!-- more -->

## eslint

> Find and fix problems in your JavaScript code

![eslint-react-hooks.png](https://i.loli.net/2020/02/03/aWBruH69SoGDET5.png)

其实社区有很多的 lint 工具，例如 `eslint`, `stylelint`, `tslint`, `htmllint`, `markdownlint` 等。lint 工具一方面可以帮助维护团队成员保持统一，良好的代码风格，另一面可以帮助我们检测出代码的坏味道，降低 bug 的产生的可能性，提高代码质量。需要指出的是：**lint 工具有一定的格式化能力，但是主要功能不是负责格式化代码，格式化代码应该交给专门的格式化工具。** 我们这个项目就将准备使用 `prettier` 进行代码格式化。

因为是打算使用 TypeScript 来编写 react，所以要选择一款支持 TypeScript 的 lint 工具，最流行的支持 TypeScript 的 lint 工具有俩，`tslint` 和 `eslint`。去年 2019 年 2 月份 `tslint` 团队就宣布了废弃 tslint，转而将维护一系列将 TypeScript 集成到 `ESLint` 的工具。具体可以看这个 [issue](https://github.com/palantir/tslint/issues/4534) 和这篇博客：[TSLint in 2019](https://medium.com/palantir/tslint-in-2019-1a144c2317a9)。

2020 年我觉得新项目没有任何理由还去选择 `tslint`，`eslint` 的 TypeScript 插件已经算是比较成熟了，虽然还是有挺多的 bug。

其实前端绝大多数构建工具都是用 node 编写模块来提供 API，有些也会提供命令行工具，本质上就是解析用户输入调用 node API，然后还可以通过配置文件来配置选项，集成插件，并且配置还可以通过 npm 包来共享。

`eslint` 也不例外，配置 `eslint` 建议使用 `eslint` 命令行工具提供的交互式配置生成器。很多包既可以全局安装，也可以本地安装，我们选择本地安装，因为你没办法确保别人开发这个项目的时候也全局安装了，而且这样还可以保证都是使用同一版本。

安装 `eslint`：

```bash
# -D 参数表示开发依赖
yarn add eslint -D
```

调用 `eslint` 自带的配置生成器：

```bash
npx eslint --init
```

`npx` 是 npm 5.2 自带的一个命令，`x` 就是和文件类型描述符的那个 `x` 一样表示 `execute` 执行嘛。如果本地安装了就会用本地的 `eslint`，没安装就去找全局的，全局再没有就在临时目录下载 `eslint`，用完就删。用起来比 npm scripts 还方便，传参数不用像 npm scripts 一样要在参数前加 `--`。执行上面的 `eslint` 初始化命令后会询问你一系列的问题，关于每一个问题的详细说明可以看一下这篇文章 [Setting up ESLINT in your JavaScript Project with VS Code](https://dev.to/devdammak/setting-up-eslint-in-your-javascript-project-with-vs-code-2amf)，这篇文章说的很细。

- How would you like to use ESLint?

  我们选择第三条：`To check syntax, find problems, and enforce code style`，选择其它几条就不会问我们是否选择 Google，Airbnb 还是 Standard 风格了

- What type of modules does your project use?

  我们选择 `JavaScript modules (import/export)`，包括 webpack 配置等 node 脚本我们都将使用 ts 来编写，所以选择 esm

- Which framework does your project use?

  显然选择 react

- Does your project use TypeScript?

  这一步一定要选 Y，只有告诉初始化器我们使用 TypeScript，它才会帮助我们配置好 TypeScript 的 ESLint parser，相关的 plugins， 以及其它配置

- Where does your code run?

  这里我们 browser 和 node 两个都选上，因为我们还要编写一些 node 代码

- How would you like to define a style for your project?

  我们选第一个 `Use a popular style guide`

- Which style guide do you want to follow?

  选择 Airbnb（爱彼迎）的代码风格

- What format do you want your config file to be in?

  我们选择最灵活的配置方式：javascript，虽然 js 格式的配置文件比 json 格式的更灵活，但是 js 格式没法使用 VSCode 提供的 JSON validate 功能。

- Would you like to install them now with npm?

  选择 Y，立即安装依赖。虽然我们用的是 yarn，不应该使用 npm 安装依赖，用 npm 安装依赖还会生成对我们没有用 `package-lock.json`。`package.lock.json` 和 `yarn.lock` 一样都是用来锁定依赖版本的。之所以这里选择立即安装依赖是因为你如果不立即安装依赖，后面你想再用 yarn 安装依赖的时还要去查一下安装哪几个依赖，我觉得很麻烦。

安装完之后，把 `node_modules`, `package-lock.json`, `yarn.lock` 都删掉，使用 yarn 重新安装依赖，再升级到最新版本：

```bash
# 安装依赖
yarn
# 升级到最新版本
yarn upgrade --latest
```

通过 eslint 自带的配置生成器我们生成了 `.eslintrc.js` ：

```javascript
// 格式化后的 .eslintrc.js
module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  extends: ['plugin:react/recommended', 'airbnb'],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  plugins: ['react', '@typescript-eslint'],
  rules: {},
};
```

可以看到相对于非 TypeScript 项目，使用 `@typescript-eslint/parser` 替换掉了默认的 parser，并添加了 `@typescript-eslint` 插件。

我们先做以下修改：

- 查看 [eslint-config-airbnb](https://www.npmjs.com/package/eslint-config-airbnb) 的说明，里面提到，如果要开启 react hooks 检查，需要添加 `"extends": "airbnb/hooks"` 到 `.eslintrc.js`

- 修改 `parserOptions.ecmaVersion` 为 2020，争做新时代的弄潮儿 😂

- 查看 [@typescript-eslint/eslint-plugin](https://www.npmjs.com/package/@typescript-eslint/eslint-plugin) 文档，里面提到我们可以通过添加 `extends: 'plugin:@typescript-eslint/recommended'`来开启它推荐的一些 rules。

- 为了让 `eslint-plugin-import` 能够正确解析 `ts`, `tsx`, `json` 后缀名，我们还需指定允许的后缀名，添加 `setttings` 字段，加入以下配置：

  ```javascript
  // .eslintrc.js
  {
      settings: {
          'import/resolver': {
              node: {
                  // 指定 eslint-plugin-import 解析的后缀名
                  extensions: ['.ts', '.tsx', '.js', '.json'],
              },
          },
      },
  }
  ```

- 为了让 `eslint-plugin-import` 能够正确解析 `tsconfig.json` 中的 `paths` 映射，我们需要安装 `eslint-import-resolver-typescript`：

  ```bash
  yarn add eslint-import-resolver-typescript -D
  ```

  修改 `settings` 字段：

  ```javascript
  // .eslintrc.js
  {
      settings: {
          'import/resolver': {
              typescript: {
                  // 配置 eslint-import-resolver-typescript 读取 tsconfig.json 的路径
                  // 目前用不着，先注释掉
                  // directory: [resolve('./src/tsconfig.json'), resolve('./scripts/tsconfig.json')],
              },
          },
      },
  }
  ```

添加一些社区中优秀的 eslint 插件：

```bash
yarn add eslint-plugin-eslint-comments eslint-plugin-promise eslint-plugin-unicorn -D
```

[eslint-plugin-eslint-comments](https://mysticatea.github.io/eslint-plugin-eslint-comments/) 用于 lint eslint 指令注释，例如检测出无用的 eslint-disable 注释。[eslint-plugin-promise](https://github.com/xjamundx/eslint-plugin-promise) 按照最佳实践 lint 你的 promise 代码，[eslint-plugin-unicorn](https://github.com/sindresorhus/eslint-plugin-unicorn) 是 [sindresorhus](https://github.com/sindresorhus) 大佬开发的一个 eslint 插件，提供了循环依赖检测，文件名大小写风格约束等非常实用的规则集合。

在我的使用中我发现，目前 `eslint-plugin-import` 和 `TypeScript` 搭配还是存在很多的 bug，其中的一个不能忍的 bug 就是`import/extensions` 这个规则不能正确处理文件后缀名：

![import-extension.png](https://i.loli.net/2020/02/02/iRsYKELCtXvyz9k.png)

去 [eslint-plugin-import](https://github.com/benmosher/eslint-plugin-import/issues?utf8=%E2%9C%93&q=is%3Aissue+is%3Aopen+import%2Fextensions+typescript) github issue 搜索关键字 `import/extensions typescript` 可以搜到很多相关的 issues。目前我采用的解决方案是修改 `import/extension` 的规则配置：

```javascript
'import/extensions': [
    '2,
    'ignorePackages',
    {
        ts: 'never',
        tsx: 'never',
        json: 'never',
        js: 'never'
    },
],
```

另外一个要提的 bug 就是这个 issue： [no-useless-constructor: Cannot read property 'body' of null](https://github.com/typescript-eslint/typescript-eslint/issues/420)，简单来说就是目前在 eslint 搭配 typescript 相关插件时，如果 `.d.ts` 声明文件中如果使用了 `constructor` 就会报这个错。例如：

```javascript
declare module 'size-plugin' {
    import { Plugin } from 'webpack';

    interface SizePluginOptions {
        writeFile?: boolean;
    }

    class SizePlugin extends Plugin {
        // 使用了 constructor 就报错：no-useless-constructor: Cannot read property 'body' of null
        constructor(options?: SizePluginOptions);
    }

    export = SizePlugin;
}
```

目前我采用的解决办法时是添加下面两个规则：

```javascript
rules: {
    'no-useless-constructor': 'off',
    '@typescript-eslint/no-useless-constructor': 'error',
},
```

针对 `.d.ts` 文件我们还需要要禁用一些规则，我们后续会在 `script` 文件夹中实现和 webpack 相关的 node 脚本，针对这个文件夹也调整一些规则：

```javascript
// .eslintrc.js
{
  overrides: [
        {
            files: ['**/*.d.ts'],
            rules: {
                'import/no-duplicates': OFF,
            },
        },
        {
            files: ['scripts/**/*.ts'],
            rules: {
                'import/no-extraneous-dependencies': OFF,
            },
        },
    ],
}
```

其它一些个人习惯的规则调整我就不提了，读者可以直接去看最终的配置：[.eslintrc.js](https://github.com/tjx666/react-typescript-boilerplate/blob/master/.eslintrc.js)。

目前这个配置还存在一些问题，例如很多 rules 会和 `prettier` 冲突，后面我们会一一解决这些问题。

## stylelint

> A mighty, modern linter that helps you avoid errors and enforce conventions in your styles

![stylelint](https://i.loli.net/2020/02/20/1X387zS5GgclEVo.png)

对于 stylelint，我一般都是直接参考 [ant design 的 stylint 配置](https://github.com/ant-design/ant-design/blob/master/.stylelintrc.json)。添加 `.stylelintrc.json` 到项目根路径，copy 过来简单修改一下，：

```javascript
// .stylelintrc.json
{
    "extends": [
        "stylelint-config-standard",
        "stylelint-config-rational-order",
        "stylelint-config-prettier"
    ],
    "plugins": [
        "stylelint-order",
        "stylelint-declaration-block-no-ignored-properties",
        "stylelint-scss"
    ],
    "rules": {
        "comment-empty-line-before": null,
        "declaration-empty-line-before": null,
        "function-name-case": "lower",
        "no-descending-specificity": null,
        "no-invalid-double-slash-comments": null
    },
     // 加 "**/typings/**/*" 的原因：https://github.com/stylelint/vscode-stylelint/issues/72
    "ignoreFiles": ["node_modules/**/*", "src/assets/**/*", "dist/**/*", "**/typings/**/*"]
}
```

`src/assets` 文件夹准备用来保存一些资源文件，例如第三方的 css 库，并不需要 lint。VSCode 的 stylelint 插件目前有个 bug，默认居然会 lint `.d.ts` 文件然后报错，所以我也添加了 `"**/typings/**/*"` 来忽略 `.d.ts` 文件：

![vscode stylint bug](https://i.loli.net/2020/02/20/H1g5SiBMrslOI7Q.png)

根据上面的配置文件，我们需要安装对应的 npm 包：

```bash
yarn add stylelint stylelint-config-standard stylelint-config-rational-order stylelint-config-prettier stylelint-order stylelint-declaration-block-no-ignored-properties stylelint-scss -D
```

和 eslint 一样，会与 prettier 存在冲突。

## prettier

> An opinionated code formatter

`opinionated` 可以理解为 `独断专行`，`自以为是`，其实就是说这个格式化器（formatter）不给用户做选择，就按照一套社区共识，最佳实践，最好看的的代码风格来格式化。具体表现就是提供的选项很少，我数了一下总共刚好 20 个选项。

首先我们得安装 `prettier`：

```bash
yarn add prettier -D
```

添加 .`prettierrc` 到项目根路径：

```javascript
{
    "trailingComma": "all",
    "tabWidth": 4,
    "semi": true,
    "singleQuote": true,
    "endOfLine": "auto",
    "printWidth": 100,
    "overrides": [
        {
            "files": "*.md",
            "options": {
                "tabWidth": 2
            }
        }
    ]
}
```

简单说明下一些选项这样配置的原因：

- `"trailingComma": "all"`，支持在函数参数中也插入逗号

  ![prettier-trailing-comma.png](https://i.loli.net/2020/02/03/EXeHDFAjzxTS1mi.png)

- `"semi": true`，个人习惯

- `"singleQuote": true,`，个人习惯，少敲一下 shift 难道不好吗？

- `"endOfLine": "auto"`，和 `editorconfig` 一样，按照操作系统默认的换行符来就行了

- `"printWidth": 100`，我觉得默认的最大行宽 80 太短了，浪费编辑器空间

- 之所以设置 markdown 文件格式化 `"tabWidth": 2`，是目前 prettier 在格式化 markdown 文件时，会在无序列表中插入多余的空格

  正常的无序列表应该格式化成：

  ```markdown
  - 1
  - 2
  - 3
  ```

  但是不配置 tabWidth 的话， prettier 会格式化成：

  ```
  -   1
  -   2
  -   3
  ```

  巨丑 😤

## linters 和 prettier 的冲突

这部分内容强烈建议先阅读 `prettier` 官方文档 [Integrating with Linters](https://prettier.io/docs/en/integrating-with-linters.html) 部分，官方文档往往是更新最及时，也是最权威的。

我们知道 lint 工具是用来检查代码风格的， prettier 是用来格式化代码的。想想看，如果 prettier 设置缩进为 4 个空格，而我们配置的 eslint 是要求缩进为 2 个空格，这肯定会导致我们格式化代码之后，eslint 会报缩进错误。

![conflict](https://i.loli.net/2020/02/20/Tx3Z1CXS4BLHqmF.png)

这部分内容就是为了解决 linters 规则和 prettier 的冲突问题，其实，原理很简单，就是禁用掉那些会和 prettier 格式化起冲突的规则。

安装 eslint 插件 `eslint-config-prettier`，这个插件会禁用所有会和 prettier 起冲突的规则。

```bash
yarn add eslint-config-prettier -D
```

添加 `'prettier'`，`'prettier/react'`，`'prettier/@typescript-eslint'` 到`extends` 配置：

```javascript
// .eslintrc.js
{
    extends: [
        'airbnb',
        'airbnb/hooks',
        'plugin:eslint-comments/recommended',
        'plugin:import/typescript',
        'plugin:react/recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:unicorn/recommended',
        'prettier',
        // 专门支持了 eslint-plugin-react
        'prettier/react',
        // 专门支持了 @typescript-eslint/eslint-plugin
        'prettier/@typescript-eslint',
    ],
}
```

这里注意要把 `prettier` 放最后面，因为这样才能让 `prettier` 有机会禁用前面所有的 `extends` 中配置的会起冲突的规则。

stylelint 也是一样，先安装插件 `stylelint-config-prettier`：

```bash
yarn add stylelint-config-prettier -D
```

再将 `"stylelint-config-prettier"` 添加到 `extends` 数组最后面：

```javascript
// .stylelintrc.json
{
    "extends": [
        "stylelint-config-standard",
        "stylelint-config-rational-order",
        "stylelint-config-prettier"
    ],
}
```

## lint-staged

> Run linters on git staged files

![git-stage.png](https://i.loli.net/2020/02/03/XKgBvifDF8Wch7R.png)

我们每次提交代码都要对代码先进行 lint 和格式化，确保团队的代码风格统一。为了达到每次 lint 和格式化时只处理我们修改了的代码，也就是保存在 git stage 区（暂存区）的代码。社区比较流行的方案有俩：

1. [pretty-quick](https://github.com/azz/pretty-quick)
2. [lint-staged](https://github.com/okonet/lint-staged)

我们选择使用 `lint-staged`，因为 `pretty-quick`功能单一，只是提供了 prettier 格式化 stage 区代码的功能，没法配 eslint 和 stylelint 使用，还不能通过配置文件来配置。lint-satged 更灵活，通过它我们可以同时配置 `eslint`，`stylelint`，`prettier`。

为了达到在我们每次 commit 的时候，都自动 lint 和格式化，我们需要给 git commit 挂个钩子，使用 [husky](https://github.com/typicode/husky) 可以很轻松的给 git 配置钩子。

先安装 husky 和 lint-staged：

```bash
yarn add husky lint-staged -D
```

在 package.json 配置 git commit 时的钩子操作:

```javascript
// package.json
{
    "husky": {
        "hooks": {
            // 在执行 git commit 调用 lint-staged 命令，lint-staged 会读取 package.json 中 lint-staged 的配置
            "pre-commit": "lint-staged"
        }
    },
}
```

再在 package.json 中 `"ling-staged"` 字段配置 lint-staged：

```javascript
// package.json
{
    "lint-staged": {
        // 对于 ts,tsx,js 文件调用 eslint
        "*.{ts,tsx,js}": [
            "eslint -c .eslintrc.js"
        ],
        // 对于 css,less,scss 文件调用 stylelint
        "*.{css,less,scss}": [
            "stylelint --config .stylelintrc.json"
        ],
        // prettier 支持很多类型文件的格式化
        "*.{ts,tsx,js,json,html,yml,css,less,scss,md}": [
            "prettier --write"
        ]
    },
}
```

prettier 的 --write 参数是干嘛用的呢？举个 🌰 来说，命令行调用 `prettier a.js` 默认只会输出格式化后的代码到控制台，不会修改原文件，加上 `--write` 才会将格式化后的代码写到 `a.js`。需要注意的一点是，可能你们看别人的教程或者一些项目中他们配置 `lint-staged` 还加了一个 `git add` 步骤，然后控制台会有警告：

> ⚠ Some of your tasks use `git add` command.

原因很简单：**lint-staged 从 V10 版本开始，任何被修改了的原 staged 区的文件都会被自动 git add**，所以我们不需要自己添加 git add 。

## commitlint

> `commitlint` helps your team adhering to a commit convention. By supporting npm-installed configurations it makes sharing of commit conventions easy.

[commitlint](https://commitlint.js.org/) 是一个用来 lint **commit message** 的工具。看官网的例子：

![commitlint](https://user-gold-cdn.xitu.io/2020/2/3/1700a62c2b0044e3?imageView2/0/w/1280/h/960/format/webp/ignore-error/1)

我知道有些人提交代码喜欢直接来三个点 `...`，这是很不好的习惯，这样你就完全没有利用到 commit message，很不利于项目管理。规范化的编写 commit message 有很多好处，可以方便我们检索提交历史，配合 [conventional-changelog](https://github.com/conventional-changelog/conventional-changelog) 直接生成 changelog，关联 github issue 等。

我们可以通过 `husky` + `commlint` 实现在 commit 的时候先检查 commit message 的规范性，如果不符合规范直接终止 commit。

安装需要的依赖：

```bash
yarn add @commitlint/cli @commitlint/config-conventional -D
```

[@commitlint/config-conventional](https://www.npmjs.com/package/@commitlint/config-conventional) 是 commitlint 官方推荐的一个 angular 风格的 commitlint 配置，提供了少量的 lint 规则，类似于 eslint 的 extend。

它默认支持的提交类型为：

```json
["build", "ci", "chore", "docs", "feat", "fix", "perf", "refactor", "revert", "style", "test"]
```

添加 commlint 的配置到项目根目录的 `.commitlintrc.js`：

```javascript
// .commitlintrc.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      // 比默认值多了个 deps，用于表示依赖升级，降级，新增等提交
      [
        'build',
        'ci',
        'chore',
        'deps',
        'docs',
        'feat',
        'fix',
        'perf',
        'refactor',
        'revert',
        'style',
        'test',
      ],
    ],
  },
};
```

添加 git `commit-msg` 钩子：

```javascript
// package.json
{
    "husky": {
        "hooks": {
            "pre-commit": "lint-staged",
            "commit-msg": "commitlint -c .commitlintrc.js -E HUSKY_GIT_PARAMS"
        }
    },
}
```

当调用 `commit-msg` 钩子的时候，环境变量 `HUSKY_GIT_PARAMS` 会被临时设置为保存 commit messsge 的文件的路径，然后 `commitlint` 就会去 lint 这个文件中的 commit message。

如果你想在命令行中交互式的编辑 commit message，可以了解一下 [commitizen](https://github.com/commitizen/cz-cli) ，我们这个项目就不配了，主要还是觉得要配置的话就要根据具体的业务去配，我们这个通用目的的模板项目就算了。我看了一下 `angular` 和 `vue-next` lint commit message 的做法，它们 commitlint 和 commitizen 俩都没配，只是在 git `commit-msg` 时调用了下 node 脚本校验 commit message 。

我们接着再配置自动生成 changelog，本地安装 `conventional-changelog-cli`：

```bash
yarn add conventional-changelog-cli -D
```

添加一个 npm script：

```javascript
// package.json
"scripts": {
    "changelog": "conventional-changelog -p angular -i CHANGELOG.md -s"
}
```

这样我们就可以通过 `npm run changelog` 生成 angular 风格的 changelog 了，`conventional-changelog` 会读取提交历史中 fix, feat 等 type 的 commit message 自动生成 changelog。

我们接着讨论一个使用了 commilint 后如何插入 emoji 的问题，我们知道 commit message 的格式是这样的：

```javascript
// 整行叫 header
<type>(<scope>): <subject>
// 空一行
<body>
// 空一行
<footer>

// 举个例子，某次提交的 commit message 是：feat(component): add component Navbar
// feat 是 type
// component 是 scope
// 'add component Navbar' 是 subject
// 这里没有 body 和 footer
```

我们知道 git emoji 的格式是：

```bash
:emoji_string:
```

如果你使用下面的带 emoji 的 commit message 提交：

```bash
git commit -m ':bug: fix: xxx'
```

commitlint 等工具在解析的时候应该是将第一个冒号之前的内容解析为 type，也就是说会把 emoji 左边冒号之前的内容解析为 type，那这样解析的话 type 就是空字符串了，所以使用上面的 commit message 提交会报错说你没有填写 type。

如果不修改 commilint 的 type 配置是无法通过 commitlint 的，解决办法之一是添加一个 type `:bug: fix`，但是这样的话 `conventional-changelog-cli` 不会将 commit mesage 提取到 changelog，它只认 `fix: xxx` 不认 `:bug: fix: xxx`。因此，在当前配置下，我们如果要插入 emoji，建议使用下图的方式，虽然我觉得这样不好看，但目前来说是比较折中的方案。

```bash
git commit -m "chore: :memo: improve docs and config json"
```

![commitlint git emoji](https://i.loli.net/2020/02/14/OcsuXR5CMaxlo41.png)

## second commit

添加几个常用用于 lint 的 npm scripts：

```javascript
{
    "scripts": {
        "lint": "yarn run lint-eslint && yarn run lint-stylelint",
        "lint-eslint": "eslint -c .eslintrc.js --ext .ts,.tsx,.js {src,scripts}/**/*.{ts,tsx,js}",
        "lint-stylelint": "stylelint --config .stylelintrc.json src/**/*.scss --syntax scss",
    }
}
```

可以看到我配置 eslint 和 stylelint 的 script 是用 `前缀-参数` 的形式，有些项目配置带参数的 script 名是用 `前缀:参数` 的形式，也就是用冒号做分隔符。我觉得那样不好，因为有些工具支持 `yarn:scriptName` 的形式来执行 npm scripts，例如 [concurrently](https://github.com/kimmobrunfeldt/concurrently)。

假设你有多个 npm scripts，分别是：`yarn:watch-node`，`yarn:watch-node`，`yarn:watch-css`，这个工具支持一条命令来并行执行它们：

```bash
concurrently yarn:watch-node yarn:watch-js yarn:watch-css
```

那你说如果用冒号来做分隔符，那要写就是：

```
concurrently yarn:watch:node yarn:watch:js yarn:watch:css
```

看起来就很迷，不了解的人可能还以为后面的冒号也是 `concurrently` 的参数呢，**所以表示带参数的 npm script 不要用冒号做分隔符**。

最后再来一发 `yarn upgarde --latest`，养成每天升级依赖的好习惯，避免以后同时升级很多依赖出了都搞不清楚是哪个依赖升级导致的。不过公司的项目千万别这样搞，容易导致出 bug 连续加班。

到这里，**从零开始配置 react + typescript** 系列第二篇算是差不多了，再一次提交代码：

```bash
git add -A
git commit -m 'build: integrate eslint, stylelint, prettier, lint-staged, commi
tlint'
# 上次 push 的时候使用 -u 参数关联了 master 分支和 github 远程仓库，这里就可以直接 push
git push
```

第二篇到此结束，[第三篇](https://lyreal666.com/%E4%BB%8E%E9%9B%B6%E5%BC%80%E5%A7%8B%E9%85%8D%E7%BD%AE-react-typescript%EF%BC%88%E4%B8%89%EF%BC%89%EF%BC%9Awebpack/)关于 webpack 配置的文章将是四篇中干货最多，估计也是最长的一篇。将介绍使用 `TypeScript` 来编写 `express + webpack devServer 中间件` 作为 devServer，集成一些实用和酷炫的 webpack 插件，优化 babel 配置，生产环境打包优化等内容。

要想了解更多细节，建议直接看源码，项目地址：[react-typescript-boilerplate](https://github.com/tjx666/react-typescript-boilerplate)。如果觉得本文对你有用，不妨赏颗 star 😁。对本文内容有疑问或者有什么改进的地方欢迎通过评论和邮件交流。

本文为原创内容，首发于[个人博客](http://www.lyreal666.com/)，转载请注明出处。
