<template>
  <div class="v-flink-cluster-management">
    <!-- 页面头部 -->
    <div class="v-flink-cluster-management__header">
      <h2>Flink 集群管理</h2>
      <p>管理 Flink 集群实例，支持远程集群和 Flink on Yarn 集群</p>
    </div>

    <!-- 工具栏 -->
    <div class="v-flink-cluster-management__toolbar">
      <el-button type="primary" icon="Plus" @click="handleCreateCluster">
        新建集群
      </el-button>
    </div>

    <!-- 筛选器 -->
    <div class="v-flink-cluster-management__filter">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-input
            v-model="searchForm.keyword"
            placeholder="搜索集群名称或描述"
            clearable
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <Icon icon="ep:search" />
            </template>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-select v-model="searchForm.type" placeholder="集群类型" clearable @change="handleSearch">
            <el-option label="远程集群" value="remote" />
            <el-option label="Flink on Yarn" value="yarn" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="searchForm.status" placeholder="集群状态" clearable @change="handleSearch">
            <el-option label="运行中" value="running" />
            <el-option label="已关闭" value="stopped" />
            <el-option label="可用" value="available" />
            <el-option label="不可用" value="unavailable" />
          </el-select>
        </el-col>
        <el-col :span="10">
          <el-button type="primary" icon="Search" @click="handleSearch">搜索</el-button>
          <el-button icon="Refresh" @click="handleReset">重置</el-button>
        </el-col>
      </el-row>
    </div>

    <!-- 统计卡片 -->
    <div class="v-flink-cluster-management__stats">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ statistics.total }}</div>
              <div class="stat-label">集群总数</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ statistics.runningCount + statistics.availableCount }}</div>
              <div class="stat-label">运行中/可用</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ statistics.remoteCount }}</div>
              <div class="stat-label">远程集群</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ statistics.yarnCount }}</div>
              <div class="stat-label">Yarn 集群</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 集群列表 -->
    <div class="v-flink-cluster-management__content">
      <el-table
        v-loading="loading"
        :data="clusterList"
        style="width: 100%"
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="集群名称" width="180" show-overflow-tooltip />
        <el-table-column prop="type" label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getClusterTypeTag(row.type)">
              {{ getClusterTypeName(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="地址/队列" width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.type === 'remote'">{{ row.remoteUrl || '-' }}</span>
            <span v-else>{{ row.queueName || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="flinkVersion" label="Flink版本" width="120" show-overflow-tooltip />
        <el-table-column prop="owner" label="负责人" width="120" show-overflow-tooltip />
        <el-table-column prop="createTime" label="创建时间" width="180" :formatter="dateFormatter" />
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <el-dropdown trigger="click" @command="(command) => handleCommand(command, row)">
              <el-button size="small" icon="MoreFilled" circle />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="view" icon="View">详情</el-dropdown-item>
                  <el-dropdown-item
                    v-if="row.type === 'yarn'"
                    command="edit"
                    icon="Edit"
                  >
                    编辑
                  </el-dropdown-item>
                  <el-dropdown-item command="test" icon="Connection">测试连接</el-dropdown-item>
                  <el-dropdown-item command="refresh" icon="Refresh">刷新状态</el-dropdown-item>
                  <el-dropdown-item
                    v-if="row.type === 'yarn'"
                    command="copy"
                    icon="CopyDocument"
                  >
                    复制集群
                  </el-dropdown-item>
                  <el-dropdown-item
                    command="delete"
                    icon="Delete"
                    divided
                  >
                    <span class="text-danger">删除</span>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handlePageSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 创建/编辑集群对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="clusterForm.id ? (clusterForm.type === 'yarn' ? '编辑集群' : '集群详情') : '新建集群'"
      width="800px"
      @close="handleCloseDialog"
    >
      <el-tabs v-model="activeTab">
        <el-tab-pane label="基础配置" name="basic">
          <el-form
            ref="formRef"
            :model="clusterForm"
            :rules="formRules"
            label-width="120px"
          >
            <el-form-item label="集群名称" prop="name">
              <el-input v-model="clusterForm.name" placeholder="请输入集群名称" :disabled="clusterForm.id && clusterForm.type === 'remote'" />
            </el-form-item>
            <el-form-item label="集群类型" prop="type">
              <el-select v-model="clusterForm.type" placeholder="请选择集群类型" :disabled="clusterForm.id" @change="handleTypeChange">
                <el-option
                  v-for="type in clusterTypes"
                  :key="type.value"
                  :label="type.label"
                  :value="type.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="集群描述">
              <el-input
                v-model="clusterForm.description"
                type="textarea"
                :rows="3"
                placeholder="请输入集群描述"
                :disabled="clusterForm.id && clusterForm.type === 'remote'"
              />
            </el-form-item>
            <el-form-item label="负责人">
              <el-input v-model="clusterForm.owner" placeholder="请输入负责人" :disabled="clusterForm.id && clusterForm.type === 'remote'" />
            </el-form-item>
            <el-form-item label="标签">
              <el-select
                v-model="clusterForm.tags"
                multiple
                filterable
                allow-create
                default-first-option
                placeholder="请选择或输入标签"
                :disabled="clusterForm.id && clusterForm.type === 'remote'"
              >
                <el-option
                  v-for="tag in commonTags"
                  :key="tag"
                  :label="tag"
                  :value="tag"
                />
              </el-select>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="集群配置" name="config">
          <template v-if="clusterForm.type === 'remote'">
            <!-- 远程集群配置 -->
            <el-form ref="remoteFormRef" :model="clusterForm" :rules="remoteFormRules" label-width="120px">
              <el-form-item label="Flink版本" prop="flinkVersion">
                <el-select v-model="clusterForm.flinkVersion" placeholder="请选择Flink版本" :disabled="clusterForm.id">
                  <el-option
                    v-for="version in flinkVersions"
                    :key="version"
                    :label="version"
                    :value="version"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="远程地址" prop="remoteUrl">
                <el-input v-model="clusterForm.remoteUrl" placeholder="例如：10.1.1.100:8081 或 zk://zk1:2181/namespace" :disabled="clusterForm.id" />
              </el-form-item>
              <el-form-item label="Web UI地址">
                <el-input v-model="clusterForm.webUiUrl" placeholder="自动生成或手动输入" :disabled="clusterForm.id" />
              </el-form-item>
              <el-form-item label="启用HA">
                <el-switch v-model="clusterForm.haEnabled" :disabled="clusterForm.id" />
              </el-form-item>
              <el-form-item v-if="clusterForm.haEnabled" label="ZK命名空间">
                <template #label>
                  <span>
                    ZK命名空间
                    <el-tooltip placement="top" effect="light">
                      <template #content>
                        <div style="max-width: 400px; line-height: 1.6;">
                          <p style="margin: 0 0 8px 0; font-weight: 600;">作用说明：</p>
                          <p style="margin: 0 0 8px 0;">
                            ZooKeeper命名空间用于隔离Flink集群的元数据存储，类似于一个独立的目录。
                          </p>
                          <p style="margin: 0 0 8px 0; font-weight: 600;">主要用途：</p>
                          <ul style="margin: 0; padding-left: 20px;">
                            <li>存储JobManager状态和检查点信息</li>
                            <li>实现多集群数据隔离（支持在同一个ZooKeeper集群上部署多个Flink集群）</li>
                            <li>区分不同环境（生产、测试、开发）的集群</li>
                          </ul>
                          <p style="margin: 8px 0 0 0; font-weight: 600;">示例：</p>
                          <p style="margin: 0; font-family: monospace; background: #f5f5f5; padding: 4px; border-radius: 3px;">
                            /flink/production<br />
                            /flink/test-cluster-1<br />
                            /my-flink-cluster
                          </p>
                        </div>
                      </template>
                      <el-icon style="margin-left: 4px; cursor: help; color: var(--el-color-primary);">
                        <QuestionFilled />
                      </el-icon>
                    </el-tooltip>
                  </span>
                </template>
                <el-input v-model="clusterForm.zkNamespace" placeholder="例如：/flink/production" :disabled="clusterForm.id" />
              </el-form-item>
              <el-form-item label="最大并行度">
                <el-input-number v-model="clusterForm.maxParallelism" :min="1" style="width: 100%" :disabled="clusterForm.id && clusterForm.type === 'remote'" />
              </el-form-item>
            </el-form>
          </template>
          <template v-else>
            <!-- Yarn集群配置 -->
            <el-form ref="yarnFormRef" :model="clusterForm" :rules="yarnFormRules" label-width="120px">
              <el-form-item label="Flink版本" prop="flinkVersion">
                <el-select v-model="clusterForm.flinkVersion" placeholder="请选择Flink版本">
                  <el-option
                    v-for="version in flinkVersions"
                    :key="version"
                    :label="version"
                    :value="version"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="Hadoop版本">
                <el-input v-model="clusterForm.hadoopVersion" placeholder="请输入Hadoop版本" />
              </el-form-item>
              <el-form-item label="Yarn地址" prop="yarnUrl">
                <el-input v-model="clusterForm.yarnUrl" placeholder="例如：http://10.1.1.100:8088" />
              </el-form-item>
              <el-form-item label="队列名称" prop="queueName">
                <el-input v-model="clusterForm.queueName" placeholder="默认：default" />
              </el-form-item>
              <el-form-item label="部署模式" prop="deployMode">
                <el-select v-model="clusterForm.deployMode" placeholder="请选择部署模式">
                  <el-option label="Session" value="session" />
                  <el-option label="Per-Job" value="per-job" />
                  <el-option label="Application" value="application" />
                </el-select>
              </el-form-item>
              <el-form-item label="内存(MB)">
                <el-input-number v-model="clusterForm.memoryMB" :min="1024" :step="1024" style="width: 100%" />
              </el-form-item>
              <el-form-item label="CPU核心数">
                <el-input-number v-model="clusterForm.vcores" :min="1" style="width: 100%" />
              </el-form-item>
              <el-form-item label="最大并行度">
                <el-input-number v-model="clusterForm.maxParallelism" :min="1" style="width: 100%" />
              </el-form-item>
            </el-form>
          </template>
        </el-tab-pane>

        <el-tab-pane label="高级配置" name="advanced">
          <el-form ref="advancedFormRef" :model="clusterForm" label-width="120px">
            <el-form-item label="连接超时(ms)">
              <el-input-number v-model="clusterForm.connectTimeout" :min="1000" :step="1000" style="width: 100%" />
            </el-form-item>
            <el-form-item label="心跳间隔(秒)">
              <el-input-number v-model="clusterForm.heartbeatInterval" :min="10" :step="10" style="width: 100%" />
            </el-form-item>
            <el-form-item label="关联项目">
              <el-select
                v-model="clusterForm.projects"
                multiple
                filterable
                allow-create
                default-first-option
                placeholder="请选择或输入关联项目"
              >
                <el-option
                  v-for="project in commonProjects"
                  :key="project"
                  :label="project"
                  :value="project"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="自定义配置">
              <el-input
                v-model="clusterForm.customConfig"
                type="textarea"
                :rows="4"
                placeholder="请输入JSON格式的自定义配置"
              />
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button icon="Connection" @click="handleTestCurrentConnection">
            测试连接
          </el-button>
          <el-button
            v-if="clusterForm.type === 'yarn' || !clusterForm.id"
            type="primary"
            :loading="saveLoading"
            @click="handleSaveCluster"
          >
            保存
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 集群详情对话框 -->
    <el-dialog v-model="detailVisible" title="集群详情" width="700px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="集群名称">{{ detailCluster.name }}</el-descriptions-item>
        <el-descriptions-item label="集群类型">
          <el-tag>{{ getClusterTypeName(detailCluster.type) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="集群状态">
          <el-tag :type="getStatusTag(detailCluster.status)">{{ getStatusText(detailCluster.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="负责人">{{ detailCluster.owner || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建人">{{ detailCluster.creator }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDate(detailCluster.createTime) }}</el-descriptions-item>
        <el-descriptions-item label="最后连接">{{ formatDate(detailCluster.lastConnectedTime) || '-' }}</el-descriptions-item>
        <template v-if="detailCluster.type === 'remote'">
          <el-descriptions-item label="Flink版本">{{ detailCluster.flinkVersion || '-' }}</el-descriptions-item>
          <el-descriptions-item label="远程地址" :span="2">{{ detailCluster.remoteUrl || '-' }}</el-descriptions-item>
          <el-descriptions-item label="Web UI地址" :span="2">
            <a v-if="detailCluster.webUiUrl" :href="detailCluster.webUiUrl" target="_blank">{{ detailCluster.webUiUrl }}</a>
            <span v-else>-</span>
          </el-descriptions-item>
        </template>
        <template v-else>
          <el-descriptions-item label="Flink版本">{{ detailCluster.flinkVersion || '-' }}</el-descriptions-item>
          <el-descriptions-item label="Hadoop版本">{{ detailCluster.hadoopVersion || '-' }}</el-descriptions-item>
          <el-descriptions-item label="Yarn地址" :span="2">{{ detailCluster.yarnUrl || '-' }}</el-descriptions-item>
          <el-descriptions-item label="队列名称">{{ detailCluster.queueName || 'default' }}</el-descriptions-item>
          <el-descriptions-item label="部署模式">{{ detailCluster.deployMode || '-' }}</el-descriptions-item>
          <el-descriptions-item label="内存(MB)">{{ detailCluster.memoryMB || '-' }}</el-descriptions-item>
          <el-descriptions-item label="CPU核心">{{ detailCluster.vcores || '-' }}</el-descriptions-item>
        </template>
        <el-descriptions-item label="最大并行度">{{ detailCluster.maxParallelism || '-' }}</el-descriptions-item>
        <el-descriptions-item label="集群描述" :span="2">{{ detailCluster.description || '-' }}</el-descriptions-item>
        <el-descriptions-item label="标签" :span="2">
          <el-tag v-for="tag in detailCluster.tags" :key="tag" class="mr-5px">{{ tag }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="关联项目" :span="2">
          <el-tag v-for="project in detailCluster.projects" :key="project" class="mr-5px">{{ project }}</el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { QuestionFilled } from '@element-plus/icons-vue'
import { Icon } from '@/components/Icon'
import type {
  FlinkCluster,
  ClusterType,
  ClusterStatus,
  ClusterQueryParams,
  ClusterStatistics
} from '@/api/dataStudio/flinkCluster'
import { flinkClusterApi } from '@/api/dataStudio/flinkCluster'
import { dateFormatter, formatDate } from '@/utils/formatTime'

// 对话框显示状态
const dialogVisible = ref(false)
const detailVisible = ref(false)
const saveLoading = ref(false)
const loading = ref(false)
const activeTab = ref('basic')

// 选中的集群
const selectedCluster = ref<FlinkCluster | null>(null)

// 集群列表
const clusterList = ref<FlinkCluster[]>([])

// 详情集群
const detailCluster = reactive<FlinkCluster>({} as FlinkCluster)

// 表单实例
const formRef = ref<FormInstance>()

// 搜索表单
const searchForm = reactive<ClusterQueryParams>({
  keyword: '',
  type: undefined,
  status: undefined
})

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

// 统计信息
const statistics = reactive<ClusterStatistics>({
  total: 0,
  remoteCount: 0,
  yarnCount: 0,
  runningCount: 0,
  stoppedCount: 0,
  availableCount: 0,
  unavailableCount: 0,
  byProject: {}
})

// 集群类型列表
const clusterTypes = ref([
  { value: 'remote', label: '远程集群', editable: false },
  { value: 'yarn', label: 'Flink on Yarn', editable: true }
])

// Flink版本列表
const flinkVersions = ref<string[]>(['1.12', '1.13', '1.14', '1.15', '1.16', '1.17', '1.18', '1.19'])

// 常用标签
const commonTags = ref(['生产', '测试', '开发', '核心', '备份'])

// 常用项目
const commonProjects = ref(['推荐系统', '实时数仓', '算法测试', '日志分析'])

// 集群表单
const clusterForm = reactive<FlinkCluster>({
  name: '',
  type: 'remote',
  status: 'stopped',
  description: '',
  tags: [],
  owner: '',
  flinkVersion: '',
  remoteUrl: '',
  webUiUrl: '',
  haEnabled: false,
  zkNamespace: '',
  yarnUrl: '',
  queueName: 'default',
  deployMode: 'session',
  hadoopVersion: '',
  memoryMB: undefined,
  vcores: undefined,
  maxParallelism: undefined,
  connectTimeout: 30000,
  heartbeatInterval: 60,
  customConfig: '',
  projects: []
})

// 表单验证规则
const formRules: FormRules = {
  name: [
    { required: true, message: '请输入集群名称', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择集群类型', trigger: 'change' }
  ]
}

// 远程集群表单规则
const remoteFormRules: FormRules = {
  flinkVersion: [
    { required: true, message: '请选择Flink版本', trigger: 'change' }
  ],
  remoteUrl: [
    { required: true, message: '请输入远程地址', trigger: 'blur' }
  ]
}

// Yarn集群表单规则
const yarnFormRules: FormRules = {
  flinkVersion: [
    { required: true, message: '请选择Flink版本', trigger: 'change' }
  ],
  yarnUrl: [
    { required: true, message: '请输入Yarn地址', trigger: 'blur' }
  ],
  queueName: [
    { required: true, message: '请输入队列名称', trigger: 'blur' }
  ],
  deployMode: [
    { required: true, message: '请选择部署模式', trigger: 'change' }
  ]
}

// 初始化
onMounted(() => {
  loadClusterList()
  loadStatistics()
})

// 加载集群列表
const loadClusterList = async () => {
  loading.value = true
  try {
    const response = await flinkClusterApi.getList({
      ...searchForm,
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    // 响应拦截器已处理数据，直接使用
    clusterList.value = response?.list || []
    pagination.total = response?.total || 0
  } catch (error: any) {
    console.error('加载集群列表失败', error)
    ElMessage.error(error.message || '加载集群列表失败')
    // 出错时重置数据
    clusterList.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

// 加载统计信息
const loadStatistics = async () => {
  try {
    const stats = await flinkClusterApi.getStatistics()
    // 响应拦截器已处理数据，直接使用
    const statsData = stats || {}
    Object.assign(statistics, {
      total: 0,
      remoteCount: 0,
      yarnCount: 0,
      runningCount: 0,
      stoppedCount: 0,
      availableCount: 0,
      unavailableCount: 0,
      byProject: {},
      ...statsData
    })
  } catch (error: any) {
    console.error('加载统计信息失败', error)
    // 出错时重置统计数据
    Object.assign(statistics, {
      total: 0,
      remoteCount: 0,
      yarnCount: 0,
      runningCount: 0,
      stoppedCount: 0,
      availableCount: 0,
      unavailableCount: 0,
      byProject: {}
    })
  }
}

// 处理表格选择
const handleSelectionChange = (selection: FlinkCluster[]) => {
  selectedCluster.value = selection.length > 0 ? selection[0] : null
}

// 新建集群
const handleCreateCluster = () => {
  resetForm()
  clusterForm.type = 'remote'
  activeTab.value = 'basic'
  dialogVisible.value = true
}

// 编辑集群
const handleEditCluster = (row: FlinkCluster) => {
  Object.assign(clusterForm, row)
  activeTab.value = 'basic'
  dialogVisible.value = true
}

// 查看详情
const handleViewDetail = async (row: FlinkCluster) => {
  try {
    const detail = await flinkClusterApi.getDetail(row.id!)
    // 响应拦截器已处理数据，直接使用
    Object.assign(detailCluster, detail || {})
    detailVisible.value = true
  } catch (error: any) {
    console.error('加载集群详情失败', error)
    ElMessage.error(error.message || '加载集群详情失败')
  }
}

// 删除集群
const handleDeleteCluster = async (row: FlinkCluster) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除集群 "${row.name}" 吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await flinkClusterApi.delete(row.id!)
    ElMessage.success('删除成功')
    loadClusterList()
    loadStatistics()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// 测试连接
const handleTestConnection = async () => {
  if (!selectedCluster.value) {
    ElMessage.warning('请选择要测试的集群')
    return
  }
  await testSingleConnection(selectedCluster.value)
}

// 测试单个集群
const handleTestSingleConnection = async (row: FlinkCluster) => {
  await testSingleConnection(row)
}

// 测试当前表单连接
const handleTestCurrentConnection = async () => {
  if (!clusterForm.id) {
    // 新建时测试，使用 testForm 接口
    try {
      ElMessage.info('正在测试连接...')
      const result = await flinkClusterApi.testForm(clusterForm)
      if (result.connected) {
        ElMessage.success(`连接测试成功！响应时间：${result.responseTime}ms`)
      } else {
        ElMessage.error(result.lastMessage || '连接测试失败')
      }
    } catch (error: any) {
      ElMessage.error(error.message || '连接测试失败')
    }
    return
  }
  await testSingleConnection(clusterForm)
}

// 处理下拉菜单命令
const handleCommand = async (command: string, row: FlinkCluster) => {
  switch (command) {
    case 'view':
      handleViewDetail(row)
      break
    case 'edit':
      handleEditCluster(row)
      break
    case 'test':
      await handleTestSingleConnection(row)
      break
    case 'refresh':
      await handleRefreshStatus(row)
      break
    case 'copy':
      handleCopyCluster(row)
      break
    case 'delete':
      await handleDeleteCluster(row)
      break
  }
}

// 测试连接通用方法
const testSingleConnection = async (cluster: FlinkCluster) => {
  try {
    ElMessage.info('正在测试连接...')
    const result = await flinkClusterApi.testConnection(cluster.id!)
    // 响应拦截器已处理数据，直接使用
    const data = result || {}
    if (data.connected) {
      ElMessage.success(`连接成功！响应时间：${data.responseTime}ms`)
      // 注意：后端现在会自动更新状态和心跳检测
    } else {
      ElMessage.error(data.lastMessage || '连接测试失败')
    }
    loadClusterList()
  } catch (error: any) {
    console.error('连接测试失败', error)
    ElMessage.error(error.message || '连接测试失败')
  }
}

// 刷新状态
const handleRefreshStatus = async (row: FlinkCluster) => {
  try {
    const result = await flinkClusterApi.refreshStatus(row.id!)
    // 防御性编程：检查数据结构
    ElMessage.success('状态刷新成功')
    loadClusterList()
  } catch (error: any) {
    console.error('状态刷新失败', error)
    ElMessage.error(error.message || '状态刷新失败')
  }
}

// 复制集群
const handleCopyCluster = (row: FlinkCluster) => {
  resetForm()
  Object.assign(clusterForm, row, {
    id: undefined,
    name: `${row.name}-副本`,
    createTime: undefined
  })
  activeTab.value = 'basic'
  dialogVisible.value = true
}

// 保存集群
const handleSaveCluster = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    saveLoading.value = true
    try {
      let savedCluster
      if (clusterForm.id) {
        // 更新
        await flinkClusterApi.update(clusterForm)
        ElMessage.success('更新成功')
      } else {
        // 创建
        savedCluster = await flinkClusterApi.create(clusterForm)
        ElMessage.success('创建成功')
        // 注意：后端现在会自动异步测试连接，前端无需再次测试
      }
      dialogVisible.value = false
      loadClusterList()
      loadStatistics()
    } catch (error: any) {
      ElMessage.error(error.message || '保存失败')
    } finally {
      saveLoading.value = false
    }
  })
}

// 关闭对话框
const handleCloseDialog = () => {
  formRef.value?.clearValidate()
  resetForm()
}

// 重置表单
const resetForm = () => {
  Object.assign(clusterForm, {
    id: undefined,
    name: '',
    type: 'remote',
    status: 'stopped',
    description: '',
    tags: [],
    owner: '',
    flinkVersion: '',
    remoteUrl: '',
    webUiUrl: '',
    haEnabled: false,
    zkNamespace: '',
    yarnUrl: '',
    queueName: 'default',
    deployMode: 'session',
    hadoopVersion: '',
    memoryMB: undefined,
    vcores: undefined,
    maxParallelism: undefined,
    connectTimeout: 30000,
    heartbeatInterval: 60,
    customConfig: '',
    projects: []
  })
}

// 集群类型改变
const handleTypeChange = (type: ClusterType) => {
  if (type === 'remote') {
    clusterForm.remoteUrl = ''
    clusterForm.webUiUrl = ''
  } else {
    clusterForm.yarnUrl = ''
    clusterForm.queueName = 'default'
    clusterForm.deployMode = 'session'
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadClusterList()
}

// 重置
const handleReset = () => {
  Object.assign(searchForm, {
    keyword: '',
    type: undefined,
    status: undefined
  })
  pagination.page = 1
  loadClusterList()
}

// 分页大小改变
const handlePageSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  loadClusterList()
}

// 页码改变
const handlePageChange = (page: number) => {
  pagination.page = page
  loadClusterList()
}

// 获取集群类型名称
const getClusterTypeName = (type: ClusterType) => {
  const typeMap: Record<ClusterType, string> = {
    remote: '远程集群',
    yarn: 'Flink on Yarn'
  }
  return typeMap[type] || type
}

// 获取集群类型标签
const getClusterTypeTag = (type: ClusterType) => {
  const typeMap: Record<ClusterType, '' | 'success' | 'warning' | 'info' | 'danger'> = {
    remote: 'success',
    yarn: 'warning'
  }
  return typeMap[type] || 'info'
}

// 获取状态文本
const getStatusText = (status: ClusterStatus) => {
  const statusMap: Record<ClusterStatus, string> = {
    running: '运行中',
    stopped: '已关闭',
    available: '可用',
    unavailable: '不可用'
  }
  return statusMap[status] || status
}

// 获取状态标签
const getStatusTag = (status: ClusterStatus) => {
  const statusMap: Record<ClusterStatus, '' | 'success' | 'warning' | 'info' | 'danger'> = {
    running: 'success',
    stopped: 'info',
    available: 'success',
    unavailable: 'danger'
  }
  return statusMap[status] || 'info'
}
</script>

<style lang="scss" scoped>
.v-flink-cluster-management {
  padding: 24px;
  height: 100%;
  overflow-y: auto;

  &__header {
    margin-bottom: 24px;

    h2 {
      margin: 0 0 8px 0;
      color: var(--el-text-color-primary);
      font-size: 20px;
      font-weight: 600;
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
    flex-wrap: wrap;
  }

  &__filter {
    margin-bottom: 16px;
    padding: 16px;
    background: var(--el-bg-color);
    border-radius: 6px;
  }

  &__stats {
    margin-bottom: 16px;

    .stat-card {
      .stat-content {
        text-align: center;

        .stat-number {
          font-size: 32px;
          font-weight: 700;
          color: var(--el-color-primary);
          margin-bottom: 8px;
        }

        .stat-label {
          font-size: 14px;
          color: var(--el-text-color-secondary);
        }
      }
    }
  }

  &__content {
    background: var(--el-bg-color);
    border-radius: 6px;
    padding: 16px;
  }
}

.pagination-container {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.dialog-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.mr-5px {
  margin-right: 5px;
}

.text-danger {
  color: var(--el-color-danger);
}
</style>
