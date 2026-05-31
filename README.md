# AI辅助无人机实时监控与任务控制系统

中文 | [English](#ai-assisted-drone-real-time-monitoring-and-mission-control-system)

一个基于 Vue 3 + Vite 的无人机任务控制前端项目，面向巡检、安防、农田监测等场景，提供实时飞行状态、航点规划、航拍识别和任务记录管理等工作台能力。

> 当前版本使用前端模拟数据演示完整交互流程，可作为无人机地面站、低空巡检平台或可视化大屏的前端原型继续扩展。

## 项目亮点

- 深色调控制台界面，适合实时监控和数据密集场景。
- 连接无人机后自动生成模拟飞行数据，展示电量、速度、高度、姿态、轨迹和信号状态。
- 支持航点增删改查、任务参数配置、路径优化和任务保存/发送。
- 内置航拍画面模拟、AI识别标记、手动框选、截图和录制记录。
- 任务记录支持搜索、筛选、详情查看、重新执行和 Excel 导出。
- 使用路由懒加载和 Vite 分包配置，降低首屏资源压力。

## 技术栈

| 类型 | 技术 |
| --- | --- |
| 前端框架 | Vue 3 |
| 构建工具 | Vite |
| 状态管理 | Pinia |
| 路由 | Vue Router |
| UI 组件 | Element Plus |
| 图表 | ECharts / vue-echarts |
| 数据导出 | xlsx |

## 功能模块

| 模块 | 说明 |
| --- | --- |
| 实时监控 | 展示无人机在线状态、飞行指标、姿态仪表、轨迹地图和 AI 检测目标。 |
| AI任务控制 | 进行任务配置、航点编辑、路径优化、任务保存与发送。 |
| 航拍监控 | 模拟实时航拍画面，支持目标识别标记、截图、录制和自动检测。 |
| 任务记录 | 管理历史任务，支持筛选、导出、详情查看、删除和重新执行。 |

## 快速开始

### 环境要求

- Node.js >= 20.19.0
- npm >= 10.0.0

### 安装与运行

```bash
npm install
npm run dev
```

开发服务器启动后，打开终端提示的本地地址即可访问。

### 常用命令

```bash
npm run dev      # 启动开发服务器
npm run build    # 构建生产版本
npm run preview  # 本地预览生产构建
npm run check    # 执行构建检查
```

## 项目结构

```text
drone-control-system/
├── .github/workflows/ci.yml  # GitHub Actions 构建检查
├── public/                   # 静态资源
├── src/
│   ├── layout/               # 主布局
│   ├── router/               # 路由配置
│   ├── stores/               # Pinia 状态管理
│   ├── views/                # 页面视图
│   ├── App.vue
│   ├── main.js
│   └── style.css
├── index.html
├── package.json
├── STRUCTURE.md
└── vite.config.js
```

更多结构说明见 [STRUCTURE.md](./STRUCTURE.md)。

## 数据说明

项目目前未连接真实无人机、后端服务或 AI 推理服务。实时飞行数据、航拍识别结果和任务记录均在前端模拟生成，便于展示页面交互和业务流程。

后续接入真实服务时，可将 Pinia store 中的模拟更新逻辑替换为 WebSocket、REST API 或设备 SDK 数据源。

## 部署建议

构建静态资源：

```bash
npm run build
```

生成的 `dist/` 目录可部署到 GitHub Pages、Vercel、Netlify 或任意静态站点服务。

---

# AI-Assisted Drone Real-Time Monitoring and Mission Control System

[中文](#ai辅助无人机实时监控与任务控制系统) | English

A Vue 3 + Vite frontend project for drone mission control scenarios such as inspection, security patrol, and agricultural monitoring. It provides a dashboard-style workspace for real-time flight status, waypoint planning, aerial recognition, and mission record management.

> The current version uses simulated frontend data to demonstrate the full interaction flow. It can be extended into a drone ground station, low-altitude inspection platform, or visualization dashboard prototype.

## Highlights

- Dark control-console interface designed for real-time monitoring and data-dense workflows.
- Simulated drone connection with live battery, speed, altitude, attitude, trajectory, and signal data.
- Waypoint CRUD, mission parameter configuration, path optimization, and mission save/dispatch flows.
- Simulated aerial video, AI recognition marks, manual selection, screenshots, and recording records.
- Mission search, filtering, detail view, re-execution, deletion, and Excel export.
- Route lazy loading and Vite chunk splitting for a cleaner production build.

## Tech Stack

| Category | Technology |
| --- | --- |
| Frontend Framework | Vue 3 |
| Build Tool | Vite |
| State Management | Pinia |
| Router | Vue Router |
| UI Library | Element Plus |
| Charts | ECharts / vue-echarts |
| Data Export | xlsx |

## Features

| Module | Description |
| --- | --- |
| Real-Time Monitoring | Displays drone online status, flight metrics, attitude panel, trajectory map, and AI detection targets. |
| AI Mission Control | Edits mission parameters and waypoints, optimizes routes, and saves or dispatches missions. |
| Aerial Monitoring | Simulates an aerial video feed with target recognition marks, screenshots, recording, and automatic detection. |
| Mission Records | Manages historical missions with filtering, export, detail view, deletion, and re-execution. |

## Getting Started

### Requirements

- Node.js >= 20.19.0
- npm >= 10.0.0

### Installation

```bash
npm install
npm run dev
```

After the development server starts, open the local URL shown in the terminal.

### Scripts

```bash
npm run dev      # Start the development server
npm run build    # Build for production
npm run preview  # Preview the production build locally
npm run check    # Run the build check
```

## Project Structure

```text
drone-control-system/
├── .github/workflows/ci.yml  # GitHub Actions build check
├── public/                   # Static assets
├── src/
│   ├── layout/               # Main layout
│   ├── router/               # Router configuration
│   ├── stores/               # Pinia state management
│   ├── views/                # Page views
│   ├── App.vue
│   ├── main.js
│   └── style.css
├── index.html
├── package.json
├── STRUCTURE.md
└── vite.config.js
```

See [STRUCTURE.md](./STRUCTURE.md) for more architectural details.

## Data Notes

This project is not connected to real drones, backend services, or AI inference services yet. Real-time flight data, aerial recognition results, and mission records are generated in the frontend to demonstrate the user flow.

When integrating real services later, the simulated update logic in the Pinia store can be replaced with WebSocket, REST API, or device SDK data sources.

## Deployment

Build static assets:

```bash
npm run build
```

The generated `dist/` directory can be deployed to GitHub Pages, Vercel, Netlify, or any static hosting service.
