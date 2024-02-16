# <https://yutengjing.com>

[![ci](https://github.com/tjx666/astro-blog/actions/workflows/ci.yml/badge.svg)](https://github.com/tjx666/astro-blog/actions/workflows/ci.yml)

我的个人博客前端源码。

## 技术栈

**SSG 框架** - [Astro](https://astro.build/)  
**开发语言** - [TypeScript](https://www.typescriptlang.org/)  
**组件框架** - [ReactJS](https://reactjs.org/)  
**CSS 方案** - [TailwindCSS](https://tailwindcss.com/)  
**模糊搜索** - [FuseJS](https://fusejs.io/)  
**图标** - [Boxicons](https://boxicons.com/) | [Tablers](https://tabler-icons.io/)  
**代码格式化** - [Prettier](https://prettier.io/)  
**静态部署** - [Cloudflare Pages](https://pages.cloudflare.com/)  
**代码风格检查** - [ESLint](https://eslint.org) | [Markdownlint](https://github.com/DavidAnson/markdownlint)  
**中文排版** - [Autocorrect](https://github.com/huacnlee/autocorrect)  
**拼写检查** - [CSpell](https://cspell.org/)

## 本地开发

### 安装依赖

```bash
pnpm install
```

### 写作和预览

```bash
pnpm dev
```

### 生产构建

```bash
pnpm build
```

## 致谢

非常感谢下以下网站在我设计博客时给予的灵感：

- [liruifengv 的博客](https://liruifengv.com/)
- [antfu 的博客](https://antfu.me/)
- [张鑫旭的博客](https://www.zhangxinxu.com/)

## TODOS

- [x] 社交链接图片
- [x] 升级依赖
- [x] 删除不需要的文件和代码
- [x] eslint
- [x] prettier
- [x] husky -> simple-git-hooks
- [x] autocorrect
- [x] spellcheck
- [x] markdownlint
- [ ] 搜索引擎收录
  - [x] 谷歌
  - [x] 必应
  - [ ] 百度，没有备案没有提交 sitemap 额度
  - [ ] 搜狗，没有备案无法添加站点
  - [ ] 360，待更新索引
- [x] RSS
- [x] 失效图片链接修复
- [x] 汉化
- [x] 优化 404 页面
- [x] 字体优化
- [ ] 悬浮大纲
- [ ] 分享链接
  - [ ] 微信
  - [ ] 钉钉
  - [ ] 飞书
  - [ ] 微博
  - [ ] 小红书
  - [ ] QQ
- [ ] 根据文章内容自动生成摘要
- [ ] 中文排版优化
- [ ] 主题色优化
- [ ] 将博客按照不同年份目录存放
- [ ] 草稿
- [ ] 文章封面
- [ ] 阅读耗时
- [ ] 按照年份对文章归档
- [ ] 评论
- [ ] 访问次数统计
- [ ] 捐赠页面
- [ ] 项目介绍页面
- [ ] 艺术签名
- [ ] 渐变切换暗色模式
- [ ] 变灰色
- [ ] 在线运行代码
- [ ] 友链
- [ ] 抓取所有 markdown 使用到的图片存到本地仓库
- [ ] 图床
