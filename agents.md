# AI 视觉对话助手 — 项目规范

## 技术栈
- Vite + React + TypeScript
- shadcn/ui + Tailwind CSS + Framer Motion
- Node.js 本地后端代理
- AI API: DashScope OpenAI-compatible endpoint `https://dashscope.aliyuncs.com/compatible-mode/v1`
- 多模态模型: `qwen-vl-plus`
- 语音识别: Web Speech API（浏览器端）
- 语音合成: Web Speech API TTS（浏览器端）
- 调试: vConsole（dev 模式注入）

## 目录结构
```
docs/
├── design.md                  # 产品设计说明、用户故事、成本控制策略
├── product-design-summary.md  # 功能计划、最终实现与运营成本控制总结
├── e2e-device-test-checklist.md
├── task_plan.md               # 开发规划与 PR 拆分
├── findings.md                # 过程发现与决策依据
└── progress.md                # 阶段进度与验证记录

backend/
└── server.mjs         # 本地 AI API 代理，读取 AI_API_KEY

frontend/
├── src/
│   ├── components/    # UI 组件
│   ├── hooks/         # 自定义 hooks
│   ├── lib/           # 前端 API client 与工具函数
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── vite.config.ts
└── tsconfig.json

scripts/
├── dev.mjs            # 同时启动前端和后端
└── start-ngrok.ps1
```

新增项目级文档和长期过程记录放在 `docs/`。前端源码只放在 `frontend/src/`，后端源码只放在 `backend/`。API key 只放在本地 `.env` 的 `AI_API_KEY`，禁止写入 `VITE_*` 前端变量、源码或浏览器存储。

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
