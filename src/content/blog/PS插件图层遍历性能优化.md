---
title: PS 插件图层遍历性能优化
pubDatetime: 2022-09-11
modDatetime: 2022-09-11
---

Photoshop 中的 ExtendScript 和浏览器环境下 JavaScript 一样存在 DOM API 用于访问 PS 中的各种对象。图层类似 Web 中的 Element 是最基本的操作对象，也是我们编写 CEP 插件最常访问的 DOM 对象。一个 PSD 文档由众多的图层组成一棵 n 叉树，经常性我们需要去完整遍历这棵 n 叉树，而且往往是一次调用 JSX 接口就需要遍历多遍。这个时候遍历图层树就会成为性能瓶颈，本文将探讨各种遍历图层方式的性能差异，最终给出一种兼具性能和实用性的图层遍历方案。

## 使用 DOM API 遍历

刚接触 CEP 插件开发的人遍历最容易想到的就是像下面这样使用 DOM API 遍历图层树：

```javascript
/**
 * @param {LayerSet} layerSet
 * @returns {number[]}
 */
function traverse(layerSet) {
  const ids = [];

  /**
   * @param {LayerSet} layerSet
   */
  function dfs(layerSet) {
    for (var i = 0; i < layerSet.layers.length; i++) {
      var layer = layerSet.layers[i];
      ids.push(layer.id);

      if (layer.typename === 'LayerSet') {
        dfs(layer);
      }
    }
  }

  dfs(layerSet);
  return ids;
}

const start = Date.now();
$.writeln(
  '图层数：' + traverse(activeDocument).length + '，遍历耗时：' + (Date.now() - start) + 'ms',
);
```

我拿一个公司业务中遇到的一个图层数量相对较多的 psd 来跑上面的代码，就只是遍历整个树，获取遍历到图层的 id，测试三次的结果:

> 图层数：323，遍历耗时：5894ms
>
> 图层数：323，遍历耗时：5792ms
>
> 图层数：323，遍历耗时：5786ms

可以看到结果很离谱，我还没掺杂任务实际的业务逻辑进去，裸遍历就耗时近 6s。搞前端的都应该听过一个说法，一个交互超过 3s 没有响应，用户体验就很糟糕了。

而实际上，在我开发的一个插件中，目前就需要进行 7,8 次这样的遍历，并且随着业务的规则变多，需要遍历的次数也会变多。将近 1 年的时间我都在公司开发 adobe 的插件，最近半年是在写一个 PS 的插件。在某个版本发布后，内部的设计师测试后就向我反馈说上面这个 psd 一次流程耗时就需要 10 几分钟。这是不能接受的，那个时候我才真正意识到 jsx 环境险恶，需要死扣各种性能优化细节。刚开发的时候我更多的是考虑从系统的扩展性和可维护性，并没有特别性能问题。事实上我觉得这也是我入行以来，第一次在工作的业务中碰到严重的性能问题。

### DOM 操作真的慢吗？

通过下面的简单测试代码，我们来直观感受下 DOM 操作和非 DOM 操作的性能差距：

```javascript
const traverseCount = 10 * 10000;

// 访问内置的 DOM 对象 layer
const layer = activeDocument.activeLayer;
var start = Date.now();
for (var i = 0; i < traverseCount; i++) {
  layer.name;
}
const cost1 = Date.now() - start;

// 访问纯 JS 对象
const layerObj = {
  name: 'xxx',
};
start = Date.now();
for (var i = 0; i < traverseCount; i++) {
  layerObj.name;
}
const cost2 = Date.now() - start;

$.writeln(
  'DOM 对象耗时：' + cost1 + 'ms，纯 JS 对象耗时：' + cost2 + 'ms，相差：' + cost1 / cost2 + '倍',
);
// => DOM 对象耗时：1586ms，纯 JS 对象耗时：12ms，相差：132.166666666667倍
```

可以看到访问 DOM 对象的属性比访问纯对象属性的性能慢了百倍。我这里说纯对象就是指普通 JS 对象。

因此我们首先可以得到结论：

> 在 PS 的 jsx 环境下，DOM API 比普通对象性能差很多

### 所有的 DOM 属性访问速度都比纯对象慢吗？

我们知道 ExtendScript 的语法是基于 EcmaScript3 的，并夹杂了很多私货，例如操作符重载，@include 指令，三引号字符串等。其中对于对象的属性还区分了可变和不可变属性：

```javascript
const layer = activeDocument.activeLayer;
$.writeln([layer.name, layer.id, layer.typename].join(', '));
layer.name = 'xxx';
layer.id = 11111;
layer.typename = 'xxx';
$.writeln([layer.name, layer.id, layer.typename].join(', '));
// =>
// 装饰, 462, ArtLayer
// xxx, 462, ArtLayer
```

通过设置 `$.strict = true` 来开启对属性访问的严格限制，可以在修改只读属性属抛出异常：

![ExtendScript 属性修改严格模式](https://s1.ax1x.com/2022/09/11/vO8oJs.png)

那问题来了，只读属性的访问速度会不会和纯对像访问速度一样。因为我猜测 DOM API 之所以慢是因为每次访问底层都要和 c++ 做一次通过获取最新的数据，但是既然是只读的，那应该就不用了。

还是之前的测试代码，只不过这次访问的属性从可写的 `name` 变成只读的 `id`：

```javascript
const traverseCount = 10 * 10000;

// 访问内置的 DOM 对象 layer
const layer = activeDocument.activeLayer;
var start = Date.now();
for (var i = 0; i < traverseCount; i++) {
  layer.id;
}
const cost1 = Date.now() - start;

// 访问纯 JS 对象
const layerObj = {
  id: 666,
  name: 'xxx',
  typeName: 'LayerSet',
};
start = Date.now();
for (var i = 0; i < traverseCount; i++) {
  layerObj.id;
}
const cost2 = Date.now() - start;

$.writeln(
  'DOM 对象耗时：' + cost1 + 'ms，纯 JS 对象耗时：' + cost2 + 'ms，相差：' + cost1 / cost2 + '倍',
);
// => DOM 对象耗时：1522ms，纯 JS 对象耗时：12ms，相差：126.833333333333倍
```

从测试结果来看并无差异，但是当我把测试属性换成 `typeName` 时，测试结果居然出乎意料的性能差不了多少：

```javascript
const traverseCount = 10 * 10000;

// 访问内置的 DOM 对象 layer
const layer = activeDocument.activeLayer;
var start = Date.now();
for (var i = 0; i < traverseCount; i++) {
  layer.typename;
}
const cost1 = Date.now() - start;

// 访问纯 JS 对象
const layerObj = {
  id: 666,
  name: 'xxx',
  typeName: 'LayerSet',
};
start = Date.now();
for (var i = 0; i < traverseCount; i++) {
  layerObj.typeName;
}
const cost2 = Date.now() - start;

$.writeln(
  'DOM 对象耗时：' + cost1 + 'ms，纯 JS 对象耗时：' + cost2 + 'ms，相差：' + cost1 / cost2 + '倍',
);

// => DOM 对象耗时：29ms，纯 JS 对象耗时：16ms，相差：1.8125倍
```

说实话，我也摸不着头绪，`typeName` 这个属性确实就是和纯对象访问速度差不多，其它很多只读属性测试结果都和 `id` 一样有百倍的性能差距。

### 优化 DOM API 遍历速度

前面我们知道了在 jsx 中 DOM 访问性能很差，因此我们之前使用 DOM API 遍历图层树的速度才会那么慢。在使用 DOM API 的前提下，我们可以对之前的遍历算法做怎样的优化呢？

其实就是尽量减少 DOM API 的访问次数，重写之前的遍历算法：

```javascript
/**
 * @param {LayerSet} layerSet
 * @returns {number[]}
 */
function traverse(layerSet) {
  var ids = [];

  /**
   * @param {LayerSet} layerSet
   */
  function dfs(layerSet) {
    // 构造纯数组对象，layers 本身就是 DOM 对象
    const layers = [].slice.call(layerSet.layers);
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      ids.push(layer.id);

      if (layer.typename === 'LayerSet') {
        dfs(layer);
      }
    }
  }

  dfs(layerSet);
  return ids;
}

const start = Date.now();
$.writeln(
  '图层数：' + traverse(activeDocument).length + '，遍历耗时：' + (Date.now() - start) + 'ms',
);

// => 图层数：323，遍历耗时：4539ms
```

![减少 DOM API 访问次数](https://s1.ax1x.com/2022/09/11/vOGNfs.png)

其实 `layerSet.layers` 本身就是个响应式的 DOM 对象，通过将它转换成一个纯数组对象，避免后续多次访问 `layerSet.layers`。
从测试结果来看，改版后的图层遍历时间减少 1.5s 左右。我们具体减少了哪些 DOM API 操作呢？

一个是三段式 for 循环中的条件判断，重复遍历了 `layerSet.layers.length` 次，再就是循环体里面 `var layer = layerSet.layers[i]` 这里又访问了一次。

## 使用 ActionManager 遍历

### 线性结构-至底向上遍历

对 AM 不熟的同学可以看小强的 [AM 教程](https://blog.cutterman.cn/2021/12/19/action-manager-part2/)，这里不做过多讲解。使用 AM 遍历图层树：

```javascript
const s2t = stringIDToTypeID;
const AMLayerKind = {
  AnySheet: 0,
  PixelSheet: 1,
  AdjustmentSheet: 2,
  TextSheet: 3,
  VectorSheet: 4,
  SmartObjectSheet: 5,
  VideoSheet: 6,
  LayerGroupSheet: 7,
  ThreeDSheet: 8,
  GradientSheet: 9,
  PatternSheet: 10,
  SolidColorSheet: 11,
  BackgroundSheet: 12,
  HiddenSectionBounder: 13,
};

/**
 * 使用 AM 遍历 layer tree
 *
 * @param {(layerDesc: ActionDescriptor) => boolean} visit 返回 false 停止遍历
 * @param {StringID} property
 */
function traverseLayersDesc(visit, property) {
  const docRef = new ActionReference();
  docRef.putProperty(s2t('property'), s2t('numberOfLayers'));
  docRef.putIdentifier(s2t('document'), activeDocument.id);
  const docDesc = executeActionGet(docRef);
  const layerCount = docDesc.getInteger(s2t('numberOfLayers'));

  // 索引起始值，会受是否有背景图层影响
  const startItemIndex = app.activeDocument.layers[app.activeDocument.layers.length - 1]
    .isBackgroundLayer
    ? 0
    : 1;

  for (var i = startItemIndex; i <= layerCount; i++) {
    var layerRef = new ActionReference();
    layerRef.putProperty(s2t('property'), s2t('layerKind'));
    layerRef.putIndex(s2t('layer'), i);
    var layerDesc = executeActionGet(layerRef);
    var layerKind = layerDesc.getInteger(s2t('layerKind'));

    // 13 是组边界，是一个不可见的辅助图层，大多数情况没有用
    if (layerKind !== AMLayerKind.HiddenSectionBounder) {
      layerRef = new ActionReference();
      layerRef.putProperty(s2t('property'), s2t(property));
      layerRef.putIndex(s2t('layer'), i);
      layerDesc = executeActionGet(layerRef);
      var result = visit(layerDesc);

      if (result === false) {
        break;
      }
    }
  }
}

const start = Date.now();
const ids = [];
traverseLayersDesc(function (layerDesc) {
  ids.push(layerDesc.getInteger(s2t('layerID')));
}, 'layerID');
$.writeln('图层数：' + ids.length + '，遍历耗时：' + (Date.now() - start) + 'ms');
// => 图层数：323，遍历耗时：80ms
```

通过将 DOM API 改写成 AM 代码，同样一个包含 323 个图层的 psd，遍历时间从 4000ms 优化到 80ms，相差 50 倍。

思路大致就是：

1. 获取文档的图层数量
2. 图层的 itemIndex 是递增的，itemIndex 0 始终是留给背景图层的，如果有背景图层就从 0 开始遍历，如果不存在就从 1 开始
3. AM 获取一个图层有很多方式，例如当前选中图层，id，itemIndex，我们这里使用 itemIndex 来定位图层
4. AM 中 layerKind 为 13 图层表示一个组的边界，对于业务来说没用实际意义，用来辅助定位组的范围的，因此遍历的时候跳过
5. 出于性能的考虑我们这里让用户传 property 而不是直接返回一个图层的完整 ActionDescriptor
6. 如果回调返回 false，停止遍历

实际的业务需求中可能会需要访问多个属性，你可以在此基础上继续封装，比如我封装的一个遍历图层树的函数签名：

```javascript
traverseLayersDesc(
            visit: (layerDesc: ActionDescriptor) => boolean,
            property: StringID | StringID[],
            layerKind: AMLayerKind,
        ): void;
```

之所以说是线性结构，因为你遍历的时候使用的就是 itemIndex，类似一个一维数组。它不像树结构是有层级顺序，你没法在遍历到某个图层的时候停止遍历它的子图层。

自底向上，那是因为 itemIndex 的顺序就是从最底层的图层开始的。

![PS layers](https://s1.ax1x.com/2022/09/11/vOWpQ0.png)

对于上面的图层结构，看一下遍历的结果就很容易理解什么叫线性结构-至底向上了：

```javascript
const names = [];
traverseLayersDesc(function (layerDesc) {
  names.push(layerDesc.getString(s2t('name')));
}, 'name');
$.writeln(names.join(', '));
// => Background, Layer 3, Layer 1, Group 2, Layer 2, Group 1
```

### 树结构-自顶向下遍历

实际的业务需求中，上面的那种遍历应用场景很有限。主要有以下缺点：

1. 它是至底向上的，而往往我们需要的是至顶向下的遍历
2. 线性结构无法不能像树结构那样知道当前所处的层次信息，无法获取兄弟图层
3. 无法遍历到某个图层停止遍历子图层

这三个缺点我们来一一破解。

#### 如何至顶向下

学过数据结构的应该都知道三种 dfs 遍历顺序，前中后三种顺序的遍历，这里的前中后指的是根节点的遍历顺序。PS 的图层树是 n 叉树，这里为了简化问题，我们先从 2 叉树来考虑。

上面的至底向上遍历的顺序是下面这样，按数字从小到大，数字可以对应到 itemIndex。简单来说就是：

> 右子节点 -> 左子节点 -> 根节点

![至底向上](https://s1.ax1x.com/2022/09/11/vOfFjP.png)

而至顶向下（这里指前序遍历）的顺序是：

> 根节点 -> 左节点 -> 右节点

![至顶向下遍历](https://s1.ax1x.com/2022/09/11/vOfeAg.png)

可以看出遍历的顺序刚好相反，也就是说如果已知至底向上的遍历结果，我们直接逆转一下遍历结果就得到了至顶向下的结果。!

对于下面一棵字母树，至底向上遍历结果是：

> E -> D -> C -> B -> A

而自顶向下：

> A -> B -> C -> D -> E

是不是就是：**至顶向下的遍历结果就是至底向上结果的逆序**。

![字母树](https://s1.ax1x.com/2022/09/11/vOfQcq.png)

为了实现逆序，我们只需要遍历 itemIndex 的时候从大到小遍历就行了：

![至底向上改为至顶向下](https://s1.ax1x.com/2022/09/11/vOfLCj.png)

#### 如何转换为树状结构

刷过 LeetCode 树相关的题应该都做过重建二叉树类或者叫反序列化二叉树的题目，我们目前面对的就是这么一道题。我们已知前序遍历的结果是 `A -> B -> C -> D -> E`，怎样将它转换为一棵 n 叉树？

问题的关键是我们必须想办法确定每一层的边界，而这个边界我们之前其实就已经提到过，就是 layerKind 为 13 的组边界图层。

你可以假象下面的红框就是组边界图层，它实际上对用户是不可见的，但是它占用了一个 itemIndex，是一个底层的辅助图层。

![组边界图层](https://s1.ax1x.com/2022/09/11/vOhYsP.png)

对于上面的图层树至顶向下遍历结果为：

> Group 1, Layer 2, Group 2, Layer 1, </Layer group>, </Layer group>, Layer 3, Background

其中 `</Layer group>` 就是组边界图层。

利用它我们就可以写出遍历图层的最优解：

```javascript
// @include '../../JSX/polyfill/json2.jsx'

const s2t = stringIDToTypeID;
const AMLayerKind = {
  AnySheet: 0,
  PixelSheet: 1,
  AdjustmentSheet: 2,
  TextSheet: 3,
  VectorSheet: 4,
  SmartObjectSheet: 5,
  VideoSheet: 6,
  LayerGroupSheet: 7,
  ThreeDSheet: 8,
  GradientSheet: 9,
  PatternSheet: 10,
  SolidColorSheet: 11,
  BackgroundSheet: 12,
  HiddenSectionBounder: 13,
};

/**
 * @returns {LayerTreeNode}
 */
function createLayerTree() {
  const docRef = new ActionReference();
  docRef.putProperty(s2t('property'), s2t('numberOfLayers'));
  docRef.putIdentifier(s2t('document'), activeDocument.id);
  const docDesc = executeActionGet(docRef);
  const layerCount = docDesc.getInteger(s2t('numberOfLayers'));

  const startIndex = app.activeDocument.layers[app.activeDocument.layers.length - 1]
    .isBackgroundLayer
    ? 0
    : 1;
  const root = {
    // 暂时注释掉避免 JSON.stringify 因为循环引用报错
    // parent: null,
    layerKind: -1,
    itemIndex: -1,
    id: null,
    // 实际上业务开发中 name 并不常用，这里为了演示目的设置了 name
    name: 'root',
    layers: [],
    isRoot: true,
    isLayerSet: false,
  };
  var currentIndex = layerCount;
  function recursive(node) {
    while (currentIndex >= startIndex) {
      var ref = new ActionReference();
      ref.putIndex(s2t('layer'), currentIndex);
      currentIndex--;
      // 没有 putProperty，获取的是完整的 ActionDescriptor
      var desc = executeActionGet(ref);
      var name = desc.getString(s2t('name'));
      var id = desc.getInteger(s2t('layerID'));
      var layerKind = desc.getInteger(s2t('layerKind'));
      var isGroup = layerKind === AMLayerKind.LayerGroupSheet;
      var isGroupEnd = layerKind === AMLayerKind.HiddenSectionBounder;
      if (!isGroup && !isGroupEnd) {
        node.layers.push({
          // parent: node,
          layerKind: layerKind,
          itemIndex: currentIndex,
          id: id,
          name: name,
          layers: [],
          isRoot: false,
          isLayerSet: false,
        });
      } else if (isGroup) {
        var layerSet = {
          // parent: node,
          layerKind: layerKind,
          itemIndex: currentIndex,
          id: id,
          name: name,
          layers: [],
          isRoot: false,
          isLayerSet: true,
        };
        node.layers.push(layerSet);
        recursive(layerSet);
      } else {
        return;
      }
    }
  }
  recursive(root);
  return root;
}

$.writeln(JSON.stringify(createLayerTree(), null, 4));
```

输出结果：

```json
{
  "layerKind": -1,
  "itemIndex": -1,
  "id": null,
  "name": "root",
  "layers": [
    {
      "layerKind": 7,
      "itemIndex": 6,
      "id": 2,
      "name": "Group 1",
      "layers": [
        {
          "layerKind": 1,
          "itemIndex": 5,
          "id": 7,
          "name": "Layer 2",
          "layers": [],
          "isRoot": false,
          "isLayerSet": false
        },
        {
          "layerKind": 7,
          "itemIndex": 4,
          "id": 4,
          "name": "Group 2",
          "layers": [
            {
              "layerKind": 1,
              "itemIndex": 3,
              "id": 6,
              "name": "Layer 1",
              "layers": [],
              "isRoot": false,
              "isLayerSet": false
            }
          ],
          "isRoot": false,
          "isLayerSet": true
        }
      ],
      "isRoot": false,
      "isLayerSet": true
    },
    {
      "layerKind": 1,
      "itemIndex": 0,
      "id": 8,
      "name": "Layer 3",
      "layers": [],
      "isRoot": false,
      "isLayerSet": false
    },
    {
      "layerKind": 1,
      "itemIndex": -1,
      "id": 1,
      "name": "Background",
      "layers": [],
      "isRoot": false,
      "isLayerSet": false
    }
  ],
  "isRoot": true,
  "isLayerSet": false
}
```

使用下面代码测试耗时：

```javascript
/**
 * @param {LayerTreeNode} layerTree
 * @returns {number[]}
 */
function traverse(layerTree) {
  var ids = [];

  /**
   * @param {LayerSet} layerTree
   */
  function dfs(layerTree) {
    const layers = layerTree.layers;
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      ids.push(layer.id);

      if (layer.isLayerSet) {
        dfs(layer);
      }
    }
  }

  dfs(layerTree);
  return ids;
}

const start = Date.now();
$.writeln(
  '图层数：' + traverse(createLayerTree()).length + '，遍历耗时：' + (Date.now() - start) + 'ms',
);
// => 图层数：323，遍历耗时：418ms
```

相比之前 DOM API 的遍历方式还是快了近 10 倍。

相比之前那个至底向上的遍历慢，主要是因为：

1. 这个算法获取了完整的 ActionDescriptor 对象
2. 构造树本身也要耗时

### 两种 AM 遍历方式选哪种

上面俩种使用 AM 来遍历的方式各有优缺点，前者速度更快，二者应用场景更多，**如果前者能够满足你的应用场景直接用前者就好了**。

## 总结

1. 在 PS 的 ExtendScript 中，DOM API 非常耗性能
2. 对性能要求较高的场景尽量使用 AM 而不是 DOM API
3. 没事刷刷 LeetCode 还是有好处的，面试考算法还是有其合理之处的
