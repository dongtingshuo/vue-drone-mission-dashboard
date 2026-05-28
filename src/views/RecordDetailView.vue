<template>
  <div class="record-detail-view">
    <!-- 返回按钮 -->
    <div class="back-bar">
      <el-button @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        返回列表
      </el-button>
      <h2 class="detail-title">{{ record?.name || '任务详情' }}</h2>
      <el-tag :type="getStatusType(record?.status)">{{ getStatusName(record?.status) }}</el-tag>
    </div>

    <div class="detail-content" v-if="record">
      <!-- 左侧信息 -->
      <div class="detail-left">
        <!-- 基本信息 -->
        <div class="dashboard-card info-card">
          <div class="card-header">
            <span class="card-title">
              <el-icon><Document /></el-icon>
              基本信息
            </span>
          </div>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">任务ID</span>
              <span class="info-value">{{ record.missionId || 'MSN-' + record.id.toString(36).toUpperCase() }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">任务类型</span>
              <span class="info-value">{{ getTypeName(record.type) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">航点数量</span>
              <span class="info-value">{{ record.waypoints }} 个</span>
            </div>
            <div class="info-item">
              <span class="info-label">飞行距离</span>
              <span class="info-value">{{ (record.distance || 0).toFixed(2) }} km</span>
            </div>
            <div class="info-item">
              <span class="info-label">预估时长</span>
              <span class="info-value">{{ record.duration }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">创建时间</span>
              <span class="info-value">{{ record.createdAt }}</span>
            </div>
          </div>
        </div>

        <!-- AI分析报告 -->
        <div class="dashboard-card report-card">
          <div class="card-header">
            <span class="card-title">
              <el-icon><DataAnalysis /></el-icon>
              AI分析报告
            </span>
          </div>
          <div class="report-content" v-if="record.aiReport">
            <div class="report-stats">
              <div class="report-stat">
                <div class="report-stat-value">{{ record.aiReport.detectedObjects }}</div>
                <div class="report-stat-label">检测对象数</div>
              </div>
              <div class="report-stat">
                <div class="report-stat-value">{{ record.aiReport.obstacles }}</div>
                <div class="report-stat-label">障碍物数量</div>
              </div>
              <div class="report-stat">
                <div class="report-stat-value">{{ record.aiReport.pathDeviation }}%</div>
                <div class="report-stat-label">路径偏差率</div>
              </div>
            </div>
            
            <div class="report-chart" ref="reportChartRef"></div>
            
            <div class="detection-list">
              <h4>检测结果明细</h4>
              <div class="detection-item" v-for="item in detectionResults" :key="item.id">
                <div class="detection-icon" :class="item.type">
                  <el-icon v-if="item.type === 'building'"><OfficeBuilding /></el-icon>
                  <el-icon v-else-if="item.type === 'vehicle'"><Van /></el-icon>
                  <el-icon v-else-if="item.type === 'person'"><User /></el-icon>
                  <el-icon v-else><Warning /></el-icon>
                </div>
                <div class="detection-info">
                  <span class="detection-name">{{ item.name }}</span>
                  <span class="detection-time">{{ item.time }}</span>
                </div>
                <span class="detection-confidence">{{ item.confidence }}%</span>
              </div>
            </div>
          </div>
          <el-empty v-else description="该任务暂无AI分析报告" :image-size="80" />
        </div>
      </div>

      <!-- 右侧地图 -->
      <div class="detail-right">
        <div class="dashboard-card map-card">
          <div class="card-header">
            <span class="card-title">
              <el-icon><MapLocation /></el-icon>
              飞行轨迹回溯
            </span>
            <el-button-group>
              <el-button size="small" :type="playbackSpeed === 1 ? 'primary' : ''" @click="playbackSpeed = 1">1x</el-button>
              <el-button size="small" :type="playbackSpeed === 2 ? 'primary' : ''" @click="playbackSpeed = 2">2x</el-button>
              <el-button size="small" :type="playbackSpeed === 4 ? 'primary' : ''" @click="playbackSpeed = 4">4x</el-button>
            </el-button-group>
          </div>
          
          <div class="trajectory-map">
            <svg class="trajectory-svg" viewBox="0 0 500 400" preserveAspectRatio="xMidYMid meet">
              <!-- 网格背景 -->
              <defs>
                <pattern id="detailGrid" width="25" height="25" patternUnits="userSpaceOnUse">
                  <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#2d3748" stroke-width="0.5"/>
                </pattern>
              </defs>
              <rect width="500" height="400" fill="url(#detailGrid)" />
              
              <!-- 完整轨迹 -->
              <polyline 
                :points="trajectoryPoints.map(p => `${p.x},${p.y}`).join(' ')"
                fill="none"
                stroke="#409eff"
                stroke-width="3"
                stroke-opacity="0.5"
              />
              
              <!-- 已播放轨迹 -->
              <polyline 
                :points="playedPoints.map(p => `${p.x},${p.y}`).join(' ')"
                fill="none"
                stroke="#67c23a"
                stroke-width="3"
              />
              
              <!-- 航点标记 -->
              <g v-for="(point, index) in trajectoryPoints" :key="index">
                <circle 
                  :cx="point.x" 
                  :cy="point.y" 
                  r="8"
                  :fill="index <= currentPointIndex ? '#67c23a' : '#409eff'"
                  stroke="#fff"
                  stroke-width="2"
                />
                <text 
                  :x="point.x" 
                  :y="point.y + 4" 
                  font-size="10" 
                  fill="#fff"
                  text-anchor="middle"
                >
                  {{ index + 1 }}
                </text>
              </g>
              
              <!-- 无人机位置 -->
              <g :transform="`translate(${dronePos.x}, ${dronePos.y}) rotate(${droneRotation})`">
                <circle r="12" fill="#f56c6c" fill-opacity="0.3" />
                <polygon 
                  points="0,-8 6,8 0,4 -6,8" 
                  fill="#f56c6c"
                  stroke="#fff"
                  stroke-width="1"
                />
              </g>
            </svg>
            
            <!-- 播放控制 -->
            <div class="playback-controls">
              <el-button circle @click="togglePlayback">
                <el-icon><VideoPause v-if="isPlaying" /><VideoPlay v-else /></el-icon>
              </el-button>
              <el-slider 
                v-model="playbackProgress" 
                :max="100" 
                :format-tooltip="val => `${val}%`"
                style="flex: 1; margin: 0 16px;"
                @change="onProgressChange"
              />
              <span class="playback-time">{{ playbackTimeStr }}</span>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <el-button @click="reExecuteMission">
            <el-icon><Refresh /></el-icon>
            重新执行
          </el-button>
          <el-button type="warning" @click="exportReport">
            <el-icon><Download /></el-icon>
            导出报告
          </el-button>
          <el-button type="danger" @click="deleteRecord">
            <el-icon><Delete /></el-icon>
            删除记录
          </el-button>
        </div>
      </div>
    </div>
    
    <el-empty v-else description="未找到任务记录" :image-size="120" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDroneStore } from '../stores/drone'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as echarts from 'echarts'

const route = useRoute()
const router = useRouter()
const droneStore = useDroneStore()
const { missionRecords } = storeToRefs(droneStore)

const reportChartRef = ref(null)
let reportChart = null

const record = computed(() => {
  const id = parseInt(route.params.id)
  return missionRecords.value.find(r => r.id === id)
})

const detectionResults = ref([
  { id: 1, type: 'building', name: '厂房建筑', time: '09:32:15', confidence: 94 },
  { id: 2, type: 'vehicle', name: '运输车辆', time: '09:35:22', confidence: 87 },
  { id: 3, type: 'person', name: '工作人员', time: '09:38:45', confidence: 82 },
  { id: 4, type: 'obstacle', name: '临时障碍', time: '09:41:10', confidence: 91 }
])

const isPlaying = ref(false)
const playbackSpeed = ref(1)
const playbackProgress = ref(0)
const currentPointIndex = ref(0)
let playbackTimer = null

const trajectoryPoints = computed(() => {
  const count = record.value?.waypoints || 5
  const points = []
  for (let i = 0; i < count; i++) {
    points.push({
      x: 50 + (400 / (count - 1)) * i,
      y: 350 - Math.sin(i * 0.8) * 100 - i * 20
    })
  }
  return points
})

const playedPoints = computed(() => {
  return trajectoryPoints.value.slice(0, currentPointIndex.value + 1)
})

const dronePos = computed(() => {
  if (trajectoryPoints.value.length === 0) return { x: 50, y: 350 }
  
  const progress = playbackProgress.value / 100
  const totalPoints = trajectoryPoints.value.length - 1
  const exactIndex = progress * totalPoints
  const index = Math.floor(exactIndex)
  const fraction = exactIndex - index
  
  if (index >= totalPoints) {
    return trajectoryPoints.value[totalPoints]
  }
  
  const p1 = trajectoryPoints.value[index]
  const p2 = trajectoryPoints.value[index + 1]
  
  return {
    x: p1.x + (p2.x - p1.x) * fraction,
    y: p1.y + (p2.y - p1.y) * fraction
  }
})

const droneRotation = computed(() => {
  if (trajectoryPoints.value.length < 2) return 0
  
  const progress = playbackProgress.value / 100
  const totalPoints = trajectoryPoints.value.length - 1
  const exactIndex = progress * totalPoints
  let index = Math.floor(exactIndex)
  

  if (index >= totalPoints) {
    index = totalPoints - 1
  }
  
  const p1 = trajectoryPoints.value[index]
  const p2 = trajectoryPoints.value[index + 1] || trajectoryPoints.value[index]
  

  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  

  const angle = Math.atan2(dx, -dy) * (180 / Math.PI)
  
  return angle
})

const playbackTimeStr = computed(() => {
  const totalMinutes = parseInt(record.value?.duration) || 25
  const currentMinutes = Math.floor(totalMinutes * playbackProgress.value / 100)
  const currentSeconds = Math.floor((totalMinutes * 60 * playbackProgress.value / 100) % 60)
  return `${currentMinutes}:${currentSeconds.toString().padStart(2, '0')} / ${totalMinutes}:00`
})

function getTypeName(type) {
  const names = { patrol: '区域巡逻', point: '定点飞行', trace: '轨迹追踪' }
  return names[type] || type
}

function getStatusName(status) {
  const names = { saved: '已保存', executing: '执行中', completed: '已完成', cancelled: '已取消' }
  return names[status] || status
}

function getStatusType(status) {
  const types = { saved: 'info', executing: 'warning', completed: 'success', cancelled: 'danger' }
  return types[status] || 'info'
}

function goBack() {
  router.push('/records')
}

function togglePlayback() {
  isPlaying.value = !isPlaying.value
  
  if (isPlaying.value) {
    playbackTimer = setInterval(() => {
      playbackProgress.value += 0.5 * playbackSpeed.value
      currentPointIndex.value = Math.floor(playbackProgress.value / 100 * (trajectoryPoints.value.length - 1))
      
      if (playbackProgress.value >= 100) {
        playbackProgress.value = 100
        isPlaying.value = false
        clearInterval(playbackTimer)
      }
    }, 100)
  } else {
    clearInterval(playbackTimer)
  }
}

function onProgressChange(val) {
  currentPointIndex.value = Math.floor(val / 100 * (trajectoryPoints.value.length - 1))
}

function reExecuteMission() {
  ElMessageBox.confirm('确定要重新执行此任务吗？将跳转到AI任务控制界面并加载原任务方案', '重新执行任务', {
    type: 'info',
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).then(() => {

    droneStore.setCurrentMission({
      id: record.value.id,
      name: record.value.name + ' (重新执行)',
      type: record.value.type,
      waypoints: record.value.waypoints,
      distance: record.value.distance,
      duration: record.value.duration,
      isReExecution: true,
      originalId: record.value.id
    })
    ElMessage.success('正在加载任务方案...')
    router.push('/mission')
  }).catch(() => {})
}

function exportReport() {
  ElMessage.success('报告导出成功')
}

function deleteRecord() {
  ElMessageBox.confirm('确定要删除此任务记录吗？', '警告', {
    type: 'warning'
  }).then(() => {
    ElMessage.success('删除成功')
    router.push('/records')
  }).catch(() => {})
}

function initChart() {
  if (!reportChartRef.value || !record.value?.aiReport) return
  
  reportChart = echarts.init(reportChartRef.value)
  reportChart.setOption({
    tooltip: { trigger: 'item' },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      textStyle: { color: '#a0aec0' }
    },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#16213e',
        borderWidth: 2
      },
      label: { show: false },
      emphasis: {
        label: {
          show: true,
          fontSize: 14,
          fontWeight: 'bold'
        }
      },
      data: [
        { value: 5, name: '建筑物', itemStyle: { color: '#67c23a' } },
        { value: 3, name: '车辆', itemStyle: { color: '#e6a23c' } },
        { value: 2, name: '人员', itemStyle: { color: '#409eff' } },
        { value: 2, name: '障碍物', itemStyle: { color: '#f56c6c' } }
      ]
    }]
  })
}

function handleResize() {
  reportChart?.resize()
}

onMounted(() => {
  setTimeout(initChart, 100)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  reportChart?.dispose()
  if (playbackTimer) clearInterval(playbackTimer)
})
</script>

<style scoped>
.record-detail-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 100%;
  padding-bottom: 20px;
}

.back-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.detail-title {
  margin: 0;
  font-size: 20px;
  flex: 1;
}

.detail-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  min-height: 500px;
}

.detail-left,
.detail-right {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 信息卡片 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.info-item {
  padding: 12px;
  background: var(--bg-dark);
  border-radius: 8px;
}

.info-label {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.info-value {
  font-size: 15px;
  color: var(--text-primary);
  font-weight: 500;
}

/* 报告卡片 */
.report-card {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.report-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.report-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.report-stat {
  flex: 1;
  text-align: center;
  padding: 16px;
  background: var(--bg-dark);
  border-radius: 8px;
}

.report-stat-value {
  font-size: 24px;
  font-weight: bold;
  color: var(--primary-color);
}

.report-stat-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.report-chart {
  height: 180px;
  margin-bottom: 16px;
}

.detection-list h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: var(--text-secondary);
}

.detection-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: var(--bg-dark);
  border-radius: 8px;
  margin-bottom: 8px;
}

.detection-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.detection-icon.building { background: rgba(103, 194, 58, 0.2); color: #67c23a; }
.detection-icon.vehicle { background: rgba(230, 162, 60, 0.2); color: #e6a23c; }
.detection-icon.person { background: rgba(64, 158, 255, 0.2); color: #409eff; }
.detection-icon.obstacle { background: rgba(245, 108, 108, 0.2); color: #f56c6c; }

.detection-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.detection-name {
  font-size: 14px;
  color: var(--text-primary);
}

.detection-time {
  font-size: 12px;
  color: var(--text-secondary);
}

.detection-confidence {
  font-size: 14px;
  font-weight: bold;
  color: var(--primary-color);
}

/* 地图卡片 */
.map-card {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.trajectory-map {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 300px;
}

.trajectory-svg {
  flex: 1;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border-radius: 8px;
}

.playback-controls {
  display: flex;
  align-items: center;
  padding: 12px;
  background: var(--bg-dark);
  border-radius: 8px;
  margin-top: 12px;
}

.playback-time {
  font-size: 12px;
  color: var(--text-secondary);
  min-width: 80px;
  text-align: right;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 12px;
}

.action-buttons .el-button {
  flex: 1;
}

/* 响应式 */
@media (max-width: 1400px) {
  .detail-content {
    gap: 16px;
  }
  
  .trajectory-map {
    min-height: 280px;
  }
}

@media (max-width: 1200px) {
  .detail-content {
    grid-template-columns: 1fr;
  }
  
  .info-panel {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
  
  .info-panel > .dashboard-card {
    margin-bottom: 0;
  }
  
  .map-card {
    order: -1;
  }
}

@media (max-width: 992px) {
  .record-detail-view {
    gap: 12px;
  }
  
  .detail-header {
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .header-info {
    flex: 1;
    min-width: 200px;
  }
  
  .header-stats {
    width: 100%;
    flex-wrap: wrap;
  }
  
  .trajectory-map {
    min-height: 250px;
  }
}

@media (max-width: 768px) {
  .info-panel {
    grid-template-columns: 1fr;
  }
  
  .detail-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .header-stats {
    width: 100%;
    justify-content: space-between;
  }
  
  .stat-item {
    text-align: left;
  }
  
  .playback-controls {
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .playback-controls .el-slider {
    order: 1;
    width: 100%;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .action-buttons .el-button {
    width: 100%;
  }
}

@media (max-width: 576px) {
  .header-stats {
    gap: 16px;
  }
  
  .stat-item .stat-value {
    font-size: 20px;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .trajectory-map {
    min-height: 200px;
  }
  
  .detection-item {
    padding: 10px;
  }
}
</style>
