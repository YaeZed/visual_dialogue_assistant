# AI 视觉对话助手

手机优先的 AI 视觉对话助手 MVP。用户授权摄像头和麦克风后，可以用语音向 AI 询问当前画面内容，并获得字幕与语音回应。

## 当前状态
- PR1: Vite + React + TypeScript 项目骨架

## 本地开发
```bash
npm install
npm run dev
npm run build
```

## 第三方依赖
- React / React DOM: 前端 UI 渲染
- Vite: 本地开发服务器与构建
- TypeScript: 类型检查

后续 PR 会加入 Tailwind CSS、shadcn/ui、Framer Motion、vConsole、HTTPS 与隧道调试能力。

## 原创功能
- 面向手机 Safari 的视觉对话体验设计
- Orb 状态可视化交互
- 单帧抓取式多模态对话流程，控制带宽与模型成本

