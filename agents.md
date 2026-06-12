# AI 视觉对话助手 — 项目规范

## 技术栈
- Vite + React + TypeScript
- shadcn/ui + Tailwind CSS + Framer Motion
- 中转站 API: base_url=https://api.icodeeasy.cc
- 多模态模型: Gemini 3.1 Flash（主力）, GPT image2（备选）
- 语音识别: Web Speech API（浏览器端）
- 语音合成: Web Speech API TTS（浏览器端）
- 调试: vConsole（dev 模式注入）

## 目录结构
```
src/
├── components/       # UI 组件
│   ├── ui/           # shadcn/ui 基础组件
│   ├── Orb.tsx       # Orb 发光实体
│   └── Caption.tsx   # 字幕浮层
├── hooks/            # 自定义 hooks
│   ├── useCamera.ts
│   ├── useMicrophone.ts
│   ├── useSpeechRecognition.ts
│   ├── useFrameCapture.ts
│   ├── useAiChat.ts
│   └── useOrbState.ts
├── lib/              # 工具函数
│   ├── api.ts        # 中转站 API 封装
│   └── utils.ts
├── App.tsx
└── main.tsx
```

## PR 规范（竞赛要求）

### 提交规则
- 每个 PR 只做一件事，粒度尽可能细
- 全周期持续提交，时间戳均匀分布，严禁最后一天一次性导入
- 所有 commit 时间戳必须在开发周期内

### PR 模板
```
## 标题
一句话说明本 PR 新增/修改了什么

## 功能描述
说明该功能的作用与使用方式

## 实现思路
简要说明技术选型或核心实现逻辑

## 测试方式
如何验证该功能正常运行

## 备注
- 如有复用自己过往代码，注明来源
```

### PR 无效情形（禁止）
- PR 描述空白或与实际代码变更严重不符
- 引用第三方库未在 README 中列明依赖
- 复用自己过往代码未在 PR 描述中注明来源

## 开发约定
- 语言：中文注释/文档，英文代码/变量名/commit message
- commit message 用英文，简洁描述变更意图
- 手机 Safari 为主要测试平台（台式机无摄像头/麦克风）
- dev server 启动用 HTTPS + ngrok 隧道，确保手机可访问
- 不搞登录、不搞历史记录、不搞多轮上下文持久化 — MVP 只做核心体验闭环

## Orb 状态机
```
待机（灰色静态）→ 聆听（蓝色脉动）→ 思考（金色旋转）→ 说话（绿色波纹）→ 待机
```
