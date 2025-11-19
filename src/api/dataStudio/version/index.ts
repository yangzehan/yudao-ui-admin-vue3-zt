import request from '@/config/axios'

export interface VersionItem {
  id: number
  sqlEditId: number
  versionNumber: number
  versionType: string
  remark?: string
  createTime: string
  creator: string
}

export interface VersionDetail extends VersionItem {
  content: string
  config: any
}

export interface VersionListReq {
  sqlEditId: number
  pageSize?: number
  current?: number
}

export interface VersionListResp {
  list: VersionItem[]
  total: number
}

// 获取版本列表
export const getVersionList = (params: VersionListReq) => {
  return request.get<VersionListResp>({
    url: '/sql-edit-version/list',
    params
  })
}

// 获取版本详情
export const getVersionDetail = (id: number) => {
  return request.get<VersionDetail>({
    url: `/sql-edit-version/${id}`
  })
}

// 回退版本
export const rollbackVersion = (id: number) => {
  return request.post({
    url: `/sql-edit-version/rollback/${id}`
  })
}

// 删除版本
export const deleteVersion = (id: number) => {
  return request.delete({
    url: `/sql-edit-version/${id}`
  })
}
