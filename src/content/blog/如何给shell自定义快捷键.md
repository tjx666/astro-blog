---
title: 如何给 shell 自定义快捷键
description: 最近在开发的时候有刻意的去思考有哪些影响自己开发效率的因素。比如我实际碰到的一个问题就是当 zsh-autosuggestions 插件完整提示出你要运行的命令，但是我在 Mac 上要先输入 cmd 
pubDatetime: 2022-03-20
---

最近在开发的时候有刻意的去思考有哪些影响自己开发效率的因素。比如我实际碰到的一个问题就是当 `zsh-autosuggestions` 插件完整提示出你要运行的命令，但是我在 Mac 上要先输入 `cmd + ->`，再敲回车。输入 Mac 自带键盘的右箭头是很影响输入效率的，当时我就想，我能不能通过快捷键 `shift + enter` 实现接受 zsh 提示并回车运行。在摸了两小时 🐟 后，总算是在 iterm2 和 VSCode 的 terminal 都完美实现了自己的需求。

<!-- ![VSCode 示例](../../assets/images/如何给 shell 自定义快捷键/vscode-example.gif) -->

### shell 快捷键原理

本质上对于 shell 来说只有输入输出，它不会监听你系统快捷键的，监听快捷键其实是终端模拟器的责任，他会将你输入的快捷键转换成字符串序列。当我们使用了类似 `ctrl + ->` 这样的快捷键，shell 会根据你输入的字符序列来识别为一个快捷操。

在 zsh 中，你可以通过先输入快捷键 `ctrl + v` 再输入你的快捷键，来看你输入的快捷键被转换成了什么字符序列：

<!-- ![快捷键字符序列](../../assets/images/如何给 shell 自定义快捷键/查看快捷键字符序列.gif) -->

可以看到快捷键 `ctrl + ->` 本质上是给 shell 输了字符序列：`^[[1;5C`。

## 自定义 shell 快捷键

现在我们知道了本质上我们输入的快捷键会被终端模拟器转换成一系列的字符序列传给 shell。常见的终端模拟器例如 iterm2 和 VSCode 的 xterm 都支持将你的快捷键转换输入一段指定的字符序列。

而在 zsh 中我们可以通过 `bindkey` 命令来定义快捷键，也就是在 zsh 接收到某个字符序列时执行某个操作。

通过命令 `bindkey -l` 可以查看 zsh 中定义的一些快捷键集合：

```bash
❯ bindkey -l
.safe
command
emacs
isearch
listscroll
main
menuselect
vicmd
viins
viopp
visual
```

使用命令 `bindkey -M 集合名` 可以查看该集合中的所有快捷键：

```bash
❯ bindkey -M main
"^@" set-mark-command
"^A" beginning-of-line
"^B" backward-char
"^D" delete-char-or-list
"^E" end-of-line
"^F" forward-char
# more...
```

查阅 [zsh-autosuggestions](https://github.com/zsh-users/zsh-autosuggestions#key-bindings) 的文档我们得知，如果要直接执行 zsh 的提示可以用下面的形式定义快捷键：

```bash
# 使用 ctrl + space 快捷键直接执行当前 zsh 提示
bindkey '^ ' autosuggest-accept
```

`ctrl + space` 我觉得不太符合这个操作的含义，我想改成 `shift + enter`，对应的自定义快捷键代码可以改成：

```bash
bindkey '^[SE' autosuggest-execute
```

也就是说在 zsh 在收到字符序列 `^[SE` 的时候你去直接执行 zsh 的提示。这个字符序列其实只要你是以控制字符开头就行，一般来将用 `^[` 开头就行了，后面的 `SE` 是可以随便写的，不和其它快捷键冲突就行，这里我用 SE 只就是想表达 `shift` 和 `enter` 键。

那么现在问题来到如何在终端模拟器中配置快捷键对应的字符序列。

### iterm2 配置快捷键字符序列

打开 iterm2，通过操作路径 `Preference -> Profiles -> Keys -> Key Mappings` 打开键位映射配置。我们先切换预设为 `Natural Text Editing`，注意切换的时候会提示是否保留之前的快捷键，建议是保留。

![Key Mappings](https://s2.loli.net/2022/03/20/fL9uTiM2V6K3om5.png)

点击预设 Presets 旁边的 `+` 号添加快捷键，Action 我们选择输入文本，文本内容为快捷键要传给 shell 的字符序列 `^[SE`：

![iterm2 设置快捷键](https://s2.loli.net/2022/03/20/aBPskf25TVMrLwx.png)

OK，这样我们就配置好了 iterm2 使用快捷键 `shift + enter` 直接执行 zsh 提示的语句了。

### VSCode 集成终端自定义快捷键字符序列

查看 VSCode 集成终端的官方文档：[Integrated Terminal in Visual Studio Code](https://code.visualstudio.com/docs/editor/integrated-terminal#_send-text-via-a-keybinding)。我们得知如果配置集成终端将快捷键转换自定义的字符序列需要像下面这样配置快捷键。通过 `cmd + shift + p` 打开命令面板，输入 `open shortcuts json` 打开 VSCode 的快捷键配置文件，添加下面的快捷键配置：

```json
// keybinding.json
{
  "key": "shift+enter",
  "command": "workbench.action.terminal.sendSequence",
  "when": "terminalFocus",
  // text 参数就是你需要输入给 shell 的自定义序列
  "args": { "text": "\u001bSE" }
}
```

`\u001b` 对应的就是输入 `^[`，这个可以查看 xterm 的源码可知：[List of C0 and C1 control codes](https://github.com/xtermjs/xterm.js/blob/0e45909c7e79c83452493d2cd46d99c0a0bb585f/src/common/data/EscapeSequences.ts)。

本文讲的内容只在 zsh 上进行过测试，想必其它平台的 shell 应该是大同小异，可能会些不一样，读者需要自行摸索，有什么问题可以在评论区提出来。

本文完。

未经本人允许，禁止转载，目前只发表于知乎和掘金平台。
