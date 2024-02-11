---
title: 面向 lint 编程
description: 待补充描述
pubDatetime: 2023-06-13
---

## 何为 linter

Linter 泛指能够检测代码问题的工具，这些问题可能包括：

- 代码风格，代码格式是代码风格的一部分
- 逻辑 bug

![ESLint --init](https://github.com/tjx666/blog/blob/main/images/%E9%9D%A2%E5%90%91%20lint%20%E7%BC%96%E7%A8%8B/eslint-init.png)

常见的 linter：

- [eslint](https://github.com/eslint/eslint)
- [stylelint](https://github.com/stylelint/stylelint)
- [markdownlint](https://github.com/DavidAnson/markdownlint)
- [commitlint](https://github.com/conventional-changelog/commitlint)
- [code spell checker](https://github.com/streetsidesoftware/vscode-spell-checker)
- 小众的如
  - [zhlint](https://github.com/Jinjiang/zhlint)
  - [auto correct](https://github.com/huacnlee/autocorrect)
  - [publint](https://github.com/bluwy/publint)
  - [attw](https://github.com/arethetypeswrong/arethetypeswrong.github.io/tree/main/packages/cli)
- 不建议使用
  - [jshint](https://github.com/jshint/jshint) 已过时，建议迁移到 eslint
  - [tslint](https://github.com/palantir/tslint) 已废弃，建议迁移到 eslint + [typescript-eslint](https://github.com/typescript-eslint/typescript-eslint)

比较典型的，[prettier](https://github.com/prettier/prettier) 不是 linter，是 formatter。

## Linter 中常见概念解释

很多 lint 工具的设计都是类似的，以大家最熟悉的 ESLint 为例。下图是我们编写 Lint 工具插件常用的网站 [astexplorer](https://astexplorer.net/)，图中的一些标注对应了 ESLint 中的一些常见概念。

![astexplorer](https://github.com/tjx666/blog/blob/main/images/%E9%9D%A2%E5%90%91%20lint%20%E7%BC%96%E7%A8%8B/astexplorer.png)

### Parser

像 ESLint, Stylelint 这类 Lint 编程语言的 Linter，一般都需要通过 parser 将源码解析成 ast，然后在规则中遍历 ast 节点发现代码问题。同一个编程语言可以有很多不同的 parser，例如 js 有 espress, @babel/eslint-parser。不同的的编程语言那更是不同的 parser 了。

本文不对 ast 做过多的叙述，因为我也只是停留在会用的层面，没有系统学习过怎么写一个 ast Parser，就不班门弄斧了。

我们可以通过 `parser` 选项来设置 ESLint 的 parser。多数情况对于 js 以外的语言我们会用 `overrides` 来覆盖特定后缀名对应的文件使用别的 parser，例如；

```js
/** @type {import('eslint').Linter.Config} */
module.exports = {
  overrides: [
    // https://github.com/tjx666/eslint-config/blob/main/packages/basic/index.js#L59
    {
      files: ["*.{json,jsonc}"],
      parser: "jsonc-eslint-parser",
      // json 特定的规则
      rules: {},
    },
    // https://github.com/tjx666/eslint-config/blob/main/packages/vue/index.js#L11
    {
      files: ["*.vue"],
      parser: "vue-eslint-parser",
      env: {
        "vue/setup-compiler-macros": true,
      },
      parserOptions: {
        parser: "@typescript-eslint/parser",
      },
      rules: {},
    },
  ],
};
```

常见的 parser：

- [espree](https://github.com/eslint/espree) eslint 的默认 parser，支持解析进入 stable 阶段的 ECMAScript
- [@babel/eslint-parser](https://www.npmjs.com/package/@babel/eslint-parser) 支持 ES3 和实验性的 ECMAScript 语法
- [vue-eslint-parser](https://github.com/vuejs/vue-eslint-parser) 解析 vue sfc
- [eslint-plugin-jsonc](https://github.com/ota-meshi/eslint-plugin-jsonc) 解析 json/jsonc
- [@typescript-eslint/parser](https://github.com/typescript-eslint/typescript-eslint/tree/main/packages/parser) 解析 ts/tsx

这里就不得不夸一下日本老哥 [ota-meshi](https://github.com/ota-meshi)，它开发了很多 eslint 插件和 parser，而且回复 issue 贼快。他写的插件例如 eslint-plugin-vue 大多都有 playground, 做实验或者 reproduce 都很方便。

### configuration

自称 opinionated 的 prettier 仅有 20 个左右的选项，而 eslint 提供了丰富的选项，每个规则还可以有自己的 options。这也是有选人选择使用 ESLint 来格式化代码而不是 prettier 的原因。

#### ESLint 自身配置

![eslint define config](https://github.com/tjx666/blog/blob/main/images/%E9%9D%A2%E5%90%91%20lint%20%E7%BC%96%E7%A8%8B/eslint-define-config.png)

- .eslintrc 几乎所有的 eslint 可自定义的内容都可以在这个文件配置，支持多种格式，
  - json 好处在于可以借助 [json schema](https://github.com/microsoft/vscode-eslint/blob/c023aab96e56f7e1accf8c742a6c601e568bde1e/package-json-schema.json#L2) 很容易获取 IDE 提示，适合配置内容很少的场景
  - js 相比于 json，可编程性强多了，更灵活，还可以借助 npm 生态，代码复用能力强等，借助 jsdoc 和 [eslint-define-config](https://www.npmjs.com/package/eslint-define-config) 也可以获得 ide 提示
- .eslintignore 类似 `.gitignore`，可以指定一些 glob patterns 来忽略某些文件不要被 lint。一些更复杂的场景可以直接使用 .eslintrc 的 `ignorePatterns` 选项。所以其实项目中可以不需要这个文件，这里点名批评 prettier [不支持](https://github.com/prettier/prettier/issues/4708)使用 `.prettierrc` 配置文件来配置 `ignorePatterns`。

#### 共享配置

可以将一个 eslint 配置以 npm 包的形式共享，在 extends 中使用。这里列举一些当前比较流行的配置包：

- <https://github.com/airbnb/javascript> 应该是用户最多的，尤其是 react 用户
- <https://github.com/standard/eslint-config-standard>
- <https://github.com/antfu/eslint-config> 需要说明的是不能和 prettier 一起使用
- <https://github.com/google/eslint-config-google> 貌似已废弃
- <https://github.com/tjx666/eslint-config> 我自己封装的，建议同 prettier 一起使用

使用形式：

```js
module.exports = {
  // 包名为 @yutengjing/eslint-config-react
  extends: "@yutengjing/eslint-config-react",
  rules: {},
};
```

如果包名就是：

- `@scope/eslint-config`，可以简写为 `"extends": "@scope"`
- `eslint-config-xxx`，可以简写为 `"extends": "xxx"`

### Plugin

plugin 可以提供 rules 和 configs。例如我们看 [@typescript-eslint/eslint-plugin/src/index.ts](https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/src/index.ts):

```javascript
export = {
  rules,
  configs: {
    all,
    base,
    recommended,
    'eslint-recommended': eslintRecommended,
    'recommended-requiring-type-checking': recommendedRequiringTypeChecking,
    strict,
  },
};
```

而每个 config 其实就和我们平时配置 .eslintrc 导出的对象类型是一样的，例如 [plugin:@typescript-eslint/base](https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/src/configs/base.ts):

```js
export = {
  parser: '@typescript-eslint/parser',
  parserOptions: { sourceType: 'module' },
  plugins: ['@typescript-eslint'],
};
```

我们自己的配置优先级最高：

```js
// .eslintrc.js
module.exports = {
  root: true,
  // 插件提供的配置以 plugin: 开头
  extends: ["plugin:@typescript-eslint/base"],
  // 将会覆盖 plugin:@typescript-eslint/base 的 sourceType: 'module'
  parserOptions: { sourceType: "script" },
};
```

### Rule

ESLint 有很多[内置的规则](https://eslint.org/docs/latest/rules)，你也可以通过 eslint 插件增加更多的规则。

```js
module.exports = {
  plugins: ["unicorn"],
  rules: {
    // 内置的规则没有 scope
    "no-undef": 2,
    // 外部插件都有 scope
    // eslint-plugin-unicorn 的规则都以 unicorn 这个 scope 开头
    "unicorn/filename-case": ["error"],
  },
};
```

配置文件中 rules 对象类型：

```typescript
type Severity = 0 | 1 | 2;
type StringSeverity = "off" | "warn" | "error";

type RuleLevel = Severity | StringSeverity;
// 例如 'unicorn/xxx': ['error', option1, option2, ...option999]
type RuleLevelAndOptions<Options extends any[] = any[]> = Prepend<
  Partial<Options>,
  RuleLevel
>;

type RuleEntry<Options extends any[] = any[]> =
  | RuleLevel
  | RuleLevelAndOptions<Options>;

interface RulesRecord {
  [rule: string]: RuleEntry;
}
```

### documentation

ESLint 规则众多，我们怎样查看一个规则对应的文档呢？Google 确实是一种方法，如果是在 VSCode 中，我们可以直接通过 `quick fix` 快速打开规则对应的文档。

![documentation](https://github.com/tjx666/blog/blob/main/images/%E9%9D%A2%E5%90%91%20lint%20%E7%BC%96%E7%A8%8B/documentation.png)

一般来讲在编写 ESLint 插件时我们都会把所有的规则的文档都平铺到一个文件夹：

![documentation folder](https://github.com/tjx666/blog/blob/main/images/%E9%9D%A2%E5%90%91%20lint%20%E7%BC%96%E7%A8%8B/documentation-folder.png)

这样方便统一设置规则的文档：

```javascript
const fs = require("node:fs");
const path = require("node:path");

function getDocumentationUrl(filename) {
  const ruleName = path.basename(filename, ".js");
  return `https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/${ruleName}.md`;
}

function loadRule(ruleId) {
  const rule = require(`../rules/${ruleId}`);

  return {
    meta: {
      docs: {
        ...rule.meta.docs,
        // 统一设置规则的文档
        url: getDocumentationUrl(ruleId),
      },
    },
    create: rule.create,
  };
}

function loadRules() {
  return Object.fromEntries(
    fs
      .readdirSync(path.resolve(__dirname, "../rules"), { withFileTypes: true })
      .filter(file => file.name !== "index.js" && file.isFile())
      .map(file => {
        const ruleId = path.basename(file.name, ".js");
        return [ruleId, loadRule(ruleId)];
      })
  );
}
```

### Fix

eslint 可以使用 `--fix` 参数来对代码进行自动修复。这就有一些默认的约定：

- 如果是代码风格的修复，必须确保修复后代码和修复前逻辑是一样的，换个专业一点的词叫**安全的修复**
- 如果没有办法安全的修复，可以提供一些供 IDE 使用的手动修复

这里举个例子，eslint-unicorn 有个规则叫 [unicorn/prefer-at](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-at.md)：

```javascript
array[array.length - 1];
// 会被自动修复为
array.at(-1);
```

但是这其实是不安全的，例如下面的代码，[NodeList](https://developer.mozilla.org/zh-CN/docs/Web/API/NodeList) 在目前所有主流浏览器都没有实现 at 方法：

```javascript
// issue: https://github.com/sindresorhus/eslint-plugin-unicorn/issues/2098
parent?.childNodes[parent.childNodes.length - 1];
```

使用 IDE 手动修复的例子：

![editor suggestion](https://github.com/tjx666/blog/blob/main/images/%E9%9D%A2%E5%90%91%20lint%20%E7%BC%96%E7%A8%8B/editor-suggestion.png)

### [Disable](https://eslint.org/docs/latest/use/configure/rules#disabling-rules)

ESLint 的错误提示并不总是准确的，例如不支持自动修复的规则：[unicorn/prefer-dom-node-text-content](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-dom-node-text-content.md) 。这个规则希望我们使用 `textContent` 而不是 `innerText`，但这俩属性其实是有[区别](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-dom-node-text-content.md)的，innerText 属性会考虑子元素的样式，例如 br 标签换行。所以某些需要保留样式的情况你就要禁用这个规则。

```javascript
// eslint-disable-next-line unicorn/prefer-dom-node-text-content
this.$refs.cell.innerText = content ?? "";
```

如果一个 ESLint 规则每次 ESLint 报错都是需要禁用的情况，那其实它对我们没啥用，建议直接关了。例如：[no-new](https://eslint.org/docs/latest/rules/no-new)。多数情况我们使用 `new Constructor()` 没有对它赋值其实是故意的，例如：

```vue
new Vue({ el: '#app', render: (h) => h(App) })
```

建议使用 [eslint-plugin-eslint-comments](https://github.com/mysticatea/eslint-plugin-eslint-comments) 规范 disable 注释使用，例如检测没有用的 eslint disable 注释（有点像 @ts-expect-error），以及不允许禁用所有规则，必须声明禁用的规则是哪一条。

我们可以借助 VSCode 的 quick fix 快速的 disable，利用好工具能事半功倍。

### ESLint 基本工作原理

简单介绍 ESLint 在 Lint 一个文件时的流程：

1. 根据命令行参数，`.eslintrc` 配置文件，以及 IDE 的 ESLint 插件设置解析出这个文件对应的配置。
2. 遍历所有这个文件开启的规则，每个规则对应一个 js 对象。
   1. 读取规则的元信息 (meta)，包括文档链接，问题类型，是否支持 IDE 手动修复，选项的 JSON Schema 等
   2. 调用规则模块的 create 方法，并将这个文件的上下文对象 context 作为第一个参数。这个 context 包含源码，配置，`parserServices` 等其它等信息。`parserServices` 包含其它 parser 提供的用于遍历 ast 的 visitor 函数，例如 vue 文件可以使用使用 `eslint-vue-parser` 提供的 `context.parserServices.defineTemplateBodyVisitor` 来遍历 vue sfc template 中的节点。
   3. create 方法可以返回一个 `NodeListener` 用来遍历所有的 ast 节点
3. 在规则的 create 方法内，通过遍历节点发现代码满足某个条件后，你可以通过 `context.report(descriptor: Rule.ReportDescriptor)` 同步抛出一个问题的描述，其中包括
   1. message: 问题的描述信息
   2. node: 问题对应的代码节点
   3. fix: --fix 参数自动修复逻辑，类型是 `Fix | IterableIterator<Fix> | Fix[]`，fix 函数也可以是一个生成器函数
   4. suggest：IDE 手动修复逻辑
4. ESLint 收集到所有的规则 report 的 descriptors 后，默认情况会把 `warning` 和 `error` 级别的问题输出到控制台（开启 `--quiet`参数就只会输出 `error` 级别）。如果有 `error` 级别的问题，程序的退出码为 0 以外的数。当然如果是 VSCode ESLint 插件，会根据 lint 结果提供错误提示，文档链接，自动修复，手动修复等

## Lint Staged

为了统一团队代码风格，以及检测出潜在的问题，我们可以在使用 git 提交代码进行 lint 检查。每次对所有代码进行 Lint 是不现实的，例如我现在维护的一个公司项目 30 多万行代码，每次都 lint 那就太慢了。而且如果每次全量 lint 会有另一个问题：某次调整 eslint 规则，新增了一个 `error` 级别的规则，全量 lint 那要修复的文件可能有上百个，错误上千。

[lint-taged](https://github.com/okonet/lint-staged) 可以帮助我们只 lint 我们此次修改了的代码，每次只 lint 我们改动了的代码，可以让我们渐进式的处理代码中的 lint 问题。

### Github Hooks

本质上是保存在 `.git/hooks` 的一堆钩子脚本。

我们一般会使用 `pre-commit` 这个 git hook 触发 Lint Staged。

### 为啥么不用 husky 而用 simple-git-hooks

简单即是美。忘了从哪个版本开始 [husky](https://www.npmjs.com/package/husky) 开始强制用户必须存在 `.husky` 文件夹，这我不能忍，我就想设置一个钩子一行代码还要占用本来就很长的一级目录。貌似也是因为这个原因，尤雨溪在开发 vue3 的时候就把 husky 换成了 [yorkie](https://www.npmjs.com/package/yorkie)，不过最新代码已经换成 [simple-git-hook](https://www.npmjs.com/package/simple-git-hooks) 了

#### 为啥么我的 lint-staged 不会被触发？

在维护公司基建过程中，发现部分同事本地不会触发 `pre-commit` 钩子。原因是我们那个项目是由 husky 迁移到 simple-git-hooks 的，使用 husky 的项目都会把 git 钩子目录设置为 `.husky` 目录。如果我们在仓库中运行命令 `git config --list`，我们可以看到有这么一行：

```bash
core.hookspath=.husky
```

解决方法就是将 hooks 目录设置为默认的文件夹：

```bash
git config core.hooksPath .git/hooks/
```

#### 为啥么每次修改配置 git hook 都需要执行 `simple-git-hooks`

因为需要将 package.json 中最新的 git hooks 配置写入到 `.git/hooks`。

### Lint Changed

目前开源界对于 Lint 触发时机有两大主流做法：

1. 本地 git 提交时触发 lint staged
2. 不在本地做，直接在 ci 上做 lint

我目前主要维护的公司项目两个都会走，本地好办，直接上 lint-staged，但是 ci 上 lint-staged 很难用，放一张图你就明白了：

![lint changed](https://github.com/tjx666/blog/blob/main/images/%E9%9D%A2%E5%90%91%20lint%20%E7%BC%96%E7%A8%8B/ci-lint-changed.png)

总结下问题就是：

- 没有处理 ci 环境输出，这点 vite 就做的很好，在 ci 上不会因为进度动画输出一堆重复冗余的输出
- 文件名太长，有时候某次 pr 修改的文件特多，上百个，这个时候如果 lint 出错了，会在控制台输出一堆文件名

下面是我优化后的效果：

![lint changed fixed](https://github.com/tjx666/blog/blob/main/images/%E9%9D%A2%E5%90%91%20lint%20%E7%BC%96%E7%A8%8B/lint-changed-fixed.png)

通过自己实现了一个脚本读取 lint-staged 配置文件来实现 lint changed，优化代码：

```typescript
import { createRequire } from "node:module";

import boxen from "boxen";
import consola from "consola";
import type { ExecaError } from "execa";
import { execa } from "execa";
import micromatch from "micromatch";
import c from "picocolors";

import { execaWithOutput } from "./utils";

const changeTarget = process.env.CHANGE_TARGET || "master";

const require = createRequire(import.meta.url);
const lintStagedConfig = require("../lint-staged.config") as Record<
  string,
  (files: string[]) => string
>;

async function getChangedFiles() {
  const { stdout } = await execa("git", [
    "diff",
    "--name-only",
    // 排除删除了的文件
    "--diff-filter=d",
    changeTarget,
    "HEAD",
  ]);
  return stdout.trim().split(/\r?\n/);
}

const changedFiles = await getChangedFiles();

const lintTasks = Object.entries(lintStagedConfig).map(
  async ([pattern, taskCreator]) => {
    const expandedPattern = `**/${pattern}`;
    const matchedFiles = micromatch(changedFiles, expandedPattern, {});
    const command = taskCreator(matchedFiles).trim();

    if (command === (globalThis as any).__lintStagedSkipMessage__) {
      consola.info(c.cyan(`skip lint for pattern: ${c.green(pattern)}`));
      return;
    }

    const doubleQuoteIndex = command.indexOf('"');
    const [exe, ...args] = command
      .slice(0, doubleQuoteIndex)
      .trim()
      .split(/\s+/);
    const pathList = command
      .slice(doubleQuoteIndex)
      .split(/(?<=")\s+(?=")/)
      // 去除引号
      .map(pathWithQuote => pathWithQuote.slice(1, -1));
    const filesTooMany = pathList.length > 10;
    const pathListStr = filesTooMany
      ? `<...${pathList.length}files>`
      : pathList.join(" ");
    const commandStr = `${[exe, ...args, pathListStr].join(" ")}`;
    console.log(c.dim(`$ ${commandStr}\n`));
    try {
      await execaWithOutput(exe, [...args, ...pathList], {
        outputCommand: false,
      });
    } catch (_error) {
      const error = _error as unknown as ExecaError;
      let { message, command, exitCode } = error;
      if (filesTooMany) {
        message = message.replace(command, c.red(commandStr));
      }
      consola.error(message);

      const fixCommand = `pnpm lint:fix ${changeTarget}`;
      // 第二行需要留一个空格来实现换行
      const fixMessage = `${c.red("Lint 失败，请尝试在本地运行下面的修复命令！")}\n
${c.magenta(fixCommand)}`;
      console.log(
        boxen(fixMessage, {
          padding: 1,
          margin: 1,
          align: "center",
          borderColor: "yellow",
          borderStyle: "round",
        })
      );

      process.exit(exitCode);
    }
  }
);

// 只 lint 不修复，也就是只读不写不会有并发问题
await Promise.all(lintTasks);

consola.success("Lint 通过");
```

预计不就后我会开源一个 npm 包用来放一些我编写的非常实用的前端工程化脚本。

## VSCode 中 Lint 工具的使用

### 必备插件

- eslint
- stylelint
- markdownlint
- prettier
- [better-colorizer](https://github.com/tjx666/better-colorizer) 我写的一个 VSCode 扩展支持对 git-error file 进行色彩高亮
- [VSCode FE Helper](https://github.com/tjx666/vscode-fe-helper) 我写的一个工具集，其中支持很多 lint 相关的有用命令
  - `FE Helper: Force Prettier`
  - `FE Helper: Force ESLint`
  - `FE Helper: Force Stylelint`
  - `FE Helper: Force Markdownlint`
  - `FE Helper: Show Active File ESLint Performance`
  - `FE Helper: Show Active File ESLint Config`
  - `FE Helper: Show Active File Stylelint Config`

### 推荐配置项

```json
{
  // 保存文件时触发
  "editor.codeActionsOnSave": {
    // 自动导入缺失的模块
    "source.addMissingImports": false,
    // 各种 lint 的自动修复
    "source.fixAll.eslint": true,
    "source.fixAll.stylelint": true,
    "source.fixAll.markdownlint": true
  },
  // 保存文件时自动格式化
  "editor.formatOnSave": true,
  // 使用系统环境的 node 而不是 VSCode 自带的 node，统一团队成员 eslint node 版本
  "eslint.runtime": "node",
  // 开启后在 source control 面板的菜单项就有下面截图中 `Commit Staged(No Verify)`，可以跳过 pre-commit 时的 lint verify
  "git.allowNoVerifyCommit": true,
  // 指定各种编程语言使用的格式化器
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
  // 简化写法目前优先级没用户级别设置优先级高，可能导致保存时不会触发 prettier
  // 具体查看：https://github.com/microsoft/vscode/issues/168411
  // "[javascript][javascriptreact][typescript][typescriptreact][vue][json][jsonc][html][css][less][markdown][xml][yaml][svg]": {
  //     "editor.defaultFormatter": "esbenp.prettier-vscode"
  // }
}
```

![commit no verify](https://github.com/tjx666/blog/blob/main/images/%E9%9D%A2%E5%90%91%20lint%20%E7%BC%96%E7%A8%8B/commit-no-verify.png)

### 并发 lint 导致的问题

多个 lint 工具同时写就有并发问题，例如 eslint 行号报错对不上

- 本地跑 lint-staged 串行跑，因为自动修复和格式化都是进行写操作
- ci 环境并行跑是因为不做自动修复，只读没有并发问题

## 最近的一些趋势

### rust 化

一些 rust 编写的 lint 工具：

- [rslint](https://github.com/rslint/rslint)
- [rome](https://github.com/rome/tools) 大而全的前端基建工具，我看 [ant design](https://github.com/ant-design/ant-design/blob/master/package.json#L84) 已经用它部分替代 prettier 了

搞不好一条龙服务的 [bun](https://bun.sh/docs#design-goals) 也会加入 lint 战场。

ESLint 的作者也在 ESLint 的重写目标中指出部分组件会使用性能更好的 rust 语言实现：[Complete rewrite of ESLint](https://github.com/eslint/eslint/discussions/16557)

### esm 化

自从 [sindresorhus](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c) 点燃了 ESM 大迁移的革命星火，三大前端工具目前还是没一个支持使用 ESM 格式的配置文件：

- [ ] ESLint 实测目前最新版还不行
- [ ] Stylelint 虽然已经置顶 [issue](https://github.com/stylelint/stylelint/issues/5291) ，但是以我对 Stylelint 生态的活跃程度的了解，今年估计无望
- [ ] Prettier 预计下半年 [3.0](https://github.com/prettier/prettier/issues/13142) 完工

## 常见问题

### 为啥 eslint 可以检查代码格式还需要 prettier

也不一定需要，像 [antfu](https://github.com/antfu) 就不用 prettier，参考：[Why I don't use Prettier](https://antfu.me/posts/why-not-prettier)

他的主要观点包括：

1. 它是 Opinionated，没啥配置项，一些 prettier 内置的代码风格我不认同，改不了。资本家说过：要么忍要么滚，他选择了...
2. 从 eslint 的规则中剔除掉和 prettier 冲突的规则很麻烦

我是倾向于用的：

1. Opinionated 挺好，大家都不用吵了，不用因为争论一行最多 80 个字符还是 100 而伤了和气
1. 开箱即用，支持很多语言格式，达到同样的效果，配置 eslint 也需要很大的工作量，专业的事情交给专业的人做
1. 我不觉得 eslint 的规则中剔除掉和 prettier 冲突的规则很麻烦，安装个 npm 包 [eslint-config-prettier](https://www.npmjs.com/package/eslint-config-prettier) 我觉得不算麻烦

### 如何发现有用的 eslint rules

#### code review

日常给同事 code review 发现的很多代码风格问题都可以用 eslint 来约束。例如我最近发现有同事在 ts 代码里面隐式声明 any 变量：

```typescript
let message;
if (xxx) {
  message = func();
}
```

像这个其实可以通过规则来实现：

```javascript
module.exports = {
  overrides: [
    {
      files: ["*.{ts,tsx,vue}"],
      rules: {
        "no-restricted-syntax": [
          error,
          // 禁止隐式声明类型为 any 的变量
          // tsconfig 的 "noImplicitAny": true 不会处理这种情况
          // https://github.com/microsoft/TypeScript/issues/30899#issuecomment-1583132446
          {
            selector:
              "VariableDeclaration[kind = 'let'] > VariableDeclarator[init = null]:not([id.typeAnnotation])",
            message: "Provide a type annotation.",
          },
        ],
      },
    },
  ],
};
```

再比如很多同事喜欢使用逻辑运算符替代条件判断：

```javascript
boolVar && func();
```

我们可以使用规则：

```javascript
{
'no-unused-expressions': [
            warn,
            {
                allowShortCircuit: false,
                allowTernary: false,
                allowTaggedTemplates: false,
            },
        ]
}
```

如果没有现成的插件，有能力的可以自己写一些 lint 规则来，例如我就写了一些：

- 强制要求在注释中中英文之间要有空格
- 检查是否有遗漏了 i18n
- 检查某些情况例如 ts interface 应该使用文档注释而不是单行注释
- vue sfc 文件名不能是 index.vue，因为在 vue devtools 显示不出组件名

有时间把这些都开源出来。

#### 日常踩坑

之前有写过下面的 vue 代码：

```javascript
const count = ref(0);
if (count) {
  // xxx
}
```

踩坑之后我就开启了 `vue/no-ref-as-operand` 规则。

#### 关注一些 Lint 生态的大佬

1. <https://github.com/ota-meshi>日本老哥，写了很多 ESLint 和 Stylelint 生态的东西
2. <https://github.com/ljharb> 爱彼迎的老哥，tc39 成员，维护 airbnb 的那套 config 还有 eslint-plugin-import 等
3. <https://github.com/JounQin> 柳家忍，一直很眼熟，最近才认出它的中文名
4. <https://github.com/fisker> 应该也是国人，主要在项目 eslint-plugin-unicorn 很眼熟它，貌似在 sindresorhus 很多项目都能看到他。不知道中文名是哪位

#### 多参与社区交流

例如最近太狼吐槽 AFFiNE 的 react 代码我就在下面评论了一个很有用的 eslint 规则： <https://twitter.com/Brooooook_lyn/status/1666637274757595141>

#### 订阅一些仓库

你可以订阅 <https://github.com/vuejs/eslint-plugin-vue> 仓库的 release，以便知道最近新增了哪些 ESLint 规则。最近不是 vue 3.3 支持了泛型吗，预计可能最近就会新增一些和泛型相关的 lint 规则。

最近在看 pnpm 的 changelog <https://github.com/pnpm/pnpm/pull/6617> 时也发现一个很有用的 eslint 规则：[no-await-in-loop](https://eslint.org/docs/latest/rules/no-await-in-loop)

#### 最简单快速的方法 - playground

[ota-meshi](https://github.com/ota-meshi) 老哥开发的很多 eslint 插件都有 [playground](https://ota-meshi.github.io/eslint-plugin-vue-demo/)，你可以在 playground 里面把所有的规则都打开，然后写上你需要被检测出错误的代码，这样根据错误提示你就知道应该用什么规则了：

![eslint playground](https://github.com/tjx666/blog/blob/main/images/%E9%9D%A2%E5%90%91%20lint%20%E7%BC%96%E7%A8%8B/eslint-playground.png)

### 规则那么多，配置起来好麻烦

我刚入行的时候看到别人 eslint 配置长长列表也觉得头皮发麻，非常劝退。

首先 ESLint 提供了开箱即用的 eslint 初始化器：`eslint --init`。如果你还是嫌麻烦，可以使用别人封装好的配置，在 github 或者 npm 上搜索 `eslint config` 就可以搜到一堆。

### 为什么我不用 eslint loader

- <https://github.com/fi3ework/vite-plugin-checker>
- <https://github.com/webpack-contrib/eslint-webpack-plugin>

1. 拖慢编译速度
2. 已经有 IDE 提示了，我也不会一直盯着控制台看
3. 代码风格问题不应该阻止你查看页面效果

### 怎样 debug 某个规则

在 debug eslint 配置的时候，应该简化复现环境，有一些有用的选项：

- `--debug` 显示 lint 过程中的用于 debug 的信息
- `--rule` 指定只使用某个规则
- `--print-config` 输出被 lint 文件的配置

其实最简单粗暴的还是搞个最小的 reproduce 直接 debug 你怀疑有问题的那个插件的源码。

### 怎样测试性能

设置环境变量 `TIMING=1`

```bash
❯ TIMING=1 eslint plopfile.js
Rule                             | Time (ms) | Relative
:--------------------------------|----------:|--------:
compat/compat                    |    41.726 |    48.6%
json-schema-validator/no-invalid |    17.630 |    20.5%
import/order                     |     4.049 |     4.7%
unused-imports/no-unused-imports |     1.671 |     1.9%
n/no-deprecated-api              |     0.937 |     1.1%
vue/component-tags-order         |     0.846 |     1.0%
spaced-comment                   |     0.471 |     0.5%
node/prefer-promises/dns         |     0.408 |     0.5%
no-redeclare                     |     0.405 |     0.5%
no-unmodified-loop-condition     |     0.345 |     0.4%
```

### 怎样 lint 被忽略的文件

<https://github.com/tjx666/vscode-fe-helper#other-useful-frontend-tools-commands>

### 不一定要 eslint

tsconfig 有很多选项例如：[strict](https://www.typescriptlang.org/tsconfig#strict) 和 [noImplicitAny](https://www.typescriptlang.org/tsconfig#noImplicitAny) 都是很有助于检测代码问题的。

很多 eslint 插件或者规则在使用了 ts 语言就没有了意义了，例如插件：<https://github.com/ota-meshi/eslint-plugin-css>

需要再提一下的是有些规则我更倾向于使用 eslint 而不是 ts 来做校验，例如 `noUnusedLocals` 和 `noUnusedParameters`，因为 eslint 规则有选项的存在因而更加灵活。

### 相关工具

- <https://astexplorer.net/> 编写 eslint 插件非常有用，主要是用来查看 ast
- <https://github.com/IanVS/eslint-nibble> 渐进式修复项目中存在的大量 eslint 错误
- <https://github.com/ycjcl868/eslint-gpt> 让 gpt 帮你写 ESLint 规则
