---
title: 那些你应该考虑卸载的 VSCode 扩展
tags:
  - VSCode
categories:
  - 前端
author: YuTengjing
pubDatetime: 2020-03-28 10:36:00
featured: true
---

这篇文章可能会得罪一部分 VSCode 扩展的作者，但是我实在是看不惯网上很多的文章还在推荐一些已经过时的扩展，我觉得作为 VSCode 的老粉，我有必要写一篇文章科普一下。

在 VSCode 扩展市场目前其实存在着不少下载量特别高但是不应该再被使用的扩展，显然官方是不可能直接给你标出来哪些扩展已经被废弃了，哪些有严重 bug，纯靠扩展作者自觉。很多人新人由于没有深入去了解过，看了一些文章的介绍或者看了扩展市场的简介觉得有用就安装了，其实 VSCode 扩展安装多了会导致不少问题的：

1. **启动慢**，很多扩展是启动 VSCode 的时候就开始加载的，所以不一定是 VSCode 自身变慢了，可能是你扩展装多了。你可以通过在 VSCode 的命令面板调用命令 `Developer: Startup Performance` 查看各个扩展的在 VSCode 启动时的加载时间。
2. **扩展之间冲突**，比如安装了多个会修改代码颜色的扩展，`TODO highlight` 和 `Todo Tree` 之间
3. **功能重复**，例如：`IntelliSense for CSS class names in HTML` 和 `HTML CSS Support`
4. **CPU 占用过高**，很多被弃坑的 VSCode 扩展你去看它们 github issues 页面都可以看到一堆 issues 抱怨这个问题，例如 [import-cost](https://github.com/wix/import-cost/issues)

本文将主要从两个角度介绍一些不推荐使用的 VSCode 扩展：

1. 功能已经被 VSCode 内置
2. 维护不积极的扩展

本文只是给出一些你应该考虑卸载的理由，**不是劝说你就应该卸载它们**。有些扩展虽然有些问题，但是还是有部分功能没有被内置或者暂时没有更好的替代品，但是我觉得这些事情你应该要清楚。由于本人目前主要是用 VSCode 做前端开发，所以文章中涉及到的扩展大多是和前端相关的。

<!-- more -->

## 功能已经被 VSCode 内置

文中列出的数据为文章最后更新时的数据，不保证具有时效性，`Last updated` 为该扩展最后一次发布到 VSCode 扩展市场的时间。

### [Path Intellisense](https://marketplace.visualstudio.com/items?itemName=christian-kohler.path-intellisense)

> Last updated: 2017/5/11
>
> Issues open/close: 73/63
>
> Download: 2.7M

我经常看到一些使用 VSCode 没几天的人喷没有路径补全，我觉得很莫名其妙。可以看到这个扩展已经快 3 年没维护了，这也是一个应该放弃使用它的理由。其实如果一个工具本身功能完善，没什么 bug，没有依赖别的项目的话，长期不更新倒没什么。但实际上很多项目都会依赖别的项目，尤其是使用 JS 开发的 VSCode 扩展，经常可以看到各种 npm 包报安全漏洞，最近一次影响比较大的应该是 [acorn](https://app.snyk.io/vuln/SNYK-JS-ACORN-559469)。

其实 VSCode 自身已经支持在 `import/require` 也就是导入语句中使用路径补全，**但是在其它场景中写路径字符串时还是没有提示**。如果你觉得**在导入语句中有路径补全已经能够满足你的使用需求**，那我觉得这个插件可以考虑卸载了。类似的还有 [Path Autocomplete](https://marketplace.visualstudio.com/items?itemName=ionutvmi.path-autocomplete)。

![path-intellisense](https://i.loli.net/2020/04/05/ERa7hkMz5G1fuU2.gif)

### [Auto Close Tag](https://marketplace.visualstudio.com/items?itemName=formulahendry.auto-close-tag)

> Last updated: 2018/2/17
>
> Issues open/close: 100/59
>
> Download: 2.6M

从侧边栏可以看到我一个扩展都没打开，实测在 `HTML`, `js`, `jsx`, `tsx` 文件中已经内置支持自动闭合标签功能，**但是 `vue` 还是不支持**，可以看一下我提的 issue：[auto close tag doesn't work in vue file](https://github.com/microsoft/vscode/issues/94614)。

这个扩展的作者开发了很多优秀的 VSCode 扩展，包括这个和下面的 `Auto Rename Tag`，最有名的应该是 [Code Runner](https://marketplace.visualstudio.com/items?itemName=formulahendry.code-runner)。我觉得有些扩展的功能被内置一方面也是好事，毕竟人的精力是有限的，维护开源项目还是很累的。

![auto close tag](https://i.loli.net/2020/04/05/pra1S8Is4GmDzhf.gif)

### [Auto Rename Tag](https://marketplace.visualstudio.com/items?itemName=formulahendry.auto-rename-tag)

> Last updated: 2019/10/27
>
> Issues open/close: 453/71
>
> Download: 2.6M

直接使用快捷键 `F2` 重构即可，不需要安装扩展。`auto close tag` 和 `auto rename tag` 的扩展包 [Auto Complete Tag](https://marketplace.visualstudio.com/items?itemName=formulahendry.auto-complete-tag) 也可以考虑卸载了。

通过设置 `"editor.renameOnType": true`（默认没开启），你可以达到和 `auto rename tag` 一毛一样的效果 , 如果你想只在某种特定语言中开启这个特性，可以参考下面的配置：

```javascript
// settings.json
"[html]": {
    "editor.renameOnType": true,
  },
```

还有一款也是这个作者开发的扩展 [Terminal](https://marketplace.visualstudio.com/items?itemName=formulahendry.terminal) 早就在 `2017/7/22` 就不维护了，下载量高达 `581 K`。不维护的理由作者在扩展主页上也说了，一个是 `Code Runner` 的功能比它还多，另一个是 VSCode 已经内置了这个扩展的部分功能。

![auto rename tag](https://i.loli.net/2020/04/05/8KLV6RyX3W4oewI.gif)

### [npm Intellisense](https://marketplace.visualstudio.com/items?itemName=christian-kohler.npm-intellisense)

> Last updated: 2017/2/23
>
> Issues open/close: 27/19
>
> Download: 2M

这个扩展的功能是支持在导入语句中提供 npm 模块补全，从最后更新时间来推测这个功能应该 3 年前就被内置支持，但是下载量很恐怖啊，github 上还能看到 9 天前提的 issue，人间迷惑行为。

和这个扩展功能相同，下载量同样非常高的另一个扩展是：[Node.js Modules Intellisense](https://marketplace.visualstudio.com/items?itemName=leizongmin.node-module-intellisense)。

### [Document This](https://marketplace.visualstudio.com/items?itemName=joelday.docthis)

> Last updated: 2018/6/4
>
> Issues open/close: 64/124
>
> Download: 638K

VSCode 已经内置自动生成 `jsdoc` 和注释补全功能。

![document this](https://i.loli.net/2020/04/05/px9zE6YTWNUy2ni.gif)

### [HTML Snippets](https://marketplace.visualstudio.com/items?itemName=abusaidm.html-snippets)

> Last updated: 2017/12/28
>
> Issues open/close: 19/21
>
> Download: 3.3M

这个扩展的下载量充分说明了有些人安装扩展只看名字，但凡瞅一眼这个扩展的主页也不会安装了：

![HTML Snippets](https://i.loli.net/2020/04/06/rGvmgTkSwdhRJC8.png)

### TypeScript 相关

扩展市场里面搜索 `TypeScript`，勾选按照安装数量排序，前面几个最流行的和 `TypeScript` 相关的扩展的功能基本上全部已经被 VSCode 内置。VSCode 自身就是使用 TypeScript 编写的，TypeScript 相关实用特性开发排期的优先级必然很高。所以我觉得其实 VSCode 没必要安装什么 TypeScript 基础特性相关的扩展，例如什么模块的自动导入啊，模块名的重构啊。VSCode 还在积极发展嘛，虽说 VSCode 还不算是个 IDE，但是事实上把它当作 IDE 做开发的开发者真不少，尤其是前端开发，所以那些基础特性即便是现在没内置，必然在将来某个版本会被内置。 [Auto Import](https://marketplace.visualstudio.com/items?itemName=steoates.autoimport), [TypeScript Hero](https://marketplace.visualstudio.com/items?itemName=rbbit.typescript-hero), [TypeScript Importer](https://marketplace.visualstudio.com/items?itemName=pmneo.tsimporter), [Move TS](https://marketplace.visualstudio.com/items?itemName=stringham.move-ts) 都可以考虑卸载了。安装量最高的 `auto import` 下载量高达 867K，最少的都有 250 多 K。

## 维护不积极

### [Color Highlight](https://marketplace.visualstudio.com/items?itemName=naumovs.color-highlight)

> Last updated: 2017/7/12
>
> Issues open/close: 49/25
>
> Download: 894K

可以考虑 [vscode-colorize](https://github.com/KamiKillertO/vscode-colorize) 作为替代品。

### [TODO Highlight](https://marketplace.visualstudio.com/items?itemName=wayou.vscode-todo-highlight)

> Last updated: 2018/7/22
>
> Issues open/close: 45/93
>
> Download: 953K

推荐替代品 [Todo Tree](https://marketplace.visualstudio.com/items?itemName=Gruntfuggly.todo-tree)，下面是参考了 `TODO Highlight` 源码中的色彩配置修改 `Todo Tree` 配置的后使用效果：

![todo tree](https://i.loli.net/2020/04/05/keiXn1vZKf9gHTp.png)

推荐配置：

```javascript
// settings.json
"todo-tree.general.tags": ["TODO:", "FIXME:"],
"todo-tree.highlights.defaultHighlight": {
    "gutterIcon": true
},
"todo-tree.highlights.customHighlight": {
    "TODO:": {
        "foreground": "#fff",
        "background": "#ffbd2a",
        "iconColour": "#ffbd2a"
    },
    "FIXME:": {
        "foreground": "#fff",
        "background": "#f06292",
        "icon": "flame",
        "iconColour": "#f06292"
    }
}
```

### [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)

> Last updated: 2019/4/17
>
> Issues open/close: 332/326
>
> Download: 4.8M

`live server` 确实是个好东西，能让你修改 HTML 代码时自动刷新网页，最主要的是它是以真实的服务器托管的网页，而不是像我们直接用浏览器打开文件时是使用 `file://` 协议托管的，更贴近实际生产环境，`file://` 协议还会导致跨域等问题。

这个扩展其实从更新时间上来看也不算太长没更新，主要是你去它的 [github issue 页面](https://github.com/ritwickdey/vscode-live-server/issues) 一看，有很多和性能相关的 issues，这个扩展的作者是个印度小哥，在扩展市场的主页也置顶说了他最近非常忙，在找人维护这个项目。

我翻看了这个作者的 github 仓库，发现他 fork 过 [liver-server](https://github.com/tapio/live-server) 这个 npm 包，但是这个包 18 年 10 月就不更新了。目前我也没发现合适的替代品，有需要的读者我觉得可以继续用。

![live server](https://i.loli.net/2020/04/06/HVEZhbjR1m8egWo.png)

### [Bracket Pair Colorizer 2](https://github.com/CoenraadS/Bracket-Pair-Colorizer-2)

> Last updated: 2019/11/29
>
> Issues open/close: 187/38
>
> Download: 779K

进 [github issues 页面](https://github.com/CoenraadS/Bracket-Pair-Colorizer-2/issues) 看，一堆 issues 没人理，和很多不维护的扩展一样，最多的就是导致 CPU 占用过高的问题。这个功能我感觉官方不太可能会集成，搜了一下 VSCode 中这个作者提的 [issues](https://github.com/microsoft/vscode/issues/created_by/CoenraadS)，将近有 60 个，但也没提 issue 让官方考虑集成这个功能。有评论问我这个扩展有啥好的替代品，我其实也没发现什么好的替代品，有一个同类型的 [Rainbow Brackets](https://marketplace.visualstudio.com/items?itemName=2gua.rainbow-brackets) 更不靠谱，它 16 年 5 月 9 号上架的，5 月 12 号到现在就一直没更新过，总共也就维护了几天。我目前就是使用内置的缩进线，其实也够用了，而且我发现自从不用这个插件，代码的配色都清爽多了。

另一个和缩进线相关的扩展 [indent-rainbow](https://marketplace.visualstudio.com/items?itemName=oderwat.indent-rainbow) 也有一年没维护了。

### [import-cost](https://github.com/wix/import-cost)

> Last updated: 2018/11/30
>
> Issues open/close: 81/57
>
> Download: 581K

`import-cost` 是 [wix](https://github.com/wix) 开源项目下的 VSCode 扩展之一，另一个下载量比较高的扩展是 [glean](https://github.com/wix/vscode-glean)，是一个 `React` 重构扩展。想当初我刚入坑 VSCode 的时候这是当时被安利率最高的扩展之一。和前面说的几个扩展一样，有 CPU 占用过高的 issues，没人维护了。

### [Output Colorizer](https://github.com/IBM-Cloud/vscode-log-output-colorizer)

> Last updated: 2017/7/6
>
> Issues open/close: 10/13
>
> Download: 240K

冲这最后更新时间我也不敢用了啊，从 [issues](https://github.com/IBM-Cloud/vscode-log-output-colorizer/issues) 来看都说这个扩展的功能已经失效。如果你只是想要 log 文件有色彩高亮的话，我觉得不需要安装扩展，貌似这是 VSCode 主题应该做的事情，默认主题已经支持 log 文件色彩高亮：

![log highlight](https://i.loli.net/2020/04/06/xVN8Qh7XRvpy4kH.png)

### [SVG Viewer](https://github.com/cssho/vscode-svgviewer)

> Last updated: 2019//28
>
> Issues open/close: 21/20
>
> Download: 431K

这个扩展是个日本小哥开发的，该项目已经放弃维护，[github 仓库](https://github.com/cssho/vscode-svgviewer) 都已经被封存了，推荐国人开发的替代品：[vscode-svg2](https://github.com/lishu/vscode-svg2)。

### [Regex Previewer](https://github.com/chrmarti/vscode-regex)

> Last updated: 2018/4/27
>
> Issues open/close: 23/13
>
> Download: 172K

推荐在线工具 [regex101](https://regex101.com/#javascript)。

### [vscode-fileheader](https://marketplace.visualstudio.com/items?itemName=mikey.vscode-fileheader)

> Last updated: 2016/8/10
>
> Issues open/close: 19/5
>
> Download: 143K

这个扩展自从第一次发布之后就一直没更新过... 推荐国人开发的替代品：[koroFileHeader](https://marketplace.visualstudio.com/items?itemName=OBKoro1.korofileheader)。

### [XML Tools](https://marketplace.visualstudio.com/items?itemName=DotJoshJohnson.xml)

> Last updated: 2019/6/1
>
> Issues open/close: 53/171
>
> Download: 1.7M

从 [github issues](https://github.com/DotJoshJohnson/vscode-xml/issues) 来看貌似没人维护了，同类的推荐替代品是红帽的 [XML](https://github.com/redhat-developer/vscode-xml)。

## 其它一些不推荐使用的扩展

### [TSLint](https://marketplace.visualstudio.com/items?itemName=ms-vscode.vscode-typescript-tslint-plugin)

如果你还不知道 tslint 去年年初就被废弃了，并且现在是以插件的形式被集成到 ESLint 了，那你可能是个假前端。

### [Beautify](https://github.com/HookyQR/VSCodeBeautify)

VSCode 内置的格式化器就是使用 [js-beautify](https://github.com/beautify-web/js-beautify)，但是前端界当前最流行的格式化工具是 [prettier](https://prettier.io/)，建议安装 `prettier`，然后设置 VSCode 使用 `prettier` 作为格式化器。同样的道理，下载量奇高的 [JS-CSS-HTML Formatter](https://marketplace.visualstudio.com/items?itemName=lonefy.vscode-JS-CSS-HTML-formatter), [Prettify JSON](https://marketplace.visualstudio.com/items?itemName=mohsen1.prettify-json) 等格式化插件也不推荐安装。

```javascript
// settings.json
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
"[vue]": {
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
"[markdown]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
},
"[yaml]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

### [jshint](https://github.com/Microsoft/vscode-jshint)

就没见几个开源项目还在用 `jshint`，推荐使用 [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)。

### [JavaScript (ES6) code snippetsJavaScript (ES6) code snippets](https://marketplace.visualstudio.com/items?itemName=xabikos.JavaScriptSnippets)

如果你平时开发 `React`，那你极大可能也安装了 [ES7 React/Redux/GraphQL/React-Native snippets](https://marketplace.visualstudio.com/items?itemName=dsznajder.es7-react-js-snippets)，你可以去对比它俩提供的 `snippets`，后者基本上覆盖了前者提供的 `snippets`，除了 `commonjs` 的导入语句，也就是说后者没有 `rqr` 和 `mde` 的两个代码片段。`snippets` 扩展装多了是会影响代码提示的速度的，因为每次显示的补全列表都是到对应语言的 `snippets` 里面过滤出来的。

### [GitHub](https://marketplace.visualstudio.com/items?itemName=KnisterPeter.vscode-github)

这个扩展的作者推荐使用 github 官方开发的 [GitHub Pull Requests](https://marketplace.visualstudio.com/items?itemName=GitHub.vscode-pull-request-github) 作为替代品。

![github](https://i.loli.net/2020/04/06/7Rxehr6Y4syS892.png)

### [IntelliSense for CSS class names in HTML](https://marketplace.visualstudio.com/items?itemName=Zignd.html-css-class-completion)

![CSS](https://i.loli.net/2020/04/06/olqhvOL4mp9YWZn.png)

[HTML CSS Support](https://marketplace.visualstudio.com/items?itemName=ecmel.vscode-html-css) 和 [IntelliSense for CSS class names in HTML](https://marketplace.visualstudio.com/items?itemName=Zignd.html-css-class-completion) 是功能差不多两个扩展，我更推荐使用前者，原因是它的贡献者中有 VSCode 的核心开发人员。

### 如何推荐别人使用一些扩展

我们可以在项目根目录的 `.vscode/extensions.json` 文件中配置一些推荐和不推荐使用的扩展，在扩展市场选择 `Show Recommended Extensions` 就可以看到我们推荐的扩展。

```javascript
// .vscode/extensions.json
{
    "recommendations": [
        "editorconfig.editorconfig",
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "yutengjing.view-github-repository",
        "yutengjing.open-in-external-app"
    ],
    "unwantedRecommendations": [
        "hookyqr.beautify",
        "ms-vscode.vscode-typescript-tslint-plugin",
        "dbaeumer.jshint"
    ]
}
```

![recommend extensions](https://i.loli.net/2020/04/06/knPYOr1tpDUB43J.png)

## 最后

VSCode 最近几个月一直都在做设置同步的功能，也就是 [Settings Sync](https://marketplace.visualstudio.com/items?itemName=Shan.code-settings-sync) 做的事情，估计正式上线后这个扩展也可以考虑卸载了。以前写过推荐 VSCode 扩展的文章，那时我安装的扩展有 100 多个，现在也就将近 50 个左右，是越来越挑剔了。我自己也写了两个简单的扩展 [View GitHub Repository](https://marketplace.visualstudio.com/items?itemName=YuTengjing.view-github-repository) 和 [Open in External App](https://marketplace.visualstudio.com/items?itemName=YuTengjing.open-in-external-app)，之前开发扩展后还提炼了一个 VSCode 扩展开发模板：[vscode-extension-boilerplate](https://github.com/tjx666/vscode-extension-boilerplate)，感兴趣的读者可以了解下。如果文章有什么错误之处或者读者有什么推荐的更好的替代品，欢迎在评论区指出。

最后奉上我的 VSCode 扩展 gist 地址：[cloudSettings](https://gist.github.com/tjx666/daa6317cf80ab5f467c50b2693527875)，可以搭配 [Settings Sync](https://marketplace.visualstudio.com/items?itemName=Shan.code-settings-sync) 使用。
