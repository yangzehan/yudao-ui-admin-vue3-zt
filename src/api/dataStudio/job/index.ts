import request from '@/config/axios'

// 作业管理
export interface Job {
  id?: number
  jobId: string
  jobName: string
  jobType: string
  status: string
  executionMode?: string
  flinkVersion?: string
  parallelism?: number
  checkpointInterval?: number
  clusterId?: number
  clusterName?: string
  fileId?: number
  config?: Record<string, string>
  errorMessage?: string
  webUiUrl?: string
  deployMode?: string
  submitTime?: string
  startTime?: string
  endTime?: string
  duration?: number
}

// 作业状态统计
export interface JobStatistics {
  totalCount: number
  runningCount: number
  successCount: number
  failedCount: number
  pendingCount: number
  cancelledCount: number
}

// 分页查询参数
export interface JobPageParams {
  jobName?: string
  status?: string
  executionMode?: string
  pageNo?: number
  pageSize?: number
}

// 作业API
export const jobApi = {
  // 获取作业列表
  getList(params?: {
    jobName?: string
    status?: string
    executionMode?: string
  }) {
    return request.get<Job[]>({ url: '/data-studio/job/list', params })
  },

  // 获取作业分页
  getPage(params?: JobPageParams) {
    return request.get({ url: '/data-studio/job/page', params })
  },

  // 获取作业详情
  get(id: number) {
    return request.get<Job>({ url: `/data-studio/job/get?id=${id}` })
  },

  // 根据Flink作业ID获取作业
  getByFlinkJobId(flinkJobId: string) {
    return request.get<Job>({ url: `/data-studio/job/get-by-job-id?flinkJobId=${flinkJobId}` })
  },

  // 获取最近的作业执行记录
  getRecent(limit?: number) {
    return request.get<Job[]>({ url: '/data-studio/job/recent', params: { limit } })
  },

  // 创建作业
  create(data: Job) {
    return request.post<number>({ url: '/data-studio/job/create', data })
  },

  // 更新作业
  update(data: Job) {
    return request.put<boolean>({ url: '/data-studio/job/update', data })
  },

  // 删除作业
  delete(id: number) {
    return request.delete<boolean>({ url: `/data-studio/job/delete?id=${id}` })
  },

  // 批量删除作业
  deleteList(ids: number[]) {
    return request.delete<boolean>({ url: '/data-studio/job/delete-list', params: { ids } })
  },

  // 启动作业
  start(id: number) {
    return request.post<boolean>({ url: `/data-studio/job/start?id=${id}` })
  },

  // 停止作业
  stop(id: number) {
    return request.post<boolean>({ url: `/data-studio/job/stop?id=${id}` })
  },

  // 获取作业状态统计
  getStatistics() {
    return request.get<JobStatistics>({ url: '/data-studio/job/statistics' })
  },

  // 部署作业
  deploy(data: {
    taskType: string
    executionMode: string
    flinkVersion: string
    parallelism: number
    taskId?: number
    jarFile?: string
    entryPointClassName?: string
    jobName?: string
    arguments?: string[]
  }) {
    return request.post<boolean>({ url: '/data-studio/job/deploy', data })
  }
}
