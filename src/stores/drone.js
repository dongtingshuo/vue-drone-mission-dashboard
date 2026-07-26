import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useDroneStore = defineStore('drone', () => {

  const droneStatus = ref({
    id: 'DRONE-001',
    name: '巡检无人机1号',
    connected: false,
    battery: 100,
    speed: 0,
    altitude: 0,
    latitude: 39.9042,
    longitude: 116.4074,
    heading: 0,
    pitch: 0,
    roll: 0,
    yaw: 0,
    signal: 100,
    gpsCount: 12,
    flightMode: '待机',
    flightTime: 0
  })

  const trajectoryHistory = ref([])

  const detectedTargets = ref([])

  const wsConnected = ref(false)

  const currentMission = ref(null)

  const missionRecords = ref([
    {
      id: 1001,
      missionId: 'MSN-ABC123',
      name: '园区日常巡检',
      type: 'patrol',
      status: 'completed',
      waypoints: 8,
      distance: 3.5,
      duration: '25分钟',
      createdAt: '2025-12-29 09:30:00',
      waypointData: [
        { lat: 39.904, lng: 116.404, altitude: 50 },
        { lat: 39.906, lng: 116.407, altitude: 55 },
        { lat: 39.908, lng: 116.410, altitude: 60 },
        { lat: 39.910, lng: 116.413, altitude: 55 },
        { lat: 39.912, lng: 116.416, altitude: 50 },
        { lat: 39.914, lng: 116.419, altitude: 55 },
        { lat: 39.916, lng: 116.422, altitude: 60 },
        { lat: 39.918, lng: 116.425, altitude: 50 }
      ],
      aiReport: {
        detectedObjects: 12,
        obstacles: 2,
        pathDeviation: 3.5
      }
    },
    {
      id: 1002,
      missionId: 'MSN-DEF456',
      name: '仓库安全检查',
      type: 'point',
      status: 'completed',
      waypoints: 5,
      distance: 2.1,
      duration: '15分钟',
      createdAt: '2025-12-29 10:15:00',
      waypointData: [
        { lat: 39.902, lng: 116.402, altitude: 40 },
        { lat: 39.905, lng: 116.408, altitude: 45 },
        { lat: 39.908, lng: 116.414, altitude: 50 },
        { lat: 39.911, lng: 116.420, altitude: 45 },
        { lat: 39.914, lng: 116.426, altitude: 40 }
      ],
      aiReport: {
        detectedObjects: 8,
        obstacles: 0,
        pathDeviation: 1.2
      }
    },
    {
      id: 1003,
      missionId: 'MSN-GHI789',
      name: '边界线追踪',
      type: 'trace',
      status: 'completed',
      waypoints: 12,
      distance: 5.8,
      duration: '40分钟',
      createdAt: '2025-12-29 11:00:00',
      waypointData: [
        { lat: 39.900, lng: 116.400, altitude: 60 },
        { lat: 39.902, lng: 116.404, altitude: 65 },
        { lat: 39.904, lng: 116.408, altitude: 70 },
        { lat: 39.906, lng: 116.412, altitude: 65 },
        { lat: 39.908, lng: 116.416, altitude: 60 },
        { lat: 39.910, lng: 116.420, altitude: 65 },
        { lat: 39.912, lng: 116.424, altitude: 70 },
        { lat: 39.914, lng: 116.420, altitude: 65 },
        { lat: 39.916, lng: 116.416, altitude: 60 },
        { lat: 39.918, lng: 116.412, altitude: 65 },
        { lat: 39.920, lng: 116.408, altitude: 70 },
        { lat: 39.922, lng: 116.404, altitude: 60 }
      ],
      aiReport: {
        detectedObjects: 5,
        obstacles: 1,
        pathDeviation: 2.8
      }
    },
    {
      id: 1004,
      missionId: 'MSN-JKL012',
      name: '农田监测任务',
      type: 'patrol',
      status: 'saved',
      waypoints: 15,
      distance: 8.2,
      duration: '55分钟',
      createdAt: '2025-12-28 14:30:00',
      waypointData: null,
      aiReport: null
    },
    {
      id: 1005,
      missionId: 'MSN-MNO345',
      name: '应急救援演练',
      type: 'point',
      status: 'cancelled',
      waypoints: 6,
      distance: 2.5,
      duration: '18分钟',
      createdAt: '2025-12-28 16:00:00',
      waypointData: null,
      aiReport: null
    }
  ])

  const plannedPath = ref([])

  const missionPlanForm = ref({
    name: '巡检任务-' + new Date().toLocaleDateString(),
    altitude: 50,
    speed: 8,
    optimizeMode: 'shortest',
    type: 'patrol'
  })

  const missionPlanNodes = ref([
    { id: 1, lat: 39.904, lng: 116.404, altitude: 50 },
    { id: 2, lat: 39.910, lng: 116.412, altitude: 60 },
    { id: 3, lat: 39.916, lng: 116.420, altitude: 55 }
  ])

  const batteryStatus = computed(() => {
    const battery = droneStatus.value.battery
    if (battery > 60) return 'success'
    if (battery > 30) return 'warning'
    return 'danger'
  })

  const signalStatus = computed(() => {
    const signal = droneStatus.value.signal
    if (signal > 70) return 'excellent'
    if (signal > 40) return 'good'
    return 'poor'
  })

  function updateDroneStatus(data) {
    Object.assign(droneStatus.value, data)
    if (data.latitude != null && data.longitude != null) {
      trajectoryHistory.value.push({
        lat: data.latitude,
        lng: data.longitude,
        alt: data.altitude,
        time: Date.now()
      })
      if (trajectoryHistory.value.length > 1000) {
        trajectoryHistory.value.shift()
      }
    }
  }

  function updateDetectedTargets(targets) {
    detectedTargets.value = targets
  }

  function addDetectedTarget(target) {
    detectedTargets.value.push({
      ...target,
      id: Date.now(),
      timestamp: new Date().toLocaleString()
    })
  }

  function setWsConnected(status) {
    wsConnected.value = status
    droneStatus.value.connected = status
  }

  function setCurrentMission(mission) {
    currentMission.value = mission
  }

  function addMissionRecord(record) {
    missionRecords.value.unshift(record)
  }

  function updateMissionRecord(id, data) {
    const index = missionRecords.value.findIndex(r => r.id === id)
    if (index !== -1) {
      Object.assign(missionRecords.value[index], data)
    }
  }

  function deleteMissionRecord(id) {
    const index = missionRecords.value.findIndex(r => r.id === id)
    if (index !== -1) {
      missionRecords.value.splice(index, 1)
    }
  }

  function setPlannedPath(path) {
    plannedPath.value = path
  }

  function clearTrajectoryHistory() {
    trajectoryHistory.value = []
  }

  function clearDetectedTargets() {
    detectedTargets.value = []
  }

  function updateMissionPlanForm(form) {
    Object.assign(missionPlanForm.value, form)
  }

  function setMissionPlanNodes(nodes) {
    missionPlanNodes.value = nodes
  }

  const videoAiMarks = ref([])
  const videoScreenshots = ref([])
  const videoRecordedSegments = ref([])
  
  function addVideoAiMark(mark) {
    videoAiMarks.value.push(mark)
    if (videoAiMarks.value.length > 50) {
      videoAiMarks.value.shift()
    }
  }
  

  function removeVideoAiMark(id) {
    videoAiMarks.value = videoAiMarks.value.filter(m => m.id !== id)
  }
  

  function clearVideoAiMarks() {
    videoAiMarks.value = []
  }
  

  function addVideoScreenshot(shot) {
    videoScreenshots.value.unshift(shot)

    if (videoScreenshots.value.length > 20) {
      videoScreenshots.value.pop()
    }
  }
  

  function addVideoRecordedSegment(segment) {
    videoRecordedSegments.value.unshift(segment)
  }

  return {
    droneStatus, trajectoryHistory, detectedTargets, wsConnected, currentMission,
    missionRecords, plannedPath, missionPlanForm, missionPlanNodes,
    videoAiMarks, videoScreenshots, videoRecordedSegments,
    batteryStatus, signalStatus, updateDroneStatus, updateDetectedTargets,
    addDetectedTarget, setWsConnected, setCurrentMission, addMissionRecord,
    updateMissionRecord, deleteMissionRecord, setPlannedPath,
    clearTrajectoryHistory, clearDetectedTargets, updateMissionPlanForm,
    setMissionPlanNodes, addVideoAiMark, removeVideoAiMark,
    clearVideoAiMarks, addVideoScreenshot, addVideoRecordedSegment
  }
})
