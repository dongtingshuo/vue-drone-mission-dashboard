# 项目结构与架构说明

本文档用于快速了解项目的模块边界、页面职责和主要数据流。

## 根目录

```text
drone-control-system/
├── .github/workflows/ci.yml  # GitHub Actions 构建检查
├── public/                   # 静态资源
├── src/                      # 应用源码
├── index.html                # Vite HTML 入口
├── package.json              # 项目元信息、脚本和依赖
├── package-lock.json         # 依赖锁定文件
├── README.md                 # 项目说明
├── STRUCTURE.md              # 项目结构说明
└── vite.config.js            # Vite 配置
```

## src 目录

```text
src/
├── layout/
│   └── MainLayout.vue        # 左侧导航、顶部状态栏和路由出口
├── router/
│   └── index.js              # 页面路由和懒加载配置
├── stores/
│   └── drone.js              # 无人机状态、任务记录、航拍数据等全局状态
├── views/
│   ├── MonitorView.vue       # 实时监控
│   ├── MissionView.vue       # AI任务控制
│   ├── VideoView.vue         # 航拍监控
│   ├── RecordsView.vue       # 任务记录列表
│   └── RecordDetailView.vue  # 任务详情
├── App.vue
├── main.js
└── style.css
```

## 页面职责

| 页面 | 路由 | 职责 |
| --- | --- | --- |
| MonitorView | `/monitor` | 展示飞行状态、轨迹、姿态、AI 检测目标和实时图表。 |
| MissionView | `/mission` | 编辑任务参数和航点，执行路径优化，保存或发送任务。 |
| VideoView | `/video` | 展示模拟航拍画面，管理 AI 标记、截图和录制记录。 |
| RecordsView | `/records` | 浏览、搜索、筛选、删除、导出和重新执行任务。 |
| RecordDetailView | `/records/:id` | 查看单个任务的基础信息、航点数据和 AI 分析报告。 |

## 状态管理

`src/stores/drone.js` 使用 Pinia 维护核心业务状态：

- `droneStatus`：无人机实时飞行状态。
- `trajectoryHistory`：飞行轨迹历史。
- `detectedTargets`：实时监控页 AI 检测目标。
- `missionRecords`：任务记录列表。
- `missionPlanForm` / `missionPlanNodes`：任务规划表单和航点。
- `videoAiMarks` / `videoScreenshots` / `videoRecordedSegments`：航拍监控相关状态。

## 数据流

```text
MainLayout 模拟连接无人机
  -> 周期性更新 Pinia store
  -> MonitorView / MissionView / VideoView / RecordsView 读取并展示状态
  -> 用户操作写回 store
  -> 任务详情、重新执行、导出等流程复用同一份任务记录
```

真实业务接入时，建议将 `MainLayout.vue` 中的模拟数据更新逻辑抽离为服务层，例如 `src/services/droneRealtime.js`，再通过 WebSocket、REST API 或设备 SDK 更新 store。

## 构建优化

`vite.config.js` 已按依赖类型进行基础分包：

- `vendor-vue`：Vue、Pinia 等核心运行时。
- `vendor-element-plus`：Element Plus 组件库。
- `vendor-charts`：ECharts 和 vue-echarts。
- `vendor-xlsx`：Excel 导出依赖。

该配置可降低单个产物体积，便于浏览器缓存和后续性能分析。
