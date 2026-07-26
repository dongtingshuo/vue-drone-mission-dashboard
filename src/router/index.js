import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Layout',
    component: () => import('../layout/MainLayout.vue'),
    redirect: '/monitor',
    children: [
      {
        path: '/monitor',
        name: 'Monitor',
        component: () => import('../views/MonitorView.vue'),
        meta: { title: '实时监控', icon: 'Monitor' }
      },
      {
        path: '/mission',
        name: 'Mission',
        component: () => import('../views/MissionView.vue'),
        meta: { title: 'AI任务控制', icon: 'Position' }
      },
      {
        path: '/video',
        name: 'Video',
        component: () => import('../views/VideoView.vue'),
        meta: { title: '航拍监控', icon: 'VideoCamera' }
      },
      {
        path: '/records',
        name: 'Records',
        component: () => import('../views/RecordsView.vue'),
        meta: { title: '任务记录', icon: 'Document' }
      },
      {
        path: '/records/:id',
        name: 'RecordDetail',
        component: () => import('../views/RecordDetailView.vue'),
        meta: { title: '任务详情', icon: 'Document' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
