<template>
  <div class="mission-view">
    <!-- 重新执行提示 -->
    <el-alert 
      v-if="isReExecution"
      type="info"
      :closable="false"
      show-icon
      class="reexecution-alert"
    >
      <template #title>
        <span>正在重新执行任务: <strong>{{ originalMissionName }}</strong></span>
      </template>
      <template #default>
        已加载原任务方案，您可以修改后重新下发任务
      </template>
    </el-alert>

    <!-- 左侧路径规划面板 -->
    <div class="mission-panel">
      <!-- 任务设置 -->
      <div class="dashboard-card mission-settings">
        <div class="card-header">
          <span class="card-title">
            <el-icon><Setting /></el-icon>
            任务配置
          </span>
          <el-tag :type="mapMode === 'edit' ? 'warning' : 'info'" size="small">
            {{ mapMode === 'edit' ? '编辑模式' : '查看模式' }}
          </el-tag>
        </div>
        
        <el-form :model="missionForm" label-position="top" class="mission-form" size="default">
          <el-form-item label="任务名称">
            <el-input v-model="missionForm.name" placeholder="请输入任务名称" />
          </el-form-item>
          
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="飞行高度(m)">
                <el-input-number v-model="missionForm.altitude" :min="10" :max="500" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="飞行速度(m/s)">
                <el-input-number v-model="missionForm.speed" :min="1" :max="20" />
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-form-item label="AI优化模式">
            <el-select v-model="missionForm.optimizeMode" style="width: 100%">
              <el-option label="最短路径" value="shortest" />
              <el-option label="避障优先" value="avoidance" />
              <el-option label="节能模式" value="energy" />
              <el-option label="快速到达" value="fast" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="任务类型">
            <el-radio-group v-model="missionForm.type">
              <el-radio label="patrol">区域巡逻</el-radio>
              <el-radio label="point">定点飞行</el-radio>
              <el-radio label="trace">轨迹追踪</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </div>

      <!-- 路径节点列表 -->
      <div class="dashboard-card waypoints-card">
        <div class="card-header">
          <span class="card-title">
            <el-icon><Flag /></el-icon>
            航点列表
            <el-tag type="primary" size="small" round>{{ pathNodes.length }}</el-tag>
          </span>
          <div class="header-actions">
            <el-tooltip content="AI智能规划路径" placement="top">
              <el-button size="small" type="primary" @click="requestAIPath" :loading="aiLoading">
                <el-icon><MagicStick /></el-icon>
                AI规划
              </el-button>
            </el-tooltip>
          </div>
        </div>
        
        <div class="waypoints-toolbar">
          <el-button size="small" @click="addNode">
            <el-icon><Plus /></el-icon>
            添加航点
          </el-button>
          <el-button size="small" type="danger" @click="clearPath" :disabled="pathNodes.length === 0">
            <el-icon><Delete /></el-icon>
            清空全部
          </el-button>
        </div>
        
        <div class="waypoints-list" v-if="pathNodes.length > 0">
          <transition-group name="waypoint-list">
            <div class="waypoint-item" v-for="(element, index) in pathNodes" :key="element.id">
              <div class="waypoint-header">
                <div class="waypoint-index">{{ index + 1 }}</div>
                <span class="waypoint-title">航点 {{ index + 1 }}</span>
                <div class="waypoint-actions">
                  <el-button size="small" circle @click="focusNode(index)" title="定位">
                    <el-icon><Aim /></el-icon>
                  </el-button>
                  <el-button type="danger" size="small" circle @click="removeNode(index)" title="删除">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
              <div class="waypoint-body">
                <div class="coord-row">
                  <span class="coord-label">纬度:</span>
                  <el-input-number 
                    v-model="element.lat" 
                    size="small" 
                    :precision="6"
                    :step="0.001"
                    controls-position="right"
                  />
                </div>
                <div class="coord-row">
                  <span class="coord-label">经度:</span>
                  <el-input-number 
                    v-model="element.lng" 
                    size="small" 
                    :precision="6"
                    :step="0.001"
                    controls-position="right"
                  />
                </div>
                <div class="coord-row">
                  <span class="coord-label">高度:</span>
                  <el-input-number 
                    v-model="element.altitude" 
                    size="small" 
                    :min="10" 
                    :max="500"
                    :step="5"
                    controls-position="right"
                  />
                  <span class="coord-unit">m</span>
                </div>
              </div>
            </div>
          </transition-group>
        </div>
        <el-empty v-else description="暂无航点，点击地图或添加按钮创建" :image-size="60" />
      </div>

      <!-- 任务统计 -->
      <div class="dashboard-card mission-stats">
        <div class="card-header">
          <span class="card-title">
            <el-icon><DataAnalysis /></el-icon>
            任务预估
          </span>
        </div>
        <div class="stats-row">
          <div class="stat-item">
            <el-icon class="stat-icon"><Odometer /></el-icon>
            <div class="stat-content">
              <div class="stat-value">{{ totalDistance.toFixed(2) }}<span class="stat-unit">km</span></div>
              <div class="stat-label">总距离</div>
            </div>
          </div>
          <div class="stat-item">
            <el-icon class="stat-icon"><Timer /></el-icon>
            <div class="stat-content">
              <div class="stat-value">{{ estimatedTime }}</div>
              <div class="stat-label">预估时间</div>
            </div>
          </div>
          <div class="stat-item">
            <el-icon class="stat-icon"><Lightning /></el-icon>
            <div class="stat-content">
              <div class="stat-value">{{ estimatedBattery }}<span class="stat-unit">%</span></div>
              <div class="stat-label">预估耗电</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="mission-actions">
        <el-button type="warning" @click="saveMission" :disabled="pathNodes.length < 2">
          <el-icon><FolderAdd /></el-icon>
          保存任务
        </el-button>
        <el-button type="primary" @click="sendMission" :loading="sending" :disabled="pathNodes.length < 2">
          <el-icon><Promotion /></el-icon>
          下发任务
        </el-button>
      </div>
    </div>

    <!-- 右侧地图预览 -->
    <div class="dashboard-card map-panel">
      <div class="card-header">
        <span class="card-title">
          <el-icon><MapLocation /></el-icon>
          路径预览
        </span>
        <div class="header-actions">
          <el-button-group>
            <el-button size="small" :type="mapMode === 'view' ? 'primary' : ''" @click="mapMode = 'view'">
              查看
            </el-button>
            <el-button size="small" :type="mapMode === 'edit' ? 'primary' : ''" @click="mapMode = 'edit'">
              编辑
            </el-button>
          </el-button-group>
        </div>
      </div>
      
      <div class="map-container" @dblclick="onMapClick">
        <svg class="path-svg" viewBox="0 0 600 450" preserveAspectRatio="xMidYMid meet">
          <!-- 网格背景 -->
          <defs>
            <pattern id="pathGrid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#2d3748" stroke-width="0.5"/>
            </pattern>
            <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L0,6 L9,3 z" fill="#409eff" />
            </marker>
          </defs>
          <rect width="600" height="450" fill="url(#pathGrid)" />
          
          <!-- 起点标记 -->
          <g v-if="dronePosition">
            <circle :cx="dronePosition.x" :cy="dronePosition.y" r="12" fill="#67c23a" fill-opacity="0.3" />
            <circle :cx="dronePosition.x" :cy="dronePosition.y" r="6" fill="#67c23a" />
            <text :x="dronePosition.x" :y="dronePosition.y - 18" font-size="12" fill="#67c23a" text-anchor="middle">起点</text>
          </g>
          
          <!-- 规划路径 -->
          <polyline 
            v-if="pathPoints.length > 1"
            :points="pathPoints.map(p => `${p.x},${p.y}`).join(' ')"
            fill="none"
            stroke="#409eff"
            stroke-width="3"
            stroke-dasharray="10,5"
            marker-end="url(#arrow)"
          />
          
          <!-- 路径节点 -->
          <g v-for="(point, index) in pathPoints" :key="index">
            <circle 
              :cx="point.x" 
              :cy="point.y" 
              r="14"
              fill="transparent"
              style="cursor: move"
              @mousedown.stop="startDragNode($event, index)"
            />
            <circle 
              :cx="point.x" 
              :cy="point.y" 
              r="10"
              :fill="selectedNode === index ? '#e6a23c' : draggingNode === index ? '#f56c6c' : '#409eff'"
              stroke="#fff"
              stroke-width="2"
              style="cursor: pointer; pointer-events: none"
            />
            <text 
              :x="point.x" 
              :y="point.y + 4" 
              font-size="10" 
              fill="#fff"
              text-anchor="middle"
              style="pointer-events: none"
            >
              {{ index + 1 }}
            </text>
          </g>
          
          <!-- 障碍物标记 -->
          <g v-for="obstacle in obstacles" :key="obstacle.id">
            <rect 
              :x="obstacle.x - 15" 
              :y="obstacle.y - 15" 
              width="30" 
              height="30"
              fill="#f56c6c"
              fill-opacity="0.3"
              stroke="#f56c6c"
              stroke-width="2"
              rx="4"
            />
            <text 
              :x="obstacle.x" 
              :y="obstacle.y + 4" 
              font-size="10" 
              fill="#f56c6c"
              text-anchor="middle"
            >
              障碍
            </text>
          </g>
        </svg>
        
        <!-- 提示信息 -->
        <div class="map-tip" v-if="mapMode === 'edit'">
          <el-icon><InfoFilled /></el-icon>
          双击空白处添加航点 | 拖拽航点调整位置 | 左侧列表可编辑坐标
        </div>
        <div class="map-tip view-tip" v-else>
          <el-icon><View /></el-icon>
          切换到"编辑"模式可添加和调整航点
        </div>
        
        <!-- 图例 -->
        <div class="map-legend">
          <div class="legend-item">
            <span class="legend-dot" style="background: #67c23a"></span>
            起点
          </div>
          <div class="legend-item">
            <span class="legend-dot" style="background: #409eff"></span>
            航点
          </div>
          <div class="legend-item">
            <span class="legend-dot" style="background: #f56c6c"></span>
            障碍物
          </div>
        </div>
      </div>
    </div>

    <!-- 任务下发结果对话框 -->
    <el-dialog v-model="resultDialogVisible" title="任务下发结果" width="400px">
      <div class="result-content">
        <el-result
          :icon="missionResult.success ? 'success' : 'error'"
          :title="missionResult.success ? '任务下发成功' : '任务下发失败'"
          :sub-title="missionResult.message"
        >
          <template #extra>
            <div class="result-details" v-if="missionResult.success">
              <p>任务ID: {{ missionResult.missionId }}</p>
              <p>开始执行时间: {{ missionResult.startTime }}</p>
            </div>
          </template>
        </el-result>
      </div>
      <template #footer>
        <el-button type="primary" @click="resultDialogVisible = false">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useDroneStore } from '../stores/drone'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'

const droneStore = useDroneStore()
const { currentMission, missionPlanForm, missionPlanNodes } = storeToRefs(droneStore)

const isReExecution = ref(false)
const originalMissionName = ref('')

const missionForm = missionPlanForm

const pathNodes = missionPlanNodes

const obstacles = ref([
  { id: 1, x: 310, y: 175 },
  { id: 2, x: 210, y: 275 }
])

const mapMode = ref('view')
const selectedNode = ref(null)
const draggingNode = ref(null)
const aiLoading = ref(false)
const sending = ref(false)
const resultDialogVisible = ref(false)
const missionResult = reactive({
  success: false,
  message: '',
  missionId: '',
  startTime: ''
})

onMounted(() => {
  if (currentMission.value && currentMission.value.isReExecution) {
    isReExecution.value = true
    originalMissionName.value = currentMission.value.name.replace(' (重新执行)', '')
    
    missionForm.value.name = currentMission.value.name
    missionForm.value.type = currentMission.value.type || 'patrol'
    
    if (currentMission.value.waypointData && currentMission.value.waypointData.length > 0) {
      pathNodes.value = currentMission.value.waypointData.map((wp, i) => ({
        id: Date.now() + i,
        lat: wp.lat,
        lng: wp.lng,
        altitude: wp.altitude || missionForm.value.altitude
      }))
    } else {
      const waypointCount = currentMission.value.waypoints || 5
      const generatedNodes = []
      for (let i = 0; i < waypointCount; i++) {
        generatedNodes.push({
          id: Date.now() + i,
          lat: parseFloat((39.902 + i * 0.003).toFixed(6)),
          lng: parseFloat((116.402 + i * 0.004).toFixed(6)),
          altitude: missionForm.value.altitude
        })
      }
      pathNodes.value = generatedNodes
    }
    
    ElMessage.success(`已加载任务方案: ${originalMissionName.value}`)
    droneStore.setCurrentMission(null)
  }
})

const dronePosition = computed(() => ({
  x: 80,
  y: 380
}))

const mapBounds = {
  minLat: 39.900,
  maxLat: 39.920,
  minLng: 116.400,
  maxLng: 116.425
}

const pathPoints = computed(() => {
  if (pathNodes.value.length === 0) return []
  
  const padding = 50
  const mapWidth = 600 - padding * 2
  const mapHeight = 450 - padding * 2
  
  const latRange = mapBounds.maxLat - mapBounds.minLat
  const lngRange = mapBounds.maxLng - mapBounds.minLng
  
  return pathNodes.value.map((node) => {
    const x = padding + ((node.lng - mapBounds.minLng) / lngRange) * mapWidth
    const y = padding + mapHeight - ((node.lat - mapBounds.minLat) / latRange) * mapHeight
    return {
      x: Math.max(padding, Math.min(600 - padding, x)),
      y: Math.max(padding, Math.min(450 - padding, y)),
      lat: node.lat,
      lng: node.lng
    }
  })
})

const totalDistance = computed(() => {
  if (pathNodes.value.length < 2) return 0
  let distance = 0
  for (let i = 1; i < pathNodes.value.length; i++) {
    const p1 = pathNodes.value[i - 1]
    const p2 = pathNodes.value[i]

    const dlat = (p2.lat - p1.lat) * 111
    const dlng = (p2.lng - p1.lng) * 111 * Math.cos(p1.lat * Math.PI / 180)
    distance += Math.sqrt(dlat * dlat + dlng * dlng)
  }
  return distance
})

const estimatedTime = computed(() => {
  if (totalDistance.value === 0) return '0分钟'
  const hours = totalDistance.value / (missionForm.value.speed * 3.6)
  if (hours < 1) {
    return Math.ceil(hours * 60) + '分钟'
  }
  return hours.toFixed(1) + '小时'
})

const estimatedBattery = computed(() => {

  return Math.min(100, Math.ceil(totalDistance.value * 5))
})

function addNode() {
  const lastNode = pathNodes.value[pathNodes.value.length - 1]
  const newNode = {
    id: Date.now(),
    lat: lastNode ? parseFloat((lastNode.lat + 0.002).toFixed(6)) : 39.908,
    lng: lastNode ? parseFloat((lastNode.lng + 0.003).toFixed(6)) : 116.408,
    altitude: missionForm.value.altitude
  }
  pathNodes.value.push(newNode)
  ElMessage.success(`已添加航点 ${pathNodes.value.length}`)
}

function removeNode(index) {
  pathNodes.value.splice(index, 1)
  ElMessage.success(`已删除航点 ${index + 1}`)
}

function focusNode(index) {
  selectedNode.value = index
  ElMessage.info(`已定位到航点 ${index + 1}`)
}

function selectNode(index) {
  selectedNode.value = selectedNode.value === index ? null : index
}

function startDragNode(event, index) {
  if (mapMode.value !== 'edit') {
    selectNode(index)
    return
  }
  
  draggingNode.value = index
  selectedNode.value = index
  
  const mapContainer = event.target.closest('.map-container')
  const rect = mapContainer.getBoundingClientRect()
  
  const padding = 50
  const mapWidth = 600 - padding * 2
  const mapHeight = 450 - padding * 2
  const latRange = mapBounds.maxLat - mapBounds.minLat
  const lngRange = mapBounds.maxLng - mapBounds.minLng
  
  const onMouseMove = (e) => {
    if (draggingNode.value === null) return
    
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    const svgX = (x / rect.width) * 600
    const svgY = (y / rect.height) * 450
    
    const clampedX = Math.max(padding, Math.min(600 - padding, svgX))
    const clampedY = Math.max(padding, Math.min(450 - padding, svgY))
    
    const normalizedX = (clampedX - padding) / mapWidth
    const normalizedY = 1 - (clampedY - padding) / mapHeight
    
    pathNodes.value[draggingNode.value].lng = parseFloat((mapBounds.minLng + normalizedX * lngRange).toFixed(6))
    pathNodes.value[draggingNode.value].lat = parseFloat((mapBounds.minLat + normalizedY * latRange).toFixed(6))
  }
  
  const onMouseUp = () => {
    draggingNode.value = null
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }
  
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

function onMapClick(event) {
  if (mapMode.value !== 'edit') return
  
  const target = event.target
  if (target.tagName === 'circle' || target.tagName === 'text') return
  
  const rect = event.currentTarget.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  
  const svgX = (x / rect.width) * 600
  const svgY = (y / rect.height) * 450
  
  const padding = 50
  const mapWidth = 600 - padding * 2
  const mapHeight = 450 - padding * 2
  const latRange = mapBounds.maxLat - mapBounds.minLat
  const lngRange = mapBounds.maxLng - mapBounds.minLng
  
  const normalizedX = Math.max(0, Math.min(1, (svgX - padding) / mapWidth))
  const normalizedY = Math.max(0, Math.min(1, 1 - (svgY - padding) / mapHeight))
  
  const newLng = mapBounds.minLng + normalizedX * lngRange
  const newLat = mapBounds.minLat + normalizedY * latRange
  
  pathNodes.value.push({
    id: Date.now(),
    lat: parseFloat(newLat.toFixed(6)),
    lng: parseFloat(newLng.toFixed(6)),
    altitude: missionForm.value.altitude
  })
  ElMessage.success(`已添加航点 ${pathNodes.value.length}`)
}

async function requestAIPath() {
  aiLoading.value = true
  

  await new Promise(resolve => setTimeout(resolve, 2000))
  

  const modes = {
    shortest: generateShortestPath,
    avoidance: generateAvoidancePath,
    energy: generateEnergyPath,
    fast: generateFastPath
  }
  
  const generator = modes[missionForm.value.optimizeMode] || generateShortestPath
  pathNodes.value = generator()
  
  aiLoading.value = false
  ElMessage.success(`AI已完成${getModeName(missionForm.value.optimizeMode)}路径规划`)
}

function getModeName(mode) {
  const names = {
    shortest: '最短路径',
    avoidance: '避障优先',
    energy: '节能模式',
    fast: '快速到达'
  }
  return names[mode] || ''
}

function generateShortestPath() {
  return [
    { id: 1, lat: 39.906, lng: 116.404, altitude: 50 },
    { id: 2, lat: 39.910, lng: 116.412, altitude: 50 },
    { id: 3, lat: 39.914, lng: 116.418, altitude: 50 }
  ]
}

function generateAvoidancePath() {

  return [
    { id: 1, lat: 39.902, lng: 116.402, altitude: 60 },
    { id: 2, lat: 39.905, lng: 116.405, altitude: 70 },
    { id: 3, lat: 39.908, lng: 116.402, altitude: 75 },
    { id: 4, lat: 39.912, lng: 116.404, altitude: 70 },
    { id: 5, lat: 39.916, lng: 116.408, altitude: 65 },
    { id: 6, lat: 39.918, lng: 116.420, altitude: 55 }
  ]
}

function generateEnergyPath() {
  return [
    { id: 1, lat: 39.906, lng: 116.404, altitude: 40 },
    { id: 2, lat: 39.910, lng: 116.410, altitude: 40 },
    { id: 3, lat: 39.914, lng: 116.416, altitude: 40 }
  ]
}

function generateFastPath() {
  return [
    { id: 1, lat: 39.906, lng: 116.404, altitude: 80 },
    { id: 2, lat: 39.914, lng: 116.418, altitude: 80 }
  ]
}

function clearPath() {
  ElMessageBox.confirm('确定要清除当前规划的路径吗？', '提示', {
    type: 'warning'
  }).then(() => {
    pathNodes.value = []
    ElMessage.success('路径已清除')
  }).catch(() => {})
}

function saveMission() {
  if (pathNodes.value.length < 2) {
    ElMessage.warning('请至少设置2个航点')
    return
  }
  
  const missionId = `MSN-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
  
  droneStore.addMissionRecord({
    id: Date.now(),
    missionId: missionId,
    name: missionForm.value.name,
    type: missionForm.value.type,
    status: 'saved',
    waypoints: pathNodes.value.length,
    distance: totalDistance.value,
    duration: estimatedTime.value,
    createdAt: new Date().toLocaleString('zh-CN', { 
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).replace(/\//g, '-'),
    waypointData: pathNodes.value.map(node => ({
      lat: node.lat,
      lng: node.lng,
      altitude: node.altitude
    })),
    aiReport: null
  })
  
  ElMessage.success('任务已保存到任务记录')
}

async function sendMission() {
  if (pathNodes.value.length < 2) {
    ElMessage.warning('请至少设置2个航点')
    return
  }
  
  sending.value = true
  

  await new Promise(resolve => setTimeout(resolve, 1500))
  

  const success = Math.random() > 0.1
  
  missionResult.success = success
  missionResult.message = success 
    ? '无人机已接收任务指令，即将开始执行'
    : '无人机连接超时，请检查通信状态'
  missionResult.missionId = 'MSN-' + Date.now().toString(36).toUpperCase()
  missionResult.startTime = new Date().toLocaleString()
  
  if (success) {
    droneStore.setCurrentMission({
      id: missionResult.missionId,
      name: missionForm.value.name,
      waypoints: pathNodes.value,
      status: 'executing'
    })
    
    droneStore.addMissionRecord({
      id: Date.now(),
      missionId: missionResult.missionId,
      name: missionForm.value.name,
      type: missionForm.value.type,
      status: 'executing',
      waypoints: pathNodes.value.length,
      distance: totalDistance.value,
      duration: estimatedTime.value,
      createdAt: new Date().toLocaleString('zh-CN', { 
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      }).replace(/\//g, '-'),
      waypointData: pathNodes.value.map(node => ({
        lat: node.lat,
        lng: node.lng,
        altitude: node.altitude
      })),
      aiReport: null
    })
  }
  
  sending.value = false
  resultDialogVisible.value = true
}
</script>

<style scoped>
.mission-view {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 20px;
  min-height: 100%;
}

.reexecution-alert {
  grid-column: 1 / -1;
  margin-bottom: 0;
}

.reexecution-alert strong {
  color: #409eff;
}

.mission-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  max-height: calc(100vh - 140px);
}

.mission-settings {
  flex-shrink: 0;
}

.mission-form {
  padding-top: 8px;
}

.mission-form :deep(.el-form-item) {
  margin-bottom: 16px;
}

.mission-form :deep(.el-form-item__label) {
  color: var(--text-secondary);
}

.waypoints-card {
  flex: 1;
  min-height: 200px;
  display: flex;
  flex-direction: column;
}

.waypoints-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}

.waypoints-list {
  flex: 1;
  overflow-y: auto;
  max-height: 300px;
}

.waypoint-item {
  background: var(--bg-dark);
  border-radius: 10px;
  margin-bottom: 10px;
  border: 1px solid var(--border-color);
  transition: all 0.3s;
  overflow: hidden;
}

.waypoint-item:hover {
  border-color: var(--primary-color);
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.15);
}

.waypoint-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: rgba(64, 158, 255, 0.1);
  border-bottom: 1px solid var(--border-color);
}

.waypoint-title {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.waypoint-actions {
  display: flex;
  gap: 4px;
}

.waypoint-index {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: bold;
  flex-shrink: 0;
}

.waypoint-body {
  padding: 12px;
}

.coord-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.coord-row:last-child {
  margin-bottom: 0;
}

.coord-label {
  width: 40px;
  font-size: 12px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.coord-unit {
  font-size: 12px;
  color: var(--text-secondary);
}

.coord-row :deep(.el-input-number) {
  width: 100%;
}

/* 航点列表动画 */
.waypoint-list-enter-active,
.waypoint-list-leave-active {
  transition: all 0.3s ease;
}

.waypoint-list-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.waypoint-list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.mission-stats {
  flex-shrink: 0;
}

.stats-row {
  display: flex;
  gap: 12px;
}

.stats-row .stat-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: var(--bg-dark);
  border-radius: 10px;
  border: 1px solid var(--border-color);
}

.stat-icon {
  font-size: 24px;
  color: var(--primary-color);
}

.stat-content {
  flex: 1;
}

.stats-row .stat-value {
  font-size: 18px;
  font-weight: bold;
  color: var(--text-primary);
}

.stats-row .stat-unit {
  font-size: 12px;
  color: var(--text-secondary);
  margin-left: 2px;
}

.stats-row .stat-label {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.mission-actions {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

.mission-actions .el-button {
  flex: 1;
}

/* 地图面板 */
.map-panel {
  display: flex;
  flex-direction: column;
  min-height: 500px;
}

.map-panel .map-container {
  flex: 1;
  position: relative;
  cursor: crosshair;
  min-height: 400px;
}

.path-svg {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border-radius: 8px;
}

.map-tip {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(64, 158, 255, 0.9);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.map-tip.view-tip {
  background: rgba(103, 194, 58, 0.9);
}

.map-legend {
  position: absolute;
  bottom: 12px;
  right: 12px;
  background: rgba(0, 0, 0, 0.7);
  padding: 12px;
  border-radius: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.legend-item:last-child {
  margin-bottom: 0;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

/* 结果对话框 */
.result-content {
  text-align: center;
}

.result-details {
  text-align: left;
  background: var(--bg-dark);
  padding: 16px;
  border-radius: 8px;
  margin-top: 16px;
}

.result-details p {
  margin: 8px 0;
  font-size: 14px;
  color: var(--text-secondary);
}

/* 响应式 */
@media (max-width: 1400px) {
  .mission-view {
    gap: 16px;
  }
  
  .map-panel {
    min-height: 450px;
  }
}

@media (max-width: 1200px) {
  .mission-view {
    grid-template-columns: 1fr;
  }
  
  .map-panel {
    min-height: 400px;
    order: -1;
  }
  
  .control-panel {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
  
  .control-panel > .dashboard-card {
    margin-bottom: 0;
  }
}

@media (max-width: 992px) {
  .mission-view {
    gap: 12px;
  }
  
  .map-panel {
    min-height: 350px;
  }
  
  .map-panel .map-container {
    min-height: 300px;
  }
}

@media (max-width: 768px) {
  .control-panel {
    grid-template-columns: 1fr;
  }
  
  .map-panel {
    min-height: 300px;
  }
  
  .map-legend {
    padding: 8px;
    font-size: 11px;
  }
  
  .map-tip {
    font-size: 11px;
    padding: 6px 12px;
  }
  
  .waypoint-item {
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .waypoint-coords {
    width: 100%;
    font-size: 11px;
  }
}

@media (max-width: 576px) {
  .map-panel {
    min-height: 280px;
  }
  
  .waypoint-item {
    padding: 8px;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
