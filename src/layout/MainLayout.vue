<template>
  <div class="main-layout">
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="logo">
        <el-icon :size="32"><Position /></el-icon>
        <span class="logo-text">无人机控制系统</span>
      </div>
      
      <el-menu
        :default-active="activeMenu"
        router
        class="sidebar-menu"
      >
        <el-menu-item index="/monitor">
          <el-icon><Monitor /></el-icon>
          <span>实时监控</span>
        </el-menu-item>
        <el-menu-item index="/mission">
          <el-icon><Position /></el-icon>
          <span>AI任务控制</span>
        </el-menu-item>
        <el-menu-item index="/video">
          <el-icon><VideoCamera /></el-icon>
          <span>航拍监控</span>
        </el-menu-item>
        <el-menu-item index="/records">
          <el-icon><Document /></el-icon>
          <span>任务记录</span>
        </el-menu-item>
      </el-menu>

      <!-- 连接状态 -->
      <div class="connection-status">
        <div class="status-item">
          <span class="status-indicator">
            <span :class="['status-dot', wsConnected ? 'online' : 'offline']"></span>
            {{ wsConnected ? '已连接' : '未连接' }}
          </span>
        </div>
        <div class="drone-id" v-if="wsConnected">
          {{ droneStatus.id }}
        </div>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="main-content">
      <!-- 顶部栏 -->
      <header class="header">
        <div class="header-left">
          <h2 class="page-title">{{ currentRoute?.meta?.title || '控制台' }}</h2>
        </div>
        <div class="header-right">
          <div class="quick-stats">
            <div class="stat-item">
              <el-icon><Odometer /></el-icon>
              <span>{{ droneStatus.speed.toFixed(1) }} m/s</span>
            </div>
            <div class="stat-item">
              <el-icon><Upload /></el-icon>
              <span>{{ droneStatus.altitude.toFixed(1) }} m</span>
            </div>
            <div class="stat-item" :class="batteryClass">
              <el-icon><Lightning /></el-icon>
              <span>{{ droneStatus.battery }}%</span>
            </div>
          </div>
          <el-button 
            :type="wsConnected ? 'danger' : 'primary'" 
            @click="toggleConnection"
            :loading="connecting"
          >
            {{ wsConnected ? '断开连接' : '连接无人机' }}
          </el-button>
        </div>
      </header>

      <!-- 页面内容 -->
      <div class="page-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useDroneStore } from '../stores/drone'
import { storeToRefs } from 'pinia'

const route = useRoute()
const droneStore = useDroneStore()
const { droneStatus, wsConnected, batteryStatus } = storeToRefs(droneStore)

const connecting = ref(false)
let simulationInterval = null

const activeMenu = computed(() => route.path)
const currentRoute = computed(() => route)

const batteryClass = computed(() => {
  const battery = droneStatus.value.battery
  if (battery > 60) return 'battery-good'
  if (battery > 30) return 'battery-warning'
  return 'battery-danger'
})

function startSimulation() {
  let time = 0
  simulationInterval = setInterval(() => {
    time += 1
    

    const baseData = {
      battery: Math.max(0, 100 - time * 0.1),
      speed: 5 + Math.sin(time * 0.1) * 3,
      altitude: 50 + Math.sin(time * 0.05) * 20,
      latitude: 39.9042 + Math.sin(time * 0.02) * 0.01,
      longitude: 116.4074 + Math.cos(time * 0.02) * 0.01,
      heading: (time * 2) % 360,
      pitch: Math.sin(time * 0.1) * 5,
      roll: Math.cos(time * 0.1) * 3,
      yaw: (time * 2) % 360,
      signal: Math.max(60, 100 - Math.random() * 20),
      gpsCount: Math.floor(10 + Math.random() * 5),
      flightMode: time > 5 ? '自动巡航' : '起飞中',
      flightTime: time
    }
    
    droneStore.updateDroneStatus(baseData)
    

    if (time % 10 === 0) {
      const targetTypes = ['建筑物', '车辆', '人员', '树木', '障碍物']
      const riskLevels = ['low', 'medium', 'high']
      droneStore.addDetectedTarget({
        type: targetTypes[Math.floor(Math.random() * targetTypes.length)],
        confidence: (80 + Math.random() * 20).toFixed(1),
        lat: baseData.latitude + (Math.random() - 0.5) * 0.005,
        lng: baseData.longitude + (Math.random() - 0.5) * 0.005,
        risk: riskLevels[Math.floor(Math.random() * riskLevels.length)]
      })
    }
  }, 1000)
}

function stopSimulation() {
  if (simulationInterval) {
    clearInterval(simulationInterval)
    simulationInterval = null
  }
}

function toggleConnection() {
  if (wsConnected.value) {

    stopSimulation()
    droneStore.setWsConnected(false)
    droneStore.clearTrajectoryHistory()
    droneStore.clearDetectedTargets()
  } else {

    connecting.value = true
    setTimeout(() => {
      droneStore.setWsConnected(true)
      startSimulation()
      connecting.value = false
    }, 1500)
  }
}

onMounted(() => {

  toggleConnection()
})

onUnmounted(() => {
  stopSimulation()
})
</script>

<style scoped>
.main-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  width: 240px;
  background: var(--bg-card);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
}

.logo .el-icon {
  color: var(--primary-color);
}

.logo-text {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.sidebar-menu {
  flex: 1;
  padding: 12px 0;
}

.connection-status {
  padding: 16px;
  border-top: 1px solid var(--border-color);
  background: var(--bg-dark);
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.drone-id {
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-secondary);
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 24px;
}

.quick-stats {
  display: flex;
  gap: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--text-secondary);
}

.stat-item .el-icon {
  color: var(--primary-color);
}

.stat-item.battery-good .el-icon {
  color: var(--success-color);
}

.stat-item.battery-warning .el-icon {
  color: var(--warning-color);
}

.stat-item.battery-danger .el-icon {
  color: var(--danger-color);
}

.page-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  overflow-x: hidden;
}

/* 页面切换动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 响应式布局 */
@media (max-width: 1400px) {
  .sidebar {
    width: 220px;
  }
  
  .page-content {
    padding: 20px;
  }
}

@media (max-width: 1200px) {
  .sidebar {
    width: 200px;
  }
  
  .header {
    padding: 12px 20px;
  }
  
  .page-content {
    padding: 16px;
  }
  
  .quick-stats {
    gap: 16px;
  }
}

@media (max-width: 992px) {
  .sidebar {
    width: 180px;
  }
  
  .logo-text {
    font-size: 14px;
  }
  
  .page-title {
    font-size: 18px;
  }
  
  .quick-stats {
    display: none;
  }
}

@media (max-width: 768px) {
  .sidebar {
    width: 64px;
  }
  
  .logo-text {
    display: none;
  }
  
  .logo {
    justify-content: center;
    padding: 16px;
  }
  
  .sidebar-menu :deep(.el-menu-item span) {
    display: none;
  }
  
  .sidebar-menu :deep(.el-menu-item) {
    justify-content: center;
    padding: 0 !important;
  }
  
  .sidebar-menu :deep(.el-menu-item .el-icon) {
    margin-right: 0;
  }
  
  .connection-status {
    padding: 12px;
    text-align: center;
  }
  
  .connection-status .status-item span:not(.status-dot) {
    display: none;
  }
  
  .drone-id {
    display: none;
  }
  
  .page-content {
    padding: 12px;
  }
  
  .header {
    padding: 10px 12px;
  }
  
  .page-title {
    font-size: 16px;
  }
}

@media (max-width: 576px) {
  .header-right .el-button span {
    display: none;
  }
  
  .header-left {
    gap: 8px;
  }
  
  .page-content {
    padding: 10px;
  }
}
</style>
