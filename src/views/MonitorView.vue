<template>
  <div class="monitor-view">
    <!-- 顶部状态卡片 -->
    <div class="status-cards">
      <div class="dashboard-card status-card">
        <div class="status-icon battery" :class="batteryStatus">
          <el-icon :size="24"><Lightning /></el-icon>
        </div>
        <div class="status-info">
          <div class="data-value">{{ droneStatus.battery.toFixed(1) }}<span class="data-unit">%</span></div>
          <div class="data-label">电池电量</div>
        </div>
        <div class="status-trend">
          <el-progress 
            :percentage="droneStatus.battery" 
            :color="batteryColor"
            :stroke-width="6"
            :show-text="false"
          />
        </div>
      </div>

      <div class="dashboard-card status-card">
        <div class="status-icon speed">
          <el-icon :size="24"><Odometer /></el-icon>
        </div>
        <div class="status-info">
          <div class="data-value">{{ droneStatus.speed.toFixed(1) }}<span class="data-unit">m/s</span></div>
          <div class="data-label">飞行速度</div>
        </div>
      </div>

      <div class="dashboard-card status-card">
        <div class="status-icon altitude">
          <el-icon :size="24"><Upload /></el-icon>
        </div>
        <div class="status-info">
          <div class="data-value">{{ droneStatus.altitude.toFixed(1) }}<span class="data-unit">m</span></div>
          <div class="data-label">飞行高度</div>
        </div>
      </div>

      <div class="dashboard-card status-card">
        <div class="status-icon signal">
          <el-icon :size="24"><Connection /></el-icon>
        </div>
        <div class="status-info">
          <div class="data-value">{{ droneStatus.signal.toFixed(0) }}<span class="data-unit">%</span></div>
          <div class="data-label">信号强度</div>
        </div>
      </div>

      <div class="dashboard-card status-card">
        <div class="status-icon gps">
          <el-icon :size="24"><Location /></el-icon>
        </div>
        <div class="status-info">
          <div class="data-value">{{ droneStatus.gpsCount }}<span class="data-unit">颗</span></div>
          <div class="data-label">GPS卫星</div>
        </div>
      </div>

      <div class="dashboard-card status-card">
        <div class="status-icon time">
          <el-icon :size="24"><Timer /></el-icon>
        </div>
        <div class="status-info">
          <div class="data-value">{{ formatTime(droneStatus.flightTime) }}</div>
          <div class="data-label">飞行时间</div>
        </div>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="monitor-main">
      <!-- 左侧地图 -->
      <div class="dashboard-card map-card">
        <div class="card-header">
          <span class="card-title">
            <el-icon><MapLocation /></el-icon>
            实时位置与轨迹
          </span>
          <div class="header-actions">
            <el-button size="small" @click="clearTrajectory">清除轨迹</el-button>
            <el-tag :type="droneStatus.flightMode === '待机' ? 'info' : 'success'">
              {{ droneStatus.flightMode }}
            </el-tag>
          </div>
        </div>
        <div class="map-wrapper">
          <!-- 模拟地图 -->
          <div class="simulated-map" ref="mapRef">
            <svg class="map-svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet">
              <!-- 网格背景 -->
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#2d3748" stroke-width="0.5"/>
                </pattern>
              </defs>
              <rect width="400" height="300" fill="url(#grid)" />
              
              <!-- 飞行轨迹 -->
              <polyline 
                v-if="trajectoryPoints.length > 1"
                :points="trajectoryPoints.map(p => `${p.x},${p.y}`).join(' ')"
                fill="none"
                stroke="#409eff"
                stroke-width="2"
                stroke-opacity="0.7"
              />
              
              <!-- AI检测目标 -->
              <g v-for="target in mapTargets" :key="target.id">
                <circle 
                  :cx="target.x" 
                  :cy="target.y" 
                  r="8"
                  :fill="getRiskColor(target.risk)"
                  fill-opacity="0.3"
                  :stroke="getRiskColor(target.risk)"
                  stroke-width="2"
                />
                <text 
                  :x="target.x" 
                  :y="target.y - 12" 
                  font-size="10" 
                  fill="#fff"
                  text-anchor="middle"
                >
                  {{ target.type }}
                </text>
              </g>
              
              <!-- 无人机位置 -->
              <g :transform="`translate(${dronePosition.x}, ${dronePosition.y}) rotate(${droneStatus.heading})`">
                <polygon 
                  points="0,-10 8,10 0,5 -8,10" 
                  fill="#409eff"
                  stroke="#fff"
                  stroke-width="1"
                />
              </g>
            </svg>
            
            <!-- 坐标信息 -->
            <div class="position-info">
              <div>纬度: {{ droneStatus.latitude.toFixed(6) }}°</div>
              <div>经度: {{ droneStatus.longitude.toFixed(6) }}°</div>
              <div>航向: {{ droneStatus.heading.toFixed(0) }}°</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧面板 -->
      <div class="right-panel">
        <!-- 姿态仪表 -->
        <div class="dashboard-card attitude-card">
          <div class="card-header">
            <span class="card-title">
              <el-icon><Compass /></el-icon>
              飞行姿态
            </span>
          </div>
          <div class="attitude-display">
            <div class="attitude-item">
              <div class="attitude-gauge">
                <div class="gauge-value" :style="{ transform: `rotate(${droneStatus.pitch}deg)` }">
                  <div class="gauge-indicator pitch"></div>
                </div>
              </div>
              <div class="attitude-label">俯仰角 {{ droneStatus.pitch.toFixed(1) }}°</div>
            </div>
            <div class="attitude-item">
              <div class="attitude-gauge">
                <div class="gauge-value" :style="{ transform: `rotate(${droneStatus.roll}deg)` }">
                  <div class="gauge-indicator roll"></div>
                </div>
              </div>
              <div class="attitude-label">横滚角 {{ droneStatus.roll.toFixed(1) }}°</div>
            </div>
            <div class="attitude-item">
              <div class="attitude-gauge compass">
                <div class="gauge-value" :style="{ transform: `rotate(${-droneStatus.yaw}deg)` }">
                  <div class="compass-dial"></div>
                </div>
              </div>
              <div class="attitude-label">航向角 {{ droneStatus.yaw.toFixed(0) }}°</div>
            </div>
          </div>
        </div>

        <!-- AI检测目标列表 -->
        <div class="dashboard-card targets-card">
          <div class="card-header">
            <span class="card-title">
              <el-icon><Aim /></el-icon>
              AI检测目标
            </span>
            <el-badge :value="detectedTargets.length" :max="99" />
          </div>
          <div class="targets-list" v-if="detectedTargets.length > 0">
            <div 
              class="target-item" 
              v-for="target in displayTargets" 
              :key="target.id"
              :class="target.risk"
            >
              <div class="target-icon">
                <el-icon><Warning /></el-icon>
              </div>
              <div class="target-info">
                <div class="target-type">{{ target.type }}</div>
                <div class="target-meta">
                  置信度: {{ target.confidence }}% | {{ target.timestamp }}
                </div>
              </div>
              <el-tag :type="getRiskTagType(target.risk)" size="small">
                {{ getRiskLabel(target.risk) }}
              </el-tag>
            </div>
          </div>
          <el-empty v-else description="暂无检测目标" :image-size="60" />
        </div>
      </div>
    </div>

    <!-- 底部图表 -->
    <div class="charts-row">
      <div class="dashboard-card chart-card">
        <div class="card-header">
          <span class="card-title">
            <el-icon><TrendCharts /></el-icon>
            高度变化曲线
          </span>
        </div>
        <div class="chart-container" ref="altitudeChartRef"></div>
      </div>
      <div class="dashboard-card chart-card">
        <div class="card-header">
          <span class="card-title">
            <el-icon><DataLine /></el-icon>
            速度变化曲线
          </span>
        </div>
        <div class="chart-container" ref="speedChartRef"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useDroneStore } from '../stores/drone'
import { storeToRefs } from 'pinia'
import echarts from '../charts/echarts'

const droneStore = useDroneStore()
const { droneStatus, trajectoryHistory, detectedTargets, batteryStatus } = storeToRefs(droneStore)

const mapRef = ref(null)
const altitudeChartRef = ref(null)
const speedChartRef = ref(null)

let altitudeChart = null
let speedChart = null
const altitudeData = ref([])
const speedData = ref([])
const timeLabels = ref([])

const batteryColor = computed(() => {
  const battery = droneStatus.value.battery
  if (battery > 60) return '#67c23a'
  if (battery > 30) return '#e6a23c'
  return '#f56c6c'
})

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const dronePosition = computed(() => {

  const centerLat = 39.9042
  const centerLng = 116.4074
  const scale = 10000
  
  const x = 200 + (droneStatus.value.longitude - centerLng) * scale
  const y = 150 - (droneStatus.value.latitude - centerLat) * scale
  
  return { x: Math.max(20, Math.min(380, x)), y: Math.max(20, Math.min(280, y)) }
})

const trajectoryPoints = computed(() => {
  const centerLat = 39.9042
  const centerLng = 116.4074
  const scale = 10000
  
  return trajectoryHistory.value.slice(-100).map(point => ({
    x: 200 + (point.lng - centerLng) * scale,
    y: 150 - (point.lat - centerLat) * scale
  }))
})

const mapTargets = computed(() => {
  const centerLat = 39.9042
  const centerLng = 116.4074
  const scale = 10000
  
  return detectedTargets.value.slice(-10).map(target => ({
    ...target,
    x: 200 + (target.lng - centerLng) * scale,
    y: 150 - (target.lat - centerLat) * scale
  }))
})

const displayTargets = computed(() => {
  return [...detectedTargets.value].reverse().slice(0, 5)
})

function getRiskColor(risk) {
  const colors = {
    low: '#67c23a',
    medium: '#e6a23c',
    high: '#f56c6c'
  }
  return colors[risk] || '#909399'
}

function getRiskTagType(risk) {
  const types = {
    low: 'success',
    medium: 'warning',
    high: 'danger'
  }
  return types[risk] || 'info'
}

function getRiskLabel(risk) {
  const labels = {
    low: '低风险',
    medium: '中风险',
    high: '高风险'
  }
  return labels[risk] || '未知'
}

function clearTrajectory() {
  droneStore.clearTrajectoryHistory()
  altitudeData.value = []
  speedData.value = []
  timeLabels.value = []
}

function initCharts() {
  if (altitudeChartRef.value) {
    altitudeChart = echarts.init(altitudeChartRef.value)
    altitudeChart.setOption({
      grid: { top: 20, right: 20, bottom: 30, left: 50 },
      xAxis: {
        type: 'category',
        data: timeLabels.value,
        axisLine: { lineStyle: { color: '#2d3748' } },
        axisLabel: { color: '#a0aec0', fontSize: 10 }
      },
      yAxis: {
        type: 'value',
        name: '高度(m)',
        nameTextStyle: { color: '#a0aec0' },
        axisLine: { lineStyle: { color: '#2d3748' } },
        axisLabel: { color: '#a0aec0' },
        splitLine: { lineStyle: { color: '#2d3748', type: 'dashed' } }
      },
      series: [{
        data: altitudeData.value,
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: { color: '#409eff', width: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0)' }
          ])
        }
      }]
    })
  }

  if (speedChartRef.value) {
    speedChart = echarts.init(speedChartRef.value)
    speedChart.setOption({
      grid: { top: 20, right: 20, bottom: 30, left: 50 },
      xAxis: {
        type: 'category',
        data: timeLabels.value,
        axisLine: { lineStyle: { color: '#2d3748' } },
        axisLabel: { color: '#a0aec0', fontSize: 10 }
      },
      yAxis: {
        type: 'value',
        name: '速度(m/s)',
        nameTextStyle: { color: '#a0aec0' },
        axisLine: { lineStyle: { color: '#2d3748' } },
        axisLabel: { color: '#a0aec0' },
        splitLine: { lineStyle: { color: '#2d3748', type: 'dashed' } }
      },
      series: [{
        data: speedData.value,
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: { color: '#67c23a', width: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(103, 194, 58, 0.3)' },
            { offset: 1, color: 'rgba(103, 194, 58, 0)' }
          ])
        }
      }]
    })
  }
}

function updateCharts() {
  const now = new Date()
  const timeLabel = `${now.getMinutes()}:${now.getSeconds().toString().padStart(2, '0')}`
  
  timeLabels.value.push(timeLabel)
  altitudeData.value.push(droneStatus.value.altitude)
  speedData.value.push(droneStatus.value.speed)
  

  if (timeLabels.value.length > 60) {
    timeLabels.value.shift()
    altitudeData.value.shift()
    speedData.value.shift()
  }
  
  if (altitudeChart) {
    altitudeChart.setOption({
      xAxis: { data: timeLabels.value },
      series: [{ data: altitudeData.value }]
    })
  }
  
  if (speedChart) {
    speedChart.setOption({
      xAxis: { data: timeLabels.value },
      series: [{ data: speedData.value }]
    })
  }
}

watch(() => droneStatus.value.flightTime, () => {
  updateCharts()
})

function handleResize() {
  altitudeChart?.resize()
  speedChart?.resize()
}

onMounted(() => {
  initCharts()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  altitudeChart?.dispose()
  speedChart?.dispose()
})
</script>

<style scoped>
.monitor-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 100%;
  padding-bottom: 20px;
}

/* 状态卡片 */
.status-cards {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
  flex-shrink: 0;
}

.status-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  min-width: 0;
}

.status-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.status-icon.battery {
  background: linear-gradient(135deg, rgba(103, 194, 58, 0.2), rgba(103, 194, 58, 0.1));
  color: #67c23a;
}

.status-icon.battery.warning {
  background: linear-gradient(135deg, rgba(230, 162, 60, 0.2), rgba(230, 162, 60, 0.1));
  color: #e6a23c;
}

.status-icon.battery.danger {
  background: linear-gradient(135deg, rgba(245, 108, 108, 0.2), rgba(245, 108, 108, 0.1));
  color: #f56c6c;
}

.status-icon.speed {
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.2), rgba(64, 158, 255, 0.1));
  color: #409eff;
}

.status-icon.altitude {
  background: linear-gradient(135deg, rgba(230, 162, 60, 0.2), rgba(230, 162, 60, 0.1));
  color: #e6a23c;
}

.status-icon.signal {
  background: linear-gradient(135deg, rgba(103, 194, 58, 0.2), rgba(103, 194, 58, 0.1));
  color: #67c23a;
}

.status-icon.gps {
  background: linear-gradient(135deg, rgba(144, 147, 153, 0.2), rgba(144, 147, 153, 0.1));
  color: #909399;
}

.status-icon.time {
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.2), rgba(64, 158, 255, 0.1));
  color: #409eff;
}

.status-info {
  flex: 1;
  min-width: 0;
}

.status-info .data-value {
  font-size: 22px;
}

.status-trend {
  width: 60px;
}

/* 主内容区 */
.monitor-main {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 20px;
  min-height: 400px;
}

.map-card {
  display: flex;
  flex-direction: column;
  min-height: 400px;
}

.map-wrapper {
  flex: 1;
  min-height: 350px;
}

.simulated-map {
  width: 100%;
  height: 100%;
  position: relative;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border-radius: 8px;
  overflow: hidden;
}

.map-svg {
  width: 100%;
  height: 100%;
}

.position-info {
  position: absolute;
  bottom: 12px;
  left: 12px;
  background: rgba(0, 0, 0, 0.7);
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  color: #a0aec0;
  line-height: 1.6;
}

/* 右侧面板 */
.right-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.attitude-card {
  flex-shrink: 0;
}

.attitude-display {
  display: flex;
  justify-content: space-around;
  padding: 16px 0;
}

.attitude-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.attitude-gauge {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  border: 2px solid var(--border-color);
  position: relative;
  background: var(--bg-dark);
}

.gauge-value {
  width: 100%;
  height: 100%;
  position: absolute;
  transition: transform 0.3s ease;
}

.gauge-indicator {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.gauge-indicator.pitch,
.gauge-indicator.roll {
  top: 8px;
  width: 4px;
  height: 20px;
  background: var(--primary-color);
  border-radius: 2px;
}

.attitude-gauge.compass .compass-dial {
  width: 100%;
  height: 100%;
  position: relative;
}

.compass-dial::before {
  content: 'N';
  position: absolute;
  top: 5px;
  left: 50%;
  transform: translateX(-50%);
  color: #f56c6c;
  font-size: 12px;
  font-weight: bold;
}

.compass-dial::after {
  content: '';
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 2px;
  height: 15px;
  background: #f56c6c;
}

.attitude-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.targets-card {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.targets-list {
  flex: 1;
  overflow-y: auto;
}

.target-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 8px;
  background: var(--bg-dark);
  border-left: 3px solid;
}

.target-item.low {
  border-left-color: #67c23a;
}

.target-item.medium {
  border-left-color: #e6a23c;
}

.target-item.high {
  border-left-color: #f56c6c;
}

.target-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(64, 158, 255, 0.1);
  color: var(--primary-color);
}

.target-info {
  flex: 1;
  min-width: 0;
}

.target-type {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.target-meta {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
}

/* 图表行 */
.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  flex-shrink: 0;
}

.chart-card {
  display: flex;
  flex-direction: column;
}

.chart-card .chart-container {
  flex: 1;
  min-height: 180px;
  height: 180px;
}

/* 响应式 */
@media (max-width: 1600px) {
  .status-cards {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 1400px) {
  .status-cards {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .monitor-main {
    gap: 16px;
  }
}

@media (max-width: 1200px) {
  .monitor-main {
    grid-template-columns: 1fr;
  }
  
  .right-panel {
    flex-direction: row;
    gap: 16px;
  }
  
  .attitude-card,
  .targets-card {
    flex: 1;
    min-width: 0;
  }
  
  .charts-row {
    gap: 16px;
  }
}

@media (max-width: 992px) {
  .status-cards {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .monitor-view {
    gap: 16px;
  }
}

@media (max-width: 768px) {
  .status-cards {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  
  .charts-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .right-panel {
    flex-direction: column;
  }
  
  .status-value {
    font-size: 20px;
  }
  
  .chart-card .chart-container {
    min-height: 150px;
    height: 150px;
  }
  
  .attitude-gauge {
    width: 60px;
    height: 60px;
  }
}

@media (max-width: 576px) {
  .status-cards {
    grid-template-columns: minmax(0, 1fr);
    gap: 8px;
  }
  
  .status-card {
    padding: 12px;
  }
  
  .status-icon {
    width: 36px;
    height: 36px;
    font-size: 18px;
  }
  
  .status-value {
    font-size: 18px;
  }
  
  .status-label {
    font-size: 11px;
  }
  
  .mission-info-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
