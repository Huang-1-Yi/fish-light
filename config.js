// fish-light GitHub Pages 配置（参考 birthday 的 config.js 思路）
// 你只需要改这里，不用动 HTML。
window.FISH_LIGHT_CONFIG = {
  title: "鱼灯点云粒子模型",
  description: "基于 Three.js 的点云粒子 3D 查看器（支持鼠标/触控 + 可选手势控制）",

  // viewer 页面相对当前 fish-light/ 的路径。
  // 推荐把 GitHub Pages 发布目录设为 fishlightv3/（或仓库根），这样 ../fish-light-viewer.html 能访问到。
  viewerPath: "../fish-light-viewer.html",

  // viewer 使用的 .xyz 数据文件（目前 fish-light-viewer.html 默认会尝试同目录加载；如果你后续给 viewer 加了参数支持，可用到它）
  // xyzUrl: "../ImageToStl.com_20251211110417_d743b9d5.xyz",

  // true: 默认在页面内 iframe 预览；false: 只显示“打开查看器”按钮
  embedViewer: true
};
