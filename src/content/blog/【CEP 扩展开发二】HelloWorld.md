---
title: 【CEP 扩展开发二】HelloWorld
pubDatetime: 2022-05-01
modDatetime: 2022-08-14
---

本文是 CEP 扩展开发系列教程的第二篇，通过手把手实现一个 Hello World 级别的插件来初步掌握 CEP 插件的配置和开发。

CEP 扩展本身是跨系统（Windows，MacOS）平台的，但是不同宿主环境（Photoshop，AfterEffects 等）的 jsx 解释器（或者说 engine）的技术实现有些许差异。注入的 API 那更是完全不一样，毕竟不同宿主的文档模型和工具能力差异很大。比方说 PS 是 psd，AE 是 project，这两种文档模型完全不一样。

由于最近一段时间我都是在写 PS 插件，因此本文将会主要以 PS 为例子来讲解。

## 开发工具

在开始我们的 Hello World 之前我们先检查一下是否安装了以下开发 CEP 的必备工具：

- 宿主应用：After Effects / Photoshop，创作这篇教程时我用的是 Photoshop 2022，版本号是 23.4.2，最近几个月已经不开发 AE 插件，主要在开发和维护 PS 扩展。因为电脑磁盘空间（251G）不够用，都没法保存 psd 了，暂时把 AE 都给卸了，有空清理下空间再装回来...
- 代码编辑器：[Visual Studio Code](https://code.visualstudio.com/)，理论上你用记事本编写代码也没关系，但是目前 ExtendScript 的 debugger 工具只有 VSCode 的 debugger 扩展还在维护。而且用 VSCode 你还可以安装一些 CEP 开发辅助的扩展，例如我开发的 [Adobe Extension Development Tools](https://marketplace.visualstudio.com/items?itemName=YuTengjing.adobe-extension-devtools) 和 [Scripting Listener](https://marketplace.visualstudio.com/items?itemName=YuTengjing.scripting-listener)
- Debugger： [ExtendScript Debugger](https://marketplace.visualstudio.com/items?itemName=Adobe.extendscript-debug&ssr=false#review-details) 是 VSCode 上用于 debug ExtendScript 和 CEP 扩展的 debugger 插件，如果需要向官方反馈这个插件的问题请去：[forums.adobeprerelease.com](https://forums.adobeprerelease.com/exmancmd/discussion/160/extendscript-debugger-2-0-beta-3-0-release/p1)，在插件市场的评论区反馈是没用的
- 操作系统：我本人用的是 MacOS Monterey12.5，CEP 扩展核心技术 chromium + nodejs + extendscript 都是跨平台的，所以本身是跨系统平台的。CEP 全拼是 `Common Extensibility Platform`，既然叫 `Common`（通用的意思） ，那么是跨平台也不然理解了。
- 浏览器：Chrome，CEP 扩展本身是使用 Chromium 内核渲染的，你可以使用任何基于 Chromium 内核的浏览器来远程 debug CEP 的网页代码。我测试过 360 和 edge 也是可以的，其它浏览器例如 safari 和 firefox 我没试过，有需要的读者可以参考后面会讲的使用 chrome 来 debug CEP 扩展的方法自行摸索。

![PS 版本](https://s2.loli.net/2022/08/02/QXMIrGScPwCOkWa.png)

## 为什么我强烈建议使用英文界面而不是中文版

不知道学习编程开发后多久，对于和开发相关的工具，我开始有意识的尽量使用软件的原生语言。也就是说如果一个软件安装的时候默认是英文的我就用英文，不切换中文界面，也不用翻译包。换句话说，英文软件就用英文，中文软件就用中文，telegram 就用英文，钉钉就用中文。例如 VSCode 我是没用语言包，Chrome 我用的是中文版的，原因是用习惯了而且切到英文版后很多网站识别不出我是中文用户。

对于我个人来说，我更倾向于使用软件的**原生语言**，原因简单概括下：

1. 我的英语水平够用，足够支撑我流畅阅读英文技术文档和软件界面的英文

2. 我不信任第三方翻译/语言包，有很多第三方的翻译我觉得不太行，而且有可能更新也不及时，正常人都喜欢原汁原味的

3. 有助于更快更准确的理解软件代码中使用的字段名，也方便抄代码和找到谷歌关键字

关于第三点，这里再展开讲讲。我们编写代码是英文的，而且使用 debugger 或者第三方扩展查看 PS 中各种数据时得到的也是英文的，因此如果你的软件界面是英文的，就能很快的对应起来。举个简单的例子，当我们想通过代码修改一个图层的是否可见的，在 PS 中设置一个图层是否可见只要点击左侧的眼睛图标就可以，当我们把光标移动到这个眼睛上，我们看看 hover 提示：

![图层可见性](https://s2.loli.net/2022/08/02/ZiY3fVj2yHmUCdQ.png)

看到这其实我们基本上就能肯定 layer 上有一个 `visibility` 或者它的形容词 `visible`，通过 debugger 工具查看果不其然有个 `visible` 属性：

![debugger 中查看 visible 属性](https://s2.loli.net/2022/08/02/4ZI6sCDcT2jaYpP.png)

实际的项目开发你会发现很多场景这对于加速开发是非常帮助的，来一个更复杂的例子。例如我们最近的一个实际需求，检测一个矢量蒙版是否修改了密度，也就是不是默认的 100。产品给到我的示意图是这样的：

![矢量蒙版密度](https://s2.loli.net/2022/08/02/HyaQe3UBmKi1ZjG.png)

我看到这图的第一眼是很懵逼的，密度对应的英文单词是哪个？查了一下谷歌翻译：

![使用谷歌翻译翻译密度](https://s2.loli.net/2022/08/02/GUMr9diTnogKV1J.png)

那他丫的到底是 density 还是 thickness，又或者是 denseness 呢？直到我打开我英文版的 PS 的矢量蒙版的属性面板，一目了然：

![PS 英文界面中的密度](https://s2.loli.net/2022/08/02/3MHvSbp5k7cEg1l.png)

这时英文版的优势就极大的体现出来了，使用我开发的 [Adobe Extension Development Tools](https://marketplace.visualstudio.com/items?itemName=YuTengjing.adobe-extension-devtools&ssr=false#review-details) 打开图层的 Descriptor Info，直接搜索 density，毫无疑问 `vectorMaskDensity` 就是我们要找的属性。

![descriptor info 中的矢量蒙版密度属性](https://s2.loli.net/2022/08/02/vi1PkodOySqwxs6.png)

这样代码写起来也很快：

```javascript
// 至于怎么拿到 layerDesc 这个后序教程讲 AM 的时候就知道了，暂时你就理解为图层的描述对象，和底层 c++ 图层的结构体对应
function isVectorDensityModified(layerDesc) {
  return layerDesc.vectorMaskDensity != null && layerDesc.vectorMaskDensity !== 255;
}
```

## Hello World

接下来我们动手写一个简单的 Hello World 级别的插件，功能很简单：插件面板有一个按钮，点击这个按钮在插件界面上显示出当前选中图层的名称。完整的项目代码我已经放到 github 上了：[cep-hello-world](https://github.com/tjx666/cep-hello-world/tree/c59b58ba35a1476b2bc0897f7d8f390d5a4757f6)。

![演示](https://s2.loli.net/2022/08/07/T6Zlp5G8hIXonBt.gif)

### 项目结构

最终我们 Hello world 项目的目录结构是这样的：

```plaintext
.
├── .debug # CEP 扩展 debug 模式配置文件，只开开发时需要
├── CSXS # 用于存放扩展的配置和资源文件（例如图标）
│   └── manifest.xml # 扩展清单文件，用于配置扩展的名称，兼容性，图标，菜单等方方面面，类似 chrome 扩展和 pwa 应用的 manifest
├── JSX # 存放 extendscript 代码
│   └── index.jsx # jsx 代码入口
└── web # 前端代码
    └── index.html # 扩展面板的 HTML
```

### 创建项目

插件必须要放在特定的文件夹才能被 PS 加载到。有三个位置都能存放 CEP 插件：

- 软件安装文件夹
- 系统级插件存放文件夹
- 用户级插件存放文件夹

#### 软件安装文件夹

> 软件安装文件夹/CEP/extensions

例如软件（或者说宿主）是 Photoshop，那么在 Mac 对应的路径默认就是：`/Applications/Adobe Photoshop 2022`，当然软件的安装路径你是可以修改的。这个文件夹不应该被用于存放第三方插件，是用来存放软件自带的 CEP 插件的，而且在 Mac 上修改这个文件夹是需要 Root 权限的。

#### 系统级的插件存放文件夹

- Win(x64): `C:\Program Files (x86)\Common Files\Adobe\CEP\extensions`, and `C:\Program Files\Common Files\Adobe\CEP\extensions` (since CEP 6.1)
- macOS: `/Library/Application Support/Adobe/CEP/extensions`

既然是系统级的，那么将插件安装到这就是需要 root 权限。开发插件的时候肯定是不会放这的，放这都没权限修改代码。

这个文件夹适合存放生产环境的插件，某种程度上可以防止用户修改到插件内容，修改了插件内容一般会导致 PS 加载插件的时候报**插件内容和签名不一致的问题**。

#### 用户级别的插件存放文件夹

- Win: `C:\Users\<用户名>\AppData\Roaming\Adobe\CEP/extensions`
- macOS: `~/Library/Application Support/Adobe/CEP/extensions`

这才是我们在开发插件时插件应该存放的目录，我们可以随意修改这个文件夹内的内容。

#### 插件查找顺序

软件安装文件夹 > 系统级的插件存放文件夹 > 用户级别的插件存放文件夹。

所以我们第一步就是在**用户级别的插件存放文件夹**创建我们的**插件文件夹**：

```bash
# 以 Mac 举例，Windows 就是 C:\Users\<USERNAME>\AppData\Roaming\Adobe\CEP/extensions
cd '~/Library/Application Support/Adobe/CEP/extensions'
mkdir cep-hello-world
```

### 添加插件配置文件

> 一个包含 CSXS/manifest.xml 的文件夹就能称之为一个 CEP 插件。宿主扫描到**存放插件的文件夹**中的**子文件**中包含 `CSXS/manifest.xml` 便会将这个**子文件夹**识别为一个 CEP 插件。有过 chrome 扩展或者 pwa 应用的读者应该都见过个名为 manifest 的文件，同样的在 CEP 插件中也必须存在一个这样的配置文件。

在项目根目录下创建 `CSXS` 文件夹，并添加 `manifest.xml` 文件，文件内容：

```xml
<?xml version="1.0" encoding="UTF-8" standalone="no" ?>
<!-- ExtensionBundleId 是插件 id -->
<!-- Version 指的是 manifest.xml 的 schema 版本 -->
<ExtensionManifest
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  ExtensionBundleId="org.ytj.helloWorld"
  ExtensionBundleVersion="1.0"
  Version="7.0"
>
    <!-- 一个 CEP 插件可以注册多个面板，每一个面板都可以视为一个子插件 -->
    <ExtensionList>
        <!-- 注册一个面板，这个面板可以视为一个子插件，id 为 org.ytj.helloWorld.panel -->
        <Extension Id="org.ytj.helloWorld.panel" Version="0.0.1" />
    </ExtensionList>
    <ExecutionEnvironment>
        <!-- 声明这个插件支持的宿主，也就是说是支持跑在 PS 还是 AE，还是其它 adobe 软件 -->
        <HostList>
            <!-- PHSP 和 PHXS 都是说 Photoshop -->
            <Host Name="PHSP" Version="16.0" />
            <!-- 16.0 指的是兼容 ps 的 16.0 版本及其以上 -->
            <Host Name="PHXS" Version="16.0" />
        </HostList>
        <!-- 插件支持的语言 -->
        <LocaleList>
            <Locale Code="All" />
        </LocaleList>
        <RequiredRuntimeList>
            <!-- 声明支持的 CEP 版本为 CEP9 -->
            <RequiredRuntime Name="CSXS" Version="9.0" />
        </RequiredRuntimeList>
    </ExecutionEnvironment>
    <DispatchInfoList>
        <!-- 面板的具体配置 -->
        <Extension Id="org.ytj.helloWorld.panel">
            <DispatchInfo>
                <Resources>
                    <!-- 面板的网页 HTML 首页路径，相对路径是相对于插件文件夹 -->
                    <MainPath>./web/index.html</MainPath>
                    <!-- 和这个面板相关联的 extendscript 线程加载的 extendscript 文件路径 -->
                    <!-- 不同的面板它们的 jsx 环境是隔离的，这和宿主的实现有关，PS 是隔离的， AE 不是 -->
                    <ScriptPath>./JSX/index.jsx</ScriptPath>
                    <!-- 浏览器环境和 nodejs 环境的一些参数 -->
                    <CEFCommandLine>
                        <Parameter>--enable-speech-input</Parameter>
                        <Parameter>--enable-media-stream</Parameter>
                        <!-- 开启 nodejs 支持，可以在 node 环境直接写 nodejs 代码 -->
                        <Parameter>--enable-nodejs</Parameter>
                    </CEFCommandLine>
                </Resources>
                <Lifecycle>
                    <!-- 设置打开插件显示面板界面，也可以设置为 false，打开后不会显示界面-->
                    <AutoVisible>true</AutoVisible>
                </Lifecycle>
                <!-- 面板 UI 配置 -->
                <UI>
                    <!-- 除了普通的面板类型还有 -->
                    <!-- ModalDialog：模态框，不能嵌入 PS 界面，用户在关掉之前不能和 PS 交互  -->
                    <!-- Modeless：和 ModalDialog 区别在于它不会阻止你和 PS 交互 -->
                    <!-- Custom：配合 AutoVisible 实现无界面面板 -->
                    <Type>Panel</Type>
                    <!-- 插件名称，你在 PS 的菜单中看到的插件名称 -->
                    <Menu>Hello World</Menu>
                    <!-- 面板尺寸相关 -->
                    <Geometry>
                        <!-- 插件默认宽高 -->
                        <Size>
                            <Height>611</Height>
                            <Width>280</Width>
                        </Size>
                        <!-- 插件最大宽高 -->
                        <MaxSize>
                            <Height>4000</Height>
                            <Width>600</Width>
                        </MaxSize>
                        <!-- 插件最小宽高 -->
                        <MinSize>
                            <Height>611</Height>
                            <Width>280</Width>
                        </MinSize>
                    </Geometry>
                </UI>
            </DispatchInfo>
        </Extension>
    </DispatchInfoList>
</ExtensionManifest>
```

里面很多配置项的功能我都以注释的形式说明了。这里再提一下其中几个点：

- `manifest.xml` 中所有的**相对路径**都是相对于**插件的根路径**
- 一个 CEP 插件是可以包含多个面板，每一个面板都可以称之为一个**子插件**，这在 manifest.xml 和后面提到的 debug 配置里都能体现出来。这些面板可以是能**嵌入** PS 界面的普通面板，也可以是是模态的，非模态的，还可以是无界面的面板。模态面板主要是阻止用户在使用插件时和 PS **交互**，修改文档数据。无界面面板你可以作为**后台服务**来用，例如启动一个 nodejs 服务器提供图片压缩等耗时任务。每一个面板都是一个**独立**的进程，不同的进程相互是隔离的，不会因为一个面板崩溃影响到另一个面板。
- `CSXS` 文件夹下我们一般还会存放其它插件用到的资源，例如 `CSXS/logo` 用来存放插件图标，当然这不是强制的，只不过我看社区的人很多都是这么干。学习一门技术同时也意味着需要去习惯这个社区的文化

![插件和面板的关系](https://s2.loli.net/2022/08/07/KZUwetOuIVR4za8.png)

顺便提醒一下，我们可以配置 VSCode 的 XML Schema 来获取 manifest.xml 文档提示，增加 `.vscode/settings.json`，在其中添加：

```json
{
  "xml.fileAssociations": [
    {
      "pattern": "CSXS/manifest.xml",
      // 这里声明的是 7.0 版本，和 manifest.xml 中 ExtensionManifest 标签的 Version 属性对应
      // raw.githubusercontent.com 这个域名似乎国内访较慢，你可以直接下载到本地，然后直接用本地文件路径
      "systemId": "https://raw.githubusercontent.com/Adobe-CEP/CEP-Resources/master/CEP_7.x/ExtensionManifest_v_7_0.xsd"
    }
  ]
}
```

![.vscode/settings.json](https://s2.loli.net/2022/08/07/CjivByHqwzefN7O.png)

### 浏览器代码

这部分内容我们来编写前端部分的代码，这部分代码是使用 chromium 内核渲染的，一个面板其实相当于一个浏览器标签页。

还记得前面 manifest.xml 我们有配置插件面板的 HTML 路径吗？其实就是 MainPath 标签的内容。

```xml
<Resources>
    <!-- 面板的网页 HTML 首页路径，相对路径是相对于插件文件夹 -->
    <MainPath>./web/index.html</MainPath>
    <!-- 和这个面板相关联的 extendscript 线程加载的 extendscript 文件路径 -->
    <!-- 不同的面板它们的 jsx 环境是隔离的，这和宿主的实现有关，PS 是隔离的， AE 不是 -->
    <ScriptPath>./jsx/index.jsx</ScriptPath>
    <!-- 浏览器环境和 nodejs 环境的一些参数 -->
    <CEFCommandLine>
        <Parameter>--enable-speech-input</Parameter>
        <Parameter>--enable-media-stream</Parameter>
        <!-- 开启 nodejs 支持，可以在 node 环境直接写 nodejs 代码 -->
        <Parameter>--enable-nodejs</Parameter>
    </CEFCommandLine>
</Resources>
```

在插件根目录下新建文件夹 `web`，这个文件夹用来存在插件使用的前端代码，增加 `index.html`，添加如下内容：

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CEP Hello World</title>
    <link rel="stylesheet" href="./style.css" />
  </head>
  <body>
    <div id="container">
      <p>当前图层名称为：<span id="currentLayerName"></span></p>
      <button id="refresh">刷新</button>
    </div>
    <script>
      // 调用 jsx 接口获取当前选中的图层名称
      function getCurrentLayerNameFromJsx(cb) {
        // evalScript 在某些 JSX engine 的实现是异步的，也有是同步的
        return window.__adobe_cep__.evalScript('api.getCurrentLayerName()', function (result) {
          cb(result);
        });
      }

      const refreshBtn = document.querySelector('#refresh');
      function refresh() {
        getCurrentLayerNameFromJsx(function (layerName) {
          const span = document.querySelector('#currentLayerName');
          span.textContent = layerName;
        });
      }
      refreshBtn.addEventListener('click', function () {
        refresh();
      });

      // 打开插件时刷新
      refresh();
    </script>
  </body>
</html>
```

代码内容很简单：

1. 打开面板时更新当前图层名称
2. 点击`刷新`按钮时更新当前图层名称

面板插件面板默认背景是黑色的，会导致默认为黑色的文字看不见。我们再增加一个 `web/style.css` 文件来修改网页样式：

```css
#container {
  margin: 40px auto;
  /* 水平居中 */
  display: flex;
  flex-direction: column;
  align-items: center;
}

html body {
  /* 默认背景是黑的，文字也是黑的 */
  background-color: white;
  color: black;
}
```

现在插件肯定还是运行不起来的，因为我们获取选中图层的 jsx 接口还没有实现。

### ExtendScript 代码

ExtendScript 在我们 CEP 圈子里又称之为 jsx，可能因为它的文件后缀名就是 `.jsx`，这对于写 react 的前端来说开始可能有点不习惯。在前面的代码中我们还没有实现获取当前选中的图层的名称的接口，在实现它之前我们得先对 CEP 各个运行时有个基本的了解。

![CEP 浏览器代码和 jsx 代码交互](https://s2.loli.net/2022/08/07/caTSz7eQZqvxGtw.jpg)

CEP 插件的代码按照职责可以分为两部分：

- 负责读取数据渲染界面
- 负责处理业务逻辑

前面写的跑在浏览器的代码就是用于渲染插件界面，而插件的业务逻辑一般需要获取 PS 中的各种信息（也就是访问 DOM API），以及调用 PS 的 API 让 PS 执行各种操作。

浏览器环境是没办法直接获取宿主信息的，但是我们可以用通过 `window.__adobe_cep__.evalScript(script, callback);` 去执行一段 jsx 代码访问宿主信息。

增加 `JSX/index.jsx` 文件，添加以下内容：

```javascript
// 使用立即执行函数避免全局污染
(function () {
  'use strict';

  function getCurrentLayerName() {
    // 没有打开的文档返回 null
    if (app.documents.length === 0) return null;
    // activeDocument 为当前打开的文档，activeLayer 为当前选中的图层
    var currentLayer = activeDocument.activeLayer;
    return currentLayer ? currentLayer.name : null;
  }

  // 使用全局变量 api 存放我们所有暴露给浏览器代码调用的 API
  // $.global 类似浏览器环境中的 window 和 nodejs 中的 global
  $.global.api = {};
  api.getCurrentLayerName = getCurrentLayerName;
})();
```

`JSX` 文件夹用于存放我们所有的 jsx 代码，`JSX/index.jsx` 是所有 jsx 代码的入口。这个路径对应 `manifest.xml` 中 `ScriptPath` 标签配置。

### 配置 CEP Debug 模式

当我们的插件写到这，如果你重启 PS 你会发现，菜单中虽然显示出 `Hello World` 这个插件，但是打开是空白的。一个 CEP 插件只有两种情况能被加载：

- 签过名
- 开启了 CEP 的 debug 模式

在开发插件时我们肯定不会每次打开插件先签一遍名，所以开发前我们都会选择先去配置 CEP 的 debug 模式。不同的系统配置方式不同。

#### Mac 环境配置 CEP debug 模式

在终端执行下面的命令即可开启 CEP11 的 debug 模式：

```bash
defaults write com.adobe.CSXS.11 PlayerDebugMode 1
```

`11` 对应 CEP 的版本。CEP 版本可以可以对照下面的表格，如果你实在搞不清楚那就直接把 8, 9, 10, 11 全给开了。

| Application   | Host ID(Product SAPCode) | CC 2019 Version | CC 2020 Version | FY 2020          | FY2021        |
| ------------- | ------------------------ | --------------- | --------------- | ---------------- | ------------- |
| Photoshop     | PHSP/PHXS                | 20 (CEP 9)      | 21 (CEP 9)      | 22.0 (CEP 10)    | 23.0 (CEP 11) |
| InDesign      | IDSN                     | 14 (CEP 9)      | 15 (CEP 9)      | 16.0 (CEP 10 )   | 16.3(CEP 11)  |
| InCopy        | AICY                     | 14 (CEP 9)      | 15 (CEP 9)      | 16.0 (CEP 10 )   | 16.3(CEP 11)  |
| Illustrator   | ILST                     | 23 (CEP 9)      | 24 (CEP 9)      | 25.0 (CEP 10)    | 25.3(CEP 11)  |
| Premiere Pro  | PPRO                     | 13 (CEP 9)      | 14 (CEP 9)      | 14.4 (CEP 10)    | 15.4(CEP 11)  |
| Prelude       | PRLD                     | 8 (CEP 9)       | 9 (CEP 9)       | 10.0(CEP 10)     | 10.1(CEP 11)  |
| After Effects | AEFT                     | 16 (CEP 9)      | 17 (CEP 9)      | 17.1.4 (CEP 10)  | 18.4(CEP 11)  |
| Animate       | FLPR                     | 19 (CEP 9)      | 20 (CEP 9)      | 21.0 (CEP 10)    | 22.0(CEP 11)  |
| Audition      | AUDT                     | 12 (CEP 9)      | 13 (CEP 9)      | 13.0.10 (CEP 10) | 14.4(CEP 11)  |
| Dreamweaver   | DRWV                     | 19 (CEP 9)      | 20 (CEP 9)      | 21.0 (CEP 10)    | 22.0(CEP 11)  |
| Bridge        | KBRG                     | 9 (CEP 9)       | 10 (CEP 9)      | 11.0 (CEP 10)    | 12.0(CEP 11)  |
| Rush          | RUSH                     | 1 (CEP 9)       | 1.2.1 (CEP 9)   | 1.5.29 (CEP 10)  | 2.1(CEP 11)   |

为了方便起见，可以在 `.zshrc` 中添加下面两个别名：

```bash
alias enable_cep_debug="defaults write com.adobe.CSXS.11 PlayerDebugMode 1"
alias disable_cep_debug="defaults write com.adobe.CSXS.11 PlayerDebugMode 0"
```

#### Windows 环境配置 CEP Debug 模式

`Win + R` 输入 `regedit` 打开注册表编辑器，定位到 `HKEY_CURRENT_USER/Software/Adobe/CSXS.11`，修改 `PlayerDebugMode` 项的值为 1，值类型选择字符串。如果没有找到 `PlayerDebugMode` 项，那就自己添加一个。

![Windows 配置 CEP debug 模式](https://s2.loli.net/2022/08/07/9xu5EQSos4HnwMY.jpg)

配置完 CEP 的 debug 模式后，重启 ps 后你应该就可以在菜单中找到并打开插件了：

![打开插件步骤](https://s2.loli.net/2022/08/07/BCPRvWLOrezDsmx.png)

## 总结

通过一步一步实现 Hello World 项目，我们可以对 CEP 的插件开发有一个初步的了解：

- 可以通过 manifest.xml 来配置插件的方方面面
- 用前端代码渲染界面
- 需要访问宿主就编写 JSX 接口，通过 evalScript 调用

随着你对 CEP 插件了解的加深，你会慢慢能理解下面这张图：

![CEP 架构](https://s2.loli.net/2022/08/07/ZSYe4bKEyoJcOaH.png)

本文没有涉及对 nodejs 的使用，后面再单独出一篇教程吧。下一篇教程将讨论如何 debug CEP 的前端代码和 ExtendScript 代码。
