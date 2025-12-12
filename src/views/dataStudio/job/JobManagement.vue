<template>
  <ContentWrap title="作业管理" message="查看作业执行状态和历史">
    <template #header>
      <el-button type="primary" @click="handleDeployJob">
        <Icon icon="ep:plus" :size="16" class="mr-5px" />
        部署作业
      </el-button>
    </template>

    <el-table :data="jobList" style="width: 100%" border v-loading="loading">
      <el-table-column prop="name" label="作业名称" width="180" />
      <el-table-column prop="type" label="作业类型" width="120">
        <template #default="{ row }">
          <el-tag>{{ row.jobType }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusTag(row.status)">{{ row.status || '-' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="startTime" label="开始时间" width="180" :formatter="dateFormatter" />
      <el-table-column prop="endTime" label="结束时间" width="180" :formatter="dateFormatter" />
      <el-table-column prop="duration" label="运行时长" width="120">
        <template #default="{ row }">
          {{ formatDuration(row.duration) }}
        </template>
      </el-table-column>
      <el-table-column prop="webUiUrl" label="Web UI" width="120">
        <template #default="{ row }">
          <el-link
            v-if="row.webUiUrl && row.webUiUrl.trim()"
            :href="formatWebUiUrl(row.webUiUrl)"
            target="_blank"
            type="primary"
            :underline="false"
          >
            <Icon icon="ep:link" :size="14" />
          </el-link>
          <el-text v-else type="info">-</el-text>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button
            v-if="isJobStoppable(row.status)"
            size="small"
            type="warning"
            @click="handleStopJob(row)"
          >
            停止
          </el-button>
          <ContextMenu
            :schema="[
              {
                icon: 'ep:view',
                label: '查看',
                command: () => handleViewJob(row)
              },
              {
                divided: true,
                icon: 'ep:delete',
                label: '删除',
                command: () => handleDeleteJob(row)
              }
            ]"
            trigger="click"
          >
            <el-button size="small" class="ml-5px">
              <Icon icon="ep:more-filled" />
            </el-button>
          </ContextMenu>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页组件 -->
    <el-row justify="end" class="mt-20px">
      <el-pagination
        v-model:current-page="pageParams.pageNo"
        v-model:page-size="pageParams.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </el-row>

    <!-- 作业详情弹窗 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="作业详情"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-descriptions v-if="currentJob" :column="2" border>
        <el-descriptions-item label="所属文件名称">
          {{ jobDetailData?.fileName || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="所属集群名称">
          {{ jobDetailData?.clusterName || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="执行模式">
          {{ jobDetailData?.executionMode || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="Flink版本">
          {{ jobDetailData?.flinkVersion || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="Flink作业ID" :span="2">
          {{ jobDetailData?.jobId || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusTag(jobDetailData?.status)">
            {{ jobDetailData?.status || '-' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="开始时间">
          {{ jobDetailData?.startTime ? dateFormatter(null, null, jobDetailData.startTime) : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="结束时间">
          {{ jobDetailData?.endTime ? dateFormatter(null, null, jobDetailData.endTime) : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="运行时长">
          {{ jobDetailData?.duration ? formatDuration(jobDetailData.duration) : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="Flink Web UI链接" :span="2">
          <el-link
            v-if="jobDetailData?.webUiUrl && jobDetailData.webUiUrl.trim()"
            :href="jobDetailData.webUiUrl"
            target="_blank"
            type="primary"
          >
            {{ jobDetailData.webUiUrl }}
            <Icon icon="ep:link" :size="14" class="ml-5px" />
          </el-link>
          <el-text v-else type="info">-</el-text>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 部署作业弹窗 -->
    <el-dialog
      v-model="deployDialogVisible"
      title="部署作业"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-form
        v-if="deployDialogVisible"
        ref="deployFormRef"
        :model="deployForm"
        :rules="deployFormRules"
        label-width="120px"
      >
        <el-form-item label="作业类型" prop="jobType">
          <el-radio-group v-model="deployForm.jobType" @change="handleJobTypeChange">
            <el-radio value="FLINK_SQL">Flink SQL</el-radio>
            <el-radio value="JAR">JAR</el-radio>
            <el-radio value="DATA_INGESTION">数据摄取</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- Flink SQL 和数据摄取作业选择 -->
        <template v-if="deployForm.jobType === 'FLINK_SQL' || deployForm.jobType === 'DATA_INGESTION'">
          <el-form-item label="选择作业" prop="fileId">
            <el-select
              v-model="deployForm.fileId"
              placeholder="请选择"
              style="width: 100%"
              @change="handleJobChange"
            >
              <el-option
                v-for="job in availableJobs"
                :key="job.id"
                :label="job.name || job.jobName"
                :value="job.id"
              />
            </el-select>
          </el-form-item>
        </template>

        <!-- JAR 作业表单 -->
        <template v-if="deployForm.jobType === 'JAR'">
          <el-form-item label="JAR 文件路径" prop="jarFile">
            <el-input
              v-model="deployForm.jarFile"
              placeholder="请输入 JAR 文件路径"
            />
            <el-text type="info" size="small" class="mt-4px">
              输入 JAR 文件的完整路径
            </el-text>
          </el-form-item>

          <el-form-item label="入口类名" prop="entryPointClassName">
            <el-input
              v-model="deployForm.entryPointClassName"
              placeholder="请输入入口类名"
            />
          </el-form-item>

          <el-form-item label="作业名称" prop="jobName">
            <el-input
              v-model="deployForm.jobName"
              placeholder="请输入作业名称"
            />
          </el-form-item>

          <el-form-item label="参数">
            <el-space direction="vertical" fill class="w-full">
              <el-button
                type="primary"
                link
                @click="addArgument"
                :icon="Plus"
              >
                添加参数
              </el-button>
              <el-row
                v-for="(arg, index) in deployForm.arguments"
                :key="index"
                :gutter="10"
                align="middle"
              >
                <el-col :span="20">
                  <el-input
                    v-model="deployForm.arguments[index]"
                    placeholder="请输入参数"
                  />
                </el-col>
                <el-col :span="4">
                  <el-button
                    type="danger"
                    link
                    @click="removeArgument(index)"
                    :icon="Delete"
                  >
                    删除
                  </el-button>
                </el-col>
              </el-row>
            </el-space>
          </el-form-item>

          <el-divider>部署模式</el-divider>

          <el-form-item label="部署模式" prop="deployMode">
            <el-select
              v-model="deployForm.deployMode"
              placeholder="请选择部署模式"
              style="width: 100%"
              @change="handleDeployModeChange"
            >
              <el-option label="本地模式" value="local" />
              <el-option label="远程模式" value="remote" />
              <el-option label="Yarn Application模式" value="yarn-application" />
            </el-select>
          </el-form-item>

          <!-- 集群选择（非本地模式时显示） -->
          <el-form-item v-if="deployForm.deployMode !== 'local'" label="集群" prop="clusterId">
            <el-select
              v-model="deployForm.clusterId"
              placeholder="请选择集群"
              style="width: 100%"
            >
              <el-option
                v-for="cluster in availableClusters"
                :key="cluster.id"
                :label="cluster.name"
                :value="cluster.id"
              />
            </el-select>
            <el-text type="info" size="small" class="mt-4px">
              <template v-if="deployForm.deployMode === 'remote'">
                选择远程Flink集群用于部署作业
              </template>
              <template v-else-if="deployForm.deployMode === 'yarn-application'">
                选择YARN集群用于Application模式部署
              </template>
            </el-text>
          </el-form-item>

          <el-form-item label="Flink 版本" prop="flinkVersion">
            <el-select
              v-model="deployForm.flinkVersion"
              placeholder="请选择 Flink 版本"
              style="width: 100%"
            >
              <el-option label="Flink 1.17" value="1.17" />
              <el-option label="Flink 1.18" value="1.18" />
              <el-option label="Flink 1.19" value="1.19" />
            </el-select>
          </el-form-item>

          <el-form-item label="并行度" prop="parallelism">
            <el-input-number
              v-model="deployForm.parallelism"
              :min="1"
              :max="100"
              placeholder="请输入并行度"
            />
          </el-form-item>

          <el-form-item label="检查点间隔" prop="checkpointInterval">
            <el-input-number
              v-model="deployForm.checkpointInterval"
              :min="0"
              :step="1000"
              placeholder="请输入检查点间隔(毫秒)"
              style="width: 100%"
            />
            <el-text type="info" size="small" class="mt-4px">
              单位：毫秒，0表示不启用检查点
            </el-text>
          </el-form-item>
        </template>

        <!-- Flink SQL 和数据摄取作业的配置信息（只读） -->
        <template v-if="(deployForm.jobType === 'FLINK_SQL' || deployForm.jobType === 'DATA_INGESTION') && deployForm.fileId && readonlyConfig">
          <el-divider>任务配置</el-divider>
          <el-card shadow="never" class="config-info-card">
            <el-descriptions :column="2" border>
              <template v-for="(value, key) in readonlyConfig" :key="key">
                <el-descriptions-item
                  v-if="!(isRemoteClusterMode && key === 'flinkVersion') && key !== 'extendedConfig'"
                  :label="getConfigLabel(key)"
                >
                  {{ formatConfigValue(key, value) }}
                </el-descriptions-item>
              </template>
            </el-descriptions>

            <!-- 扩展配置展示 -->
            <template v-if="readonlyConfig?.extendedConfig && Object.keys(readonlyConfig.extendedConfig).length > 0">
              <el-divider />
              <el-text tag="h4" class="mb-10px">扩展配置</el-text>
              <el-descriptions :column="1" size="small">
                <el-descriptions-item
                  v-for="(value, key) in readonlyConfig.extendedConfig"
                  :key="key"
                  :label="String(key)"
                >
                  {{ String(value) }}
                </el-descriptions-item>
              </el-descriptions>
            </template>
          </el-card>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="deployDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitDeploy" :loading="deployLoading">
          部署
        </el-button>
      </template>
    </el-dialog>
  </ContentWrap>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import { ContentWrap } from '@/components/ContentWrap'
import { ContextMenu } from '@/layout/components/ContextMenu'
import { Icon } from '@/components/Icon'
import { jobApi } from '@/api/dataStudio/job'
import type { Job, JobPageParams } from '@/api/dataStudio/job'
import { dateFormatter } from '@/utils/formatTime'
import { getFileList, getFileData } from '@/api/dataStudio/file'
import { getDataIngestionList, getDataIngestionData } from '@/api/dataStudio/dataIngestion'
import { flinkClusterApi } from '@/api/dataStudio/flinkCluster'

// 作业列表数据
const jobList = ref<Job[]>([])

// 加载状态
const loading = ref(false)

// 详情弹窗控制
const detailDialogVisible = ref(false)
const currentJob = ref<Job | null>(null)

// 分页参数
const pageParams = ref<JobPageParams>({
  pageNo: 1,
  pageSize: 10
})

// 总记录数
const total = ref(0)

// 部署弹窗控制
const deployDialogVisible = ref(false)
const deployLoading = ref(false)
const deployFormRef = ref()

// 部署表单数据
const deployForm = ref({
  jobType: 'FLINK_SQL',
  fileId: null as number | null,
  jarFile: '',
  entryPointClassName: null,
  jobName: '',
  arguments: [] as string[],
  deployMode: 'local',
  clusterId: null as number | null,
  flinkVersion: '1.18',
  parallelism: 1,
  checkpointInterval: 50000
})

// 可用作业列表
const availableJobs = ref<any[]>([])

// 可用集群列表
const availableClusters = ref<any[]>([])

// 作业配置详情
const jobConfig = ref<any>(null)

// 只读配置数据
const readonlyConfig = ref<{
  deployMode?: string
  executionMode?: string
  flinkVersion?: string
  parallelism?: number
  checkpointInterval?: number
  extendedConfig?: Record<string, any>
} | null>(null)

// 配置标签映射
const configLabels = computed(() => {
  if (deployForm.value.jobType === 'FLINK_SQL') {
    return {
      deployMode: '部署模式',
      executionMode: '执行类型',
      flinkVersion: 'Flink版本',
      parallelism: '并行度',
      checkpointInterval: '检查点间隔'
    }
  } else if (deployForm.value.jobType === 'DATA_INGESTION') {
    return {
      executionMode: '部署模式',
      flinkVersion: 'Flink版本',
      parallelism: '并行度',
      checkpointInterval: '检查点'
    }
  }
  return {}
})

// 是否为远程集群模式（需要隐藏Flink版本）
const isRemoteClusterMode = computed(() => {
  const execMode = readonlyConfig.value?.executionMode || ''
  const deployMode = readonlyConfig.value?.deployMode || ''
  return execMode.includes('REMOTE') || execMode.includes('remote') ||
         deployMode.includes('REMOTE') || deployMode.includes('remote')
})

// 获取配置项的中文标签
const getConfigLabel = (key: string): string => {
  return configLabels.value[key as keyof typeof configLabels.value] || key
}

// 格式化配置值
const formatConfigValue = (key: string, value: any): string => {
  // 空值处理
  if (value === undefined || value === null || value === '') {
    return '-'
  }

  // 对象类型直接返回'-'
  if (typeof value === 'object') {
    return '-'
  }

  if (key === 'executionMode' || key === 'deployMode') {
    return formatExecutionMode(value)
  }

  if (key === 'flinkVersion') {
    return `Flink ${value}`
  }

  if (key === 'checkpointInterval') {
    return `${value}ms`
  }

  return String(value)
}

// 检查作业是否可停止
const isJobStoppable = (status: string | undefined): boolean => {
  if (!status) return false

  // 可停止的状态：正在运行或处理中的状态
  const stoppableStatuses = [
    'RUNNING',
    'INITIALIZING',
    'RESTARTING',
    'RECONCILING',
    'FAILING',
    'CANCELLING',
    // 兼容小写
    'running',
    'pending'
  ]

  return stoppableStatuses.includes(status)
}

// 格式化执行模式
const formatExecutionMode = (mode: string): string => {
  const modeMap: Record<string, string> = {
    'LOCAL': '本地模式',
    'STANDALONE': 'standalone模式',
    'YARN_SESSION': 'YARN Session',
    'YARN_PER_JOB': 'YARN Per-Job',
    'KUBERNETES_SESSION': 'Kubernetes Session',
    'KUBERNETES_PER_JOB': 'Kubernetes Per-Job',
    'REMOTE': '远程集群',
    'remote': '远程集群'  // 添加小写支持
  }
  return modeMap[mode] || mode
}

// 根据作业类型处理配置字段映射
const processConfigByType = (config: any, jobType: string) => {
  const processedConfig: any = {}

  if (jobType === 'FLINK_SQL') {
    // Flink SQL 字段映射
    processedConfig.deployMode = config.deployMode
    processedConfig.executionMode = config.executionMode
    processedConfig.flinkVersion = config.flinkVersion
    processedConfig.parallelism = config.parallelism
    processedConfig.checkpointInterval = config.checkpointInterval
  } else if (jobType === 'DATA_INGESTION') {
    // 数据摄取字段映射
    processedConfig.executionMode = config.executionMode
    processedConfig.flinkVersion = config.flinkVersion
    processedConfig.parallelism = config.parallelism
    processedConfig.checkpointInterval = config.checkpointInterval
  }

  processedConfig.extendedConfig = config.extendedConfig
  return processedConfig
}

// 表单验证规则
const deployFormRules = {
  jobType: [
    { required: true, message: '请选择作业类型', trigger: 'change' }
  ],
  fileId: [
    { required: true, message: '请选择作业', trigger: 'change' }
  ],
  jarFile: [
    { required: true, message: '请选择 JAR 文件', trigger: 'change' }
  ],
  jobName: [
    { required: true, message: '请输入任务名称', trigger: 'blur' }
  ],
  deployMode: [
    { required: true, message: '请选择部署模式', trigger: 'change' }
  ],
  clusterId: [
    { required: true, message: '请选择集群', trigger: 'change', validator: (rule: any, value: any, callback: any) => {
        if (deployForm.value.deployMode !== 'local' && !value) {
          callback(new Error('请选择集群'))
        } else {
          callback()
        }
      }
    }
  ]
  // 注意：flinkVersion、parallelism、checkpointInterval 的验证已被移除
  // 因为这些字段不再作为静态表单项，而是在JAR任务类型下作为动态表单项
}

// 格式化 Web UI URL，添加协议前缀
const formatWebUiUrl = (url: string) => {
  if (!url) return ''
  // 如果 URL 没有协议前缀，添加 http://
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `http://${url}`
  }
  return url
}

// 详情页面数据
const jobDetailData = computed(() => {
  if (!currentJob.value) return null

  return {
    fileName: currentJob.value.jobName || currentJob.value.name || `作业${currentJob.value.id}`,
    clusterName: currentJob.value.clusterName || '-',
    executionMode: currentJob.value.executionMode || '-',
    flinkVersion: currentJob.value.flinkVersion || '-',
    jobId: currentJob.value.jobId || '-',
    status: currentJob.value.status || '-',
    webUiUrl: formatWebUiUrl(currentJob.value.webUiUrl || ''),
    startTime: currentJob.value.startTime || '',
    endTime: currentJob.value.endTime || '',
    duration: currentJob.value.duration || 0
  }
})

// 获取作业列表（分页）
const loadJobList = async () => {
  loading.value = true
  try {
    const response = await jobApi.getPage(pageParams.value)

    // 转换字段名以匹配前端组件
    const list = response.list || response.data || []
    jobList.value = list.map((job: Job) => ({
      ...job,
      name: job.jobName || job.name || `作业${job.id}`, // 确保有name字段
      type: job.executionMode || 'Flink SQL' // executionMode -> type
    }))

    // 设置总记录数
    total.value = response.total || response.count || 0
  } catch (error) {
    console.error('加载作业列表失败:', error)
    ElMessage.error('加载作业列表失败')
  } finally {
    loading.value = false
  }
}

// 事件处理
const handleViewJob = async (row: Job) => {
  try {
    // 设置当前作业并打开详情弹窗
    currentJob.value = row
    detailDialogVisible.value = true
  } catch (error) {
    console.error('查看作业失败:', error)
    ElMessage.error('查看作业失败')
  }
}

const handleDeleteJob = async (row: Job) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除作业 "${row.jobName}" 吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await jobApi.delete(row.id!)
    ElMessage.success('删除成功')
    // 刷新列表
    await loadJobList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除作业失败')
    }
  }
}

// 停止作业
const handleStopJob = async (row: Job) => {
  try {
    await jobApi.stop(row.id!)
    ElMessage.success('停止成功')
    await loadJobList()
  } catch (error) {
    ElMessage.error('停止作业失败')
  }
}

// 打开部署弹窗
const handleDeployJob = async () => {
  deployDialogVisible.value = true
  // 重置表单
  deployForm.value = {
    jobType: 'FLINK_SQL',
    fileId: null,
    jarFile: '',
    entryPointClassName: '',
    jobName: '',
    arguments: [],
    deployMode: 'local',
    clusterId: null,
    flinkVersion: '1.18',
    parallelism: 1,
    checkpointInterval: 50000
  }
  jobConfig.value = null
  readonlyConfig.value = null
  availableClusters.value = []
  await loadAvailableJobs()
}

// 加载可用作业列表
const loadAvailableJobs = async () => {
  try {
    // 根据作业类型加载不同的作业列表
    let response
    if (deployForm.value.jobType === 'FLINK_SQL') {
      // 加载 SQL 作业列表（只显示 .sql 文件）
      response = await getFileList({ type: 'sql' })
    } else if (deployForm.value.jobType === 'DATA_INGESTION') {
      // 数据摄取作业（过滤掉目录）
      const allJobs = await getDataIngestionList()
      response = allJobs?.filter(item => item.type !== 'folder') || []
    }
    availableJobs.value = response || []
  } catch (error) {
    console.error('加载作业列表失败:', error)
    ElMessage.error('加载作业列表失败')
  }
}

// 作业类型变化处理
const handleJobTypeChange = async () => {
  deployForm.value.fileId = null
  jobConfig.value = null
  readonlyConfig.value = null
  await loadAvailableJobs()
}

// 作业选择变化处理
const handleJobChange = async (fileId: number) => {
  if (!fileId) {
    jobConfig.value = null
    readonlyConfig.value = null
    return
  }

  try {
    // 获取作业详情
    let jobDetail
    if (deployForm.value.jobType === 'FLINK_SQL') {
      jobDetail = await getFileData(fileId)
    } else if (deployForm.value.jobType === 'DATA_INGESTION') {
      jobDetail = await getDataIngestionData(fileId)
    }
    jobConfig.value = jobDetail

    // 处理只读配置
    if (jobDetail?.config) {
      // 根据作业类型应用字段映射
      readonlyConfig.value = processConfigByType(jobDetail.config, deployForm.value.jobType)
    } else {
      readonlyConfig.value = null
    }
  } catch (error) {
    console.error('获取作业详情失败:', error)
    ElMessage.error('获取作业详情失败')
    readonlyConfig.value = null
  }
}

// 部署模式变化处理
const handleDeployModeChange = async () => {
  deployForm.value.clusterId = null
  if (deployForm.value.deployMode !== 'local') {
    await loadAvailableClusters()
  } else {
    availableClusters.value = []
  }
}

// 加载可用集群列表
const loadAvailableClusters = async () => {
  try {
    // 根据部署模式筛选集群类型
    let clusterType
    if (deployForm.value.deployMode === 'remote') {
      clusterType = 'remote'
    } else if (deployForm.value.deployMode === 'yarn-application') {
      clusterType = 'yarn'
    }

    const response = await flinkClusterApi.getList({
      type: clusterType as any,
      page: 1,
      pageSize: 1000
    })
    availableClusters.value = response.list || []
  } catch (error) {
    console.error('加载集群列表失败:', error)
    ElMessage.error('加载集群列表失败')
  }
}

// 添加参数
const addArgument = () => {
  deployForm.value.arguments.push('')
}

// 删除参数
const removeArgument = (index: number) => {
  deployForm.value.arguments.splice(index, 1)
}

// 提交部署
const handleSubmitDeploy = async () => {
  if (!deployFormRef.value) return

  try {
    await deployFormRef.value.validate()

    deployLoading.value = true

    const deployData: any = {
      jobType: deployForm.value.jobType
    }

    if (deployForm.value.jobType === 'FLINK_SQL' || deployForm.value.jobType === 'DATA_INGESTION') {
      // 对于Flink SQL和数据摄取作业，传递fileId和jobType
      // 其他配置从后端获取
      deployData.fileId = deployForm.value.fileId
    } else if (deployForm.value.jobType === 'JAR') {
      // JAR作业保持原有逻辑，包含所有配置项
      deployData.jarFile = deployForm.value.jarFile
      deployData.entryPointClassName = deployForm.value.entryPointClassName
      deployData.jobName = deployForm.value.jobName
      deployData.arguments = deployForm.value.arguments.filter(arg => arg.trim() !== '')
      deployData.deployMode = deployForm.value.deployMode
      deployData.clusterId = deployForm.value.clusterId
      deployData.flinkVersion = deployForm.value.flinkVersion
      deployData.parallelism = deployForm.value.parallelism
      deployData.checkpointInterval = deployForm.value.checkpointInterval
    }

    await jobApi.deploy(deployData)

    ElMessage.success('部署成功')
    deployDialogVisible.value = false
    await loadJobList()
  } catch (error: any) {
    if (error?.message) {
      ElMessage.error(error.message)
    } else {
      ElMessage.error('部署失败')
    }
  } finally {
    deployLoading.value = false
  }
}

// 分页事件处理
const handlePageChange = (page: number) => {
  pageParams.value.pageNo = page
  loadJobList()
}

const handleSizeChange = (size: number) => {
  pageParams.value.pageSize = size
  pageParams.value.pageNo = 1 // 重置到第一页
  loadJobList()
}

// 页面加载时获取数据
onMounted(() => {
  loadJobList()
})

// 获取状态标签
const getStatusTag = (status: string | undefined) => {
  if (!status) return 'info'

  // 根据后端 JobStatus 枚举进行映射
  const statusMap: Record<string, string> = {
    // 运行中相关 - 蓝色
    RUNNING: 'primary',
    INITIALIZING: 'primary',
    RESTARTING: 'primary',
    RECONCILING: 'primary',

    // 成功完成 - 绿色
    FINISHED: 'success',

    // 失败相关 - 红色
    FAILED: 'danger',
    FAILING: 'danger',

    // 取消相关 - 灰色
    CANCELED: 'info',
    CANCELLING: 'info',
    CLOSED: 'info',

    // 等待/暂停 - 橙色
    CREATED: 'warning',
    SUSPENDED: 'warning',

    // 兼容旧版本的状态值（小写）
    success: 'success',
    running: 'primary',
    failed: 'danger',
    pending: 'warning',
    cancelled: 'info'
  }
  return statusMap[status] || 'info'
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
.config-info-card {
  background-color: var(--el-fill-color-light);
}
</style>
