# AI 视觉对话助手 - 项目规范

## 项目目标
构建一个手机 Safari 可演示的 AI 视觉对话助手：用户打开页面后授权摄像头与麦克风，通过语音提问，系统抓取当前画面并让多模态模型给出语音与字幕回应。

## 当前 MVP 边界
- 核心闭环：摄像头预览 -> 语音识别 -> 抓取单帧 -> 多模态请求 -> 字幕展示 -> TTS 播放。
- 不做登录、不做历史记录、不做长期上下文持久化。
- 成本优先：按需单帧抓取，不做连续视频流上传。

## 技术栈
- Vite + React + TypeScript
- shadcn/ui + Tailwind CSS + Framer Motion
- Node.js 本地后端代理
- AI API: DashScope OpenAI-compatible endpoint `https://dashscope.aliyuncs.com/compatible-mode/v1`
- 多模态模型: `qwen-vl-plus`
- 语音识别: Web Speech API
- 语音合成: Web Speech API TTS
- 调试: dev 模式注入 vConsole

## 目录结构约定
```
docs/
├── design.md         # 产品设计说明、用户故事、成本控制策略

backend/
└── server.mjs         # 本地 AI API 代理，读取 AI_API_KEY

frontend/
├── src/
│   ├── components/    # 业务 UI 组件
│   │   ├── ui/        # shadcn/ui 基础组件
│   │   ├── Orb.tsx
│   │   ├── Caption.tsx
│   │   ├── DialogueStatus.tsx
│   │   └── MobileActionBar.tsx
│   ├── hooks/         # 自定义 hooks
│   ├── lib/           # 前端 API client 与工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── styles.css
├── index.html
├── vite.config.ts
└── tsconfig.json

scripts/
├── dev.mjs            # 同时启动前端和后端
└── start-ngrok.ps1
```

新增项目级文档放在 `docs/`，文件名使用短横线或语义名，优先服务评审复现和后续维护；临时排查材料不进入 `docs/`。
前端源码只放在 `frontend/src/`，后端源码只放在 `backend/`；根目录不再新增 `src/`。
API key 只放在本地 `.env` 的 `AI_API_KEY`，由后端代理读取，禁止写入 `VITE_*` 前端变量、源码或浏览器存储。

## 开发命令
依赖安装后使用：
```bash
npm run dev
npm run build
npm run preview
```

手机测试阶段使用本地 HTTP dev server 与 ngrok HTTPS 隧道：
```bash
npm run dev
npm run tunnel
```

`npm run dev` 会同时启动前端 Vite 和后端代理；改 `.env` 后必须重启。

## 产品与交互原则
- 第一屏必须是可操作产品界面，不做营销页。
- 移动端 Safari 优先，所有主要操作必须适合单手触控。
- 反馈要能指导下一步：权限失败、网络失败、模型失败都要给出恢复路径。
- 系统承担复杂度：能自动推断的状态不要求用户手动选择。

## PR 与提交规范
- 每个 PR 只做一件事，粒度尽可能细。
- commit message 使用英文，简洁描述变更意图。
- README 必须列明第三方依赖和原创功能部分。
- 复用自己过往代码时必须在 PR 描述中注明来源。
- `git push` 只用于跨设备同步，必须等用户明确要求。

## Orb 状态机
```
idle（灰色静态） -> listening（蓝色脉动） -> thinking（金色旋转） -> speaking（绿色波纹） -> idle
```
