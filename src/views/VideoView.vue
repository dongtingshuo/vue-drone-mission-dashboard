<template>
  <div class="video-view">
    <!-- 视频播放区域 -->
    <div class="dashboard-card video-main">
      <div class="card-header">
        <span class="card-title">
          <el-icon><VideoCamera /></el-icon>
          实时航拍画面
        </span>
        <div class="header-actions">
          <el-select v-model="quality" size="small" style="width: 100px">
            <el-option label="超清" value="1080p" />
            <el-option label="高清" value="720p" />
            <el-option label="标清" value="480p" />
          </el-select>
          <el-button-group>
            <el-button size="small" :type="isRecording ? 'danger' : ''" @click="toggleRecord">
              <el-icon><VideoPause v-if="isRecording" /><VideoPlay v-else /></el-icon>
              {{ isRecording ? '停止录制' : '开始录制' }}
            </el-button>
            <el-button size="small" @click="takeScreenshot">
              <el-icon><Camera /></el-icon>
              截图
            </el-button>
          </el-button-group>
        </div>
      </div>
      
      <div class="video-wrapper" ref="videoWrapperRef">
        <!-- 模拟视频画面 -->
        <div class="simulated-video" ref="simulatedVideoRef" @mousedown="startSelection" @mousemove="updateSelection" @mouseup="endSelection">
          <!-- 模拟航拍背景 -->
          <div class="video-background" ref="videoBackgroundRef" :style="{ transform: `translate(${videoOffset.x}px, ${videoOffset.y}px)` }">
            <div class="grid-overlay"></div>
            <div class="terrain">
              <div class="road road-h"></div>
              <div class="road road-v"></div>
              <div class="building" style="left: 20%; top: 30%; width: 80px; height: 60px;"></div>
              <div class="building" style="left: 60%; top: 20%; width: 100px; height: 80px;"></div>
              <div class="building" style="left: 40%; top: 60%; width: 70px; height: 50px;"></div>
              <div class="tree" style="left: 15%; top: 50%;"></div>
              <div class="tree" style="left: 75%; top: 45%;"></div>
              <div class="tree" style="left: 30%; top: 75%;"></div>
              <div class="tree" style="left: 55%; top: 70%;"></div>
              <!-- 动态元素 -->
              <div class="bg-vehicle" :style="{ left: dynamicElements.vehicle1.x + '%', top: dynamicElements.vehicle1.y + '%' }"></div>
              <div class="bg-vehicle bg-vehicle-2" :style="{ left: dynamicElements.vehicle2.x + '%', top: dynamicElements.vehicle2.y + '%' }"></div>
              <div class="person-dot" :style="{ left: dynamicElements.person1.x + '%', top: dynamicElements.person1.y + '%' }"></div>
              <div class="person-dot" :style="{ left: dynamicElements.person2.x + '%', top: dynamicElements.person2.y + '%' }"></div>
              <!-- 云层 -->
              <div class="cloud" :style="{ left: dynamicElements.cloud1.x + '%', top: dynamicElements.cloud1.y + '%' }"></div>
              <div class="cloud cloud-2" :style="{ left: dynamicElements.cloud2.x + '%', top: dynamicElements.cloud2.y + '%' }"></div>
            </div>
            <!-- 扫描线效果 -->
            <div class="scan-line" v-if="isPlaying"></div>
          </div>
          
          <!-- AI标记的目标 -->
          <div 
            v-for="mark in aiMarks" 
            :key="mark.id"
            class="ai-mark"
            :style="{ left: mark.x + '%', top: mark.y + '%' }"
          >
            <div class="mark-box" :class="mark.type">
              <div class="mark-label">
                {{ mark.label }} ({{ mark.confidence }}%)
              </div>
            </div>
          </div>
          
          <!-- 选择框 -->
          <div 
            v-if="isSelecting || selectionBox.visible"
            class="selection-box"
            :style="{
              left: selectionBox.x + 'px',
              top: selectionBox.y + 'px',
              width: selectionBox.width + 'px',
              height: selectionBox.height + 'px'
            }"
          ></div>
          
          <!-- 视频信息叠加 -->
          <div class="video-overlay">
            <div class="overlay-top">
              <span class="live-badge" v-if="isPlaying">
                <span class="live-dot"></span>
                LIVE
              </span>
              <span class="quality-badge">{{ quality }}</span>
              <span class="recording-badge" v-if="isRecording">
                <span class="rec-dot"></span>
                REC {{ recordingTime }}
              </span>
            </div>
            <div class="overlay-bottom">
              <span>{{ currentTime }}</span>
              <span>GPS: {{ droneStatus.latitude.toFixed(4) }}, {{ droneStatus.longitude.toFixed(4) }}</span>
              <span>ALT: {{ droneStatus.altitude.toFixed(1) }}m</span>
            </div>
          </div>
          
          <!-- 播放控制 -->
          <div class="play-control" v-if="!isPlaying" @click.stop="togglePlay">
            <el-icon :size="48"><VideoPlay /></el-icon>
          </div>
        </div>
        
        <!-- 控制栏 -->
        <div class="video-controls">
          <el-button circle @click="togglePlay">
            <el-icon><VideoPause v-if="isPlaying" /><VideoPlay v-else /></el-icon>
          </el-button>
          <el-slider v-model="volume" :show-tooltip="false" style="width: 100px" />
          <el-icon><Microphone /></el-icon>
          <div class="flex-spacer"></div>
          <el-button size="small" @click="toggleAutoDetect" :type="autoDetectEnabled ? 'success' : ''">
            <el-icon><Aim /></el-icon>
            自动识别 {{ autoDetectEnabled ? '开' : '关' }}
          </el-button>
          <el-button size="small" @click="toggleAIMode" :type="aiModeEnabled ? 'primary' : ''">
            <el-icon><Cpu /></el-icon>
            手动框选 {{ aiModeEnabled ? '开' : '关' }}
          </el-button>
          <el-button circle @click="toggleFullscreen">
            <el-icon><FullScreen /></el-icon>
          </el-button>
        </div>
      </div>
    </div>

    <!-- 右侧面板 -->
    <div class="video-sidebar">
      <!-- AI标记工具 -->
      <div class="dashboard-card mark-tools">
        <div class="card-header">
          <span class="card-title">
            <el-icon><Aim /></el-icon>
            AI标记工具
          </span>
        </div>
        
        <div class="tools-content">
          <p class="tool-tip">在画面中框选区域，自动触发AI识别</p>
          
          <el-radio-group v-model="markType" class="mark-type-group">
            <el-radio-button label="auto">自动识别</el-radio-button>
            <el-radio-button label="target">目标追踪</el-radio-button>
            <el-radio-button label="area">区域监控</el-radio-button>
          </el-radio-group>
          
          <div class="ai-settings">
            <el-form-item label="置信度阈值">
              <el-slider v-model="confidenceThreshold" :min="50" :max="99" :format-tooltip="val => val + '%'" />
            </el-form-item>
            <el-form-item label="检测目标">
              <el-checkbox-group v-model="detectTargets">
                <el-checkbox label="person">人员</el-checkbox>
                <el-checkbox label="vehicle">车辆</el-checkbox>
                <el-checkbox label="building">建筑</el-checkbox>
                <el-checkbox label="obstacle">障碍物</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
          </div>
          
          <el-button type="primary" block @click="clearMarks">
            <el-icon><Delete /></el-icon>
            清除所有标记
          </el-button>
        </div>
      </div>

      <!-- AI识别结果 -->
      <div class="dashboard-card recognition-results">
        <div class="card-header">
          <span class="card-title">
            <el-icon><List /></el-icon>
            识别结果
          </span>
          <el-badge :value="aiMarks.length" :max="99" />
        </div>
        
        <div class="results-list" v-if="aiMarks.length > 0">
          <div 
            v-for="mark in aiMarks" 
            :key="mark.id"
            class="result-item"
            :class="mark.type"
          >
            <div class="result-icon">
              <el-icon v-if="mark.type === 'person'"><User /></el-icon>
              <el-icon v-else-if="mark.type === 'vehicle'"><Van /></el-icon>
              <el-icon v-else-if="mark.type === 'building'"><OfficeBuilding /></el-icon>
              <el-icon v-else><Warning /></el-icon>
            </div>
            <div class="result-info">
              <div class="result-label">{{ mark.label }}</div>
              <div class="result-meta">
                置信度: {{ mark.confidence }}% | {{ mark.time }}
              </div>
            </div>
            <el-button size="small" circle @click="removeMark(mark.id)">
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
        </div>
        <el-empty v-else description="暂无识别结果" :image-size="60" />
      </div>

      <!-- 截图记录 -->
      <div class="dashboard-card screenshots">
        <div class="card-header">
          <span class="card-title">
            <el-icon><PictureFilled /></el-icon>
            截图记录
          </span>
        </div>
        
        <div class="screenshots-grid" v-if="screenshots.length > 0">
          <div 
            v-for="shot in screenshots" 
            :key="shot.id"
            class="screenshot-item"
            @click="previewScreenshot(shot)"
          >
            <div class="screenshot-thumb" :style="shot.dataUrl ? { backgroundImage: `url(${shot.dataUrl})`, backgroundSize: 'cover' } : { background: shot.color }">
              <el-icon v-if="!shot.dataUrl"><Picture /></el-icon>
            </div>
            <div class="screenshot-time">{{ shot.time }}</div>
          </div>
        </div>
        <el-empty v-else description="暂无截图" :image-size="40" />
      </div>

      <!-- 录制元数据 -->
      <div class="dashboard-card recordings">
        <div class="card-header">
          <span class="card-title">
            <el-icon><VideoCamera /></el-icon>
            录制记录
          </span>
        </div>
        <div class="recording-list" v-if="recordedSegments.length > 0">
          <div class="recording-item" v-for="segment in recordedSegments" :key="segment.id">
            <span>{{ segment.startTime }}–{{ segment.endTime }}</span>
            <strong>{{ segment.duration }}</strong>
          </div>
        </div>
        <el-empty v-else description="暂无录制记录" :image-size="40" />
      </div>
    </div>

    <!-- 截图预览对话框 -->
    <el-dialog v-model="previewDialogVisible" title="截图预览" width="600px">
      <div class="preview-content" v-if="previewingShot">
        <div class="preview-image" :style="previewingShot.dataUrl ? { backgroundImage: `url(${previewingShot.dataUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: previewingShot.color }">
          <div class="preview-overlay">
            <span>{{ previewingShot.time }}</span>
            <span>GPS: {{ previewingShot.gps }}</span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="downloadScreenshot">
          <el-icon><Download /></el-icon>
          下载
        </el-button>
        <el-button type="primary" @click="previewDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useDroneStore } from '../stores/drone'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'

const droneStore = useDroneStore()
const { droneStatus, videoAiMarks, videoScreenshots, videoRecordedSegments } = storeToRefs(droneStore)

const videoWrapperRef = ref(null)
const simulatedVideoRef = ref(null)
const videoBackgroundRef = ref(null)

const isPlaying = ref(true)
const volume = ref(80)
const quality = ref('720p')
const isRecording = ref(false)
const recordingTime = ref('00:00')
let recordingTimer = null
let recordingSeconds = 0

const aiModeEnabled = ref(true)
const autoDetectEnabled = ref(false)
const markType = ref('auto')
const confidenceThreshold = ref(75)
const detectTargets = ref(['person', 'vehicle', 'building', 'obstacle'])

const aiMarks = videoAiMarks
const screenshots = videoScreenshots
const recordedSegments = videoRecordedSegments

let autoDetectTimer = null

const videoOffset = ref({ x: 0, y: 0 })
let videoFlowTimer = null

const dynamicElements = reactive({
  vehicle1: { x: 45, y: 48 },
  vehicle2: { x: 70, y: 48 },
  person1: { x: 25, y: 55 },
  person2: { x: 65, y: 35 },
  cloud1: { x: 10, y: 10 },
  cloud2: { x: 80, y: 15 }
})
let sceneAnimationTimer = null

const isSelecting = ref(false)
const selectionStart = reactive({ x: 0, y: 0 })
const selectionBox = reactive({
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  visible: false
})

const previewDialogVisible = ref(false)
const previewingShot = ref(null)

const currentTime = ref(new Date().toLocaleTimeString())
let clockTimer = null

function togglePlay() {
  isPlaying.value = !isPlaying.value
}

let recordingStartTime = null

function toggleRecord() {
  if (isRecording.value) {

    clearInterval(recordingTimer)
    isRecording.value = false
    

    const segment = {
      id: Date.now(),
      startTime: recordingStartTime,
      endTime: new Date().toLocaleTimeString(),
      duration: recordingTime.value,
      gps: `${droneStatus.value.latitude.toFixed(4)}, ${droneStatus.value.longitude.toFixed(4)}`
    }
    droneStore.addVideoRecordedSegment(segment)
    
    ElMessage.success(`录制完成，时长 ${recordingTime.value}，已保存到录制列表`)
    recordingSeconds = 0
    recordingTime.value = '00:00'
    recordingStartTime = null
  } else {

    isRecording.value = true
    recordingStartTime = new Date().toLocaleTimeString()
    recordingTimer = setInterval(() => {
      recordingSeconds++
      const mins = Math.floor(recordingSeconds / 60)
      const secs = recordingSeconds % 60
      recordingTime.value = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }, 1000)
    ElMessage.success('开始录制')
  }
}

function takeScreenshot() {
  const videoElement = simulatedVideoRef.value
  if (!videoElement) {
    ElMessage.error('无法获取视频画面')
    return
  }
  

  const canvas = document.createElement('canvas')
  const rect = videoElement.getBoundingClientRect()
  canvas.width = rect.width
  canvas.height = rect.height
  const ctx = canvas.getContext('2d')
  

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
  gradient.addColorStop(0, '#1a2a3a')
  gradient.addColorStop(0.5, '#2a3a4a')
  gradient.addColorStop(1, '#1a2a3a')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  

  ctx.strokeStyle = 'rgba(255,255,255,0.03)'
  ctx.lineWidth = 1
  for (let i = 0; i < canvas.width; i += 50) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i, canvas.height)
    ctx.stroke()
  }
  for (let i = 0; i < canvas.height; i += 50) {
    ctx.beginPath()
    ctx.moveTo(0, i)
    ctx.lineTo(canvas.width, i)
    ctx.stroke()
  }
  

  ctx.fillStyle = '#3a4a5a'
  ctx.fillRect(0, canvas.height * 0.48, canvas.width, 30)
  ctx.fillRect(canvas.width * 0.35, 0, 25, canvas.height)
  

  ctx.fillStyle = '#4a5a6a'
  ctx.fillRect(canvas.width * 0.2, canvas.height * 0.3, 80, 60)
  ctx.fillRect(canvas.width * 0.6, canvas.height * 0.2, 100, 80)
  ctx.fillRect(canvas.width * 0.4, canvas.height * 0.6, 70, 50)
  

  aiMarks.value.forEach(mark => {
    const markX = (mark.x / 100) * canvas.width
    const markY = (mark.y / 100) * canvas.height
    ctx.strokeStyle = mark.type === 'vehicle' ? '#e6a23c' : mark.type === 'person' ? '#409eff' : '#67c23a'
    ctx.lineWidth = 2
    ctx.strokeRect(markX - 30, markY - 20, 60, 40)
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    ctx.font = '12px Arial'
    ctx.fillText(`${mark.label} ${mark.confidence}%`, markX - 30, markY - 25)
  })
  

  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.font = '14px Arial'
  ctx.fillText(new Date().toLocaleString(), 10, canvas.height - 10)
  ctx.fillText(`GPS: ${droneStatus.value.latitude.toFixed(4)}, ${droneStatus.value.longitude.toFixed(4)}`, 10, canvas.height - 30)
  

  const dataUrl = canvas.toDataURL('image/png')
  
  const shot = {
    id: Date.now(),
    time: new Date().toLocaleTimeString(),
    gps: `${droneStatus.value.latitude.toFixed(4)}, ${droneStatus.value.longitude.toFixed(4)}`,
    dataUrl: dataUrl,
    color: 'transparent'
  }
  droneStore.addVideoScreenshot(shot)
  ElMessage.success('截图已保存')
}

function previewScreenshot(shot) {
  previewingShot.value = shot
  previewDialogVisible.value = true
}

function downloadScreenshot() {
  if (previewingShot.value && previewingShot.value.dataUrl) {
    const link = document.createElement('a')
    link.download = `drone-screenshot-${previewingShot.value.time.replace(/:/g, '-')}.png`
    link.href = previewingShot.value.dataUrl
    link.click()
    ElMessage.success('截图已下载')
  } else {
    ElMessage.warning('无法下载该截图')
  }
  previewDialogVisible.value = false
}

function toggleAIMode() {
  aiModeEnabled.value = !aiModeEnabled.value
  ElMessage.info(aiModeEnabled.value ? 'AI识别已开启' : 'AI识别已关闭')
}

function clearMarks() {
  droneStore.clearVideoAiMarks()
  ElMessage.success('所有标记已清除')
}

function removeMark(id) {
  droneStore.removeVideoAiMark(id)
}

function startSelection(event) {
  if (!aiModeEnabled.value) return
  
  const rect = event.currentTarget.getBoundingClientRect()
  selectionStart.x = event.clientX - rect.left
  selectionStart.y = event.clientY - rect.top
  selectionBox.x = selectionStart.x
  selectionBox.y = selectionStart.y
  selectionBox.width = 0
  selectionBox.height = 0
  selectionBox.visible = true
  isSelecting.value = true
}

function updateSelection(event) {
  if (!isSelecting.value) return
  
  const rect = event.currentTarget.getBoundingClientRect()
  const currentX = event.clientX - rect.left
  const currentY = event.clientY - rect.top
  
  selectionBox.x = Math.min(selectionStart.x, currentX)
  selectionBox.y = Math.min(selectionStart.y, currentY)
  selectionBox.width = Math.abs(currentX - selectionStart.x)
  selectionBox.height = Math.abs(currentY - selectionStart.y)
}

function endSelection() {
  if (!isSelecting.value) return
  isSelecting.value = false
  

  if (selectionBox.width > 30 && selectionBox.height > 30) {
    triggerAIRecognition()
  }
  
  setTimeout(() => {
    selectionBox.visible = false
  }, 500)
}

function triggerAIRecognition() {

  const enabledTypes = detectTargets.value
  
  if (enabledTypes.length === 0) {
    ElMessage.warning('请至少选择一种检测目标')
    return
  }
  
  const labels = {
    person: ['人员', '行人', '工人'],
    vehicle: ['车辆', '卡车', '轿车'],
    building: ['建筑物', '仓库', '厂房'],
    obstacle: ['障碍物', '杂物', '设备']
  }
  

  const type = enabledTypes[Math.floor(Math.random() * enabledTypes.length)]
  const typeLabels = labels[type]
  
  const rect = videoWrapperRef.value?.querySelector('.simulated-video')?.getBoundingClientRect()
  if (!rect) return
  
  const mark = {
    id: Date.now(),
    x: ((selectionBox.x + selectionBox.width / 2) / rect.width * 100).toFixed(0),
    y: ((selectionBox.y + selectionBox.height / 2) / rect.height * 100).toFixed(0),
    label: typeLabels[Math.floor(Math.random() * typeLabels.length)],
    confidence: Math.floor(confidenceThreshold.value + Math.random() * (100 - confidenceThreshold.value)),
    type,
    time: new Date().toLocaleTimeString()
  }
  
  droneStore.addVideoAiMark(mark)
  ElMessage.success(`识别到: ${mark.label} (置信度 ${mark.confidence}%)`)
}

function toggleFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen()
  } else {
    videoWrapperRef.value?.requestFullscreen()
  }
}

function toggleAutoDetect() {
  autoDetectEnabled.value = !autoDetectEnabled.value
  if (autoDetectEnabled.value) {
    startAutoDetect()
    ElMessage.success('已开启自动识别')
  } else {
    stopAutoDetect()
    ElMessage.info('已关闭自动识别')
  }
}

function startAutoDetect() {
  if (autoDetectTimer) return
  
  autoDetectTimer = setInterval(() => {
    if (!aiModeEnabled.value || detectTargets.value.length === 0) return
    

    if (Math.random() > 0.6) {
      autoRecognize()
    }
  }, 2500)
}

function stopAutoDetect() {
  if (autoDetectTimer) {
    clearInterval(autoDetectTimer)
    autoDetectTimer = null
  }
}

function autoRecognize() {
  const enabledTypes = detectTargets.value
  if (enabledTypes.length === 0) return
  
  const labels = {
    person: ['人员', '行人', '工人'],
    vehicle: ['车辆', '卡车', '轿车'],
    building: ['建筑物', '仓库', '厂房'],
    obstacle: ['障碍物', '杂物', '设备']
  }
  
  const type = enabledTypes[Math.floor(Math.random() * enabledTypes.length)]
  const typeLabels = labels[type]
  
  const mark = {
    id: Date.now(),
    x: (15 + Math.random() * 70).toFixed(0),
    y: (15 + Math.random() * 70).toFixed(0),
    label: typeLabels[Math.floor(Math.random() * typeLabels.length)],
    confidence: Math.floor(confidenceThreshold.value + Math.random() * (100 - confidenceThreshold.value)),
    type,
    time: new Date().toLocaleTimeString()
  }
  
  droneStore.addVideoAiMark(mark)
  

  if (aiMarks.value.length > 20) {
    droneStore.removeVideoAiMark(aiMarks.value[0].id)
  }
}

function startVideoFlow() {
  if (videoFlowTimer) return
  
  videoFlowTimer = setInterval(() => {
    if (!isPlaying.value) return
    

    videoOffset.value = {
      x: Math.sin(Date.now() / 2000) * 3,
      y: Math.cos(Date.now() / 3000) * 2
    }
  }, 50)
}

function stopVideoFlow() {
  if (videoFlowTimer) {
    clearInterval(videoFlowTimer)
    videoFlowTimer = null
  }
}

function startSceneAnimation() {
  if (sceneAnimationTimer) return
  
  sceneAnimationTimer = setInterval(() => {
    if (!isPlaying.value) return
    

    dynamicElements.vehicle1.x += 0.2
    if (dynamicElements.vehicle1.x > 95) {
      dynamicElements.vehicle1.x = 5
    }
    

    dynamicElements.vehicle2.x -= 0.15
    if (dynamicElements.vehicle2.x < 5) {
      dynamicElements.vehicle2.x = 95
    }
    

    dynamicElements.person1.x += (Math.random() - 0.5) * 0.3
    dynamicElements.person1.y += (Math.random() - 0.5) * 0.3
    dynamicElements.person1.x = Math.max(10, Math.min(90, dynamicElements.person1.x))
    dynamicElements.person1.y = Math.max(20, Math.min(80, dynamicElements.person1.y))
    
    dynamicElements.person2.x += (Math.random() - 0.5) * 0.3
    dynamicElements.person2.y += (Math.random() - 0.5) * 0.3
    dynamicElements.person2.x = Math.max(10, Math.min(90, dynamicElements.person2.x))
    dynamicElements.person2.y = Math.max(20, Math.min(80, dynamicElements.person2.y))
    

    dynamicElements.cloud1.x += 0.05
    if (dynamicElements.cloud1.x > 100) {
      dynamicElements.cloud1.x = -10
    }
    
    dynamicElements.cloud2.x += 0.03
    if (dynamicElements.cloud2.x > 110) {
      dynamicElements.cloud2.x = -15
    }
  }, 50)
}

function stopSceneAnimation() {
  if (sceneAnimationTimer) {
    clearInterval(sceneAnimationTimer)
    sceneAnimationTimer = null
  }
}

onMounted(() => {
  startVideoFlow()
  startSceneAnimation()
  clockTimer = setInterval(() => {
    currentTime.value = new Date().toLocaleTimeString()
  }, 1000)
})

onUnmounted(() => {
  if (recordingTimer) {
    clearInterval(recordingTimer)
  }
  stopAutoDetect()
  stopVideoFlow()
  stopSceneAnimation()
  if (clockTimer) clearInterval(clockTimer)
})
</script>

<style scoped>
.video-view {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 20px;
  min-height: 100%;
}

.video-main {
  display: flex;
  flex-direction: column;
  min-height: 500px;
}

.video-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 450px;
}

.simulated-video {
  flex: 1;
  position: relative;
  background: #0a0a0a;
  border-radius: 8px;
  overflow: hidden;
  cursor: crosshair;
}

.video-background {
  width: 100%;
  height: 100%;
  position: relative;
  background: linear-gradient(180deg, #1a2a3a 0%, #2a3a4a 50%, #1a2a3a 100%);
}

.grid-overlay {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 50px 50px;
}

.terrain {
  position: absolute;
  inset: 0;
}

.road {
  position: absolute;
  background: #3a4a5a;
}

.road-h {
  left: 0;
  right: 0;
  top: 48%;
  height: 30px;
}

.road-v {
  top: 0;
  bottom: 0;
  left: 35%;
  width: 25px;
}

.building {
  position: absolute;
  background: linear-gradient(135deg, #4a5a6a 0%, #3a4a5a 100%);
  border: 1px solid #5a6a7a;
  border-radius: 4px;
}

.tree {
  position: absolute;
  width: 30px;
  height: 30px;
  background: radial-gradient(circle, #2d5a3d 0%, #1a3a2a 100%);
  border-radius: 50%;
}

.bg-vehicle {
  position: absolute;
  width: 20px;
  height: 12px;
  background: #e6a23c;
  border-radius: 3px;
  transition: left 0.05s linear, top 0.05s linear;
}

.bg-vehicle-2 {
  background: #67c23a;
}

.person-dot {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #409eff;
  border-radius: 50%;
  box-shadow: 0 0 6px #409eff;
  transition: left 0.05s linear, top 0.05s linear;
}

/* 云层效果 */
.cloud {
  position: absolute;
  width: 80px;
  height: 30px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  filter: blur(8px);
  transition: left 0.05s linear;
}

.cloud::before {
  content: '';
  position: absolute;
  left: 20px;
  top: -10px;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 50%;
}

.cloud-2 {
  width: 100px;
  height: 40px;
  background: rgba(255, 255, 255, 0.08);
}

/* 扫描线效果 */
.scan-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, 
    transparent 0%, 
    rgba(64, 158, 255, 0.3) 20%, 
    rgba(64, 158, 255, 0.8) 50%, 
    rgba(64, 158, 255, 0.3) 80%, 
    transparent 100%
  );
  animation: scanMove 3s linear infinite;
  pointer-events: none;
}

@keyframes scanMove {
  0% { top: 0%; }
  100% { top: 100%; }
}

/* 全屏样式 */
.video-wrapper:fullscreen {
  background: #0a0a0a;
  display: flex;
  flex-direction: column;
}

.video-wrapper:fullscreen .simulated-video {
  flex: 1;
  height: 100%;
}

.video-wrapper:fullscreen .video-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 100;
}

/* AI标记 */
.ai-mark {
  position: absolute;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.mark-box {
  padding: 4px 8px;
  border: 2px solid;
  border-radius: 4px;
  animation: markPulse 2s infinite;
}

.mark-box.person {
  border-color: #409eff;
  background: rgba(64, 158, 255, 0.2);
}

.mark-box.vehicle {
  border-color: #e6a23c;
  background: rgba(230, 162, 60, 0.2);
}

.mark-box.building {
  border-color: #67c23a;
  background: rgba(103, 194, 58, 0.2);
}

.mark-box.obstacle {
  border-color: #f56c6c;
  background: rgba(245, 108, 108, 0.2);
}

.mark-label {
  font-size: 11px;
  color: white;
  white-space: nowrap;
}

@keyframes markPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* 选择框 */
.selection-box {
  position: absolute;
  border: 2px dashed #409eff;
  background: rgba(64, 158, 255, 0.1);
  pointer-events: none;
}

/* 视频叠加信息 */
.video-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 12px;
}

.overlay-top,
.overlay-bottom {
  display: flex;
  gap: 12px;
}

.overlay-bottom {
  justify-content: flex-end;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.live-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f56c6c;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  color: white;
}

.live-dot {
  width: 6px;
  height: 6px;
  background: white;
  border-radius: 50%;
  animation: blink 1s infinite;
}

.quality-badge {
  background: rgba(0, 0, 0, 0.5);
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  color: white;
}

.recording-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f56c6c;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  color: white;
}

.rec-dot {
  width: 8px;
  height: 8px;
  background: white;
  border-radius: 50%;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

/* 播放控制 */
.play-control {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
}

.play-control:hover {
  background: rgba(64, 158, 255, 0.8);
  transform: translate(-50%, -50%) scale(1.1);
}

.play-control .el-icon {
  color: white;
}

/* 控制栏 */
.video-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--bg-dark);
  border-radius: 0 0 8px 8px;
}

.flex-spacer {
  flex: 1;
}

/* 侧边栏 */
.video-sidebar {
  display: block;
  height: calc(100vh - 140px);
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 4px;
}

/* 侧边栏内的所有卡片 - 关键修复 */
.video-sidebar .dashboard-card {
  margin-bottom: 16px;
  position: relative;
  overflow: hidden;
}

.video-sidebar .dashboard-card:last-child {
  margin-bottom: 0;
}

/* 自定义滚动条 */
.video-sidebar::-webkit-scrollbar {
  width: 6px;
}

.video-sidebar::-webkit-scrollbar-track {
  background: var(--bg-darker);
  border-radius: 3px;
}

.video-sidebar::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}

.video-sidebar::-webkit-scrollbar-thumb:hover {
  background: var(--primary-color);
}

.mark-tools {
  /* 无特殊样式 */
}

.tools-content {
  padding-top: 8px;
}

.tool-tip {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.mark-type-group {
  width: 100%;
  margin-bottom: 16px;
}

.mark-type-group :deep(.el-radio-button) {
  flex: 1;
}

.ai-settings {
  margin-bottom: 16px;
}

.ai-settings :deep(.el-form-item) {
  margin-bottom: 12px;
}

.ai-settings :deep(.el-form-item__label) {
  color: var(--text-secondary);
  font-size: 13px;
}

/* 识别结果卡片 - 关键修复 */
.recognition-results {
  position: relative;
  overflow: hidden;
}

.recognition-results .card-header {
  position: relative;
  z-index: 1;
}

.results-list {
  max-height: 200px;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
}

/* 识别结果列表滚动条 */
.results-list::-webkit-scrollbar {
  width: 5px;
}

.results-list::-webkit-scrollbar-track {
  background: var(--bg-darker);
  border-radius: 3px;
}

.results-list::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}

.results-list::-webkit-scrollbar-thumb:hover {
  background: var(--primary-color);
}

/* 识别结果项 - 确保在容器内 */
.result-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: var(--bg-dark);
  border-radius: 8px;
  margin-bottom: 8px;
  border-left: 3px solid;
  box-sizing: border-box;
  position: relative;
}

.result-item:last-child {
  margin-bottom: 0;
}

.result-item.person {
  border-left-color: #409eff;
}

.result-item.vehicle {
  border-left-color: #e6a23c;
}

.result-item.building {
  border-left-color: #67c23a;
}

.result-item.obstacle {
  border-left-color: #f56c6c;
}

.result-icon {
  width: 32px;
  height: 32px;
  min-width: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(64, 158, 255, 0.1);
  color: var(--primary-color);
  flex-shrink: 0;
}

.result-info {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.result-label {
  font-size: 14px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-meta {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-item .el-button {
  flex-shrink: 0;
}

/* 截图卡片 - 关键修复 */
.screenshots {
  position: relative;
  overflow: hidden;
}

.screenshots-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.screenshot-item {
  cursor: pointer;
  transition: transform 0.2s;
}

.screenshot-item:hover {
  transform: scale(1.05);
}

.screenshot-thumb {
  aspect-ratio: 16/9;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.5);
}

.screenshot-time {
  font-size: 10px;
  color: var(--text-secondary);
  text-align: center;
  margin-top: 4px;
}

.recording-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.recording-item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 10px;
  border-radius: 6px;
  background: var(--bg-dark);
  color: var(--text-secondary);
  font-size: 12px;
}

.recording-item strong {
  color: var(--text-primary);
}

/* 预览对话框 */
.preview-content {
  text-align: center;
}

.preview-image {
  width: 100%;
  aspect-ratio: 16/9;
  border-radius: 8px;
  position: relative;
}

.preview-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px;
  background: linear-gradient(transparent, rgba(0,0,0,0.7));
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: white;
  border-radius: 0 0 8px 8px;
}

/* 响应式 */
@media (max-width: 1400px) {
  .video-view {
    grid-template-columns: 1fr 280px;
    gap: 16px;
  }
}

@media (max-width: 1200px) {
  .video-view {
    grid-template-columns: 1fr;
  }
  
  .video-sidebar {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    height: auto;
    max-height: none;
    overflow: visible;
  }
  
  .video-sidebar .dashboard-card {
    margin-bottom: 0;
  }
  
  .video-main {
    min-height: 400px;
  }
  
  .video-wrapper {
    min-height: 350px;
  }
  
  .results-list {
    max-height: 150px;
  }
}

@media (max-width: 992px) {
  .video-view {
    gap: 12px;
  }
  
  .video-main {
    min-height: 350px;
  }
  
  .video-wrapper {
    min-height: 300px;
  }
  
  .screenshots-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 768px) {
  .video-sidebar {
    grid-template-columns: 1fr;
    display: block;
  }
  
  .video-sidebar .dashboard-card {
    margin-bottom: 16px;
  }
  
  .video-main {
    min-height: 300px;
  }
  
  .video-wrapper {
    min-height: 250px;
  }
  
  .video-controls {
    flex-wrap: wrap;
    gap: 8px;
    padding: 8px;
  }
  
  .control-group {
    gap: 4px;
  }
  
  .control-group .el-button {
    padding: 8px;
  }
  
  .screenshots-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .results-list {
    max-height: 180px;
  }
  
  .ai-tag {
    font-size: 10px;
    padding: 2px 6px;
  }
}

@media (max-width: 576px) {
  .video-main {
    min-height: 250px;
  }
  
  .video-wrapper {
    min-height: 200px;
  }
  
  .video-controls .el-button span {
    display: none;
  }
  
  .control-group {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .screenshots-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .result-item {
    padding: 8px;
  }
}
</style>
