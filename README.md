# fish-light（GitHub Pages 入口）

这个目录是 `fish-light` 的 GitHub Pages 站点入口，写法参考了 `birthday/` 的结构：
- `index.html` 作为入口页
- `config.js` 放可配置项
- `custom.js` 做最小的 DOM 初始化
- `assets/` 放静态样式

## 推荐的 GitHub Pages 发布方式

### 方式 A（推荐）：把 Pages 发布目录指向 `fishlightv3/`（或仓库根）

这样 `fishlightv3/fish-light/index.html` 可以通过相对路径访问到上级的 `fish-light-viewer.html`，同时 viewer 默认也能在同目录加载 `.xyz` 数据文件。

访问地址形如：
- `https://<user>.github.io/<repo>/fish-light/`

### 方式 B：只发布 `fishlightv3/fish-light/`

如果你把 Pages 的发布目录设置成 `fishlightv3/fish-light/`，那么：
- `../fish-light-viewer.html`（上级文件）通常不会被发布到站点里
- viewer 默认尝试自动加载 `.xyz` 也会更容易失败

这种情况下 viewer 仍然可以使用“选择XYZ文件”按钮从本地加载，但如果你希望自动加载，需要把 `fish-light-viewer.html` 和 `.xyz` 一并放到发布目录里，并同步修改路径。

## 配置

- 修改 `config.js` 里的：
  - `title` / `description`
  - `viewerPath`（指向 viewer 页面的位置）
  - `embedViewer`（是否内嵌 iframe 预览）

## 本地预览

由于 iframe + fetch 在 `file://` 下可能受浏览器限制，建议用静态服务器预览，例如 VS Code 的 Live Server。
