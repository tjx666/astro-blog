---
title: 【CEP 扩展开发一】简介
description: 待补充描述
pubDatetime: 2024-02-10
---

## 写作目的

Adobe 毫无疑问是设计软件行业的垄断巨头，旗下的 PS，AE 等都是搞设计和自媒体的必装软件。有很多小公司的产品其实本质上是依赖这些设计软件生存的，例如开发 AE 特效插件的公司，例如使用 PS 开发海报模板的我司。

**其实 CEP 扩展的开发生态是相当的恶劣**，中文资料不能说少，简直可以说是没有，质量不错的一只手可以数得过来。国外的资料相对多一点，但还是很少，主要还是以论坛，github 仓库, stackoverflow 提问的形式散落在各处，大多数文章的内容也很浅。

笔者将近一年时间的主要工作就是为 AE 和 PS 开发 CEP 扩展，各上线了一个扩展。踩过很多坑，也有很多的技术沉淀。我写这一系列教程的主要目的在于：

1. 思考总结，知识沉淀
2. 帮助新人快速入门，减少踩坑
3. 优化 CEP 扩展开发的生态环境，教你怎么最大限度的使用现代化的前端技术开发 CEP 扩展

## Adobe 插件种类

大致可以分成以下几类：

- ExtendScript 脚本
- 面板插件

  - Flash 面板插件
  - CEP 面板插件
  - UXP 面板插件

- 独立客户端
- C++ 插件

### ExtendScript 脚本

![ExtendScript 脚本](https://s2.loli.net/2022/04/25/kjoIGRTEpc29g8u.png)

ExtendScript 是 ECMAScript3 的一种方言，和 JavaScript 基本上语法一样，不过集成了一些例如指令，模块化，反射系统，三引号字符串，操作符重载等语法特性。文件后缀名是 `.jsx`（不是 react 用的那个 JS 的 DSL），**所以 ExtendScript 又被称为 jsx**。由宿主（**例如 PS, AE, PR 等设计软件自身都叫宿主**）实现的 ExtendScript 引擎解释执行，不同宿主都能解释执行 jsx，但是底层实现以及注入的宿主特有的 API 不一样。

通过以下 jsx 代码查看 jsx 的引擎信息：

```javascript
$.about();
```

![about](https://s2.loli.net/2022/04/25/XweDa6QH7kGTF1R.png)

其实如果你不调用宿主特有的 API 或者针对不同的宿主做了兼容，那么 JSX 脚本就是兼容所有 adobe 设计软件的。既可以跑在 PS 上也能跑在 AE, InDesign 上，只要你跑的那个平台实现了 JSX 引擎（貌似绝大多数都实现了）。

ExtendScript 可以调用宿主的各种 API，例如在 AE 中可以访问图层信息，调用渲染队列输出媒体资源，也有原生能力例如读写文件，还可以使用内置的各种窗口和控件接口去创建图形界面。因此它完全可以作为一种插件形式去实现独立的功能。

不带界面的例如可能很多人用过的这个用来优化 PSD 体积的 jsx 脚本：[一键压缩 PSD 文件从 GB 变为 MB](https://github.com/julysohu/photoshop_deep_cleaner)

再例如 github 上 1.2k star 的一个将 psd 图层导出为文件的工具：[Photoshop-Export-Layers-to-Files-Fast](https://github.com/antipalindrome/Photoshop-Export-Layers-to-Files-Fast)，这个工具使用 jsx 搞了个的对话框。

![Photoshop-Export-Layers-to-Files-Fast](https://s2.loli.net/2022/04/25/LosJhwSniUVQvrc.png)

其实 adobe 软件支持的脚本语言并不只有 ExtendScript，例如在 PS 其实是支持：`Apple Script`, `VBScript` 和 `ExtendScript`，具体可以查看软件对应的文档：[Photoshop Scripting](https://github.com/Adobe-CEP/CEP-Resources/tree/master/Documentation/Product%20specific%20Documentation/Photoshop%20Scripting)。

#### 优缺点

优点：

- 方便分享，本质上就是一个或多个 .jsx 后缀的文本文件，多个 jsx 文件可以使用 [jsxbin](https://www.npmjs.com/package/jsxbin) 打包成单个二进制文件。用户可以直接通过菜单直接加载执行
- 界面风格非常贴近宿主界面：ScriptUI 是对 JSX 内置的图形界面框架的统称，例如上面那个导出 psd 图层为文件的工具的界面，可以看出使用 ScriptUI 构建的界面风格非常贴近宿主的原生界面风格
- 方便复用：CEP 插件涉及到对宿主的访问都需要调用 JSX 脚本，这样的话，你用 JSX 脚本使用的功能其实很容易复用到 CEP 插件中。比如你在开发 CEP 扩展的某个功能的时候你就可以直接去把别人实现好的 JSX 代码直接拷过来调用

缺点：

- 构建界面不够灵活：ScriptUI 只能使用内置组件构建界面，如果涉及到画图表或者更复杂的界面就不行了，不像 CEP 扩展是完全使用前端技术构建界面
- 网络请求不方便：ScriptUI 网络请求非常底层，需要用 socket 对象请求，不像 CEP 扩展可以使用浏览器环境的 xhr 和 nodejs 的 httpClient
- 不支持异步：jsx 环境没有定时器，文件操作也没有异步形式。AE 环境倒还是定时器接口让代码异步执行，PS 环境那是彻底的木有办法异步执行代码。相对而言，CEP 可以使用 nodejs 来进行异步 IO 操作，甚至还可以使用子进程，web worker 来执行重计算任务防止阻塞界面渲染。

### 面板插件

所谓面板插件，指的是界面是面板形式的插件，例如用于导出 [lottie](https://airbnb.io/lottie) 动画数据的 [bodymovin](https://github.com/bodymovin/bodymovin-extension)。由于是界面是面板的形式，因此它们可以悬浮显示，也可以内嵌到 workspace 布局中。

![bodymovin](https://s2.loli.net/2022/04/25/dZxuoPXQzYhBHNE.gif)

实际上你也可以开发一个无界面的面板扩展，虽然在 windows -> extensions 菜单中会显示出来，但是点击后不会弹出界面。像 bodymovin 其实就使用了这么一个无界面的面板扩展来启动一个 node server，用来提供例如图片压缩等服务。

#### Flash 面板插件

在 CS6 以前，开发面板扩展只能通过 flash。但是众所周知 adobe 早就宣布放弃 flash 技术转投 html 的怀抱，从 CC2014 开始直接废弃了 flash 的插件架构，这也是为什么你看到很多以前用的插件都无法再 CC2014/15 上跑起来。说实话，我对这类插件一点都不了解，没有开发过，甚至都没见过这类插件。

#### CEP 面板插件

在 AE 中，就像上面 GIF 图中展示的那样，你通过菜单 Window -> Extensions 的下拉列表打开的就是 CEP 扩展了。

CEP([Common Extensibility Platform](https://github.com/Adobe-CEP/CEP-Resources/blob/master/CEP_11.x/Documentation/CEP%2011.1%20HTML%20Extension%20Cookbook.md)) 扩展的界面是使用 Chromium 渲染的，采用的是 CEF（Chromium Embedded Framework） 架构。CEF 简单理解就是将浏览器嵌入到其它应用中让我们可以直接使用前端技术去开发界面，electron, nwjs，tauri 是 CEF 架构的代表框架了。这类框架除了是使用前端技术开发界面，runtime 往往都还搞成混合型的，例如开启了 node 集成的 electron 和 nwjs 的浏览器窗口的运行时都是 web runtime 和 nodejs runtime 的复合 runtime。

> ### Chromium Embedded Framework (CEF)
>
> CEP HTML engine is based on Chromium Embedded Framework version 3 (CEF3). You can find more information about CEF [here](http://code.google.com/p/chromiumembedded/). Here are the versions used in CEP:
>
> | Component            | CEP 9.0                   | CEP 10.0                  | CEP 11.1                    |
> | -------------------- | ------------------------- | ------------------------- | --------------------------- |
> | CEF 3                | CEF 3 release branch 3163 | CEF 3 release branch 3729 | CEF 3 release branch - (88) |
> | Chromium             | 61.0.3163.91              | 74.0.3729.157             | 88                          |
> | Node.js              | Node.js 8.6.0             | Node.js 12.3.1            | Node.js 15.9.0              |
> | CEF/Node integration | Node-Webkit 0.25          | Node-Webkit 0.38          | Node-Webkit 0.50.1          |
> | v8                   | 6.3.292.49                | 7.4.288                   | 8.7                         |

其实 CEP 的架构和[从 HTML 页面启动的 nwjs](https://www.electronjs.org/docs/latest/development/electron-vs-nwjs#1-entry-of-application) 最像，每一个 CEP 扩展本质就是本地的一个文件夹，**打开一个 CEP 扩展其实就是就是去渲染 manifest.xml 指定的一个 HTML 文件**。

看一个典型的 CEP 扩展目录：[AfterEffectsPanel](https://github.com/Adobe-CEP/Samples/tree/master/AfterEffectsPanel)

![CEP 扩展目录](https://s2.loli.net/2022/04/26/wWVAz5aR34oKrGD.png)

#### UXP 面板插件

[UXP](https://developer.adobe.com/photoshop/uxp/guides/#the-uxp-technology-stack) (**U**nified E**x**tensibility **P**latform)是下一代的面板插件架构，未来 CEP 扩展的结局会和 Flash 插件一样被废弃，并被 UXP 架构取代。

官方文档有提到 UXP 和 CEP 的优劣势对比：[UXP for CEP Developers](https://developer.adobe.com/photoshop/uxp/2022/guides/uxp_for_you/uxp_for_cep_devs/)。我这意译一下：

CEP 的劣势：

- CEP 使用完整的 Chromium 渲染 web，非常的吃资源，开多个 CEP 插件的时候更甚
- CEP 并不能直接访问宿主，需要写 jsx 代码访问宿主。实际开发时你要写两端代码，一份是 jsx，一份是浏览器环境代码，分别被两个不同的 js 引擎执行，互相调用很不方便
- CEP 插件不能使用原生控件，你需要编写很多 CSS 样式才能与原生面板和对话框的样式风格匹配
- jsx 的 ECMAScript 规范版本很低，你需要在浏览器的高版本 ECMAScript 和 jsx 的 ECMAScript3 来回切换

UXP 的优势：

- UXP 可以直接沟通宿主，不需要编写 jsx
- UXP 官方有提供一个插件启动器和自定义的 Chrome Dev Tools 用于 debugger，比起 CEP 开发更简单
- UXP 可以使用 [Spectrum CSS](https://opensource.adobe.com/spectrum-css/) 组件库来，这个组件库支持自动切换主题而且是跨平台的，能够让你开发的面板看起来和应用本身风格一致

相对于 CEP，一个很明显的优势是可以直接在浏览器环境代码中直接访问宿主，不需要像 CEP 那样通过 evalScript 或者 evalFile 调用 jsx 代码来访问宿主，在 CEP 中浏览器环境的代码和 jsx 代码是完全隔离的。

例如同样实现获取当前打开的 PSD 文件名，CEP 中代码是这样的：

```html
<script>
  // 需要执行 jsx 代码
  var jsxScript = 'activeDocument.name';
 window.__adobe_cep__.evalScript(jsxScript, function(name) {
  console.log(name)
 });
<script/>
```

在 UXP 里面你只需要：

```html
<script>
  // 直接使用宿主模块
  const app = require("photoshop").app;
  const doc = app.activeDocument;
  console.log(doc.name);
</script>
```

UXP 扩展还处在发展中，目前只有 PS2021 及其以上的版本支持 UXP 扩展，而且目前还有很多 PS 宿主的 API 没有暴露出来。

对于 PS 这个宿主而言，UXP 比起 CEP 还有一个巨大优势是 UXP 扩展的宿主 API 是支持异步的。这在 CEP 中是完全做不到的，PS 中的 jsx 是完全没有异步支持的。目前 PS 有一个限制，如果你在 CEP 扩展中调用 jsx 代码，那么会直接阻塞所有 CEP 扩展的代码执行和渲染，也就是说浏览器代码和 JSX 代码是互斥的。举个直观点的例子，你在 CEP 调用 jsx 读取一个很大的文件，然后在 CEP 面板放了一张 GIF 图，那么在读取文件期间，这个 GIF 图会卡住不动，直到 jsx 代码执行完，才会开始播放。这个问题目前是无解的，相关的讨论可以移步：[[BUG] The CSInterface.evalScript API blocks on macOS](https://github.com/Adobe-CEP/CEP-Resources/issues/163)。因此你如果想实现类似调用一个 jsx 接口，然后在面板中渲染 jsx 执行进度的进度条的功能，这在 PS 的 CEP 扩展中是没法实现的。

以前我在公司的交流群里经常开玩笑说 PS 是 adobe 的亲儿子，很大一部分原因就是因为 UXP 先支持 AE 平台。后来我真正开始写 PS 的 CEP 扩展的时候，我改变了我的看法，我觉得 UXP 先支持 PS 可能是因为 PS 的 CEP 开发环境太烂。在 AE 中开发 CEP 扩展基本上 JSX 提供的 DOM API 就能满足日常开发，但是 PS 的 jsx DOM API 只能满足大概日常开发的 30% - 40%，剩下的要写 ActionManager 代码，ActionManager 是一套调用底层 C++ 代码的框架，写起来贼恶心。

### 独立客户端

你可以实现一个独立于宿主软件之外的客户端来给它们提供扩展能力。本质上，其实你只需要有办法去调用宿主 API，能和宿主通信即可。通信的方式有很多，如果你是使用 VB 构建的界面，你可以使用 ps 的 com 库。如果你是用 electron 写的客户端，那么你可以用 osascript 去执行一段 jsx 代码。笔者开发的一个 VSCode 扩展 [Adobe Extension Development Tools](https://marketplace.visualstudio.com/items?itemName=YuTengjing.adobe-extension-devtools) 提供了 AE 合成 Outline 功能，获取 AE 合成信息时本质上就是通过 osascript 去执行了一段 jsx 代码。

![AE Composition Outline](https://s2.loli.net/2022/04/27/Q39sKIUPeEOZcql.gif)

### C++ 插件

每一个 adobe 的设计软件都提供了对应的 c++ 插件开发 SDK，它们自身就是用 c++ 开发。C++ 插件在所有插件中无疑是获取宿主信息最全面，性能最强的插件类型。可以说如果有哪个能力 c++ 插件做不到，别的插件类型那就不用想了。

由于开发 c++ 插件需要使用对应宿主提供的 c++ SDK，因此 c++ 插件显然不是跨平台的。其实这也可以从插件的存放路径可以看出来，c++ 插件一般存放在宿主应用的 Plugins 目录下，例如 Mac 上 AE 的 c++ 插件就放在：

```bash
/Applications/Adobe After Effects 2021/Plug-ins/xxx.plugin
```

对比而言，用户级别的 CEP 插件是放在：

```bash
~/Library/Application Support/Adobe/CEP/xxx
```

可以看到 CEP 扩展存放路径并不是和某个宿主关联的，这意味着**所有宿主**在启动时都会去加载**所有的 CEP 插件的配置文件**。在 CEP 的配置文件中你是可以配置它兼容的宿主的，所有也不是说 AE CEP 插件会出现在 PS 中。

在 AE 中，出现在特效和预设面板的中的第三方插件都是 c++ 插件。给 AE 新增一种特效这在 JSX 中是做不到的，只能通过 c++。涉及到对应用中的二进制数据计算的功能也是没法通过 jsx 实现的，jsx 中都没有 buffer 对象，nodejs 倒是可以读取本地文件，但是也没办法读取编辑中的合成使用到的媒体资源的二进制数据。After Codes 是一个可以给 AE 和 PR 提供丰富的导出格式和对导出媒体文件压缩能力的扩展，例如 AE 渲染队列是不支持导出 mp4 格式的，通过它可以导出 mp4，并可以设置导出的 mp4 的压缩级别。由于需要读取和计算合成中的媒体资源二进制数据，因此显而易见是个 c++ 插件。

在 PS 中倒是可以使用生成器插件来使用 nodejs 对 psd 的图像二进制数据进行读取，而且还是异步的，感兴趣的可以阅读这篇文章：[生成器](https://blog.cutterman.cn/2022/02/12/generator/)。

![c++ plugin](https://s2.loli.net/2022/04/27/kW8MsuHFRGeDoc6.png)

## 新人疑问

回答一些刚接触 CEP 开发的新人的疑问。

### 写 CEP 扩展是不是需要精通设计软件？

不需要。

想当初我被 leader 叫去写 AE 插件的时候，我 AE 一次也没用过。当时自己也是有这个疑虑，自己对 AE 完全陌生，是否能胜任 AE 的插件开发。实际上作为一个合格的程序员，是不应该有软件会不会用这种问题的。合格的程序员都具备一定的英文阅读能力，再不济你也可以用翻译软件。程序员尤其是 GUI 程序员对界面交互的理解肯定是强于普通人的，那么这样设计给普通人使用的软件对于程序员来说肯定是更容易上手，而且设计软件的用户入门级资料无论是中文还是英文的都一大堆。实际在做的一个插件的时候也是分成很多模块去开发，你只需要慢慢把各个模块涉及到的 AE 功能了解清楚就行了。例如当你要做导出的时候，你再去了解渲染队列也不迟。

### CEP 还是 UXP

首先，UXP 目前只支持 PS 平台，如果你是给 PS 以外的 adobe 软件开发面板插件，那你只能选 CEP，CEP 扩展支持的平台很多：

| Application   | Host ID   | CC 2019 Version | CC 2020 Version | FY 2020          | FY2021        |
| ------------- | --------- | --------------- | --------------- | ---------------- | ------------- |
| Photoshop     | PHSP/PHXS | 20 (CEP 9)      | 21 (CEP 9)      | 22.0 (CEP 10)    | 23.0 (CEP 11) |
| InDesign      | IDSN      | 14 (CEP 9)      | 15 (CEP 9)      | 16.0 (CEP 10 )   | 16.3(CEP 11)  |
| InCopy        | AICY      | 14 (CEP 9)      | 15 (CEP 9)      | 16.0 (CEP 10 )   | 16.3(CEP 11)  |
| Illustrator   | ILST      | 23 (CEP 9)      | 24 (CEP 9)      | 25.0 (CEP 10)    | 25.3(CEP 11)  |
| Premiere Pro  | PPRO      | 13 (CEP 9)      | 14 (CEP 9)      | 14.4 (CEP 10)    | 15.4(CEP 11)  |
| Prelude       | PRLD      | 8 (CEP 9)       | 9 (CEP 9)       | 10.0(CEP 10)     | 10.1(CEP 11)  |
| After Effects | AEFT      | 16 (CEP 9)      | 17 (CEP 9)      | 17.1.4 (CEP 10)  | 18.4(CEP 11)  |
| Animate       | FLPR      | 19 (CEP 9)      | 20 (CEP 9)      | 21.0 (CEP 10)    | 22.0(CEP 11)  |
| Audition      | AUDT      | 12 (CEP 9)      | 13 (CEP 9)      | 13.0.10 (CEP 10) | 14.4(CEP 11)  |
| Dreamweaver   | DRWV      | 19 (CEP 9)      | 20 (CEP 9)      | 21.0 (CEP 10)    | 22.0(CEP 11)  |
| Bridge        | KBRG      | 9 (CEP 9)       | 10 (CEP 9)      | 11.0 (CEP 10)    | 12.0(CEP 11)  |
| Rush          | RUSH      | 1 (CEP 9)       | 1.2.1 (CEP 9)   | 1.5.29 (CEP 10)  | 2.1(CEP 11)   |

如果你是要给 PS 开发面板插件，目前 2022 年 4 月这个时间点我还是建议选择 CEP 扩展。理由是：

- 目前 UXP 插件架构还处在开发阶段，很多 api 还没暴露出来。虽然你可以用 [batchPlay](https://developer.adobe.com/photoshop/uxp/2022/ps_reference/#batchplay)（类似于 jsx 中的 ActionManager 去调内部的接口），不过它也和 ActionManager 一样写起来很麻烦。UXP 目标肯定是希望最终用户能不用 batchPlay 就能完成插件开发工作
- 根据我的观察，我周围的设计师群体 PS 版本普遍滞后于最新版本 3 ~ 5 个版本，对应到就是版本大多停留在 2019 以前，UXP 目前只支持 PS2021 及其以上，这样你开发出来用户用不了也是白搭

如果你是自己的玩票项目，那我觉得你可以无脑上 UXP。

### 开发 CEP 插件需要什么基础？

首先你必须具备**前端开发基础**，你只要会前端三件套 HTML, CSS, JavaScript 就能开发简单的 CEP 插件了。如果你还在使用 10 年前那样没有模块化，没有打包工具的时代那套开发方式，那开发复杂的插件就很不方便了。后面我会单独拿一章来介绍怎样使用现代化的开发方式来开发 CEP 扩展。

最好具备**一定的英文阅读能力**，之前就有说了，国内的 CEP 相关资料简直可以说是没有。你可能需要 Google 遇到的问题，通过阅读 stackoverflow 上的问答，官方论坛的讨论等去寻找答案。而且目前我还没发现各种官方文档资料有对应的中文翻译版，全是英文的。

### 怎样 Google ？

首先，你别指望百度那个广告阅读器能搜出啥有用的信息。

这里的技巧主要是指搜索的关键字：

- 请带上宿主名称，搜 AE 的资料就带上 ae 就行了。搜 ps 的资料你搜 ps 没用的，搜出来全是 powershell 的内容，搜 ps 的资料一定要全拼 photoshop
- 搜索 jsx 相关的问题请带上 `script` 关键字，不带上的话搜出来的很可能是那些针对普通用户的使用入门教程。例如你想了解 AE jsx 的关键帧的 API，你可以自己对比下搜 `ae script keyframe` 和 `ae keyframe` 的结果。如果带上 `script` 搜出来的结果不理想，试试换成 `scripting`, `extendscript`

比较靠谱的网站有 [stackoverflow](https://stackoverflow.com/)，[Adobe Support Community](https://community.adobe.com/)，[creativecow.net](https://creativecow.net/forums/)，直接 google 搜不到，可以试试这几个网站的站内搜索，再搜不到可以去 github 碰碰运气。

### 扩展 vs 插件

扩展的英文单词是 extension，插件的英文单词是 plugin。其实大多数情况下扩展和插件是同一个意思。但是有时候也不一样，例如 chrome 扩展和插件，chrome 的扩展是你在扩展市场下载的那个比如说油猴扩展，而插件是更为底层的 chrome 组件。但事实上，很多时候人们会混为一谈。如果你有心的话，你会注意到在一些比较严谨的文档里，adobe 软件的 c++ 插件只会用 c++ plugin 不会用 c++ extension，而 CEP 扩展一般只会用 CEP extension 表达而不会用 CEP Plugin。这貌似和 chrome 一样，plugin 表示的是更底层的组件，而 extension 表示的是应用层的组件。

后序的教程多我会尽量使用 `CEP 扩展`而不是 `CEP 插件`，但也不排除可能笔误会写成 CEP 插件。绝大数情况下混用它俩不会造成文章内容理解上的困扰，不过还是希望读者能理解`扩展`和`插件`的区别。

## 学习资料

### 必读

首先当然是 [CEP Extension Cookbook](https://github.com/Adobe-CEP/CEP-Resources/blob/master/CEP_11.x/Documentation/CEP%2011.1%20HTML%20Extension%20Cookbook.md)，建议一字不落通读 3 遍。这个文档由浅入深的介绍了 CEP 开发的方方面面。我最开始做 CEP 开发的时候看了两遍这个后就对 CEP 开发胸有成竹了，感觉 CEP 的老底已经被我摸透。看的时候建议一边看一边实际写代码测试，还是有很多东西你不去实际测试是很难理解的。

[JavaScript Tools Guide CC](https://extendscript.docsforadobe.dev/#) 是 adobe 官方的 extendscript 教程，涵盖了 ExtendScript 的方方面面，这个建议按照自己的需要看对应的章节，刚入门的时候 [文件系统](https://extendscript.docsforadobe.dev/file-system-access/index.html) 和 [ExtendScript 工具和特性](https://extendscript.docsforadobe.dev/extendscript-tools-features/index.html) 这两章应该说是必看的。阅读前者你会知道这样在 jsx 中进行文件读写，打开文件管理器窗口等，这些都是在开发时肯定会碰到的知识。通过阅读后者你会了解 ExtendScript 相对于 JavaScript 的不同点，例如 ExtendScript 自身的模块化，反射系统，操作符重载。

[After Effects Scripting Guide](https://ae-scripting.docsforadobe.dev/#) 这个是 AE 这个宿主环境下 ExtendScript 的教程。虽然很大一部分都是 API，但是它的 API 描述还是很值得阅读的，主要还是获取相关知识的渠道太少了。AE 的 ExtendScript Engine 除了 ExtendScript 本身通用的那些 API，还注入的 AE 特有的 DOM API。强烈建议精读 [AE 对象模型](https://ae-scripting.docsforadobe.dev/introduction/objectmodel.html#the-after-effects-object-model) 这一小节，其它的章节按需阅读。刚开始写 PS CEP 扩展的时候，我一直想找个和 [After Effects Scripting Guide](https://ae-scripting.docsforadobe.dev/#) 差不多优质的 PS ExtendScript 教程，找是找到了[Photoshop Scripting Reference](https://theiviaxx.github.io/photoshop-docs/index.html)，但是相较于前者来说差太多，而且从 18 年就没更新过了。官方的最新的 [PS 脚本开发教程](https://github.com/Adobe-CEP/CEP-Resources/tree/master/Documentation/Product%20specific%20Documentation/Photoshop%20Scripting) 是 2020 版，但是那 pdf 排版看得我贼难受。

### 推荐阅读

[creative-scripts.com](https://creative-scripts.com/) 。这个网站上有几篇文章很值得阅读，例如 [JSX.js A Game Changer in Adobe HTML Extensions Development?。](https://creative-scripts.com/jsx-js/)这篇文章教会了我怎样在浏览器的 JS 代码中加载 JSX 代码，通过阅读 JSX.js 的源码，我还学到 了例如怎样获取 JSX 中 exception 对应的代码位置信息等。

[小强的博客](https://blog.cutterman.cn/2021/09/18/photoshop-plugin-types/) 。我当时入门 PS ActionManager 就是看这位老哥的博客，因为受益匪浅还给他捐赠了 66 块。

### 面向 debugger 学习

由于很多 jsx api 你可能都搜不到相关的资料，或者搜到的也是只言片语根本不明所以。所以当你想找一个 api，但是没搜到的时候，不如去在 debugger 的时候去查看一下相关对象的属性和方法。有些 api 看名字就能猜出来意思，猜不出来可以打印输出结果或者 google 接口名找找相关的资料也许就能整明白了。

![ae jsx debug](https://s2.loli.net/2022/04/28/jtWJsehdp39LYNc.png)

### 面向代码提示学习

在 VSCode 中配置好 jsx 的代码提示，通过阅读 API 的 jsdoc 就可以知道 API 是干嘛用的，也可以通过这种方式查找自己需要的 API。

![jsx suggestion](https://s2.loli.net/2022/04/28/EiMqQCXl4jOYn2o.png)

## 总结

CEP 扩展开发可以说是一个很小众的领域了，国内外的资料异常的稀少。如果你有在 adobe 设计软件中开发一个面板扩展的需求，就目前阶段毫无疑问的最佳选择还是 CEP。c++ 开发效率太低，对程序员的要求比起前端高不少，而且前端程序员肯定比 c++ 程序员数量多不少，招人也容易的多，所以如果不是涉及到必须操作编辑中的媒体的二进制数据（例如特效插件）的话，还是不建议上 c++ 插件。

我一开始写 CEP 也很难受，不过还好我前端工程化能力够强，最终是把 webpack + react + typescript 这一套给整起来了，还支持了 VSCode 的代码提示，封装了支持异步的双端通信框架，写了个很简单的测试框架，研究出了个检测 jsx 内存泄漏的工具，写了俩 VSCode 插件辅助开发。经过不断的折腾，开发体验目前还算不错。唯一遗憾的可能就是目前 VSCode jsx 的 debugger 插件还不支持 sourcemap，所以 jsx 不敢上 typescript。
