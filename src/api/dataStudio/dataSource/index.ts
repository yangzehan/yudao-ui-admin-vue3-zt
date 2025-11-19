import request from '@/config/axios'

// 数据源配置类型
export interface DataSourceType {
  type: string
  name: string
  driverClassName: string
  defaultPort: number
  defaultUrlTemplate: string
  defaultDriver: string
  supported: boolean
  icon: string
}

// 数据源配置
export interface DataSource {
  id?: number
  name: string
  type: string
  driverClassName?: string
  url?: string
  host?: string
  port?: number
  database?: string
  username?: string
  password?: string
  connectionParams?: string
  status: number
  connectionStatus?: string
  lastConnectionTime?: number
  lastConnectionError?: string
  sort?: number
  description?: string
  extInfo?: string
  createTime?: string
}

// 连接测试结果
export interface ConnectionTestResult {
  success: boolean
  responseTime: number
  errorMessage?: string
  message: string
}

// 数据源API
export const dataSourceApi = {
  // 获取数据源类型列表
  getTypes() {
    return request.get<DataSourceType[]>({ url: '/data-studio/datasource/types' })
  },

  // 获取数据源列表
  getList(params?: {
    name?: string
    type?: string
    status?: number
  }) {
    return request.get<DataSource[]>({ url: '/data-studio/datasource/list', params })
  },

  // 获取数据源分页
  getPage(params?: {
    name?: string
    type?: string
    status?: number
    pageNo?: number
    pageSize?: number
  }) {
    return request.get({ url: '/data-studio/datasource/page', params })
  },

  // 获取数据源详情
  get(id: number) {
    return request.get<DataSource>({ url: `/data-studio/datasource/get?id=${id}` })
  },

  // 创建数据源
  create(data: DataSource) {
    return request.post<number>({ url: '/data-studio/datasource/create', data })
  },

  // 更新数据源
  update(data: DataSource) {
    return request.put<boolean>({ url: '/data-studio/datasource/update', data })
  },

  // 删除数据源
  delete(id: number) {
    return request.delete<boolean>({ url: `/data-studio/datasource/delete?id=${id}` })
  },

  // 批量删除数据源
  deleteList(ids: number[]) {
    return request.delete<boolean>({ url: '/data-studio/datasource/delete-list', params: { ids } })
  },

  // 测试数据源连接
  testConnection(id: number) {
    return request.post<ConnectionTestResult>({ url: `/data-studio/datasource/test-connection?id=${id}` })
  },

  // 直接测试数据源连接
  testConnectionDirect(data: DataSource) {
    return request.post<ConnectionTestResult>({ url: '/data-studio/datasource/test-connection-direct', data })
  }
}
