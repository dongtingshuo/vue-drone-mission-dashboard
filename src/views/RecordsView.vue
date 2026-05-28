<template>
  <div class="records-view">
    <!-- 搜索和筛选 -->
    <div class="dashboard-card filter-card">
      <div class="filter-row">
        <el-input 
          v-model="searchKeyword" 
          placeholder="搜索任务名称..." 
          prefix-icon="Search"
          clearable
          style="width: 250px"
        />
        <el-select v-model="filterStatus" placeholder="任务状态" clearable style="width: 150px">
          <el-option label="全部状态" value="" />
          <el-option label="已保存" value="saved" />
          <el-option label="执行中" value="executing" />
          <el-option label="已完成" value="completed" />
          <el-option label="已取消" value="cancelled" />
        </el-select>
        <el-select v-model="filterType" placeholder="任务类型" clearable style="width: 150px">
          <el-option label="全部类型" value="" />
          <el-option label="区域巡逻" value="patrol" />
          <el-option label="定点飞行" value="point" />
          <el-option label="轨迹追踪" value="trace" />
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="width: 260px"
        />
        <div class="flex-spacer"></div>
        <el-button type="primary" @click="exportToExcel" :loading="exporting">
          <el-icon><Download /></el-icon>
          导出Excel
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="dashboard-card stat-card">
        <div class="stat-icon total">
          <el-icon><Document /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ totalRecords }}</div>
          <div class="stat-label">总任务数</div>
        </div>
      </div>
      <div class="dashboard-card stat-card">
        <div class="stat-icon completed">
          <el-icon><CircleCheck /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ completedRecords }}</div>
          <div class="stat-label">已完成</div>
        </div>
      </div>
      <div class="dashboard-card stat-card">
        <div class="stat-icon executing">
          <el-icon><Loading /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ executingRecords }}</div>
          <div class="stat-label">执行中</div>
        </div>
      </div>
      <div class="dashboard-card stat-card">
        <div class="stat-icon distance">
          <el-icon><Odometer /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ totalDistance.toFixed(1) }}</div>
          <div class="stat-label">总飞行距离(km)</div>
        </div>
      </div>
    </div>

    <!-- 任务列表 -->
    <div class="dashboard-card table-card">
      <div class="card-header">
        <span class="card-title">
          <el-icon><List /></el-icon>
          任务记录列表
        </span>
        <el-button size="small" @click="refreshData" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
      
      <el-table
        :data="filteredRecords"
        v-loading="loading"
        @row-click="viewDetail"
        row-class-name="clickable-row"
        :row-style="{ background: 'transparent' }"
      >
        <el-table-column prop="id" label="任务ID" width="130">
          <template #default="{ row }">
            <span class="task-id">{{ row.missionId || 'MSN-' + row.id.toString(36).toUpperCase() }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="任务名称" min-width="180">
          <template #default="{ row }">
            <div class="task-name">
              <el-icon class="task-icon"><Position /></el-icon>
              {{ row.name }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ getTypeName(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusName(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="waypoints" label="航点数" width="80" align="center" />
        <el-table-column prop="distance" label="距离(km)" width="90">
          <template #default="{ row }">
            {{ (row.distance || 0).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click.stop="viewDetail(row)">
              <el-icon><View /></el-icon>
              详情
            </el-button>
            <el-button 
              v-if="row.status === 'executing'" 
              size="small" 
              type="warning" 
              link 
              @click.stop="cancelTask(row)"
            >
              <el-icon><VideoPause /></el-icon>
              取消
            </el-button>
            <el-button 
              v-if="row.status !== 'executing'" 
              size="small" 
              type="success" 
              link 
              @click.stop="reExecuteTask(row)"
            >
              <el-icon><Refresh /></el-icon>
              重新执行
            </el-button>
            <el-button size="small" type="danger" link @click.stop="deleteRecord(row)">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="totalRecords"
          layout="total, sizes, prev, pager, next, jumper"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDroneStore } from '../stores/drone'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as XLSX from 'xlsx'

const router = useRouter()
const droneStore = useDroneStore()
const { missionRecords } = storeToRefs(droneStore)

const loading = ref(false)
const exporting = ref(false)
const searchKeyword = ref('')
const filterStatus = ref('')
const filterType = ref('')
const dateRange = ref(null)
const currentPage = ref(1)
const pageSize = ref(10)

const filteredRecords = computed(() => {
  let result = missionRecords.value
  
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(r => r.name.toLowerCase().includes(keyword))
  }
  
  if (filterStatus.value) {
    result = result.filter(r => r.status === filterStatus.value)
  }
  
  if (filterType.value) {
    result = result.filter(r => r.type === filterType.value)
  }
  
  return result
})

const totalRecords = computed(() => missionRecords.value.length)
const completedRecords = computed(() => missionRecords.value.filter(r => r.status === 'completed').length)
const executingRecords = computed(() => missionRecords.value.filter(r => r.status === 'executing').length)
const totalDistance = computed(() => missionRecords.value.reduce((sum, r) => sum + (r.distance || 0), 0))

function getTypeName(type) {
  const names = {
    patrol: '区域巡逻',
    point: '定点飞行',
    trace: '轨迹追踪'
  }
  return names[type] || type
}

function getStatusName(status) {
  const names = {
    saved: '已保存',
    executing: '执行中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return names[status] || status
}

function getStatusType(status) {
  const types = {
    saved: 'info',
    executing: 'warning',
    completed: 'success',
    cancelled: 'danger'
  }
  return types[status] || 'info'
}

function viewDetail(row) {
  router.push(`/records/${row.id}`)
}

function cancelTask(row) {
  ElMessageBox.confirm(`确定要取消正在执行的任务 "${row.name}" 吗？`, '取消任务', {
    type: 'warning',
    confirmButtonText: '确定取消',
    cancelButtonText: '继续执行'
  }).then(() => {
    droneStore.updateMissionRecord(row.id, { status: 'cancelled' })
    ElMessage.success('任务已取消')
  }).catch(() => {})
}

function reExecuteTask(row) {
  ElMessageBox.confirm(`确定要重新执行任务 "${row.name}" 吗？`, '重新执行', {
    type: 'info',
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).then(() => {

    const newTaskId = Date.now()
    const newTask = {
      id: newTaskId,
      missionId: `MSN-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      name: row.name + ' (重新执行)',
      type: row.type,
      status: 'executing',
      waypoints: row.waypoints,
      distance: row.distance,
      duration: row.duration,
      createdAt: new Date().toLocaleString('zh-CN', { 
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      }).replace(/\//g, '-'),
      waypointData: row.waypointData || null,
      aiReport: null
    }
    

    droneStore.addMissionRecord(newTask)
    

    const durationMatch = row.duration?.match(/(\d+)/)
    const durationMinutes = durationMatch ? parseInt(durationMatch[1]) : 25

    const executionTime = durationMinutes * 1000
    
    ElMessage.success(`任务 "${row.name}" 已开始重新执行，预计耗时 ${durationMinutes} 秒`)
    

    setTimeout(() => {
      droneStore.updateMissionRecord(newTaskId, {
        status: 'completed',
        aiReport: {
          detectedObjects: Math.floor(Math.random() * 15) + 5,
          obstacles: Math.floor(Math.random() * 3),
          pathDeviation: (Math.random() * 5).toFixed(1)
        }
      })
      ElMessage.success(`任务 "${newTask.name}" 执行完成`)
    }, executionTime)
  }).catch(() => {})
}

function deleteRecord(row) {
  ElMessageBox.confirm(`确定要删除任务 "${row.name}" 吗？`, '提示', {
    type: 'warning'
  }).then(() => {
    droneStore.deleteMissionRecord(row.id)
    ElMessage.success('删除成功')
  }).catch(() => {})
}

function refreshData() {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    ElMessage.success('数据已刷新')
  }, 1000)
}

function exportToExcel() {
  exporting.value = true
  
  try {
    const data = filteredRecords.value.map(r => ({
      '任务ID': r.missionId || 'MSN-' + r.id.toString(36).toUpperCase(),
      '任务名称': r.name,
      '类型': getTypeName(r.type),
      '状态': getStatusName(r.status),
      '航点数': r.waypoints,
      '距离(km)': (r.distance || 0).toFixed(2),
      '时长': r.duration,
      '创建时间': r.createdAt,
      'AI检测对象': r.aiReport?.detectedObjects || '-',
      '障碍物数量': r.aiReport?.obstacles || '-',
      '路径偏差率(%)': r.aiReport?.pathDeviation || '-'
    }))
    
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '任务记录')
    

    ws['!cols'] = [
      { wch: 15 }, { wch: 20 }, { wch: 12 }, { wch: 10 },
      { wch: 8 }, { wch: 12 }, { wch: 10 }, { wch: 20 },
      { wch: 12 }, { wch: 12 }, { wch: 15 }
    ]
    
    XLSX.writeFile(wb, `任务记录_${new Date().toLocaleDateString()}.xlsx`)
    
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败: ' + error.message)
  } finally {
    exporting.value = false
  }
}
</script>

<style scoped>
.records-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 100%;
  padding-bottom: 20px;
}

.filter-card {
  flex-shrink: 0;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.flex-spacer {
  flex: 1;
}

/* 统计卡片 */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-icon.total {
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.2), rgba(64, 158, 255, 0.1));
  color: #409eff;
}

.stat-icon.completed {
  background: linear-gradient(135deg, rgba(103, 194, 58, 0.2), rgba(103, 194, 58, 0.1));
  color: #67c23a;
}

.stat-icon.executing {
  background: linear-gradient(135deg, rgba(230, 162, 60, 0.2), rgba(230, 162, 60, 0.1));
  color: #e6a23c;
}

.stat-icon.distance {
  background: linear-gradient(135deg, rgba(144, 147, 153, 0.2), rgba(144, 147, 153, 0.1));
  color: #909399;
}

.stat-content .stat-value {
  font-size: 28px;
  font-weight: bold;
  color: var(--text-primary);
}

.stat-content .stat-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 4px;
}

/* 表格 */
.table-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 400px;
}

.table-card :deep(.el-table) {
  flex: 1;
  min-height: 300px;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-row-hover-bg-color: rgba(64, 158, 255, 0.1);
  --el-table-header-bg-color: rgba(30, 41, 59, 0.8);
  --el-table-border-color: var(--border-color);
}

.table-card :deep(.el-table__row) {
  background: transparent !important;
}

.table-card :deep(.el-table__row:hover > td) {
  background: rgba(64, 158, 255, 0.08) !important;
}

.table-card :deep(.el-table__header th) {
  background: rgba(30, 41, 59, 0.8) !important;
  border-bottom: 1px solid var(--border-color);
}

.task-id {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
  color: var(--primary-color);
}

.task-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.task-icon {
  color: var(--primary-color);
}

.clickable-row {
  cursor: pointer;
}

.pagination-wrapper {
  padding: 16px 0;
  display: flex;
  justify-content: flex-end;
}

/* 响应式 */
@media (max-width: 1400px) {
  .stats-row {
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }
  
  .stat-content .stat-value {
    font-size: 24px;
  }
}

@media (max-width: 1200px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .filter-row {
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .filter-row > .el-input,
  .filter-row > .el-select {
    width: calc(50% - 6px) !important;
  }
  
  .filter-row > .el-date-picker {
    width: 100% !important;
  }
  
  .flex-spacer {
    display: none;
  }
  
  .filter-row > .el-button {
    width: 100%;
  }
}

@media (max-width: 992px) {
  .records-view {
    gap: 12px;
  }
  
  .stat-icon {
    width: 40px;
    height: 40px;
    font-size: 20px;
  }
  
  .stat-content .stat-value {
    font-size: 22px;
  }
}

@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  
  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-row > * {
    width: 100% !important;
  }
  
  .stat-card {
    padding: 12px;
  }
  
  .stat-icon {
    width: 36px;
    height: 36px;
    font-size: 18px;
  }
  
  .stat-content .stat-value {
    font-size: 20px;
  }
  
  .stat-content .stat-label {
    font-size: 12px;
  }
  
  .table-card {
    min-height: 300px;
  }
}

@media (max-width: 576px) {
  .stats-row {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  
  .stat-card {
    padding: 10px;
    gap: 8px;
  }
  
  .stat-icon {
    width: 32px;
    height: 32px;
    font-size: 16px;
  }
  
  .stat-content .stat-value {
    font-size: 18px;
  }
  
  .stat-content .stat-label {
    font-size: 11px;
  }
  
  .task-name {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>
