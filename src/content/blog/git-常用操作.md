---
title: git 常用操作
tags:
  - git
categories:
  - 开发工具
author: 余腾靖
pubDatetime: 2019-05-08 19:28:00
---

这几天电脑总是蓝屏，有时候重启时还显示找不到系统，然后多重启几次又正常进入系统。昨天电脑蓝屏重启不下十次，忍无可忍，无须再忍，只好重装系统，换上了最新的 win10 1903。1903 在用户界面上做了挺多优化，窗口阴影，浅色主题，磨砂锁屏等，还有 windows 沙盒等新玩意。

但是换了之后还是会蓝屏重启，说明是硬件的问题。怀疑是主板有问题，平时用的是笔记本自带的键盘，很容易进灰，有时候边看视频边吃饭的时候可能进了些菜水什么的。今天把电脑后盖拆了之后清了清灰，用吹风机对着自带键盘吹了半天热风，再次重新装了系统。一天下来，啥也没干，装各种软件，配环境，用到现在也没蓝屏，不知道能持续几天。这不，现在要重新配下 git，顺便写篇文章记录一下，省的以后重新配的时候还要到处查资料。

<!-- more -->

## 配置账号信息

```bash
# 配置全局用户名
git config --global user.name 'your name'
# 配置全局邮箱
git config --global user.email 'your email address'
```

这里顺便说个之前碰到的一个很迷的问题。之前我发现我 github 的 `contributions` 一直没有计算我最近的 commit，只有零星几个绿点。当时我就发了个邮件向 github 团队求助，github 团队挺给力的，很快就给我说明了情况，说是计算用户的 commit 是和你提交数据中的邮箱账号相关的。也就是说判断一次提交是否是某个 github 用户的提交是看**该用户绑定的邮箱是否和 commit 用户的邮箱是相同的**。然后我就把我 github 绑定了我本地 git 配置的邮箱，之前的提交都重新算到我的 github 账号上了。

## 生成非对称密钥对

```bash
# 各个参数含义
$ ssh-keygen --help
ssh-keygen: unknown option -- -
usage: ssh-keygen [-q] [-b bits] [-t dsa | ecdsa | ed25519 | rsa]
                  [-N new_passphrase] [-C comment] [-f output_keyfile]
       ssh-keygen -p [-P old_passphrase] [-N new_passphrase] [-f keyfile]
       ssh-keygen -i [-m key_format] [-f input_keyfile]
       ssh-keygen -e [-m key_format] [-f input_keyfile]
       ssh-keygen -y [-f input_keyfile]
       ssh-keygen -c [-P passphrase] [-C comment] [-f keyfile]
       ssh-keygen -l [-v] [-E fingerprint_hash] [-f input_keyfile]
       ssh-keygen -B [-f input_keyfile]
       ssh-keygen -D pkcs11
       ssh-keygen -F hostname [-f known_hosts_file] [-l]
       ssh-keygen -H [-f known_hosts_file]
       ssh-keygen -R hostname [-f known_hosts_file]
       ssh-keygen -r hostname [-f input_keyfile] [-g]
       ssh-keygen -G output_file [-v] [-b bits] [-M memory] [-S start_point]
       ssh-keygen -T output_file -f input_file [-v] [-a rounds] [-J num_lines]
                  [-j start_line] [-K checkpt] [-W generator]
       ssh-keygen -s ca_key -I certificate_identity [-h] [-U]
                  [-D pkcs11_provider] [-n principals] [-O option]
                  [-V validity_interval] [-z serial_number] file ...
       ssh-keygen -L [-f input_keyfile]
       ssh-keygen -A
       ssh-keygen -k -f krl_file [-u] [-s ca_public] [-z version_number]
                  file ...
       ssh-keygen -Q -f krl_file file ...

```

一般用法：

```bash
# 密钥需要存放在 "~/.ssh" 文件夹下面，因为无论是 ssh 远程还是 git 远程仓库读取私钥都是从这个文件夹目录下读取，如果当前没有就创建
$ cd ~/.ssh
# 密钥长度建议设置 2048，越长越安全
$ ssh-keygen -b 2048 -t rsa -C 'ytj2713151713@gmail.com'
```

### 添加公钥（public key）到 github

打开 '~/.ssh' 目录，以 `.pub` 结尾的便是公钥。注意生成的公钥的第二行的空行也要复制过去。

可以看到下面的公钥是有个空行的。

![public key](https://i.loli.net/2019/05/08/5cd2d0b0d4753.png)

![github-ssh](https://i.loli.net/2019/05/08/5cd2df9832175.jpg)

## 常用命令

### 初始化仓库

```bash
git init
```

初始化仓库后会在当前文件夹生成一个 `.git` 文件夹，这个文件夹就是用来存放了整个仓库的版本信息。`.git` 文件夹就是本地仓库 (local repository)，项目根目录叫工作目录 (working directory)

### 添加修改到暂存区

```bash
# 将 file 添加到 stage 区
git add <file>
# 我一般都是用下面的命令一次性提交所有修改
git add -A
```

### 提交

```bash
git commit -m 'commit message'
```

### 推送本地代码到远程仓库服务器

#### 添加远程仓库地址

`remote-server-name` 是你给远程服务器取的一个名字。

```bash
git remote add remote-server-name server-address
```

例如添加 github 远程地址：

```bash
git remote add github git@github.com:tjx666/learn-git.git
```

#### 推送本地提交

```bash
git push remote-server-name -u branch-name
```

例如推送到 github：

```
git push github -u master
```

`-u` 是 `set-upstream` 断参数，用于添加一个和当前分支相关联的远程地址，下次还在同一个分支 `git push` 就不用指定远程仓库地址了，直接使用 `git push` 即可。

### 查看仓库信息

#### 查看仓库状态

```bash
# 示例
$ git status
On branch master
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git checkout -- <file>..." to discard changes in working directory)

        modified:   test.txt

no changes added to commit (use "git add" and/or "git commit -a")
```

#### 查看文件修改内容

```bash
$ git diff HEAD -- test.txt
diff --git a/test.txt b/test.txt
index a9682e5..a9ef16d 100644
--- a/test.txt
+++ b/test.txt
@@ -1 +1,2 @@
-原谅我放荡不羁爱自由。
\ No newline at end of file
+原谅我放荡不羁爱自由。
+放屁，单身狗的自我安慰。
\ No newline at end of file
```

#### 查看提交记录

```bash
$ git log
commit 412d436e2380d4d64c663849c81eb7646a204755 (HEAD -> master)
Author: YuTengjing <ytj2713151713@gmail.com>
pubDatetime:   Wed May 8 21:46:39 2019 +0800

    append comment to test.txt

commit 6bc24d2f5c1b1462e4fe8828492151ffab78b49e
Author: YuTengjing <ytj2713151713@gmail.com>
pubDatetime:   Wed May 8 21:40:26 2019 +0800

    init project
```

#### 查看版本操作记录

```bash
$ git reflog
412d436 (HEAD -> master) HEAD@{0}: commit: append comment to test.txt
6bc24d2 HEAD@{1}: commit (initial): init project
```

待补充...
