window.FISH_LIGHT_CONFIG = {
    title: "鱼灯点云模型",
    xyzFile: "./ImageToStl.com_20251211110417_d743b9d5.xyz",
    mediaPipeBasePath: "./libs/mediapipe/",
    defaults: {
        particleDensity: "0.5",
        particleSize: 0.015,
        particleColor: "#4fc3f7",
        rotationSpeed: 0.003,
        diffusionEnabled: true,
        cameraZ: 3
    },
    uiText: {
        panelTitle: "🐟 鱼灯点云模型",
        loadingText: "正在加载点云数据...",
        selectFilePrompt: "请点击选择XYZ文件按钮加载数据",
        selectFileButton: "选择XYZ文件",
        processingText: "正在处理数据...",
        loadFailedPrefix: "加载失败: ",
        cameraOff: "摄像头未开启",
        cameraOn: "摄像头已开启",
        cameraStartFailed: "摄像头启动失败",
        gestureNone: "未检测到手势",
        gestureOpen: "张手 ✋ - 放大+扩散",
        gestureFist: "握拳 ✊ - 缩小+聚集"
    }
};