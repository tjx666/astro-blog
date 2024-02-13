---
title: 从零开始配置 react + typescript（一）：dotfiles
tags:
  - react
  - typescript
  - dotfile
categories:
  - 前端
author: 余腾靖
pubDatetime: 2020-02-01 12:25:00
featured: true
---

之前我写过一篇文章 [搭建 react + typescript + ant design 开发环境](https://juejin.im/post/5cd596d451882568897d89c8)，现在看来很多内容都已经过时了。但是我看到前不久还有读者给我这篇文章点赞，不更新的话总感觉坑了它们，有点过意不去。但是，如果现在让我再去配置那套环境，我肯定不会再像那篇文章那样配置了，毕竟过了这么长一段时间，很多工具都在发展，我的想法也在改变，那么干脆我就再整一篇新的文章，这是我创作这篇文章的动机之一。

最近一段时间，我写过不少类型的项目，有 `chrome 扩展`，`VSCode 扩展`， `electron` 等，配置开发环境都是裸写的，并没有使用一些 cli 工具或者第三方的项目模板。因此，我踩过不少坑，也总结了不少的经验。所以另一个创作动机就想总结和分享一下我配置开发环境的最佳实践。

我使用的开发机和编辑器分别是 `win10pro-1909` 和 `VSCode`，使用的所有依赖都是最新的，并且文章会不定时更新，确保具有时效性。

文章将按照开发一个模板项目的时间顺序预计分成四篇来写：

1. dotfiles
2. linters 和 formatter
3. webpack
4. 第三方库集成和优化

项目地址：[react-typescript-boilerplate](https://github.com/tjx666/react-typescript-boilerplate)

<!-- more -->

## init

搭建项目的第一步就是新建项目文件夹，然后初始化为 git 仓库：

```bash
# 新建项目文件夹
mkdir react-typescript-boilerplate
# 切换工作路径到项目文件夹
cd $_
# 初始化 git 仓库
git init
```

你可以将 `react-typescript-boilerplate` 替换成任意你需要的项目名，`$_` 表示上一条命令最后的参数，这里就表示项目文件夹。

对于 `dotfiles` 这个词，我的理解是指那些以点 `.` 开头的配置文件。在我刚开始学习前端框架的时候，看到脚手架生成的一堆 `dotfiles` 我也是很懵逼，头皮发麻，心想怎么写个项目要这么多配置文件，写个前端项目也太麻烦了。其实**存在即合理**，当我了解了它们的用途之后，就能够理解它们的必要性了，而且配置文件很多从某种程度上也反应了前端构建工具生态的活跃不是。

## .gitignore

建议初始化 git 仓库后第一步就是添加 `.gitignore`。如果你不添加，那么 VSCode 的版本控制会监控你项目中的所有文件包括 `node_modules`下的一堆文件，导致 CPU 和内存占用过高等问题，所以最好一开始就配置好 `gitignore`。配置 `gitignore` 建议使用 VSCode 的 [gitignore](https://marketplace.visualstudio.com/items?itemName=codezombiech.gitignore) 扩展。使用方式很简单：`ctrl+shift+p` 唤出命令面板，调用 `Add gitignore` 命令，然后选择不同类型项目的 `ignore` 配置，可以多次追加。

![gitignore.gif](https://i.loli.net/2020/02/01/hl1P65K79jLcUMb.gif)

我一般添加的项目类型包括：`Node`, `VisualStudioCode`, `JetBrains`, `Windows`, `Linux`, `macOS`，你可以根据自己的需要添加其它的项目类型例如 `SublimeText`，`Vim`。虽然我是用 `VSCode` 做开发，但是考虑到别人开发这个项目的时候可能用的就是 `WebStorm` 了，所以就添加了和 `JetBrains` IDE 相关的 `ignore` 配置。这个扩展的原理是通过拉取开源项目 [gitignore](https://github.com/github/gitignore) 的 `gitignore` 配置，**需要注意的是我们要删除其中两个配置项 `typings/` 和 `Icon`**。这两个配置项明显是需要添加到 git 版本控制的，`typings` 文件夹我们会用来保存 ts 的类型定义文件，`icon` 文件夹我们一般用来保存图标。

## .editorconfig

通过配置 `editorconfig`，我们可以让多个开发人员，使用不同的编辑器时，代码格式化风格仍然保持一致。有些 IDE 例如 IDEA 是直接内置了 `editorconfig` 规范，有些编辑器如 VSCode 则需要安装[对应的插件](https://marketplace.visualstudio.com/items?itemName=EditorConfig.EditorConfig)去支持。

我们拿 VSCode 和 IDEA 来做个测试，下面这张图是左边是测试文件 `index.js`，右边是 `editorcofig` 配置，注意到**我刻意把缩进设置成了 3 个空格**。`VSCode` 是可以设置它格式化代码时使用的 `formatter` 的，如果你不设置，那就是用内置的 `formatter`，也就是：

```json
"[javascript]": {
    "editor.defaultFormatter": "vscode.typescript-language-features"
 }
```

![editorconfig-vscode.png](https://i.loli.net/2020/02/01/y4Q9Xmqzv3K7kjs.png)

在我 `alt + shift + f` 格式化之后可以看到，VSCode 遵循了 `editorconfig` 的配置将代码的缩进格式化成了 3 个空格。

我继续在 IDEA 中打开这个项目后通过 `ctrl + alt + l` 格式化，意料之中也是格式化成了三个空格，我就不贴图了，和上面一样。所以，`editorconfig` 可以让我们在使用不同的编辑器时格式化的保持风格一致。

有人可能会想，`prettier` 也是格式化工具，为什么同一个项目配置俩格式化工具（后面我们还要配置 `prettier`）？事实上，可以看到有些著名的开源项目如 `react`, `VSCode` 就是两个都用了。其实想想看：到最后代码格式化功能肯定是要交给 `prettier` 去干的，一般都是用 `lint-staged`，每次只把修改过的代码格式化。那是否就是说， `editorconfig` 是没有用的配置呢？

当然是有用的，本质上 `editorconfig` 和 `prettier` 的区别在于：`editorconfig` 是主动作用于编辑器的，你添加了 `.editoronfig` 文件，调用 VSCode 的格式化，格式化结果就是 `.editorconfig` 配置的风格。而 `prettier` 只是一个命令行工具，需要我们去调用它，它才会格式化代码，它本身是被动的。如果你不配置 `editorconfig`，那当用户修改了一个文件，调用 `VSCode` 快捷键手动格式化代码，提交时又被 `prettier` 格式化一遍，因为 `VScode` 内置的 `formatter` 和 `prettier` 风格不一样，导致我明明手动格式化了，怎么提交后还被修改了。配置 `editorconfig` ，并且使其和 `prettier` 的风格保持一致，就可以解决前面提到的多次格式化结果不一样的问题。事实上， `react` 就是这样干的。

其实，当用户配置了 `prettier` 作为 VSCode 的 `javascript` formatter， `editorconfig` 配置就没什么用了。

![edittorconfig-prettier.png](https://i.loli.net/2020/02/01/lrV5nzXkGugMxfj.png)

说了那么多，其实配置起来非常简单，建议安装 VSCode 扩展 [EditorConfig for VS Code](https://marketplace.visualstudio.com/items?itemName=EditorConfig.EditorConfig)，安装之后可以通过命令 `Generate .editorcofig` 生成默认的配置，个人建议最后加上一行 `end_of_line = unset`，让行尾换行符直接遵守操作系统的换行符。

```bash
root = true

[*]
indent_style = space
indent_size = 4
charset = utf-8
trim_trailing_whitespace = false
insert_final_newline = false
# 加上这一行
end_of_line = unset
```

## .nvmrc

[nvm](https://github.com/nvm-sh/nvm) (node version manager) 是 node 的版本管理工具，在 windows 上使用 nvm 要安装另一个工具 [nvm-windows](https://github.com/coreybutler/nvm-windows)。

`.nvmrc` 是 `nvm` 的配置文件，很多工具在判断项目的 node 版本的时候会读取这个配置，例如 travis CI。如果项目根路径有 `.nvmrc` 的话就不用在 `.travis.yml` 中指定 node 的版本了。建议平时开发使用最新的 LTS 版本，新版本不但支持的 ES 特性更多，性能一般也有提升，bug 一般也更少。不建议开发项目时选择最新的非 LTS 版，有些包例如 [bcrypt](https://github.com/kelektiv/node.bcrypt.js) 在最新的非 LTS 版根本就不支持。之前我一个朋友就碰到安装 `bcrypt` 安装不了的问题，研究到最后发现是因为 `bcrypt` 只是在 LTS 版本的 node 上测试，并不保证支持非 LTS 版本。

通过下面的 shell 命令生成 `.nvmrc`：

```bash
node --version > ./.nvmrc
```

## .npmrc

众所周知，由于不可抗之力，国内无论是访问 `github` 还是下载 `npm` 包都是蜗速。对于国内用户而言，首先我们要做的一件事就是将 `npm` 源设置淘宝源。配置 `npm` 源建议使用 [nrm](https://github.com/Pana/nrm)：

```bash
# 全局安装 nrm，
yarn global add nrm
# 或者使用 npm 安装，install 可以简写成 i
npm i -g nrm
# 设置使用淘宝源
nrm use taobao
```

通过 `nrm ls` 我们还可以看到其它的一些源：

```bash
$ nrm ls

  npm -------- https://registry.npmjs.org/
  yarn ------- https://registry.yarnpkg.com/
  cnpm ------- http://r.cnpmjs.org/
* taobao ----- https://registry.npm.taobao.org/
  nj --------- https://registry.nodejitsu.com/
  npmMirror -- https://skimdb.npmjs.com/registry/
  edunpm ----- http://registry.enpmjs.org/
```

测试一下其中几个常见的源的丢包率，淘宝源一骑绝尘啊：

![taobao-cnpm-registry.png](https://i.loli.net/2020/02/01/bCpAYTVKENDqBmW.png)

`.npmrc` 是给 `npm` 用的配置文件，当然你如果使用 `yarn`，`yarn` 也会遵守 `.npmrc` 配置，虽然 `yarn` 有专门的配置文件 `.yarnrc`。

我们知道有些 `npm` 包在安装时是需要下载一些二进制依赖文件，其中有几个坑货像 `node-sass`，`electron`，`bcrypt` 还需要配置代理才能下载。为了让让别人合作开发项目的时候能顺利安装它们，我们可以在 `.npmrc` 中直接设置它们的镜像地址，添加 `node-sass` 的镜像地址：

```bash
# .npmrc
SASS_BINARY_SITE=http://npm.taobao.org/mirrors/node-sass
```

我们可以在 [淘宝 npm 镜像](https://npm.taobao.org/mirrors) 查看更多常用镜像地址。

## LICENSE

![open source license](https://i.loli.net/2020/02/05/Fb7OUkWmYfIiHyX.png)

根据你的项目性质，去网站 [choose a license](http://choosealicense.online/) 选择一个合适的 license，复制后粘贴到项目根路径的 `LICENSE` 或 `LICENSE.txt` 文件里面，修改一些配置即可。这里我选择宽松的 MIT 协议，修改其中的年份和作者名：

```
MIT License

Copyright (c) [2020] [YuTengjing]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## package.json

生成 `package.json` 的时候需要考虑一个问题，你是打算使用 `yarn`，`npm`，还是 `cnpm`？

最近貌似还发布了 `yarn2` ，不过我目前肯定不会考虑 `yarn2` 的，先不说有很多 `bug` ，还不够成熟，社区的接受度还是一个问题，`yarn2` 和 `yarn1` 差别很大。

讲真我觉得 `npm` 是真的设计的很屎，不知道最开始为什么会设计成安装包默认不会添加到 `dependencies`，使用缓存这么容易想到的设计还是 `yarn` 首创的，锁定版本也是抄 `yarn` 的。

`yarn` 用起来舒服多了。但是 `yarn` 在 `windows` 经常有 `hash` 值对不上然后安装不了的 `bug`，搞得我很烦，看了一下 github 仓库，将近 2000 个 issues。

最近我重新试用了一下 `cnpm`，让我意外的是下载速度是真的快，同样的使用淘宝源，`cnpm` 比 `yarn` 还要快很多。但是我觉得 `cnpm` 安装之后，`node_modules` 看起来很乱，多了很多乱七八槽的依赖。

因为我有点洁癖，所以 `yarn` 和 `cnpm` 我站 `yarn`。其实 `yarn` 还有一个杀手级的特性 `yarn workspace`，用于管理 `monorepos` 的依赖，虽然这个项目不是 `monorepos` 结构，但是确实 说明一个问题 `npm` 在工程领域落后 `yarn` 太远了。

package.json 是用来管理 `npm` 包的配置文件，生成 package.json 最简单的方式就是来一句 `yarn init -y`，直接就生成一个默认的 package.json。

```json
{
  "name": "react-typescript-boilerplate",
  "version": "1.0.0",
  "main": "index.js",
  "author": "YuTengjing <ytj2713151713@gmail.com>",
  "license": "MIT"
}
```

我们来修改下这个默认的配置：

因为我们这个项目不打算发布到 `npm`，所以 `private` 设置为 `true`。

这个 `main` 入口对于我们这个模板项目来说没什么意义，直接删了。

修改一下 `author` 和 `repository` 的格式就是下面这样了：

```json
{
  "name": "react-typescript-boilerplate",
  "version": "1.0.0",
  "description": "A boilerplate for react + typescript development",
  "private": true,
  "author": {
    "name": "YuTengjing",
    "url": "https://github.com/tjx666",
    "email": "ytj2713151713@gmail.com"
  },
  "repository": {
    "type": "git",
    "url": "git@github.com:tjx666/react-typescript-boilerplate.git"
  },
  "license": "MIT",
  "scripts": {}
}
```

## settings.json

如果你使用的是 VSCode，那么可以添加 VSCode 的项目配置文件 `.vscode/settings.json`。新建 `.vscode` 文件夹并在其中创建 `settings.json`文件。虽然 `settings.json` 后缀名是 `.json`，但其实是 `jsonc` 格式的文件，`jsonc` 和 `json` 文件的区别就在于 `jsonc` 允许添加注释，`jsonc` 的这个`c` 就是 `comment`（注释）的意思嘛。暂时添加以下内容：

```javascript
{
    // stylelint 扩展自身的校验就够了
    "css.validate": false,
    "less.validate": false,
    "scss.validate": false,
    // 使用本地安装的 TypeScript 替代 VSCode 内置的来提供智能提示
    "typescript.tsdk": "./node_modules/typescript/lib",
    // 指定哪些文件不参与搜索
    "search.exclude": {
        "**/node_modules": true,
        "dist": true,
        "yarn.lock": true
    },
    // 指定哪些文件不被 VSCode 监听，预防启动 VSCode 时扫描的文件太多，导致 CPU 占用过高
    "files.watcherExclude": {
        "**/.git/objects/**": true,
        "**/.git/subtree-cache/**": true,
        "**/node_modules/*/**": true,
        "**/dist/**": true
    },
    // 配置 VScode 使用 prettier 的 formatter
    "[javascript]": {
        "editor.defaultFormatter": "esbenp.prettier-vscode"
    },
    "[javascriptreact]": {
        "editor.defaultFormatter": "esbenp.prettier-vscode"
    },
    "[typescript]": {
        "editor.defaultFormatter": "esbenp.prettier-vscode"
    },
    "[typescriptreact]": {
        "editor.defaultFormatter": "esbenp.prettier-vscode"
    },
    "[json]": {
        "editor.defaultFormatter": "esbenp.prettier-vscode"
    },
    "[jsonc]": {
        "editor.defaultFormatter": "esbenp.prettier-vscode"
    },
    "[html]": {
        "editor.defaultFormatter": "esbenp.prettier-vscode"
    },
    "[css]": {
        "editor.defaultFormatter": "esbenp.prettier-vscode"
    },
    "[less]": {
        "editor.defaultFormatter": "esbenp.prettier-vscode"
    },
    "[scss]": {
        "editor.defaultFormatter": "esbenp.prettier-vscode"
    },
    "[yaml]": {
        "editor.defaultFormatter": "esbenp.prettier-vscode"
    },
    "[markdown]": {
        "editor.defaultFormatter": "esbenp.prettier-vscode"
    }
}
```

我们还可以通过 `.vscode/extensions.json` 文件向用户推荐一些扩展，在用户打开该项目时如果有推荐的扩展未安装 VSCode 就会提示用户安装，也可以在扩展市场勾选过滤条件为只显示推荐的扩展查看：

```json
// https://gist.github.com/tjx666/daa6317cf80ab5f467c50b2693527875
{
  "recommendations": [
    "editorconfig.editorconfig",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "stylelint.vscode-stylelint",
    "dsznajder.es7-react-js-snippets",
    "mrmlnc.vscode-scss",
    "yutengjing.view-github-repository",
    "yutengjing.open-in-external-app"
  ]
}
```

![recommend extension](https://i.loli.net/2020/04/03/gFvb8AQKmTGpdCl.png)

## .travis.yml

我选择使用最流行的开源 CI 工具 travis CI，在 github 上新建完仓库后就可以去 travis CI 官网，先同步 github 账号信息，然后搜索激活新建的仓库。后续我可能会考虑替换成 github `actions`，目前还是先用 `travis`。

![travis-ci.png](https://i.loli.net/2020/02/02/iGjOa4fZo2Dpu3q.png)

在项目根目录新建 `.travis.yml` 文件，加入以下内容：

```yaml
language: node_js
cache:
  - yarn
install:
  - yarn
script:
  - yarn test
```

非常简单的配置，只是负责自动化测试。因为目前没有测试，我们添加一个 `echo` 语句到 npm scripts 里面：

```javascript
// package.json
"scripts": {
    "test": "echo 'skip test...'"
}
```

## README.md

README.md 就是项目的说明书，每个文件夹中的 README.md 在 github 上都会被渲染到页面上。我们在项目根目录添加的 README.md 自然就会被渲染到仓库的首页。

我们添加一些实用的 badges（徽章），例如 travis CI 的 build 状态，dependencies 版本是否过期等。badge 本质上就是一个链接，只不过文字部分换成了 svg 渲染的图片，我们可以在网站 [shields.io](https://shields.io/) 上找到各种各样的 badge，平时逛 github 项目的时候看到喜欢的 badge 可用注意收藏一下。

![badge-format.png](https://i.loli.net/2020/02/02/yw7oPEIR59zC2hr.png)

添加以下内容：

```markdown
<div align="center">

# react-typescript-boilerplate

[![Build Status](https://travis-ci.org/tjx666/react-typescript-boilerplate.svg?branch=master)](https://travis-ci.org/tjx666/react-typescript-boilerplate) [![dependencies Status](https://david-dm.org/tjx666/react-typescript-boilerplate/status.svg)](https://david-dm.org/tjx666/react-typescript-boilerplate) [![devDependencies Status](https://david-dm.org/tjx666/react-typescript-boilerplate/dev-status.svg)](https://david-dm.org/tjx666/react-typescript-boilerplate?type=dev) [![Known Vulnerabilities](https://snyk.io/test/github/tjx666/react-typescript-boilerplate/badge.svg?targetFile=package.json)](https://snyk.io/test/github/tjx666/react-typescript-boilerplate?targetFile=package.json) [![Percentage of issues still open](https://isitmaintained.com/badge/open/tjx666/react-typescript-boilerplate.svg)](http://isitmaintained.com/project/tjx666/react-typescript-boilerplate')

A boilerplate for react + typescript development

</div>
```

使用 div 的 align 属性将标题，徽章和描述居中。

## first commit

到这感觉就可以做第一次提交了：

```bash
# 添加远程仓库地址
git remote add github git@github.com:tjx666/react-typescript-boilerplate.git
# 添加所有修改到暂存区
git add -A
# 提交，使用 :tada: emoji
git commit -m ":tada: first commit, add some dotfiles"
# 推送到 github，关联 github 远程仓库和 master 分支，下次还是 master 分支就可以直接 git push 了
git push github -u master
```

推荐使用 [gitmoji-cli](https://github.com/carloscuesta/gitmoji-cli) 或者直接使用 VSCode 扩展 [Gitmoji Commit](https://marketplace.visualstudio.com/items?itemName=benjaminadk.emojis4git) 生成 git emoji。

[下一篇](https://lyreal666.com/从零开始配置-react-typescript（二）：linters-和-formatter/) 将继续介绍 linters 和 formatter 的配置。

要想了解更多细节，建议直接看源码，项目地址：[react-typescript-boilerplate](https://github.com/tjx666/react-typescript-boilerplate)。如果觉得本文对你有用，不妨赏颗 star 😁。对本文内容有疑问或者有什么改进的地方欢迎通过 github issues 和发布平台的评论区交流。

本文为原创内容，首发于[个人博客](http://www.lyreal666.com/)，转载请注明出处。
