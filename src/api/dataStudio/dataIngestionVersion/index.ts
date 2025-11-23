import request from '@/config/axios'

export interface ConfigInfo {
  type?: string
  parentId?: number
  filePath?: string
  sort?: number
  fileSize?: number
  status?: number
  // Flink任务配置字段
  executionMode?: string
  flinkVersion?: string
  parallelism?: number
  checkpointInterval?: number
}

export interface VersionItem {
  id: number
  dataIngestionId: number
  versionNumber: number
  versionType: string
  remark?: string
  createTime: string
  creator: string
}

export interface VersionDetail extends VersionItem {
  content: string
  config?: ConfigInfo
}

export interface VersionListReq {
  dataIngestionId: number
  pageSize?: number
  current?: number
}

export interface VersionListResp {
  list: VersionItem[]
  total: number
}

// ==================== 数据摄取版本 API ====================

// 获取版本列表
export const getVersionList = (params: VersionListReq) => {
  return request.get<VersionListResp>({
    url: '/data-ingestion-version/list',
    params
  })
}

// 获取版本详情
export const getVersionDetail = (id: number) => {
  return request.get<VersionDetail>({
    url: `/data-ingestion-version/${id}`
  })
}

// 回退版本
export const rollbackVersion = (id: number) => {
  return request.post({
    url: `/data-ingestion-version/rollback/${id}`
  })
}

// 删除版本
export const deleteVersion = (id: number) => {
  return request.delete({
    url: `/data-ingestion-version/${id}`
  })
}

// 创建版本
export const createVersion = (data: {
  dataIngestionId: number
  content: string
  config?: ConfigInfo
  remark?: string
  versionType: string
}) => {
  return request.post<number>({
    url: '/data-ingestion-version/create',
    data
  })
}
