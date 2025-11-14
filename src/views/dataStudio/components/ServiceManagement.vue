<template>
  <div class="v-service-management">
    <div class="v-service-management__header">
      <h2>服务管理</h2>
      <p>查看任务执行状态和历史</p>
    </div>

    <div class="v-service-management__toolbar">
      <el-button-group>
        <el-button icon="VideoPlay" @click="handleStartService">
          启动服务
        </el-button>
        <el-button icon="CloseBold" @click="handleStopService">
          停止服务
        </el-button>
      </el-button-group>
      <el-button icon="Refresh" @click="handleRefresh">
        刷新
      </el-button>
    </div>

    <div class="v-service-management__content">
      <el-tabs v-model="activeTab" type="card">
        <el-tab-pane label="任务历史" name="history">
          <div class="v-service-management__table">
            <el-table :data="taskHistory" style="width: 100%" border>
              <el-table-column prop="id" label="任务ID" width="120" />
              <el-table-column prop="name" label="任务名称" width="180" />
              <el-table-column prop="type" label="任务类型" width="120">
                <template #default="{ row }">
                  <el-tag>{{ row.type }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="getStatusTag(row.status)">{{ row.status }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="startTime" label="开始时间" width="180" />
              <el-table-column prop="endTime" label="结束时间" width="180" />
              <el-table-column prop="duration" label="运行时长" width="120">
                <template #default="{ row }">
                  {{ formatDuration(row.duration) }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="200" fixed="right">
                <template #default="{ row }">
                  <el-button size="small" icon="View" @click="handleViewTask(row)">
                    查看
                  </el-button>
                  <el-button size="small" icon="Delete" type="danger" @click="handleDeleteTask(row)">
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <el-tab-pane label="运行日志" name="logs">
          <div class="v-service-management__logs">
            <div class="v-service-management__logs-toolbar">
              <el-button icon="Download" @click="handleDownloadLogs">
                下载日志
              </el-button>
              <el-button icon="Delete" @click="handleClearLogs">
                清空日志
              </el-button>
            </div>
            <div class="v-service-management__logs-content">
              <pre class="v-service-management__logs-text">
[INFO] 2024-01-01 10:00:00 - 开始执行 SQL 任务
[INFO] 2024-01-01 10:00:01 - 解析 SQL 语句...
[INFO] 2024-01-01 10:00:02 - 验证 SQL 语法...
[INFO] 2024-01-01 10:00:03 - 生成执行计划...
[INFO] 2024-01-01 10:00:04 - 提交任务到 Flink 集群...
[INFO] 2024-01-01 10:00:05 - 任务执行成功！
[INFO] 2024-01-01 10:00:06 - 清理临时文件...
              </pre>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="系统状态" name="status">
          <div class="v-service-management__status">
            <el-row :gutter="16">
              <el-col :span="8">
                <div class="v-service-management__status-card">
                  <div class="v-service-management__status-card-header">
                    <el-icon><Cpu /></el-icon>
                    <span>CPU 使用率</span>
                  </div>
                  <div class="v-service-management__status-card-content">
                    <el-progress :percentage="45" :show-text="false" />
                    <div class="v-service-management__status-card-value">45%</div>
                  </div>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="v-service-management__status-card">
                  <div class="v-service-management__status-card-header">
                    <el-icon><Memory /></el-icon>
                    <span>内存使用率</span>
                  </div>
                  <div class="v-service-management__status-card-content">
                    <el-progress :percentage="68" :show-text="false" />
                    <div class="v-service-management__status-card-value">68%</div>
                  </div>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="v-service-management__status-card">
                  <div class="v-service-management__status-card-header">
                    <el-icon><HardDisk /></el-icon>
                    <span>磁盘使用率</span>
                  </div>
                  <div class="v-service-management__status-card-content">
                    <el-progress :percentage="32" :show-text="false" />
                    <div class="v-service-management__status-card-value">32%</div>
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

// 激活的标签页
const activeTab = ref('history')

// 任务历史数据
const taskHistory = ref([
  {
    id: 'task-001',
    name: '示例 SQL 任务',
    type: 'Flink SQL',
    status: 'success',
    startTime: '2024-01-01 10:00:00',
    endTime: '2024-01-01 10:05:00',
    duration: 300000 // 5分钟
  },
  {
    id: 'task-002',
    name: '数据同步任务',
    type: 'Flink SQL',
    status: 'running',
    startTime: '2024-01-01 11:00:00',
    endTime: '',
    duration: 600000 // 10分钟
  },
  {
    id: 'task-003',
    name: 'ETL 处理任务',
    type: 'Flink SQL',
    status: 'failed',
    startTime: '2024-01-01 09:00:00',
    endTime: '2024-01-01 09:02:00',
    duration: 120000 // 2分钟
  }
])

// 事件处理
const handleStartService = () => {
  ElMessage.success('服务启动成功')
}

const handleStopService = () => {
  ElMessage.warning('服务停止成功')
}

const handleRefresh = () => {
  ElMessage.success('服务状态已刷新')
}

const handleViewTask = (row: any) => {
  ElMessage.info(`查看任务: ${row.name}`)
}

const handleDeleteTask = (row: any) => {
  ElMessage.warning(`删除任务: ${row.name}`)
}

const handleDownloadLogs = () => {
  ElMessage.info('下载日志功能开发中...')
}

const handleClearLogs = () => {
  ElMessage.warning('清空日志功能开发中...')
}

// 获取状态标签
const getStatusTag = (status: string) => {
  const statusMap: Record<string, string> = {
    success: 'success',
    running: 'primary',
    failed: 'danger',
    pending: 'warning'
  }
  return statusMap[status] || ''
}

// 格式化运行时长
const formatDuration = (milliseconds: number) => {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  } else {
    return `${seconds}s`
  }
}
</script>

<style lang="scss" scoped>
.v-service-management {
  padding: 24px;
  height: 100%;
  overflow-y: auto;

  &__header {
    margin-bottom: 24px;

    h2 {
      margin: 0 0 8px 0;
      color: var(--el-text-color-primary);
      font-size: 20px;
    }

    p {
      margin: 0;
      color: var(--el-text-color-secondary);
      font-size: 14px;
    }
  }

  &__toolbar {
    margin-bottom: 16px;
    display: flex;
    gap: 8px;
  }

  &__content {
    height: calc(100% - 120px);

    :deep(.el-tabs) {
      height: 100%;
      display: flex;
      flex-direction: column;

      .el-tabs__content {
        flex: 1;
        padding: 0;

        .el-tab-pane {
          height: 100%;
        }
      }
    }
  }

  &__table {
    height: 100%;
  }

  &__logs {
    height: 100%;
    display: flex;
    flex-direction: column;

    &-toolbar {
      margin-bottom: 16px;
    }

    &-content {
      flex: 1;
      background: var(--el-bg-color);
      border: 1px solid var(--el-border-color);
      border-radius: 4px;
      overflow: auto;
    }

    &-text {
      margin: 0;
      padding: 16px;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 12px;
      line-height: 1.5;
      color: var(--el-text-color-primary);
      white-space: pre-wrap;
    }
  }

  &__status {
    padding: 16px 0;
  }

  &__status-card {
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color);
    border-radius: 8px;
    padding: 20px;

    &-header {
      display: flex;
      align-items: center;
      margin-bottom: 12px;

      .el-icon {
        font-size: 20px;
        color: var(--el-color-primary);
        margin-right: 8px;
      }

      span {
        color: var(--el-text-color-primary);
        font-weight: 500;
      }
    }

    &-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    &-value {
      color: var(--el-text-color-primary);
      font-size: 18px;
      font-weight: 600;
    }
  }
}
</style>