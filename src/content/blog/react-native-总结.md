---
title: react native 总结
tags:
  - react native
categories:
  - 前端
author: 余腾靖
pubDatetime: 2019-02-22 22:16:00
---

最近用 react native 做了一个移动端跨平台 App。**Learn once, write everywhere** 确实不是吹的。

本文主要由以下几部分构成：

1. 为什么我选择了 react native
2. react natve 开发 App 体验
3. react native 的有哪些坑
4. 对未来移动跨平台开发的展望

<!--more -->

## 为什么我选择了 react native

当前比较火的开发原生 APP 的跨平台技术其实挺多的，h5+, mui, uniAPP, hybird, react native, weex, flutter。最具竞争力当属 react native, weex, lutter 了。

### weex

对于 weex 我一开始是很看好的，又是基于 vue, 又比 react native 开源的晚，然后又是阿里开源的，觉得应该在设计上不会差于 react native。之所以不用 weex, 有几个原因。首先是我对 vue 的熟练度是不及 react 的，我之前用 react 独立开发过比较大的网站以及小程序，小程序的风格和 react 的风格还是很像的，但是 vue 我只是看过两遍文档，做过一些小 demo。然后就是我在一些技术论坛比如：知乎，v2ex，搜索了一些关于 weex 的评价，普遍都认为 weex 坑多，当然是相对与 react native 来说，其实我开发过 react native 之后就发现 react native 也有很多坑。最后就是当时闲鱼官方宣布使用 flutter 的消息，让我彻底的否决了选择 weex。现在打开 github 上 weex 官方仓库，发现 weex 已经托管给 apache 了...

### flutter

flutter 应该是这三个里面最晚开源的了，由 Google 开源的一个跨平台 UI 框架。flutter 使用 Google 公司开发的 dart 语言开发，而另外两个都是使用 javascript。看了一些关于 flutter 的评测文章，普遍都是 flutter 的性能要好于 react native。国内第一家公开使用 flutter 的大厂应该就是阿里闲鱼了，好像还和 flutter 官方有深度合作。对于 flutter 我是很看好的，因为 flutter 背靠 Google, Google 正在开发的 Fusion 操作系统的官方语言就是 dart, 甚至有可能以后 android 系统就会将底层的 linux 系统换成了 fusion 系统。学习 flutter 一举多得啊。如果时间允许的话我可能会选择 fluter 来开发我那个项目了。但是我没时间啊，大概两三个星期就要交产品，我对 dart 不熟，对 flutter 开发流程更是一点都不了解。

### react native

看看 github 上 react native 的 star **74.3k**，其受欢迎程度可想而知。时至今日，我仍然认为开发一些小型的 App 使用 react native 是个很好的选择，react native 相对与另外两者最大的优势就是生态。

> 所以我最后选择了 react native。

## react native 的开发体验

### 和 react 开发区别并不大

在学习 react native 之前我还担心会不会和 react 的区别挺大的，看完了官方文档前几节后，我完全打消了这个顾虑。使用 react native 开发 APP 和使用 react 开发网页并没有什么大区别，react 全家桶完全可用。由于 react native 开发的 APP 最后是使用原生控件渲染的，所以肯定是不能是 html 那一套标签了，不然要做的适配工作太大太复杂了。使用 react native 开发必须用 react native 设计的一套组件库。react native 官方的组件库其实相对与 html 来说还是少很多的，比如没有标题组件等。但是也够用了，不够用自己造，也有很多优秀的第三方组件库或者组件。github 上 [awesome-react-native](https://github.com/jondot/awesome-react-native) 上列出了很多优秀的 rn 资源，我在开发 APP 的时候经常去这个仓库看是否有合适的可以拿来用。html 中的 div 对应与 rn 中 View, span 对应 Text。在 react native 中我们仍然可以获取到组件对象，并调用组件对象的一些函数。

### 开发效率比原生开发高很多

我以前也开发过简单的原生 APP，使用 xml 那非人类标记语言，java 代码的啰嗦，记忆犹新。使用 react native 开发 App, 其实只要你懂 js 和组件化技术就可以上手了，并且 react native 还有跨平台和热更新两大杀手级特性，如果团队中有会 rn 开发的，使用 rn 来代替 h5 是个很好的选择。跨平台对于小公司来说可以减少招人成本，诱惑力不小，热更新可以让 APP 在不升级版本的情况下升级 APP 页面，由于是渲染为原生控件，还有各种方便的和系统交互的 API，肯定比 h5 技术要好。使用 rn 开发，还可以避开 Apple store 的审核，快速升级应用。

## react native 中的那些坑

react native 中有很多坑，而且有些坑还是注定无法解决的，因为这是 react native 本身的技术架构决定的，尽管有很多坑，但是一般都有解决办法，但是这些坑确实是 react native 这个框架本身的 bug, 不应该由开发者来解决。而且有些解决办法很 hack, 不一定适用你的使用场景。下面列举一些 react native 中的坑。

### 跨平台不彻底

众所周知，选择 rn 这类跨平台框架，很大一部分原因就是看重了其跨平台能力，但是当我使用 rn 时，打开官方文档查看基础组件 `Text` 的属性看到的是这样的

{% asset_img android-ios-difference.png 平台差异 %}

在不久前 Airbnb 公司宣布放弃 react native 的文章中就说到了这一点，说是因为跨平台的不彻底，需要对维持 android 和 ios 的一致性要投入很大的精力。其实作为前端工程建设极为优秀的 facebook 公司，讲道理开源出来的框架不应该做不好平台一致性啊。其实原因还是 rn 本身的技术架构的局限性导致的。由于 rn 最终渲染控件时是调用原生的控件，比如在安卓平台 rn 的 Text 组件调用的可能就是原生的 TextView。那 android 和 ios 两个移动操作系统本身原生组件就是有不同的，有些特性可能 ios 有，android 并没有，所以这一类属性在 rn 中就只好做平台区分了。flutter 是没问题的，因为 flutter 的视图是自绘的，并不依赖原生控件。

### 导航 (路由) 很混乱

时至今日，官方推荐使用[React Navigation](https://facebook.github.io/react-native/docs/navigation#react-navigation)来处理页面之间的跳转。但是呢，当我在 windows 系统使用开发的时候，发现这个库 link 后生产的构建脚本中的路径都是错误的，需要我手动转义，这开发态度也太差劲了吧？并且 react native 的路由历史上发生过好几次大改，只学最新版的 react navigation 的我看到 github 上的 rn 开源项目的时候，别人用的路由看的我很懵逼，虽然不至于看不懂，但是写法完全不一样。

### 开发工具有待完善

使用官方脚手架 react-native-cli 开发时，热重载基本上是废的，大概率热重载会有问题，我一般都是只用自动重载。有时候还会出现一个很恶心的情况，就是当出现语法错误时，你即便是修复错误了，reload 后还是报同一个语法错误，只有退出 cli, 重新 **react-native run-android** 才行。

### 调式体验极差

使用`react-native-debugger` 来 debug rn app，打开 dom 视图，估计你要打开 二，三十层嵌套才能看到你想看到的部分。不解决嵌套层次过多的问题，这调试器体验也太差了。
{% asset_img react-native-debugger.png 调式体验极差 %}

### ScrollView 中的 TextInput

当 ScrollView 中有 TextInput 时，如果滑在 TextInput 上面屏幕不会滚动。这么基础的体验不应该有开发者来解决吧，github 上面针对这个 issue 有人提出了解决办法，但是并不适合我的使用场景。

{% asset_img TextInputInScrollView.png TextInput 在 ScrollView 中的 bug %}

## 对未来移动跨平台开发的展望

看好 flutter，我最近在学习 dart 语法，感觉 dart 非常不错，感觉糅合了 js 和 java 的很多特点。不过我还要时间去深入学习，强类型 + 组件化开发，开发体验很好。flutter 在架构风格上和 react 很像，react 没白学啊。现在 flutter 差的就是时间，等生态建立好了，各方面插件都有了以后，估计有一批原生开发要失业喽。最近看到 React Native 官方 twitter 说 react native 正在由内到外大重构，不知道重构完会不会有惊喜，facebook 说不定能大力出奇迹 😍。有可能等重构完就出 1.0 稳定版了，现在 react native 还停留在 0.58 ...
