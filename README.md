#外输的 js-sdk 加载器

## 这是什么？

这是一个针对js-sdk版本迭代管理的加载器。

## 代码发布

如果你修改了本项目的代码，请使用以下命令发布代码：

```
npm run publish
```

会自动提交代码带 `gitlab`，包含构建后的 `lib` 代码，将作为其他项目中的安装引用。

### 为啥这么做？

因为 ci 的docker 可能没有 `tnpm` 命令，或者 `tnpm` 不能安装 ali 内网的 tnpm 包，因此将构建结果发布到本代码库，通过 gitlab 地址直接安装使用，这样就可以在需要的项目中依赖 并生成对应的 `sdkloader`;

### 在项目中如何安装 `sdkloader` ？

在 package.json 的 `dependencies`中加入如下依赖，然后即可用 npm 命令安装使用了。

```JSON
"dependencies": {
  "sdkloader": "http://gitlab.alibaba-inc.com/lego-team/sdkloader/repository/archive.tar.gz?ref=master"
}
```
