---
title: '使用 nodejs 写爬虫 (二): 抓取 github 热门项目'
tags:
  - node
  - spider
  - github
categories:
  - 后端
author: 余腾靖
pubDatetime: 2019-04-04 12:12:00
---

其实爬虫是一个对计算机综合能力要求比较高的技术活。

首先是要对网络协议尤其是 `http` 协议有基本的了解，能够分析网站的数据请求响应。学会使用一些工具，简单的情况使用 chrome devtools 的 network 面板就够了。我一般还会配合 postman 或者 charles 来分析，更复杂的情况可能举要使用专业的抓包工具比如 wireshark 了。你对一个网站了解的越深，越容易想出简单的方式来爬取你想获取的信息。

除了要了解一些计算机网络的知识，你还需要具备一定的字符串处理能力，具体来说就是正则表达式玩的溜，其实正则表达式一般的使用场景下用不到很多高级知识，比较常用的有点小复杂的就是分组，非贪婪匹配等。俗话说，学好正则表达式，处理字符串都不怕 🤣。

还有就是掌握一些反爬虫技巧，写爬虫你可能会碰到各种各样的问题，但是不要怕，再复杂的 12306 都有人能够爬，还有什么是能难到我们的。常见的爬虫碰到的问题比如服务器会检查 cookies, 检查 host 和 referer 头，表单中有隐藏字段，验证码，访问频率限制，需要代理，spa 网站等等。其实啊，绝大多数爬虫碰到的问题最终都可以通过操纵浏览器爬取的。

这篇使用 nodejs 写爬虫系列第二篇。实战一个小爬虫，抓取 github 热门项目。想要达到目标：

1. 学会从网页源代码中提取数据这种最基本的爬虫
2. 使用 json 文件保存抓取的数据
3. 熟悉我上一篇介绍的一些模块
4. 学会 node 中怎样处理用户输入

<!-- more -->

## 分析需求

我们的需求是从 github 上抓取热门项目数据，也就是 star 数排名靠前的项目。但是 github 好像没有哪个页面可以看到排名靠前的项目。**往往网站提供的搜索功能是我们写爬虫的人分析的重点对象**。

我之前在 v2ex 灌水的时候，看到一个讨论 `996` 的帖子上刚好教了一个查看 github stars 数前几的仓库的方法。其实很简单，就是在 github 搜索时加上 star 数的过滤条件比如：`stars:>60000`，就可以搜索到 github 上所有 star 数大于 60000 的仓库。分析下面的截图，注意图片中的注释：

![github-hot-projects](https://i.loli.net/2019/04/04/5ca59077e7a3e.png)

分析一下可以得出以下信息：

1. 这个搜索结果页面是通过 get 请求返回 html 文档的，因为我 network 选择了 `Doc` 过滤
2. url 中的请求的参数有 3 个，p(page) 代表页面数，q(query) 代表搜索内容，type 代表搜索内容的类型

然后我又想 github 会不会检查 cookies 和其它请求头比如 referer，host 等，根据是否有这些请求头决定是否返回页面。

![request headers](https://i.loli.net/2019/04/04/5ca592da2bb41.png)

比较简单的测试方法是直接用命令行工具 `curl` 来测试，在 git bash 中输入下面命令即 `curl "请求的url"`

```bash
curl "https://github.com/search?p=2&q=stars%3A%3E60000&type=Repositories"
```

不出意外的正常的返回了页面的源代码，这样的话我们的爬虫脚本就不用加上请求头和 cookies 了。

![git-bash-curl-github](https://i.loli.net/2019/04/04/5ca594909a591.png)

通过 chrome 的搜索功能，我们可以看到网页源代码中就有我们需要的项目信息

![source code search](https://i.loli.net/2019/04/04/5ca595318c77b.png)

分析到此结束，这其实就是一个很简单的小爬虫，我们只需要配置好查询参数，通过 http 请求获取到网页源代码，然后利用解析库解析，获取源代码中我们需要的和项目相关的信息，再处理一下数据成数组，最后序列化成 json 字符串存储到到 json 文件中。

![postman-github-search](https://i.loli.net/2019/04/04/5ca5bb4f43e12.png)

## 动手来实现这个小爬虫

### 获取源代码

想要通过 node 获取源代码，我们需要先配置好 url 参数，再通过 superagent 这个发送 http 请求的模块来访问配置好的 url。

```javascript
'use strict';
const requests = require('superagent');
const cheerio = require('cheerio');
const constants = require('../config/constants');
const logger = require('../config/log4jsConfig').log4js.getLogger('githubHotProjects');
const requestUtil = require('./utils/request');
const models = require('./models');

/**
 * 获取 star 数不低于 starCount k 的项目第 page 页的源代码
 *
 * @param {number} starCount Star 数量下限
 * @param {number} page 页数
 */
const crawlSourceCode = async (starCount, page = 1) => {
  // 下限为 starCount k star 数
  starCount = starCount * 1024;
  // 替换 url 中的参数
  const url = constants.searchUrl.replace('${starCount}', starCount).replace('${page}', page);
  // response.text 即为返回的源代码
  const { text: sourceCode } = await requestUtil.logRequest(requests.get(encodeURI(url)));
  return sourceCode;
};
```

上面代码中的 constants 模块是用来保存项目中的一些常量配置的，到时候需要改常量直接改这个配置文件就行了，而且配置信息更集中，便于查看。

```javascript
module.exports = {
  searchUrl: 'https://github.com/search?q=stars:>${starCount}&p=${page}&type=Repositories',
};
```

### 解析源代码获取项目信息

这里我把项目信息抽象成了一个 Repository 类了。在项目的 models 目录下的 Repository.js 中。

```javascript
const fs = require('fs-extra');
const path = require('path');

module.exports = class Repository {
  static async saveToLocal(repositories, indent = 2) {
    await fs.writeJSON(path.resolve(__dirname, '../../out/repositories.json'), repositories, {
      spaces: indent,
    });
  }

  constructor({ name, author, language, digest, starCount, lastUpdate } = {}) {
    this.name = name;
    this.author = author;
    this.language = language;
    this.digest = digest;
    this.starCount = starCount;
    this.lastUpdate = lastUpdate;
  }

  display() {
    console.log(`   项目：${this.name} 作者：${this.author} 语言：${this.language} star: ${this.starCount}
摘要：${this.digest}
最后更新：${this.lastUpdate}
`);
  }
};
```

解析获取到的源代码我们需要使用 cheerio 这个解析库，使用方式和 jquery 很相似。

```javascript
/**
 * 获取 star 数不低于 starCount k 的项目页表
 *
 * @param {number} starCount Star 数量下限
 * @param {number} page 页数
 */
const crawlProjectsByPage = async (starCount, page = 1) => {
  const sourceCode = await crawlSourceCode(starCount, page);
  const $ = cheerio.load(sourceCode);

  // 下面 cheerio 如果 jquery 比较熟应该没有障碍，不熟的话 github 官方仓库可以查看 api, api 并不是很多
  // 查看 elements 面板，发现每个仓库的信息在一个 li 标签内，下面的代码时建议打开开发者工具的 elements 面板，参照着阅读
  const repositoryLiSelector = '.repo-list-item';
  const repositoryLis = $(repositoryLiSelector);
  const repositories = [];
  repositoryLis.each((index, li) => {
    const $li = $(li);

    // 获取带有仓库作者和仓库名的 a 链接
    const nameLink = $li.find('h3 a');

    // 提取出仓库名和作者名
    const [author, name] = nameLink.text().split('/');

    // 获取项目摘要
    const digestP = $($li.find('p')[0]);
    const digest = digestP.text().trim();

    // 获取语言
    // 先获取类名为 .repo-language-color 的那个 span, 在获取包含语言文字的父 div
    // 这里要注意有些仓库是没有语言的，是获取不到那个 span 的，language 为空字符串
    const languageDiv = $li.find('.repo-language-color').parent();
    // 这里注意使用 String.trim() 去除两侧的空白符
    const language = languageDiv.text().trim();

    // 获取 star 数量
    const starCountLinkSelector = '.muted-link';
    const links = $li.find(starCountLinkSelector);
    // 选择器为 .muted-link 还有可能是那个 issues 链接
    const starCountLink = $(links.length === 2 ? links[1] : links[0]);
    const starCount = starCountLink.text().trim();

    // 获取最后更新时间
    const lastUpdateElementSelector = 'relative-time';
    const lastUpdate = $li.find(lastUpdateElementSelector).text().trim();
    const repository = new models.Repository({
      name,
      author,
      language,
      digest,
      starCount,
      lastUpdate,
    });
    repositories.push(repository);
  });
  return repositories;
};
```

有时候搜索结果是有很多页的，所以我这里又写了一个新的函数用来获取指定页面数量的仓库。

```javascript
const crawlProjectsByPagesCount = async (starCount, pagesCount) => {
  if (pagesCount === undefined) {
    pagesCount = await getPagesCount(starCount);
    logger.warn(`未指定抓取的页面数量，将抓取所有仓库，总共${pagesCount}页`);
  }

  const allRepositories = [];

  const tasks = Array.from({ length: pagesCount }, (ele, index) => {
    // 因为页数是从 1 开始的，所以这里要 i + 1
    return crawlProjectsByPage(starCount, index + 1);
  });

  // 使用 Promise.all 来并发操作
  const resultRepositoriesArray = await Promise.all(tasks);
  resultRepositoriesArray.forEach((repositories) => allRepositories.push(...repositories));
  return allRepositories;
};
```

### 让爬虫项目更人性化

只是写个脚本，在代码里面配置参数然后去爬，这有点太简陋了。这里我使用了一个可以同步获取用户输入的库[readline-sync](https://github.com/anseki/readline-sync)，加了一点用户交互，后续的爬虫教程我可能会考虑使用 electron 来做个简单的界面，下面是程序的启动代码。

```javascript
const readlineSync = require('readline-sync');
const { crawlProjectsByPage, crawlProjectsByPagesCount } = require('./crawlHotProjects');
const models = require('./models');
const logger = require('../config/log4jsConfig').log4js.getLogger('githubHotProjects');

const main = async () => {
  let isContinue = true;
  do {
    const starCount = readlineSync.questionInt(
      `输入你想要抓取的 github 上项目的 star 数量下限，单位 (k): `,
      {
        encoding: 'utf-8',
      },
    );
    const crawlModes = ['抓取某一页', '抓取一定数量页数', '抓取所有页'];
    const index = readlineSync.keyInSelect(crawlModes, '请选择一种抓取模式');

    let repositories = [];
    switch (index) {
      case 0: {
        const page = readlineSync.questionInt('请输入你要抓取的具体页数：');
        repositories = await crawlProjectsByPage(starCount, page);
        break;
      }
      case 1: {
        const pagesCount = readlineSync.questionInt('请输入你要抓取的页面数量：');
        repositories = await crawlProjectsByPagesCount(starCount, pagesCount);
        break;
      }
      case 3: {
        repositories = await crawlProjectsByPagesCount(starCount);
        break;
      }
    }

    repositories.forEach((repository) => repository.display());

    const isSave = readlineSync.keyInYN('请问是否要保存到本地 (json 格式) ?');
    isSave && models.Repository.saveToLocal(repositories);
    isContinue = readlineSync.keyInYN('继续还是退出 ?');
  } while (isContinue);
  logger.info('程序正常退出...');
};

main();
```

### 来看看最后的效果

这里要提一下 readline-sync 的一个 bug,，在 windows 上，vscode 中使用 git bash 时，中文会乱码，无论你文件格式是不是 utf-8。搜了一些 issues，在 powershell 中切换编码为 utf-8 就可以正常显示，也就是把页码切到 `65001`。

![example](https://i.loli.net/2019/04/05/5ca71256f4137.png)

![repositories-json](https://i.loli.net/2019/04/05/5ca711441ccb8.png)

项目的完整源代码以及后续的教程源代码都会保存在我的 github 仓库：[Spiders](https://github.com/tjx666/Spiders)。如果我的教程对您有帮助，希望不要吝啬您的 star 😊。后续的教程可能就是一个更复杂的案例，通过分析 ajax 请求来直接访问接口。
