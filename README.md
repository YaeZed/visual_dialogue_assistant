# AI 视觉对话助手

手机优先的 AI 视觉对话助手 MVP。用户授权摄像头和麦克风后，可以用语音向 AI 询问当前画面内容，并获得字幕与语音回应。

## 当前状态
- PR1: Vite + React + TypeScript 项目骨架
- PR2: UI 基础（Tailwind CSS、shadcn/ui 基础结构、Framer Motion）
- PR3: 手机调试环境（HTTPS dev server、vConsole、ngrok 脚本）
- PR4: 摄像头模块（权限获取、全屏视频背景、失败重试反馈）
- PR5: 麦克风与语音识别（权限获取、Web Speech API、实时 transcript）
- PR6: 视频帧抓取（canvas 截图、JPEG 压缩、抓帧元信息）
- PR7: API 层开发中

## 本地开发
```bash
npm install
npm run dev
npm run build
```

手机 Safari 调试：
```bash
copy .env.example .env
npm run dev:https
npm run tunnel
```

`.env` 中将 `VITE_ENABLE_VCONSOLE=true` 后，dev 模式会注入 vConsole，方便在手机上看日志。生产构建不注入。

`.env` 可配置 `VITE_AI_API_BASE_URL` 和 `VITE_AI_MODEL`。API key 不写入 `.env` 或源码，后续通过本次会话输入传给 API 层。

## 第三方依赖
- React / React DOM: 前端 UI 渲染
- Vite: 本地开发服务器与构建
- TypeScript: 类型检查
- Tailwind CSS: 样式系统
- shadcn/ui 基础依赖（class-variance-authority、clsx、tailwind-merge、Radix Slot）: 可组合 UI 组件
- Framer Motion: 状态切换与界面动效
- lucide-react: 图标
- @vitejs/plugin-basic-ssl: 本地 HTTPS 开发服务器
- vConsole: 手机浏览器调试面板

ngrok 用于把本地 HTTPS 服务暴露给手机访问，需要开发机提前安装并登录。

## 原创功能
- 面向手机 Safari 的视觉对话体验设计
- Orb 状态可视化交互
- 单帧抓取式多模态对话流程，控制带宽与模型成本
