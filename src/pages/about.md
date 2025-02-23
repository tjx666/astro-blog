---
layout: ../layouts/AboutLayout.astro
title: '关于'
---

Email: <ytj2713151713@gmail.com>

## 📚 教育经历

**江西师范大学** | 2016.09 - 2020.06  
全日制统招本科 · 物联网工程 · 江西南昌

## 💻 专业技能

- 擅长 Next.js 全栈开发，SSR，SEO 优化，前端响应式开发
- 擅长前端工程化，熟悉 Webpack/Vite/ESLint 等工具的配置和插件开发
- 熟悉 ES6+，TypeScript 类型体操和性能优化
- 熟悉 VSCode/Chrome 插件/Adobe CEP 插件开发
- 熟悉 Github Actions CI
- 擅长使用 AI 辅助开发工具，VSCode/Cursor 资深用户
- 熟悉 Nodejs 脚本和后端开发，写过 Dart/Python/Java
- 熟悉 Firebase/Redis/Postgresql 数据库
- 熟悉 Vercel/Neon/Clerk/Upstash/Clarity/Cloudflare/Amplitude/GCP 等开发平台

## 👔 工作经历

**[openart.ai](https://openart.ai)** | 深圳 · 全栈开发工程师 | 2024.04 - 2025.02

**[稿定设计](https://www.gaoding.com/)** | 厦门 · 前端开发工程师 | 2020.06 - 2023.10

**字节跳动** | 北京 · 前端开发工程师 · 实习 | 2019.07 - 2019.10

## 🛠️ 项目经历

### [openart.ai](https://openart.ai)

角色：核心开发

技术栈：Next.js(Pages Router) + MUI + Firebase

工作内容：

- 基本上所有页面的开发
- 首页，生成页用户引导，提高了近 10% 付费用户转换率
- 上新 AI 绘画模型和调整模型选项
- 上新 AI app, 例如 Image to 3D
- 首页 What's new 弹窗和内部管理页
- 图片生成后端 API 重构
- 基建优化例如升级 Next12 到 14, 迁移 Yarn1 到 Pnpm, tsc 编译速度优化
- SEO 优化，优化了几百万个由于 FCP 和 CLS 指标差影响到 Google 排名的页面
- 工作时间外做了很多用户体验优化，例如侧边栏移动端滑动收起，Iconify 图标 SSR

### [artiffuse.ai](https://artiffuse.ai)

角色：个人独立开发

技术栈：Nextjs15(App Router) + Trpc + Shadcn/ui + Neon Postgresql + Clerk Auth + Cloudflare R2 + Upstash Redis + Trigger.dev + Vercel Deploy

工作内容：

- 从 0 到 1 独立开发的 AI 图像生成平台
- 实现高性能的图片生成系统，高度可扩展模型和参数
- 支持暗黑模式，移动端适配，SSR 优化

### 融合图片编辑器

技术栈：Vue 2.7 + Pinia + TypeScript + Vite + Monorepo + Pnpm + Turborepo

- 迁移图表元素编辑代码从 Vue 2.6 到 2.7
- 通过避免重复打包同一个依赖的不同版本和 importmap 等手段优化项目打包体积
- 编写项目模版生成器脚本减少新建 app 和 package 成本
- 批量处理 lint 错误，避免每次 PR review 需要看一些和业务逻辑无关的修复 lint 的代码
- 自己编写了一些实用的 ESLint 规则优化开发体验
- 维护 Vite 和 Rollup 打包脚本，实现了一些实用的 Vite 插件，例如检测重复依赖，语义化分块等
- 持续优化 CI 体验，支持在 CI 中只 lint 修改的文件，检测是否引进了新的重复依赖
- 优化 Turborepo 报错信息帮助开发快速定位构建问题
- 编写 npm preinstall 脚本强制统一所有开发本地开发环境，避免因为环境不一致导致无法复现问题
- 通过 git post-checkout hook 检测是否切换到不符合规范的分支名，及时给予开发警告
- 协助同事解决 VSCode 代码提示，打包，CI 遇到的问题
- 编写和持续维护项目文档，帮助同事快速上手项目和解决常见问题

### 平面模版 - PS 导出插件

技术栈：Adobe CEP + React + Redux Toolkit + TypeScript + Webpack

- 单人完成项目技术选型，项目搭建和所有的业务实现
- 优化图层遍历效率提高 50 倍以上
- 写了一个简易打包器支持 ExtendScript 打包成单文件
- 开源了多个 VSCode 插件提高 PS CEP 插件开发效率

### 生产链路工具箱

技术栈：Electron + Vue3 + Vuex + Vite

- 负责技术选型和项目搭建
- 负责设计实现 Adobe 插件安装卸载逻辑
- 负责设计 Adobe 插件 manifest 格式
- 负责设计实现工具箱自身的扩展架构，并通过内置扩展实现视频剪辑模版本地调试等能力
- 通过自定义协议实现 Adobe 插件唤醒工具箱
- 开发体验优化：对 IPC 调用进行封装提供了详细的接口调用和生命周期日志，封装了一个交互式打包脚本
- 开源模版：[electron-vue-vite-boilerplate](https://github.com/tjx666/electron-vue-vite-boilerplate)

### 视频剪辑模版 - AE 导出插件

技术栈：Adobe CEP + React + Redux Toolkit + TypeScript + Webpack

- 带领两个新入职同事共同攻克该业务，负责组内任务分配和技术攻坚
- 负责技术选型，项目搭建和开发体验优化
- 参考 Lottie 的 AE 导出插件 Bodymovin 设计实现导出流程
- 借鉴 ESLint 的 rule 设计实现可扩展的导出校验框架
- 负责实现大部分类型的图层到元素，补间动画，文字动画等的转换
- 开源 Adobe CEP 插件开发模版：[cep-react-webpack-boilerplate](https://github.com/tjx666/cep-react-webpack-boilerplate)

### 移动端 - 新版拼图拼视频

使用公司自研的跨端框架对旧版拼图子应用重写，将多张图片拼成一张图片，支持布局，自由，拼长图模式。

- 技术栈：前期 Quickjs + TypeScript，后期 Flutter + FFI
- 工作内容
  - 主要负责交互层和业务需求开发，以及分层架构，手势系统，虚线 Layer 等少部分框架层面的设计和维护
  - 负责实现编辑器模型导出 JSON
  - 实现布局模式拉伸限制，拼接模式调节边界，拼接模式停止拉自动居中
  - 设计实现导出图片尺寸压缩策略，设计实现布局模式切换自由模式变换规则

## 🎯 个人评价

乐于技术分享，积极参与开源，追求极致的开发体验，敢于抛出问题并愿意主动解决问题。
