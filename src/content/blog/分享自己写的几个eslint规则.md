---
title: 分享自己写的几个 eslint 规则
tags:
  - eslint
categories:
  - 前端
author: 余腾靖
pubDatetime: 2024-03-24
---

在被裁后准备跑路的最后一周，把一些自己做的工作成果能开源的都给开源了，其中便包括一些[自己写的 eslint 规则](https://github.com/tjx666/eslint-config/tree/main/packages/eslint-plugin/rules)，不然你也看不到这篇文章了。由于深知自己的怠惰，所以我一直坚信一句话：**永远不要高估开发的主观能动性**，能够靠工具自动化的就不要靠开发自觉去做。我是一个对开发效率有极致追求的人，所以在开发日常碰到开发低效的场景总是会尝试使用最舒服，高效的方法去解决它。也因此在上家公司搞前端基建的那段时间，基于自己碰到的问题写了一些 eslint 规则。

## comment-autocorrect

### 问题

其实我刚入行的时候也是喜欢写英文注释的，但是入行经验的增加，越来越看中代码的可维护性，加上对自己的英文的不自信，在开发公司多人维护的项目也慢慢变成只写中文注释了。

我对代码有洁癖，包括中文注释排版，尤其是见不得中英文之间没有空格，于是就像着写个工具来自动对中文注释进行排版。

bad:

```javascript
// loading 过程中禁止全选

/**
 * Loading 过程中禁止全选
 */
```

good:

```javascript
// loading 过程中禁止全选

/**
 * Loading 过程中禁止全选
 */
```

### 技术方案

起初我是觉得应该写个 `prettier` 插件，因为这个排版优化不会修改业务逻辑代码，只是对注释做了格式化，时间充裕的话我可能会实现为一个 `prettier` 插件。我觉得当时选择使用 `eslint` 规则来实现最主要原因：

1. 我对开发 `eslint` 插件更熟
2. 对这个自动修复不是很自信，当时没怎么使用过现有的一些中文排版工具，觉得排版的效果可能不尽人意，eslint 可以只报错，然后提供 IDE 的手动修复

实现为 `eslint` 规则很简单，核心思路：

1. 遍历代码 ast 中的注释节点
2. 使用中文排版库对注释内容做排版，如果排版后的内容和之前不一样，report 并提供自动修复

最开始我选择的中文排版库是 [pangu](https://github.com/vinta/pangu.js)，毕竟 [为什么你们就是不能加个空格呢？](https://chromewebstore.google.com/detail/%E4%B8%BA%E4%BB%80%E4%B9%88%E4%BD%A0%E4%BB%AC%E5%B0%B1%E6%98%AF%E4%B8%8D%E8%83%BD%E5%8A%A0%E4%B8%AA%E7%A9%BA%E6%A0%BC%E5%91%A2%EF%BC%9F/paphcfdffjnbcgkokihcdjliihicmbpd) 这个 chrome 插件经常出现在一些文章的推荐列表里。实际体验效果不太满意，这个库优点是源代码实现很简单，可以跨平台使用，缺点就是很多边际情况没考虑，例如：[函数调用不要加空格](https://github.com/vinta/pangu.js/issues/209)， [有没有办法设置不要对网址进行加空格？](https://github.com/vinta/pangu.js/issues/155)

一番搜索下我了解到一些其它的一些中文排版工具：

- [zhlint](https://github.com/zhlint-project/zhlint) js 编写的中文 lint 工具
- [autocorrect](https://github.com/huacnlee/autocorrect) rust 编写的支持 CJK 语言排版工具

这俩库都有 node api，当时选 `autocorrect` 主要是看到 user cases 里面有 [MDN Web Docs](https://developer.mozilla.org/zh-CN)，想着应该会比较成熟。此外，相比于 pangu，`autocorrect` 还支持很多其它排版功能，例如中文句子之间使用英文逗号会修复成中文逗号，是一个功能全面的中文排版工具，甚至作者还搞了个 VSCode 插件：[AutoCorrect](https://marketplace.visualstudio.com/items?itemName=huacnlee.autocorrect)。

其实 `autocorrect` 是支持对整个文件的代码进行排版的，支持多种编程语言，但是我还是选择只对注释部分进行排版，主要原因是：代码中的中文字符串怎么写往往是设计师定的，很多时候设计师给出的文案就是中英文之间没有空格，这些不能随便改，反倒是注释调整了又不影响代码逻辑。

### 实现

代码很简单，当时项目总共好像几万行代码，直接一次性批量自动修复，抽查了十几个文件包括一些内含 url 地址，代码的注释也能正确的排版。

[完整源码](https://github.com/tjx666/eslint-config/blob/main/packages/eslint-plugin/rules/comment-autocorrect.js)

```typescript
const autocorrect = require('autocorrect-node');

const MESSAGE_ID_DEFAULT = 'default';

/** @type {RuleCreate} */
const create = (context) => {
  const { sourceCode } = context;
  return {
    Program() {
      const comments = sourceCode.getAllComments();
      comments.forEach((comment) => {
        const correctCommentContent = autocorrect.format(comment.value);
        if (correctCommentContent !== comment.value) {
          context.report({
            node: comment,
            messageId: MESSAGE_ID_DEFAULT,
            fix(fixer) {
              return fixer.replaceText(
                comment,
                comment.type === 'Line'
                  ? `//${correctCommentContent}`
                  : `/*${correctCommentContent}*/`,
              );
            },
          });
        }
      });
    },
  };
};
```

## prefer-jsdoc

当时维护的项目全面拥抱 `typescript`，说实话 `vue2` 我最不能忍受的就是对 `typescript` 支持不好。

### 问题

由于对项目的 api 不熟，我会习惯性把光标 hover 到变量属性上看类型信息，实际情况一言难尽，项目到处是下面这种代码：

```typescript
interface A {
  name: string; // xxx
}

type A = {
  // xxx
  name: string;
};

// xxx
function a() {}

// xxx
const a = () => {};

// xxx
const a = function () {};

class A {
  name: string; // xxx

  // xxx
  f() {}
}
```

最难顶的是我们那个项目是个编辑器项目。结果那个编辑器项目的 `types` 包中大量的 `interface` 的属性全用的单行注释。

js 里的注释可以分为两类：单行注释和多行注释。其中以 `/**` 开头的多行注释又被称为文档注释：`jsdoc`。`tsc` 会去解析 `jsdoc` 并通过 ts lsp 给 `VSCode` 等 IDE 提供代码补全，描述信息优化开发体验。

像我刚刚说的 `interface` 属性这种情况，你把它改写成 `jsdoc` 那样别的地方使用编辑器的属性时就有描述信息，不香吗？

```typescript
interface A {
    /** xxx */
    name: string;
}

type A {
    /** xxx */
    name: string;
}

/**
 * xxx
 */
function a() {}

/**
 * xxx
 */
const a = () => {}

/**
 * xxx
 */
const a = function(){}

class A {
    /** xxx */
    name: string;

    /**
     * xxx
     */
    f() {}
}
```

### 技术方案

如果你只是几处地方需要将单行注释转换成多行注释，其实我更推荐使用 vscode 插件：[jsdoc comment toggler](https://github.com/zachhardesty7/jsdoc-comment-toggler)

但是我们那个项目该改写成 `jsdoc` 的地方有点多，而且我不认为我在开发群里面喷一下或者分享会上聊一下这个事就能考开发者的自觉去做好这个事。还得是上 linter 强制约束。

核心思路：

1. 确定几种常见的应该将单行注释转换为 `jsdoc` 的情况，例如 ts 的 `interface`, `type`, `class`, `enum` 的属性前面和后面的单行注释，函数前面的单行注释
2. 根据不同的情况在对应的 visitor 函数里做检测
3. 在做自动修复时需要将连续多行的单行注释合并为一个 `jsdoc`，像 `interface` 属性这种不但需要考虑前面的单行注释，还需要考虑后面的注释
4. 需要忽略像 `// @ts-ignore`, `// eslint-` 之类的工具用注释

#### 实现

代码略微有点长，不过还是个单文件，感兴趣自己[点进去](https://github.com/tjx666/eslint-config/blob/main/packages/eslint-plugin/rules/prefer-jsdoc.js)看吧。

## no-declare-implicit-any-var

### 问题

你可能见过下面的代码：

```typescript
interface Resp {
  data: {
    id: string;
  }[];
}

async function fetchSomeThing(): Promise<Resp> {
  return {
    data: [{ id: '1' }],
  };
}

async function main() {
  // resp 是 any 类型
  let resp;
  try {
    resp = await fetchSomeThing();
  } catch (error) {
    console.error(error);
  }

  // 不报错
  resp = 1;

  console.log(resp);
}

// 还有一种很常见的情况，例如下面的 result 是 any[]
let result = [];
// 不报错
result.push(1);
result.push('a');
```

1. 你可能会错误的认为 resp 会被推导为 Resp 类型，然而实际上 resp 是 any 类型
2. 你还可能错误的认为只要开启了 tsconfig.json 中 compilerOptions.noImplicitAny，tsc 会对这种 any 报错

你可以在 [ts playground](https://www.typescriptlang.org/play?#code/JYOwLgpgTgZghgYwgAgEoQM4AdkG8CwAUMsgCZxhwBceRJJwpNGYUoA5ncgL4DaAukW5EicDAE8QCZDACuUsMAD2IGRDAIAFgGUlAWwgAVTRwAUAShoAFKPuAYIAHnTYAfLWLIo62VFUFPEnJKGl5cZEYaAHIARiiefgAaLm4AbiERQjFJaTkFZVU9OFALDxIAenKvTBxAejNkOBBxZEBvH0Bo9S4AG3Vq7HTPVmaA+l6cAF4GgHdisDUNHX0jExB2C36SbmQECi1kU2hbKHMy+gQVDCVugDoDpSh9qEPzdZ5MiqrAWDlAUqNATFSub2wyAmMX6XDOIAu106SlWAKwzwyhCIlWQgA34wCQ5oAAOUAs56ACP1ABx6gEHIwAhboBRg0ArYqAGH-ANHygCDNQDQcoAjdOJvVknVm9Ua4gERG6swBbNmEwE-RR3z+hAF7KuWFkGE0phiiWQUTgUXMQA) 中验证。

typescript 不像 rust，rust 声明变量的类型会被推断为第一次初始化的类型，ts 你声明变量的时候没有标类型就是 any，并且这种情况不适用于 compilerOptions.noImplicitAny 选项：[--noImplicitAny error not reported for variable declaration](https://github.com/microsoft/TypeScript/issues/30899)

合理的做法应该在声明变量的同时声明类型：

```typescript
let resp: Resp;
let result: number[] = [];
```

### 技术方案

核心思路：

1. 这个规则应该只处理 ts 或者 vue lang=ts/tsx
2. 遍历 `VariableDeclaration` ast 节点，如果没有声明类型，也就是没有 `typeAnnotation`，报错
3. 需要排除 for of 循环，例如 `for (let item of elements)`，这里变量声明不需要声明类型

### 实现

[完整源码](https://github.com/tjx666/eslint-config/blob/main/packages/eslint-plugin/rules/no-declare-implicit-any-var.js)

```typescript
const path = require('node:path');

const MESSAGE_ID_DEFAULT = 'default';

const tsFileExts = new Set(['ts', 'tsx', 'cts', 'mts'].map((ext) => `.${ext}`));
/** @type {RuleCreate} */
const create = (context) => {
  const ext = path.extname(context.filename).toLowerCase();
  // 只处理 .ts 和 lang=ts 的 .vue 文件
  const isTs =
    tsFileExts.has(ext) ||
    (ext === '.vue' && /<script\s[^>]*?\blang=['"]ts['"][^>]*>/.test(context.sourceCode.getText()));
  if (!isTs) return {};

  return {
    VariableDeclaration(node) {
      // except for (let item of arr)
      if (node.parent?.type === 'ForOfStatement') return;

      if (new Set(['const', 'let']).has(node.kind)) {
        for (const declarator of node.declarations) {
          const { init } = declarator;
          // let a;
          // let a = [];
          if (
            declarator.id.typeAnnotation == null &&
            (init === null || (init.type === 'ArrayExpression' && init.elements.length === 0))
          ) {
            context.report({
              node: declarator,
              messageId: MESSAGE_ID_DEFAULT,
            });
          }
        }
      }
    },
  };
};
```

## no-vue-filename-index

### 问题

一图胜千言：

![vue index](https://github.com/tjx666/astro-blog/blob/main/src/assets/images/分享自己写的几个eslint规则/vue-index.png?raw=true)

如果一个 `.vue` 文件名为 `index.vue`，那么默认情况下 vite vue plugin 编译 sfc 得到的 vue 组件名称就是 `index`，vue devtools 会在组件树中把这个组件名显示为 Index，不利于调试。

![Counter Index](https://github.com/tjx666/astro-blog/blob/main/src/assets/images/分享自己写的几个eslint规则/counter-index.png?raw=true)

更详细的讨论建议移步：[Use the parent directory name as the component name](https://github.com/vuejs/core/issues/7156)

我的决定是禁止命名 .vue 文件为 index.vue。

### 技术方案

之前面某电商的时候面试官问我这种情况报错范围应该怎么选。

其实通常由两种选择：

1. 整个文件报红
2. 第一行报红

我选择第二种方案，整个文件报红太影响阅读代码，简直是光污染。

核心思路：

1. 这种一个文件只会检查一次的逻辑一般会使用 `Program` 节点
2. 直接判断当前是否是 `.vue` 文件，如果是并且文件名是 `index.vue` 报错
3. 要排除掉已经使用 defineOptions 的 name 选项定义组件名的情况

### 实现

[完整源码](https://github.com/tjx666/eslint-config/blob/main/packages/eslint-plugin/rules/no-vue-filename-index.js)

```typescript
const path = require('node:path');

const MESSAGE_ID_DEFAULT = 'default';

/** @type {RuleCreate} */
const create = (ctx) => {
  return {
    Program() {
      const filePath = ctx.filename;
      const filename = path.basename(filePath);
      if (filename.toLowerCase() === 'index.vue') {
        ctx.report({
          loc: { column: 0, line: 1 },
          messageId: MESSAGE_ID_DEFAULT,
        });
      }
    },
  };
};
```

## i18n

### 问题

之前在做某个业务需求的时候，在同事 codeReview 完后让我处理下评论的问题。我打开一看，我草，怎么有这么多评论，对代码一向比较自信的我就慌了呀。仔细看了之后发现大部分都是我没有做 i18n 的评论。然后后面给别人 code review 的时候也会特意注意有没有中文没有 i18n。虽说多花时间 code review 这么挣钱挺挺轻松的，但是程序员就是这么个矛盾的群体，总是发明各种工具来提高开发效率取代自己。

前几天面试的时候某电商国际的面试官两次面试都问过同一个问题，就是说它们有一些遗留的老项目当时没有做国际化，代码里面文案都是直接硬编码的中文字符串，问我怎么做国际化？

我当时就想到我写的这个 eslint 规则，后面晚上睡觉前反思面试表现的时候才想到说，如今 aigc 时代，可以直接用 aigc 去自动转代码呀。。。aigc 时代还是要有 aigc 思维，还记得好像就是那两天 nodejs 出了个新文档，立马有人用 aigc 翻译了中文文档。

#### Fail

```javascript
const chineseStr = '包含中文字符的一个字符串字面量';
```

```html
<template>
  <p title="中文标题">中文文本</p>
</template>
```

#### Pass

```javascript
const chineseStr = $tsl('包含中文字符的一个字符串字面量');
```

```html
<template>
  <p :title="$tsl('中文标题')">{{ $tsl('中文文本') }}</p>
</template>
```

### 技术方案

核心思路：

1. 遍历字符串 ast 节点 `Literal`，由于我们项目大量使用 vue sfc，因此需要考虑 vue template 中 `VLiteral`(属性值) 和 `VText`(html 中的文本) 节点
2. 拿到 ast 节点中的字符串，判断字符串是否包含中文，这个可以用正则，中文字符有一个 unicode 范围：`/[\u4E00-\u9FA5]/`
3. 如果包含中文字符串，但是没有使用 `i18n` 函数调用，报错，并提供 IDE 手动修复
4. 需要排除 `console.error('中文字符串')`, `throw new Error('中文字符串')` 等一些不需要 i18n 的场景

### 实现

```typescript
const { isInVueSfc } = require('./utils');

function containsChineseCharacters(str) {
  return /[\u4E00-\u9FA5]/.test(str);
}

/**
 * @param {Context} context
 */
function checkStringLiteral(context, node) {
  if (containsChineseCharacters(node.value)) {
    const { parent } = node;

    // console.log('xxx')
    if (
      parent.type === 'CallExpression' &&
      parent.callee.type === 'MemberExpression' &&
      parent.callee.object.name === 'console'
    ) {
      return;
    }

    // new Error('xxx')
    if (parent.type === 'NewExpression' && parent.callee.name.includes('Error')) {
      return;
    }

    const hadI18n =
      parent.type === 'CallExpression' &&
      (parent.callee.name === '$tsl' ||
        // i18n.$tsl
        (parent.callee.type === 'MemberExpression' &&
          parent.callee.object.name === 'i18n' &&
          parent.callee.property.name === '$tsl'));
    if (!hadI18n) {
      context.report({
        node,
        messageId: MESSAGE_ID_DEFAULT,
        suggest: [
          {
            messageId: MESSAGE_ID_MANUALLY_FIX,
            fix: (fixer) => {
              const sourceCode = context.getSourceCode();
              const literalText = sourceCode.getText(node);
              return fixer.replaceText(node, `$tsl(${literalText})`);
            },
          },
        ],
      });
    }

    // i18n.$tsl('') 应该简化为 $tsl('')
    if (hadI18n && parent.callee.type === 'MemberExpression') {
      context.report({
        node: node.parent,
        messageId: MESSAGE_ID_SIMPLIFY,
      });
    }
  }
}

/** @type {RuleCreate} */
const create = (context) => {
  /** @type {RuleListener} */
  const commonVisiters = {
    Literal(node) {
      if (typeof node.value === 'string') {
        return checkStringLiteral(context, node);
      }
    },
  };

  if (isInVueSfc(context)) {
    return context.parserServices.defineTemplateBodyVisitor(
      {
        VExpressionContainer(node) {
          if (node.expression && node.expression.type === 'Literal') {
            checkStringLiteral(context, node.expression);
          }
        },
        /**
         * @param {VLiteral} node
         */
        VLiteral(node) {
          if (containsChineseCharacters(node.value)) {
            context.report({
              node,
              messageId: MESSAGE_ID_DEFAULT,
              suggest: [
                {
                  messageId: MESSAGE_ID_MANUALLY_FIX,
                  fix: (fixer) => {
                    const sourceCode = context.getSourceCode();
                    const attributeText = sourceCode.getText(node.parent);
                    const valueText = sourceCode.getText(node);
                    const directiveText = `:${attributeText}`.replace(
                      valueText,
                      `"$tsl('${valueText.slice(1, -1)}')"`,
                    );
                    return fixer.replaceText(node.parent, directiveText);
                  },
                },
              ],
            });
          }
        },
        VText(node) {
          checkStringLiteral(context, node);
        },
      },
      commonVisiters,
    );
  }

  return commonVisiters;
};
```

## no-missing-script

### 问题

当前维护的项目是一个很大的 monorepo 项目，有 90+ workspace packages，项目使用 turborepo 管理 npm scripts。

```plaintext
./mono
├── apps
│   ├── ai
│   ├── mobile
│   └── web
├── packages
│   ├── editor
│   │   ├── editor-core
│   │   └── editor-types
│   └── ui
│       ├── editor-components
│       └── editor-ui
└── tools
    ├── eslint-plugin
    ├── rollup-config
    └── vite-config
```

基本上每个 package.json 都包含下面俩 scripts：

```json
{
  "scripts": {
    "build": "vite build",
    "type-check": "vue-tsc"
  }
}
```

每个包都要写一遍确实很烦，所以我当时还有另一个突发奇想，`package.json` 要是支持 `extends` 就好了，但是 `npm` 官方是不太可能搞这个了：[Allow to specify a parent package.json](https://github.com/npm/npm/issues/8112)。但是我在 `pnpm` 那里有看到了希望：[How to share scripts between projects in a workspace](https://github.com/pnpm/pnpm/issues/2405)。

现状是还得重复写这些 scripts，但是你懂得，不要靠人的自觉。实际上就有那么几个包没写对应的 scripts，直到某一天我排查 bug 的时候打开某个 ts 文件，发现有 ts 错误，我就纳闷了，这是咋绕过 ci check 和到 master 的，排查发现那个 package 没声明 `type-check` 这个 script，ci 上根本没对那个包做类型检查。

### 技术方案

```javascript
module.exports = {
  overrides: [
    {
      files: ['apps/*/package.json'],
      rules: {
        'no-missing-script': [
          error,
          {
            scriptNames: ['check-type:app'],
            isTsProject: true,
            message: '请补充 script："check-type:app": "vue-tsc --noEmit"',
          },
        ],
      },
    },
  ],
};
```

对于下面的 `apps/design/package.json` ：

```json
{
  "scripts": {
    "dev": "vite",
    "build:app": "cross-env NODE_OPTIONS=--max-old-space-size=8192 vite build",
    "build:analyze": "cross-env ANALYZE=true pnpm build:app",
    "preview": "vite preview",
    "release": "pnpm build:app"
  }
}
```

会报错：

> 请补充 script："check-type:app": "vue-tsc --noEmit"

核心就是对 package.json 的 scripts 做检查，如果缺少了规则配置的必须存在的 scripts 就报错。

### 实现

```javascript
/** @type {RuleCreate} */
const create = (context) => {
  const filePath = context.filename;
  const filename = path.basename(filePath);

  if (filename !== 'package.json') return {};

  if (!context.parserServices.isJSON) {
    return {};
  }

  return {
    JSONProperty(node) {
      if (node.parent?.parent?.parent?.type !== 'Program') return;

      if (node.key.value !== 'scripts') return;

      const _isTsProject = fs.existsSync(path.resolve(path.dirname(filePath), 'tsconfig.json'));

      for (const { scriptNames, isTsProject, message } of context.options) {
        if (isTsProject && !_isTsProject) continue;

        const missingScripts = [];
        scriptNames.forEach((scriptName) => {
          if (node.value.properties.every((property) => property.key.value !== scriptName)) {
            missingScripts.push(scriptName);
          }
        });

        if (missingScripts.length > 0) {
          context.report({
            node,
            message,
          });
        }
      }
    },
  };
};
```

## 如何去使用这些 eslint 规则

方法有很多，相信能看到这里的人应该都是对 eslint 很熟的人了，我就简单叙述下了：

1. 直接使用我的 [@yutengjing/eslint-config](https://github.com/tjx666/eslint-config)，和 [@antfu/eslint-config](https://github.com/antfu/eslint-config) 不一样的是我的 configs 都不包含代码格式化相关的规则，格式化请使用 `prettier`
2. 使用 [@yutengjing/eslint-plugin](https://github.com/tjx666/eslint-config/blob/main/packages/eslint-plugin/package.json)，按需开启你想用的规则
3. 上面写的一些规则都是可以 copy to use 的，可以结合 [eslint-plugin-local-rules](https://github.com/cletusw/eslint-plugin-local-rules) 快速集成

## 聊聊我是怎么做批量修复的

### 背景

当时这个项目是个新仓库，早期合代码比较随意，那时候还没有上 `codeowners` 这种东西来强制约束必须至少有其它两个人 codeReview。前期我对 eslint 配置做了一些优化，加了很多实用性比较高的规则。最开始我没打算去做一次批量修复的：

1. 我怕批量修出了问题要担责啊，而且我记得最后批量修的时候好像有大几千个 changes，当然这些 changes 不只是修复 `eslint` 错误，还包括 `prettier` 格式化，ts 错误等，我们这里只聊 `eslint` 错误
2. 修了之后整个项目到处都有我的 `commit`，后面有人碰到问题查看提交记录有我都来找我了...
3. 感觉渐进式修复挺好的啊，让修改代码的人顺便把 lint 错误修了和 code review

但是实际情况是：

1. 我高估了团队同事对 eslint 的熟悉程度，碰到一些 eslint 错误经常直接把问题截图发群里了 (事实上确实之前的代码就是有问题)
2. code review 经常需要 review 一些和业务逻辑无关的修复 lint 的代码，很多 lint 错误都是能够被自动修复的，能自动修复都是相对比较安全的，一般不需要 review
3. 由于配置了 vscode 的保存文件时自动修复，当你在调试代码时，可能打开某些文件加了一些 log，然后删除 log 也会触发保存时自动修复，当然我碰到这种情况我直接用 git 回退，某些同事可能就直接提交了等 code review
4. 当时引进了对导入语句排序的规则，基本上打开一个文件就会提示排序有问题

在 leader 的支持下，我决定做一次批量自动修复。

### 行动

很显然，直接 `eslint --fix` 是不行的。这样修改的面太广了，根本无法 code review。

首先我需要分析项目中的错误，我借助了 [eslint-nibble](https://github.com/IanVS/eslint-nibble) 和 [eslint-interactive](https://github.com/mizdra/eslint-interactive) 对项目中的 eslint 错误进行统计：

eslint-nibble:

![eslint-nibble](https://github.com/IanVS/eslint-nibble/raw/master/docs/eslint-stats-screenshot.png)

eslint-interactive:

![eslint-interactive](https://github.com/mizdra/eslint-interactive/raw/main/docs/screenshot.png)

两者比较一下：

1. 首先前者有个挺影响体验的 bug：[can't select front items when error rules is too many](https://github.com/IanVS/eslint-nibble/issues/110)，
2. 后者确实速度更快
3. 后者在修复一条规则后可以不退出进程，继续选择新的规则进行修复，前者只能退出进程重新运行
4. 前者可以只输出**能够自动修复**的规则：[support --fixable-only option like eslint-nibble](https://github.com/mizdra/eslint-interactive/issues/296)，前期做批量修复肯定先关注自动修复
5. 前者确实能一眼看出哪个规则错误更多

事实上我两个都在用，前期用 `eslint-nibble` 较多，后期 `eslint-interactive` 较多。

我采取的修复策略是：

- 整体采用少量多次的原则，一条规则一次提交
- 先处理能够自动修复的，再处理需要手动修复的
- 自动修复优先处理错误数量多的，手动修复优先处理错误数量少的
- 自动修复每次修一条规则，如果错误数量较多就抽查几个文件，数量较少就一个一个打开看
- 手动修复如果错误数量较多，就直接关掉这个规则，如果数量较少就一个一个修
- 对于可能会影响到业务逻辑的需要在 pr 中备注，让其他同事 code review 对应的 commit，像 `prefer-jsdoc`, `prefer-template` 这种不改到代码逻辑的不需要了

即便我已经很小心了，但是最终上线后还是引入了一两个由于自动修复代码导致的问题：

- [([unicorn/prefer-at] should avoid auto fix " parent?.childNodes[parent.childNodes.length - 1];")](https://github.com/sindresorhus/eslint-plugin-unicorn/issues/2098)
- `eslint-plugin-unicorn` 的 `prefer-textcontent` 规则自动修复导致表格换行不显示

## 聊聊我们 CI 是怎么做按需 lint 的

其实最简单的想法就是直接用 lint-staged，但是如果你在 CI 上运行 `lint-staged --diff="master...my-branch"` 效果可能是下面这样的：

![lint-staged on ci](https://user-images.githubusercontent.com/41773861/236746041-7635c6a9-1f3e-4566-a897-63496fb22ea5.png)

具体可以看 issue：[[Feature] provide option to disable progress](https://github.com/lint-staged/lint-staged/issues/1295)。

其实本地我也配了在 `pre-commit` 的时候做 `lint-staged`，那为啥在 CI 上还要做一次 lint 检查呢？

1. 你扛不住有些人 `git commit --no-verify` 呀
2. 我们可能会在 github 上 merge 分支，这种情况只能借助 ci 检查了

不过这俩个运行逻辑还是有区别的：

- 本地运行的 linters 时候，由于都开启了 `--fix`，并行运行所有 linters 可能会出问题，于是采用的是串行执行多个 linters
- CI 上运行的时候由于是 `readonly`，没有开 `--fix`，因此可以选择直接并行跑加快检测速度

当时想着怎么在利用已有的 `lint-staged.config.js` 配置的基础上再 CI 上能够按需 lint, 于是借鉴 `lint-staged` 的思路，自己写了个脚本读取 `lint-staged.config.js` 配置跑 lint 任务。

核心思路：

1. 我们当时用的 jenkins，通过 `CHANGE_TARGET` 环境变量拿到 `base` 分支，默认是 `master`
2. 通过 `git diff --name-only --diff-filter=ACMR ${baseBranch}...HEAD` 得到相对于 `base` 分支当前分支变化的文件，`ACMR` 这个过滤参数告诉 `git` 我们只需要增加的，修改的文件，不需要删除的文件。
3. 读取 `lint-staged.config.js`，按照配置运行 tasks，不过我没有输出动画，ci 上不需要动画

### 实现

其实我在想这玩意是不是可以做成一个 github action，有空来学习下怎么把它做成 github action。

[源码](https://github.com/tjx666/fe-scripts/blob/main/lint-changed.ts)

```typescript
import { createRequire } from 'node:module';

import type { ExecaError } from 'execa';
import { execa } from 'execa';
import micromatch from 'micromatch';
import c from 'picocolors';

import { consola, execaWithOutput, formatDuration, logWithBox } from './utils';

const baseBranch = process.env.CHANGE_TARGET || 'master';
consola.info(`Base Branch：${baseBranch}`);
process.stdout.write('\n');

const require = createRequire(import.meta.url);
const lintStagedConfig = require('../lint-staged.config') as Record<
  string,
  (files: string[]) => string
>;

/**
 * @see https://github.com/okonet/lint-staged/blob/master/lib/getDiffCommand.js
 */
async function getChangedFiles() {
  const { stdout } = await execa('git', [
    'diff',
    '--name-only',
    // 排除删除了的文件
    '--diff-filter=ACMR',
    `${baseBranch}...HEAD`,
  ]);
  return stdout.trim().split(/\r?\n/);
}

const changedFiles = await getChangedFiles();

const lintTasks = Object.entries(lintStagedConfig).map(async ([pattern, taskCreator]) => {
  const expandedPattern = `**/${pattern}`;
  const matchedFiles = micromatch(changedFiles, expandedPattern, {});
  const command = taskCreator(matchedFiles).trim();

  if (command === (globalThis as any).__lintStagedSkipMessage__) {
    consola.info(c.yellow(`no files matched, skip ${c.bold(c.magenta(taskCreator.name))}`));
    return;
  }

  const doubleQuoteIndex = command.indexOf('"');
  const [exe, ...args] = command.slice(0, doubleQuoteIndex).trim().split(/\s+/);
  const pathList = command
    .slice(doubleQuoteIndex)
    .split(/(?<=")\s+(?=")/)
    // 去除引号
    .map((pathWithQuote) => pathWithQuote.slice(1, -1));
  const filesTooMany = pathList.length > 10;
  const pathListStr = filesTooMany ? `<...${pathList.length}files>` : pathList.join(' ');
  const commandStr = `${[c.bold(exe), ...args, c.green(pathListStr)].join(' ')}`;
  console.log(c.magenta(`$ ${commandStr}\n`));
  const start = Date.now();
  try {
    await execaWithOutput(exe, [...args, ...pathList], { outputCommand: false });
  } catch (_error) {
    const error = _error as unknown as ExecaError;
    let { message, command, exitCode } = error;
    if (filesTooMany) {
      message = message.replace(command, c.red(commandStr));
    }
    consola.error(message);

    const fixCommand = `pnpm lint:fix ${baseBranch}`;
    const title = c.red('Lint 失败，请尝试在本地运行下面的修复命令！');
    logWithBox(title, c.green(fixCommand));

    consola.error(`Changed files:\n${pathList.map((path) => c.green(path)).join('\n')}`);
    process.exit(exitCode);
  }
  consola.success(`${taskCreator.name} ${formatDuration(Date.now() - start)}`);
});

// 只 lint 不修复，也就是只读不写不会有并发问题
await Promise.all(lintTasks);

consola.success('Lint 通过');
```

## 折腾 linters 期间写的 vscode 插件

- [Better Colorizer](https://marketplace.visualstudio.com/items?itemName=YuTengjing.better-colorizer) support syntax highlight for git error file and output panel

## 总结

以前写业务的时候，自己很多时候碰到一些开发效率上的问题多数时候也是选择喷一喷，忍一忍，最多写到我的 ideas 里面等有空的时候来搞。等到真有空搞这些的时候，发现可以做的东西确实很多，todos 也越来越长，这个时候还要去思考哪些是短期内收益比较大的，给它们排优先级。不过做出有用的东西的时候真的很有成就感！

虽然这几年互联网整体大环境不好，很多公司裁员先裁基建，基建的同事没活干给别的部门当`"外包"`。但怎么说，至少我那段时间干的还是挺开心的，然后也被裁了...

面试的时候有那么两三个面试官问我为什么不去搞前端基建的部门投简历，咋说呢，首先就是这个岗位不咋招人，需求量少。会招人搞基建的多数是大厂了，小厂一般也不太需要，大厂现在社招岗位都不多（我都怀疑它们官网挂的几个岗位都是在营造招人的假象），还挑呢。也向一个同事打听过他们公司基建团队是否招人，回复说是都在给别的部门做`"外包"`。其次，其实我也不排斥切图呀，当兴趣成为职业你可能慢慢也就不感兴趣了，当个兴趣爱好工作之余搞搞不也挺好。还有，其实如果工作是以前端工程效率为主的，要是被裁出来是真的不还找工作，一面技术面可以和面试官聊 webpack，二面项目面，三面 boos 面也和面试官聊 webpack？

其实还有还做过一些感觉还挺有用的东西，但是和文章的主题不是很相关，感兴趣你可以去看看 [fe-scripts](https://github.com/tjx666/fe-scripts)，例如封装了 `turbo run` 方便运行 `turborepo` 的时候能够快速定位到时哪个 package，哪个 script 执行出错：[turbo-run](https://github.com/tjx666/fe-scripts/blob/main/turbo-run.ts)。

乘着周末没有面试水了两篇文档，难以想象没有双休的打工生活。
