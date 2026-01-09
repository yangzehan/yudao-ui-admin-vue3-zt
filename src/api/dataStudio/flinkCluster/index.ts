import request from '@/config/axios'

// 集群类型枚举
export enum ClusterType {
  REMOTE = 'remote',
  YARN = 'yarn'
}

// 集群状态枚举
export enum ClusterStatus {
  RUNNING = 'running',
  STOPPED = 'stopped',
  AVAILABLE = 'available',
  UNAVAILABLE = 'unavailable'
}

// 部署模式枚举
export enum DeployMode {
  SESSION = 'session',
  PER_JOB = 'per-job',
  APPLICATION = 'application'
}

// 集群类型定义
export interface FlinkCluster {
  // 基础字段
  id?: number
  name: string
  type: ClusterType
  status: ClusterStatus
  description?: string
  tags?: string[]

  // 创建信息
  creator?: string
  createTime?: string
  owner?: string

  // 远程集群特有字段
  flinkVersion?: string
  remoteUrl?: string
  webUiUrl?: string
  haEnabled?: boolean
  zkNamespace?: string

  // Yarn集群特有字段
  queueName?: string
  deployMode?: DeployMode
  yarnSitePath?: string
  hdfsSitePath?: string
  coreSitePath?: string
  yarnProvidedLibDirs?: string
  yarnProvidedUsrLibDir?: string
  yarnFlinkDistJar?: string
  yarnAppLogConfigPath?: string

  // 资源信息
  jobmanagerMemoryProcessSize?: number
  taskmanagerMemoryProcessSize?: number
  taskmanagerNumberOfTaskSlots?: number
  vcores?: number
  maxParallelism?: number

  // 连接配置
  connectTimeout?: number
  heartbeatInterval?: number

  // 监控信息
  lastConnectedTime?: string
  jobCount?: number

  // 扩展配置
  alertConfig?: string
  customConfig?: string
  projects?: string[]
}

// 查询参数
export interface ClusterQueryParams {
  type?: ClusterType
  status?: ClusterStatus
  keyword?: string
  page?: number
  pageSize?: number
}

// 连接测试结果
export interface ConnectionTestResult {
  connected: boolean
  responseTime: number
  flinkVersion?: string
  jobManagerUrl?: string
  lastMessage: string
}

// 刷新状态结果
export interface RefreshStatusResult {
  id: number
  status: ClusterStatus
  lastConnectedTime: string
  jobCount: number
}

// 集群类型选项
export interface ClusterTypeOption {
  value: ClusterType
  label: string
  editable: boolean
}

// 统计信息
export interface ClusterStatistics {
  total: number
  remoteCount: number
  yarnCount: number
  runningCount: number
  stoppedCount: number
  availableCount: number
  unavailableCount: number
  byProject: Record<string, number>
}

// Flink版本列表
export interface FlinkVersionOption {
  value: string
  label: string
}

// API 方法
export const flinkClusterApi = {
  /**
   * 获取集群列表（分页）
   * @param params 查询参数
   * @returns 集群列表和分页信息
   */
  getList(params?: ClusterQueryParams) {
    return request.get<{
      list: FlinkCluster[]
      total: number
    }>({ url: '/data-studio/flink-cluster/page', params })
  },

  /**
   * 获取集群详情
   * @param id 集群ID
   * @returns 集群详情
   */
  getDetail(id: number) {
    return request.get<FlinkCluster>({
      url: `/data-studio/flink-cluster/detail/${id}`
    })
  },

  /**
   * 创建集群
   * @param data 集群数据
   * @returns 创建的集群
   */
  create(data: FlinkCluster) {
    return request.post<FlinkCluster>({
      url: '/data-studio/flink-cluster/create',
      data
    })
  },

  /**
   * 更新集群
   * @param data 集群数据
   * @returns 更新后的集群
   */
  update(data: FlinkCluster) {
    return request.put<FlinkCluster>({
      url: '/data-studio/flink-cluster/update',
      data
    })
  },

  /**
   * 删除集群
   * @param id 集群ID
   * @returns 删除结果
   */
  delete(id: number) {
    return request.delete({
      url: '/data-studio/flink-cluster/delete',
      params: { id }
    })
  },

  /**
   * 批量删除集群
   * @param ids 集群ID列表
   * @returns 删除结果
   */
  batchDelete(ids: number[]) {
    return request.post<{
      successCount: number
      failCount: number
    }>({
      url: '/data-studio/flink-cluster/batch-delete',
      data: { ids }
    })
  },

  /**
   * 测试集群连接
   * @param id 集群ID
   * @returns 连接测试结果
   */
  testConnection(id: number) {
    return request.post<ConnectionTestResult>({
      url: '/data-studio/flink-cluster/test-connection',
      params: { id }
    })
  },

  /**
   * 测试集群配置（不保存到数据库）
   * @param data 集群配置数据
   * @returns 连接测试结果
   */
  testForm(data: FlinkCluster) {
    return request.post<ConnectionTestResult>({
      url: '/data-studio/flink-cluster/test-form',
      data
    })
  },

  /**
   * 刷新集群状态
   * @param id 集群ID
   * @returns 刷新后的状态
   */
  refreshStatus(id: number) {
    return request.post<RefreshStatusResult>({
      url: '/data-studio/flink-cluster/refresh-status',
      params: { id }
    })
  },

  /**
   * 获取集群类型列表
   * @returns 集群类型选项
   */
  getTypes() {
    return request.get<ClusterTypeOption[]>({
      url: '/data-studio/flink-cluster/types'
    })
  },

  /**
   * 获取Flink版本列表
   * @returns Flink版本列表
   */
  getFlinkVersions() {
    return request.get<string[]>({
      url: '/data-studio/flink-cluster/flink-versions'
    })
  },

  /**
   * 获取集群统计信息
   * @returns 统计信息
   */
  getStatistics() {
    return request.get<ClusterStatistics>({
      url: '/data-studio/flink-cluster/statistics'
    })
  },

  /**
   * 导出集群配置
   * @param params 导出参数
   * @returns 文件流
   */
  export(params?: { ids?: string; format?: 'json' | 'xlsx' }) {
    return request.get({
      url: '/data-studio/flink-cluster/export',
      params,
      responseType: 'blob'
    })
  },

  /**
   * 导入集群配置
   * @param file 导入文件
   * @returns 导入结果
   */
  import(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return request.post<{
      successCount: number
      failCount: number
      failList: string[]
    }>({
      url: '/data-studio/flink-cluster/import',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
}
