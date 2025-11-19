import request from '@/config/axios'

export interface FileManageVO {
  id?: number
  name: string
  type: 'folder' | 'sql' | 'yaml' | 'file'
  parentId?: number
  filePath?: string
  content?: string
  sort?: number
  fileSize?: number
  status?: number
  createTime?: Date
  updateTime?: Date
  children?: FileManageVO[]
}

export interface FileManageListReqVO {
  keyword?: string
  type?: string
  parentId?: number
}

export interface FlinkConfig {
  executionMode?: string
  flinkVersion?: string
  parallelism?: number
  checkpointInterval?: number
  extendedConfig?: Record<string, any>
}

export interface FileManageSaveReqVO {
  id?: number
  name: string
  type: 'folder' | 'sql' | 'yaml' | 'file'
  parentId?: number
  filePath?: string
  content?: string
  config?: FlinkConfig
  sort?: number
  status?: number
}

// ==================== 文件管理 API ====================

// 获取文件树形结构
export const getFileTree = (): Promise<FileManageVO[]> => {
  return request.get({ url: '/sql-edit/tree' })
}

// 获取指定目录下的子文件列表
export const getFilesByParentId = (parentId: number): Promise<FileManageVO[]> => {
  return request.get({ url: '/sql-edit/children', params: { parentId } })
}

// 搜索文件
export const searchFiles = (keyword: string): Promise<FileManageVO[]> => {
  return request.get({ url: '/sql-edit/search', params: { keyword } })
}

// 获取文件列表（筛选）
export const getFileList = (params?: FileManageListReqVO): Promise<FileManageVO[]> => {
  return request.get({ url: '/sql-edit/list', params })
}

// 获取文件详情
export const getFile = (id: number): Promise<FileManageVO> => {
  return request.get({ url: '/sql-edit/get', params: { id } })
}

// 创建文件/文件夹
export const createFile = (data: FileManageSaveReqVO): Promise<number> => {
  return request.post({ url: '/sql-edit/create', data })
}

// 更新文件
export const updateFile = (data: FileManageSaveReqVO): Promise<boolean> => {
  return request.put({ url: '/sql-edit/update', data })
}

// 删除文件
export const deleteFile = async (id: number): Promise<boolean> => {
  return await request.delete({ url: '/sql-edit/delete', params: { id } })
}

// 批量删除文件
export const deleteFileList = async (ids: number[]): Promise<boolean> => {
  return await request.delete({ url: '/sql-edit/delete-list', params: { ids: ids.join(',') } })
}

// 移动文件
export const moveFile = async (id: number, targetParentId: number): Promise<boolean> => {
  return await request.post({ url: '/sql-edit/move', params: { id, targetParentId } })
}

// 重命名文件
export const renameFile = async (id: number, name: string): Promise<boolean> => {
  return await request.post({ url: '/sql-edit/rename', params: { id, name } })
}

// 保存文件内容
export const saveFileContent = async (id: number, content: string): Promise<boolean> => {
  return await request.post({ url: '/sql-edit/save-content', params: { id, content } })
}

// 保存文件数据（内容和配置）
export const saveFileData = async (data: FileManageSaveReqVO): Promise<boolean> => {
  return await request.post({ url: '/sql-edit/save-data', data })
}

// 获取文件内容
export const getFileContent = (id: number): Promise<string> => {
  return request.get({ url: '/sql-edit/get-content', params: { id } })
}

// ==================== 工具方法 ====================

// 根据类型获取图标名称
export const getFileIcon = (type: string): string => {
  const iconMap = {
    folder: 'FolderOpened',
    sql: 'Document',
    yaml: 'Document',
    file: 'FileText'
  }
  return iconMap[type as keyof typeof iconMap] || 'FileText'
}

// 生成文件路径
export const generateFilePath = (parentPath: string, fileName: string): string => {
  return parentPath.endsWith('/') ? `${parentPath}${fileName}` : `${parentPath}/${fileName}`
}

// 文件类型检测
export const getFileType = (fileName: string): 'sql' | 'yaml' | 'file' => {
  const sqlExtensions = ['.sql']
  const yamlExtensions = ['.yaml', '.yml']
  const ext = fileName.substring(fileName.lastIndexOf('.'))
  if (sqlExtensions.includes(ext)) {
    return 'sql'
  }
  if (yamlExtensions.includes(ext)) {
    return 'yaml'
  }
  return 'file'
}
