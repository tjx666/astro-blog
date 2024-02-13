---
title: VSCode 又酷又实用的多光标编辑
pubDatetime: 2022-03-27
modDatetime: 2022-03-29
featured: true
---

如果要说 VSCode 哪个特性极大的提高了编码效率，多光标编辑绝对是其中之一。多光标编辑让我们避免重复进行相同的文本操作，VSCode 内建的和第三方扩展提供的文本处理命令更是能极大的增强多光标编辑的灵活性。希望通过阅读这篇文章，能够教会读者如何在日常编辑中灵活运用多光标编辑。

内容大纲：

- Mac 和 Windows 按键映射关系
- 如何添加多光标
- 移动光标
- 选中文本
- 删除文本
- VSCode 快捷键的设计哲学
- 文本处理命令
- 多光标实战示例
- 多光标编辑外更好的选择

## Mac 和 Windows 按键映射关系

- Mac 上的 ⌘ 也就是 command 键对应 Windows 上的 ctrl，command 键简称 cmd
- Mac 上的 ⌥ 也就是 option 键对应 WIndows 上的 alt

^ 就是 ctrl 键，另外在 Mac 自带的键盘上：

- cmd + → 等同于 end 键
- cmd + ← 等同于 home 键
- fn + backspace 等同于 delete 键

Mac 的键盘由于同时有 cmd 键和 ctrl 键，所以相比于 Windows 平台可以配置更多的快捷键。

文中提到的快捷键可以按照上面的对应关系去映射，例如：

- cmd + D 是添加选区到下一个查找到的匹配，在 Windows 上对应快捷键就应该是 ctrl + D
- cmd + option + ↑ 是在上一行同一列添加光标，在 Windows 上对应的快捷键就应该是 ctrl + alt + ↑

关系对应并不一定完全准确，利用好 VSCode 的快捷键搜索功能，支持模糊搜索和记录键位搜索。模糊搜索可以匹配命令名，快捷键，when 表达式，来源等，你在快捷键表里面看得到的文本都可以用来模糊搜索。

之前是没有按键映射这部分内容的，我原以会大多数程序员对于 Mac 和 Windows 系统的按键映射关系应该没什么问题才对，但还是扛不住在 [V2EX](https://www.v2ex.com/t/843239) 上问的人太多。

## 如何添加多光标

### 通用的方法

按住 <kbd>⌥</kbd> 键不放，再将光标移动到任何你想添加光标的地方直接点击就会增加一个光标。

![通用的方法](https://s2.loli.net/2022/03/26/e5Bybvk9nurJqSc.gif)

### 添加光标的快捷键

> VSCode 中和光标相关的快捷键中都有 ⌥ 键

我们可以通过 <kbd>⌘</kbd>+<kbd>K</kbd>, <kbd>⌘</kbd>+<kbd>S</kbd> 快捷键组合打开 VSCode 快捷键表，搜索 `cursor` 会列出所有和光标有关的快捷键，搜索 `add cursor` 就可以查看和 `添加光标` 相关的快捷键：

![VSCode 添加多光标快捷键.png](https://s2.loli.net/2022/03/27/oUiHwexWBvOy8RP.png)

同一列添加光标：

- <kbd>⌘</kbd>+<kbd>⌥</kbd>+<kbd>↓</kbd>: 在下一行同一列添加光标
- <kbd>⌘</kbd>+<kbd>⌥</kbd>+<kbd>↑</kbd>: 在上一行同一列添加光标

![同一列添加光标演示](https://s1.ax1x.com/2022/03/27/qB3ynS.gif)

### 添加选区

VSCode 编辑器中可以同时存在多个光标，也可以同时存在多个选区。在 VSCode 中大多数添加选区的命令，添加选区的同时也会添加一个光标。因此我们可以利用添加选区的快捷键来添加多光标。

常用的有：

- <kbd>⌘</kbd>+<kbd>D</kbd>：添加选区到下一个查找到的匹配，如果匹配到多个，每触发一次就多添加一个
- <kbd>⌘</kbd>+<kbd>⇧</kbd>+<kbd>L</kbd>: 添加选区到所有查找到的匹配

![添加选区](https://s1.ax1x.com/2022/03/27/qB3c7Q.gif)

上面两个快捷键虽然是说查到到的匹配，实际上使用的时候并不会展开搜索框。

VSCode 提供的命令很多时候是满足对称性的，例如 <kbd>⌘</kbd>+<kbd>D</kbd> 是添加选区到下一个查找到匹配，那么大概率就会有一个命令用于添加选区到前一个查到到的匹配。

![添加选区快捷键](https://s2.loli.net/2022/03/26/tpfR7xWMGKO8cmD.png)

如过要查找的文本比较复杂，我们可以直接先打开搜索，利用搜索框提供的 `大小写忽略`，`匹配整个单词`，`正则` 功能来查找复杂的文本，再使用 <kbd>⌘</kbd>+<kbd>⇧</kbd>+<kbd>L</kbd> 来选中所有。

![通过搜索来添加选区](https://s2.loli.net/2022/03/26/sIfcbknyrYqHu7j.gif)

**如果已经有一个选区**，我们可以使用快捷键 <kbd>⌥</kbd>+<kbd>⇧</kbd>+<kbd>I</kbd> 来在选区的所有行尾添加光标。如果这个时候你想将光标移动到行首，直接输入 `Home` 键即可。

下面的例子就是先选中多行，再将光标添加到所有行的行尾，将 TypeScript 的 interface 改成使用逗号来分隔属性：

![添加光标到选区行尾](https://s1.ax1x.com/2022/03/27/qB3mTJ.gif)

## 光标移动

多光标编辑的时候显然是不能使用鼠标定位的，这就要求我们使用按键去移动。最基本的上下左右四个箭头，Home, End 键就不用多说了。除此之外，常用的还有每次移动一个单词，或者单词的一部分。

通过搜索 `cursor right`，`cursor end` 之类的可以查看和移动光标相关的快捷键：

![cursor right](https://s2.loli.net/2022/03/26/Cu3JZXQE5kPdTpt.png)

单词级别的移动是非常常用的：

- <kbd>⌥</kbd>+<kbd>→</kbd>：向右移动光标到下一个词尾
- <kbd>^</kbd>+<kbd>⌥</kbd>+<kbd>→</kbd>：向右移动光标到单词的下一部分，驼峰，词首和词尾都是停留点

![移动一个单词](https://s2.loli.net/2022/03/27/H8a1CgQyIMo96PX.gif)

之前说过 VSCode 命令的对称式设计，<kbd>⌥</kbd>+<kbd>→</kbd> 是向右移动到下一个词尾，那么 <kbd>⌥</kbd> + <kbd>←</kbd> 就是向左移动上一个词首。

而且这里也验证了之前我们说的，和光标相关的快捷键都有 <kbd>⌥</kbd>。所以我们自定义快捷键时，和光标相关的快捷键最好也带上 <kbd>⌥</kbd>。例如可以定义 <kbd>⌥</kbd>+<kbd>J</kbd> 为移动到上一个 git change 处，再对称式设计 <kbd>⌥</kbd>+<kbd>K</kbd> 移动到下一个 git change 处。方便记忆，也方便搜索。

有些 Mac 用户可能会觉得光标移动太慢，这个可以在 `设置` -> `键盘`中调节，让光标移动的更丝滑：

![按键重复](https://s2.loli.net/2022/03/27/VIFTDUeOj3xhWub.png)

- 拖移 `重复前延迟` 滑块以设置字符开始重复前的等待时间。
- 拖移 `按键重复` 滑块以设置字符重复的速率。

建议把 `按键重复` 速度**调快**，这样光标移动就会更快更丝滑。

## 选中文本

在多光标编辑时，最常见操作便是移动，选中，删除，插入等。

> 移动光标的快捷键加上 <kbd>⇧</kbd> 就是选中**移动区域**的快捷键

稍微列举几个例子验证这个规律：

- <kbd>→</kbd> 是向右移动一个字符，<kbd>⇧</kbd>+<kbd>→</kbd> 可以向右选中下一个字符
- <kbd>↑</kbd> 是向上移动一行，<kbd>⇧</kbd>+<kbd>↑</kbd> 就是向上选中一行
- <kbd>⌥</kbd>+<kbd>→</kbd> 是向右移动到词尾，<kbd>⇧</kbd>+<kbd>⌥</kbd>+<kbd>→</kbd> 就是选中光标当前位置到下一个词尾
- <kbd>^</kbd>+<kbd>⌥</kbd>+<kbd>→</kbd> 是向右移动到单词的下一部分，<kbd>⇧</kbd>+<kbd>^</kbd>+<kbd>⌥</kbd>+<kbd>→</kbd> 就是向右选中单词的一部分

![向右选中一个单词](https://s1.ax1x.com/2022/03/27/qB89BD.gif)

有个需要单独介绍的选中命令是 `smart select`。我们知道快捷键 `cmd + D` 可以选中一个单词，但如果想选中一个字符串它就不行了，这个时候可以就可以用智能选中来实现。

- <kbd>^</kbd>+<kbd>⇧</kbd>+<kbd>→</kbd>：扩大选中范围
- <kbd>^</kbd>+<kbd>⇧</kbd>+<kbd>←</kbd>：减小选中范围

![smart select](https://s2.loli.net/2022/03/27/ZrVjpihockGnUsq.gif)

最近 antfu 有写一个用双击来智能选中文本的扩展，虽然和多光标编辑没啥关系，不过感兴趣的读者可以体验一下：**[vscode-smart-clicks](https://github.com/antfu/vscode-smart-clicks)**。

## 删除文本

> 移动光标的快捷键加上 <kbd>⌫</kbd> 键就是**向左**删除光标移动区域的快捷键，加上 fn + <kbd>⌫</kbd> 就是**向右**删除光标移动区域的快捷键

Mac 上 <kbd>⌘</kbd>+<kbd>→</kbd> 表示 `End` 键，<kbd>⌘</kbd>+<kbd>←</kbd> 表示 `Home` 键，fn + <kbd>⌫</kbd> 表示 `Delete` 键这个规则应该是所有应用都通用的。

- <kbd>⌥</kbd>+<kbd>⌫</kbd>: 向左删除到词首
- <kbd>^</kbd> + <kbd>⌥</kbd>+<kbd>⌫</kbd>: 向左删除词的一部分

因为 Backspace 本身就带有方向性，因此快捷键里面不需要搭配方向键。

## VSCode 快捷键的设计哲学

- 和光标移动相关的快捷键都包含 option 键，对应 Windows 上就是 alt

- 光标移动的快捷键搭配 shift 就是选中移动区域的快捷键
- 光标移动的快捷键搭配 backspace 就是删除移动区域的快捷键
- VSCode 快捷键设计的对称性，有向右的快捷键是 xxx + → ，那么向左的快捷键就是 xxx + ←</kbd>

记住移动相关的快捷键，使用上面的规律等同于记住了选中和删除的快捷键，你自定义快捷键也应该要符合这个规律。

其它的规律：

- cmd + k 用于组合复杂的快捷键，例如 cmd + k, cmd + s 是快捷键表

- 和面板相关的快捷键都是 cmd + shift + xxx，例如 cmd + shift + e 是打开文件列表面板，cmd + shift + d 是 debug 面板的，cmd + shift + f 是打开搜索搜索面板的，cmd + shift + j 是新建 terminal 的，cmd + shift + m 是打开问题面板的，cmd + shift + u 是打开 output 面板的，cmd + shift + y 是打开 debug output 面板的

有没有想过为什么 cmd + k, cmd + s 是打开快捷键表的快捷键？k 就是 key，s 就是 shortcut。

为什么 cmd + shift + e 是打开文件列表面板的快捷键？e 就是 explorer。

d 就是 debug，f 就是 find，这也是为什么英文软件尽量不用汉化的原因。

学什么东西不需要成本？如果掌握了上面的规律还是觉得记快捷键太麻烦，那我觉得 vim 你还是碰都不要碰的好，那要记的东西可要多的多的多。

自定义快捷键是一门学问，有时间单独写一期文章。但可能不是只聊咋自定义快捷键，而是聊 VSCode 命令的设计哲学，本质上快捷键都是为了触发触发命令。如果你想自定义快捷键实现一些功能，那么你应该去查对应的命令。

## 文本处理命令

在多光标编辑时我们可以借助 VSCode 自带的或者第三方扩展提供的命令来快捷插入特定文本或者将选中文本转换成特定文本。

VSCode 内置的有下面几个，以单词 `letterCase` 举例，转换结果分别为：

- Transform to Uppercase:`LETTERCASE`
- Transform to Lowercase:`lettercase`
- Transform to Title Case:`LetterCase`
- Transform to Snake Case:`letter_case`

搜索 `transform to` 就可以找到所有文本转换命令了

![VSCode 内置文本命令](https://s2.loli.net/2022/03/27/oZq4289Ehf5tyBu.png)

举个实际的使用例子，例如我们要把一堆原本是小驼峰的常量改成全大写：

![转换常量为全大写](https://s2.loli.net/2022/03/27/kixECvjdOuzI8sn.gif)

除了 VSCode 内置的文本处理命令，还可以借助第三方插件，这里推荐：[Text Power Tools](https://github.com/qcz/vscode-text-power-tools)。推荐理由：维护积极，功能丰富。

功能非常多，读者可以查看扩展主页自行了解。我觉得如果你没有探索精神和折腾的能力估计也看不到文章这里了。我这里只演示一下插入数字的功能：

![插入数字](https://s2.loli.net/2022/03/27/xVEdyK8uoGqQbOj.gif)

有能力的读者也可以自己编写 VSCode 扩展去实现更多的插入，转换，甚至删除等文本处理命令。需要注意的是实现的时候要处理所有选中，例如笔者的 VSCode 扩展 [VSCode FE Helper](https://github.com/tjx666/vscode-fe-helper) 实现的将选中单词变复数的扩展是下面这样实现的。代码很简单。可以注意到里面遍历了所有选区，所以在多光标编辑时调用这个命令时能够处理所有选中：

```ts
import { TextEditor } from 'vscode';

export default async function plur(editor: TextEditor): Promise<void> {
  const { default: pluralize } = await import('pluralize');
  editor.edit((editorBuilder) => {
    const { document, selections } = editor;
    for (const selection of selections) {
      const word = document.getText(selection);
      const pluralizedWord = pluralize(word);
      editorBuilder.replace(selection, pluralizedWord);
    }
  });
}
```

![pluralize](https://s2.loli.net/2022/03/27/Uo5AYIL6t9gr4Gx.gif)

## 多光标实战示例

接下来我会演示几个我平时用到多光标的几个例子。对于不熟悉多光标编辑的朋友可能看着会有点复杂，不过自己实操一遍多练练应该就没问题。我平时开发的时候经常会用到多光标编辑，但没有文中演示的那么丝滑，可能步骤也不是最少的，但还是比重复编辑效率高多了。也会经常输错，但是没关系反正可以撤回嘛。

### 替换 var

众所周知，当你学会了 ctrl + c, ctrl + v，你已经是个初级程序员了。当你不但能够抄代码还能够改别人的代码，那么你已经是个成熟的程序员了。学会了多光标编辑，可以大大提高那我们修改代码的效率。

当我们从 stackoverflow 抄了一段 JS 代码下来，可能里面有很多 var，我们可以利用多光标编辑来将所有 var 替换成 let。

Steps:

1. 将光标定到 var 上
2. <kbd>⌘</kbd>+<kbd>⇧</kbd>+<kbd>L</kbd>，来选中所有 var
3. 输入 let

![替换 var](https://s2.loli.net/2022/03/27/z9DTBNwlXCMojYJ.gif)

### 安装多个 node package

有时新开了一个项目，我会需要安装很多 eslint 插件。最开始我的做法是是到之前项目的 package.json 中把包名一个一个抄过来，那太麻烦了。有人说，你咋不直接把包名和版本号一块复制到新项目的 package.json 就好了，不那样做主要是之前项目的包版本号不一定是最新的，新项目需要安装最新的版本。

Steps:

1. 打开 package.json，把光标定到第一个包名
2. <kbd>⌘</kbd>+<kbd>Alt</kbd>+<kbd>↓</kbd> 添加多个光标到多个包名
3. <kbd>^</kbd>+<kbd>⇧</kbd>+<kbd>→</kbd>，利用 `smart select` 选中包名并 <kbd>⌘</kbd>+<kbd>C</kbd> 复制
4. <kbd>⌘</kbd>+<kbd>N</kbd>，新建一个临时文件，<kbd>⌘</kbd>+<kbd>V</kbd> 粘贴过去
5. 把光标定到第二行的行首，<kbd>⌘</kbd>+<kbd>Alt</kbd>+<kbd>↓</kbd> 往下面同一列添加多光标
6. 先 <kbd>⌫</kbd>，再敲一个空格就可以把整个文本复制到 terminal 了

![安装多个 node package](https://s2.loli.net/2022/03/27/fLGTtunjhi6pmd9.gif)

### 重构 react router path 为枚举

原代码：

```ts
function App() {
  return (
    <HashRouter>
      <Routes>
        <Route index element={<Home />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/collection" element={<Collection />} />
        <Route path="/notFound" element={<NotFound />} />
      </Routes>
    </HashRouter>
  );
}
```

将原本字符串形式的路由重构为枚举类型：

```ts
export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route index element={<Home />} />
        <Route path={RoutePath.Settings} element={<Settings />} />
        <Route path={RoutePath.Collection} element={<Collection />} />
        <Route path={RoutePath.NotFound} element={<NotFound />} />
      </Routes>
    </HashRouter>
  );
}

enum RoutePath {
  Settings = '/settings',
  Collection = '/collection',
  NotFound = '/notFound',
}
```

挑选这个例子主要是因为操作过程中用到了文本处理命令来处理大小写问题，由于步骤太多，大家就直接看动图演示吧：

![重构 react route path](https://s2.loli.net/2022/03/27/Ri9qLBJkE8bf63A.gif)

### 实现 LetterMapper 类型

在我 [TypeScript 类型体操实例解析](https://github.com/tjx666/blog/blob/main/src/TS%20%E7%B1%BB%E5%9E%8B%E4%BD%93%E6%93%8D%E5%AE%9E%E4%BE%8B%E8%A7%A3%E6%9E%90.md) 这篇文章中有实现过一个将字符串字面量类型中所有字符转换成大写的类型：

```ts
type LetterMapper = {
  a: 'A';
  b: 'B';
  c: 'C';
  d: 'D';
  e: 'E';
  f: 'F';
  g: 'G';
  h: 'H';
  i: 'I';
  j: 'J';
  k: 'K';
  l: 'L';
  m: 'M';
  n: 'N';
  o: 'O';
  p: 'P';
  q: 'Q';
  r: 'R';
  s: 'S';
  t: 'T';
  u: 'U';
  v: 'V';
  w: 'W';
  x: 'X';
  y: 'Y';
  z: 'Z';
};

type CapitalFirstLetter<S extends string> = S extends `${infer First}${infer Rest}`
  ? First extends keyof LetterMapper
    ? `${LetterMapper[First]}${Rest}`
    : S
  : S;
```

这个 `LetterMapper` 类型手敲会觉得很浪费光阴，让我们用多光标编辑酷炫的实现它：

![Letter Mapper](https://s2.loli.net/2022/03/27/pA8dDa7h3zcKYIJ.gif)

## 多光标编辑之外的选择

VSCode 作为编辑器界的新生代王者，集百家之众长，除了多光标编辑还有很多可以提高编码和重构效率的特性。例如：

- F2 重命名符号，批量替换变量名可以的话就不要用多光标编辑，重命名符号更安全
- 替换所有，有跨文件的和 tab 内的，如果你只是想要替换文本，也许直接用 VSCode 替换文本功能会简单和安全，对于复杂的文本你可以使用正则搜索
- Snippets，曾经在 twitter 看到有人发帖说写了一下午的 react 组件，结果人家一个 snippet 就整完了
- Code Actions On Save，在保存文件的时候自动添加缺失的 imports，格式化，lint 的 auto fix 等
- auto fix 和 fix all，如果你用了自动保存就不能用 Code Actions On Save 了，不过你可以手动调用 lsp 或者 lint 扩展提供的自动修复和修复所有命令
- 各种格式化扩展，例如使用 prettier 格式化代码风格，[JS/TS Import/Export Sorter](https://marketplace.visualstudio.com/items?itemName=dozerg.tsimportsorter) 格式化 imports

等等。作为一个 VSCode 老玩家，我都觉得 VSCode 还有很多使用的功能特性地方我没探索到。众所周知，折腾编辑器，折腾 shell，折腾系统，是程序员的三大乐趣。充满未知才会有趣，才能让我们热此不疲，让我们每一次发现新大陆的时候感叹自己以前的无知。

## 总结

多光标编辑是 VSCode 一个非常实用的特性，熟练掌握光标的移动，选中，删除和一些常用的文本处理命令可以让我们使用多光标编辑时更加得心应手。VSCode 的快捷键设计有它的一套自己的设计哲学，理解它不但有助于我们记忆快捷键，也便于在快捷键表中搜索。在我们自定义快捷键或者编写扩展的提供默认快捷键的时候也应该要参考这套哲学。当你觉得对下前编码重构的效率不满意时，不妨折腾下编辑器，也许能够带给你意外的惊喜。

本文完。

首发于我的 [blog 仓库](https://github.com/tjx666/blog)，[掘金](https://juejin.cn/user/2664871915684493/posts), [知乎](https://www.zhihu.com/people/yu-teng-jing/posts) 和 [V2EX](https://www.v2ex.com/t/843239)。欢迎在 blog 仓库提 issue 或者在评论区提问讨论，未经本人允许，禁止转载。
