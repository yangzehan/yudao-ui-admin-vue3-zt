import request from '@/config/axios'

// 占位符配置项
export interface PlaceholderConfigItem {
  label: string
  hint?: string
  type?: 'input' | 'datasource' | 'table' | 'kafka'
}

// 占位符配置（JSON格式）
export type PlaceholderConfig = Record<string, PlaceholderConfigItem>

export interface SqlTemplateVO {
  id?: number
  name: string
  description?: string
  category: string
  previewContent?: string
  content: string
  defaultConfig?: any
  placeholderConfig?: string
  sort?: number
  status?: number
  createTime?: Date
  creator?: string
}

export interface SqlTemplateDetailVO {
  id: number
  name: string
  description: string
  category: string
  content: string
  defaultConfig?: any
  placeholderConfig?: string
  sort?: number
  status?: number
  createTime?: Date
  creator?: string
  updateTime?: Date
}

export interface SqlTemplatePageReq {
  pageNo: number
  pageSize: number
  name?: string
  category?: string
  status?: number
}

export interface PlaceholderValue {
  placeholder: string
  value: string
}

// ==================== 模板管理 API ====================

// 获取模板列表（简单列表，选择用）
export const getTemplateList = (params?: { category?: string }): Promise<SqlTemplateVO[]> => {
  return request.get({ url: '/sql-template/list', params })
}

// 获取模板列表（分页，管理用）
export const getTemplatePage = (params: SqlTemplatePageReq): Promise<PageResult<SqlTemplateVO>> => {
  return request.get({ url: '/sql-template/page', params })
}

// 获取模板详情
export const getTemplateDetail = (id: number): Promise<SqlTemplateDetailVO> => {
  return request.get({ url: '/sql-template/get', params: { id } })
}

// 获取模板分类列表
export const getTemplateCategories = (): Promise<string[]> => {
  return request.get({ url: '/sql-template/categories' })
}

// 创建模板
export const createTemplate = (data: SqlTemplateVO): Promise<number> => {
  return request.post({ url: '/sql-template/create', data })
}

// 更新模板
export const updateTemplate = (data: SqlTemplateVO): Promise<boolean> => {
  return request.put({ url: '/sql-template/update', data })
}

// 删除模板
export const deleteTemplate = (id: number): Promise<boolean> => {
  return request.delete({ url: '/sql-template/delete', params: { id } })
}

// 解析模板中的占位符
export const parsePlaceholders = (content: string): Promise<string[]> => {
  return request.get({ url: '/sql-template/parse-placeholders', params: { content } })
}

// 根据模板创建文件
export const createFileFromTemplate = (data: {
  templateId: number
  fileName: string
  parentId: number
  placeholderValues?: Record<string, string>
}): Promise<number> => {
  return request.post({ url: '/sql-template/create-file', data })
}

// ==================== 数据源 API ====================

// 获取数据源表列表（用于占位符填充）
export const getDataSourceTables = (datasourceId: number): Promise<string[]> => {
  return request.get({ url: '/data-studio/datasource/tables', params: { datasourceId } })
}

// ==================== 占位符配置解析工具 ====================

/**
 * 解析占位符配置 JSON 字符串
 */
export const parsePlaceholderConfig = (configStr: string | undefined): PlaceholderConfig => {
  if (!configStr) return {}
  try {
    return JSON.parse(configStr)
  } catch {
    console.warn('解析占位符配置失败:', configStr)
    return {}
  }
}

/**
 * 获取占位符标签（优先从配置获取，否则使用默认标签）
 */
export const getPlaceholderLabel = (
  placeholder: string,
  config: PlaceholderConfig,
  defaultLabels: Record<string, string>
): string => {
  if (config[placeholder]?.label) {
    return config[placeholder].label!
  }
  return defaultLabels[placeholder] || placeholder
}

/**
 * 获取占位符提示信息（优先从配置获取，否则使用默认提示）
 */
export const getPlaceholderHint = (
  placeholder: string,
  config: PlaceholderConfig,
  defaultHints: Record<string, string>
): string => {
  if (config[placeholder]?.hint) {
    return config[placeholder].hint!
  }
  return defaultHints[placeholder] || `请输入 ${placeholder}`
}

/**
 * 判断占位符类型
 */
export const getPlaceholderType = (
  placeholder: string,
  config: PlaceholderConfig
): 'input' | 'datasource' | 'table' | 'kafka' => {
  // 先从配置获取
  if (config[placeholder]?.type) {
    return config[placeholder].type!
  }
  // 默认判断逻辑
  if (['mysql_host', 'mysql_port', 'mysql_database', 'mysql_username', 'mysql_password'].includes(placeholder)) {
    return 'datasource'
  }
  if (placeholder.endsWith('_table') || placeholder === 'target_table') {
    return 'table'
  }
  if (placeholder.startsWith('kafka_')) {
    return 'kafka'
  }
  return 'input'
}
