import request from '@/config/axios'

export interface DataIngestionVO {
  id?: number
  name: string
  type: 'folder' | 'yaml' | 'file'
  parentId?: number
  filePath?: string
  content?: string
  sort?: number
  fileSize?: number
  status?: number
  createTime?: Date
  updateTime?: Date
  children?: DataIngestionVO[]
}

export interface DataIngestionListReqVO {
  keyword?: string
  type?: string
  parentId?: number
}

export interface DataIngestionSaveReqVO {
  id?: number
  name: string
  type: 'folder' | 'yaml' | 'file'
  parentId?: number
  filePath?: string
  content?: string
  sort?: number
  status?: number
}

// ==================== 数据摄取 API ====================

// 获取文件树形结构
export const getDataIngestionTree = (): Promise<DataIngestionVO[]> => {
  return request.get({ url: '/data-ingestion/tree' })
}

// 获取指定目录下的子文件列表
export const getDataIngestionChildren = (parentId: number): Promise<DataIngestionVO[]> => {
  return request.get({ url: '/data-ingestion/children', params: { parentId } })
}

// 搜索文件
export const searchDataIngestionFiles = (keyword: string): Promise<DataIngestionVO[]> => {
  return request.get({ url: '/data-ingestion/search', params: { keyword } })
}

// 获取文件列表（筛选）
export const getDataIngestionList = (params?: DataIngestionListReqVO): Promise<DataIngestionVO[]> => {
  return request.get({ url: '/data-ingestion/list', params })
}

// 获取文件详情
export const getDataIngestion = (id: number): Promise<DataIngestionVO> => {
  return request.get({ url: '/data-ingestion/get', params: { id } })
}

// 创建文件/文件夹
export const createDataIngestion = (data: DataIngestionSaveReqVO): Promise<number> => {
  return request.post({ url: '/data-ingestion/create', data })
}

// 更新文件
export const updateDataIngestion = (data: DataIngestionSaveReqVO): Promise<boolean> => {
  return request.put({ url: '/data-ingestion/update', data })
}

// 删除文件
export const deleteDataIngestion = async (id: number): Promise<boolean> => {
  return await request.delete({ url: '/data-ingestion/delete', params: { id } })
}

// 批量删除文件
export const deleteDataIngestionList = async (ids: number[]): Promise<boolean> => {
  return await request.delete({ url: '/data-ingestion/delete-list', params: { ids: ids.join(',') } })
}

// 移动文件
export const moveDataIngestion = async (id: number, targetParentId: number): Promise<boolean> => {
  return await request.post({ url: '/data-ingestion/move', params: { id, targetParentId } })
}

// 重命名文件
export const renameDataIngestion = async (id: number, name: string): Promise<boolean> => {
  return await request.post({ url: '/data-ingestion/rename', params: { id, name } })
}

// 保存文件内容
export const saveDataIngestionContent = async (id: number, content: string): Promise<boolean> => {
  return await request.post({ url: '/data-ingestion/save-content', params: { id, content } })
}

// 获取文件内容
export const getDataIngestionContent = (id: number): Promise<string> => {
  return request.get({ url: '/data-ingestion/get-content', params: { id } })
}

// ==================== 工具方法 ====================

// 根据类型获取图标名称
export const getDataIngestionIcon = (type: string): string => {
  const iconMap = {
    folder: 'FolderOpened',
    yaml: 'Document',
    file: 'FileText'
  }
  return iconMap[type as keyof typeof iconMap] || 'FileText'
}

// 生成文件路径
export const generateDataIngestionPath = (parentPath: string, fileName: string): string => {
  return parentPath.endsWith('/') ? `${parentPath}${fileName}` : `${parentPath}/${fileName}`
}

// 文件类型检测
export const getDataIngestionFileType = (fileName: string): 'yaml' | 'file' => {
  const yamlExtensions = ['.yaml', '.yml']
  const ext = fileName.substring(fileName.lastIndexOf('.'))
  if (yamlExtensions.includes(ext)) {
    return 'yaml'
  }
  return 'file'
}
