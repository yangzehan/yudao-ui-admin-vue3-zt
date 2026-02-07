import request from '@/config/axios'

export interface ResourceVO {
  id?: number
  name: string
  path?: string
  size: number
  description?: string
  fileUrl?: string
  createTime?: Date
}

export interface ResourcePageReqVO {
  name?: string
  description?: string
}

// ==================== 资源管理 API ====================

// 上传资源
export const uploadResource = (data: FormData): Promise<number> => {
  return request.upload({ url: '/datastudio/resource/upload', data })
}

// 获取资源分页
export const getResourcePage = (params: ResourcePageReqVO): Promise<PageResult<ResourceVO>> => {
  return request.get({ url: '/datastudio/resource/page', params })
}

// 获取资源列表
export const getResourceList = (name?: string): Promise<ResourceVO[]> => {
  return request.get({ url: '/datastudio/resource/list', params: { name } })
}

// 获取资源详情
export const getResource = (id: number): Promise<ResourceVO> => {
  return request.get({ url: '/datastudio/resource/get', params: { id } })
}

// 删除资源
export const deleteResource = (id: number): Promise<boolean> => {
  return request.delete({ url: '/datastudio/resource/delete', params: { id } })
}

// 批量删除资源
export const deleteResourceList = (ids: number[]): Promise<boolean> => {
  return request.delete({ url: '/datastudio/resource/delete-list', params: { ids: ids.join(',') } })
}
