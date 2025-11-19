<template>
  <div class="v-data-source-management">
    <div class="v-data-source-management__header">
      <h2>数据源管理</h2>
      <p>配置和管理数据源连接</p>
    </div>

    <div class="v-data-source-management__toolbar">
      <el-button type="primary" icon="Plus" @click="handleCreateDataSource">
        新建数据源
      </el-button>
      <el-button icon="Connection" :disabled="!selectedDataSource" @click="handleTestConnection">
        测试连接
      </el-button>
      <el-button icon="Refresh" @click="loadDataSourceList">
        刷新
      </el-button>
    </div>

    <div class="v-data-source-management__content">
      <el-table
        v-loading="loading"
        :data="dataSourceList"
        style="width: 100%"
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="数据源名称" width="180" show-overflow-tooltip />
        <el-table-column prop="type" label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getDataSourceTypeTag(row.type)">
              {{ getDataSourceTypeName(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="host" label="主机地址" width="180" show-overflow-tooltip />
        <el-table-column prop="port" label="端口" width="100" />
        <el-table-column prop="database" label="数据库" width="150" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="connectionStatus" label="连接状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getConnectionStatusTag(row.connectionStatus)">
              {{ getConnectionStatusText(row.connectionStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button size="small" icon="Edit" @click="handleEditDataSource(row)">
              编辑
            </el-button>
            <el-button size="small" icon="Connection" @click="handleTestSingleConnection(row)">
              测试
            </el-button>
            <el-button size="small" icon="Delete" type="danger" @click="handleDeleteDataSource(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 数据源详情对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dataSourceForm.id ? '编辑数据源' : '新建数据源'"
      width="600px"
      @close="handleCloseDialog"
    >
      <el-form
        ref="formRef"
        :model="dataSourceForm"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="数据源名称" prop="name">
          <el-input v-model="dataSourceForm.name" placeholder="请输入数据源名称" />
        </el-form-item>
        <el-form-item label="数据源类型" prop="type">
          <el-select
            v-model="dataSourceForm.type"
            placeholder="请选择数据源类型"
            @change="handleTypeChange"
          >
            <el-option
              v-for="type in dataSourceTypes"
              :key="type.type"
              :label="type.name"
              :value="type.type"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="主机地址" prop="host">
          <el-input v-model="dataSourceForm.host" placeholder="请输入主机地址" />
        </el-form-item>
        <el-form-item label="端口" prop="port">
          <el-input-number
            v-model="dataSourceForm.port"
            :min="1"
            :max="65535"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="数据库" prop="database">
          <el-input v-model="dataSourceForm.database" placeholder="请输入数据库名" />
        </el-form-item>
        <el-form-item label="用户名" prop="username">
          <el-input v-model="dataSourceForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="dataSourceForm.password"
            type="password"
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="连接URL" prop="url">
          <el-input
            v-model="dataSourceForm.url"
            placeholder="留空则自动生成"
            type="textarea"
            :rows="2"
          />
        </el-form-item>
        <el-form-item label="驱动类名" prop="driverClassName">
          <el-input
            v-model="dataSourceForm.driverClassName"
            placeholder="留空则自动填充"
            type="textarea"
            :rows="2"
          />
        </el-form-item>
        <el-form-item label="描述信息">
          <el-input
            v-model="dataSourceForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入描述信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button icon="Connection" @click="handleTestSaveConnection">
            测试连接
          </el-button>
          <el-button type="primary" :loading="saveLoading" @click="handleSaveDataSource">
            保存
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {onMounted, reactive, ref, watch, nextTick} from 'vue'
import {ElMessage, ElMessageBox, type FormInstance, type FormRules} from 'element-plus'
import type {DataSource, DataSourceType} from '@/api/dataStudio/dataSource'
import {dataSourceApi} from '@/api/dataStudio/dataSource'

// 对话框显示状态
const dialogVisible = ref(false)
const saveLoading = ref(false)
const loading = ref(false)

// 数据源类型列表
const dataSourceTypes = ref<DataSourceType[]>([])

// 选中的数据源
const selectedDataSource = ref<DataSource | null>(null)

// 数据源列表
const dataSourceList = ref<DataSource[]>([])

// 表单实例
const formRef = ref<FormInstance>()

// 标记是否为程序更新，避免循环监听
const isUpdatingFromFields = ref(false)
const isUpdatingFromUrl = ref(false)

// 数据源表单
const dataSourceForm = reactive<DataSource>({
  name: '',
  type: 'mysql',
  host: '',
  port: 3306,
  database: '',
  username: '',
  password: '',
  url: '',
  driverClassName: '',
  description: '',
  status: 1
})

// 表单验证规则
const formRules: FormRules = {
  name: [
    { required: true, message: '请输入数据源名称', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择数据源类型', trigger: 'change' }
  ],
  host: [
    { required: true, message: '请输入主机地址', trigger: 'blur' }
  ],
  port: [
    { required: true, type: 'number', message: '请输入端口', trigger: 'blur' }
  ],
  database: [
    { required: true, message: '请输入数据库名', trigger: 'blur' }
  ],
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

// 初始化
onMounted(() => {
  loadDataSourceTypes()
  loadDataSourceList()
})

// 监听字段变化，自动生成 JDBC URL
watch(
  () => dataSourceForm.type,
  (type) => {
    if (isUpdatingFromUrl.value) return

    if (type && dataSourceForm.host && dataSourceForm.port && dataSourceForm.database) {
      isUpdatingFromFields.value = true
      dataSourceForm.url = generateJdbcUrl(type, dataSourceForm.host, dataSourceForm.port, dataSourceForm.database)
      nextTick(() => {
        isUpdatingFromFields.value = false
      })
    } else if (type) {
      // 如果有类型但缺少其他信息，生成基础 URL
      isUpdatingFromFields.value = true
      dataSourceForm.url = generatePartialUrl(type, dataSourceForm.host, dataSourceForm.port, '')
      nextTick(() => {
        isUpdatingFromFields.value = false
      })
    }
  }
)

watch(
  () => dataSourceForm.host,
  (host) => {
    if (isUpdatingFromUrl.value) return

    if (host && dataSourceForm.type && dataSourceForm.port && dataSourceForm.database) {
      isUpdatingFromFields.value = true
      dataSourceForm.url = generateJdbcUrl(dataSourceForm.type, host, dataSourceForm.port, dataSourceForm.database)
      nextTick(() => {
        isUpdatingFromFields.value = false
      })
    } else if (dataSourceForm.type) {
      // 如果有类型，生成部分 URL
      isUpdatingFromFields.value = true
      dataSourceForm.url = generatePartialUrl(dataSourceForm.type, host, dataSourceForm.port, dataSourceForm.database)
      nextTick(() => {
        isUpdatingFromFields.value = false
      })
    }
  }
)

watch(
  () => dataSourceForm.port,
  (port) => {
    if (isUpdatingFromUrl.value) return

    if (port && dataSourceForm.type && dataSourceForm.host && dataSourceForm.database) {
      isUpdatingFromFields.value = true
      dataSourceForm.url = generateJdbcUrl(dataSourceForm.type, dataSourceForm.host, port, dataSourceForm.database)
      nextTick(() => {
        isUpdatingFromFields.value = false
      })
    } else if (dataSourceForm.type) {
      // 如果有类型，生成部分 URL
      isUpdatingFromFields.value = true
      dataSourceForm.url = generatePartialUrl(dataSourceForm.type, dataSourceForm.host, port, dataSourceForm.database)
      nextTick(() => {
        isUpdatingFromFields.value = false
      })
    }
  }
)

watch(
  () => dataSourceForm.database,
  (database) => {
    if (isUpdatingFromUrl.value) return

    if (database && dataSourceForm.type && dataSourceForm.host && dataSourceForm.port) {
      isUpdatingFromFields.value = true
      dataSourceForm.url = generateJdbcUrl(dataSourceForm.type, dataSourceForm.host, dataSourceForm.port, database)
      nextTick(() => {
        isUpdatingFromFields.value = false
      })
    } else if (dataSourceForm.type) {
      // 如果有类型，生成部分 URL
      isUpdatingFromFields.value = true
      dataSourceForm.url = generatePartialUrl(dataSourceForm.type, dataSourceForm.host, dataSourceForm.port, database)
      nextTick(() => {
        isUpdatingFromFields.value = false
      })
    }
  }
)

// 监听 URL 变化，自动解析字段
watch(
  () => dataSourceForm.url,
  (newUrl) => {
    // 如果正在从字段生成 URL，则不解析
    if (isUpdatingFromFields.value) return

    if (newUrl && dataSourceForm.type) {
      const parsed = parseJdbcUrl(newUrl, dataSourceForm.type)
      if (parsed) {
        isUpdatingFromUrl.value = true
        dataSourceForm.host = parsed.host
        dataSourceForm.port = parsed.port
        dataSourceForm.database = parsed.database
        nextTick(() => {
          isUpdatingFromUrl.value = false
        })
      }
    }
  }
)

// 加载数据源类型
const loadDataSourceTypes = async () => {
  try {
    const types = await dataSourceApi.getTypes()
    dataSourceTypes.value = types
  } catch (error) {
    ElMessage.error('加载数据源类型失败')
  }
}

// 加载数据源列表
const loadDataSourceList = async () => {
  loading.value = true
  try {
    // 直接调用getList方法，不传递任何参数
    dataSourceList.value = await dataSourceApi.getList()
  } catch (error) {
    ElMessage.error('加载数据源列表失败')
  } finally {
    loading.value = false
  }
}

// 处理表格选择
const handleSelectionChange = (selection: DataSource[]) => {
  selectedDataSource.value = selection.length > 0 ? selection[0] : null
}

// 新建数据源
const handleCreateDataSource = () => {
  // 重置表单
  Object.assign(dataSourceForm, {
    id: undefined,
    name: '',
    type: 'mysql',
    host: '',
    port: 3306,
    database: '',
    username: '',
    password: '',
    url: '',
    driverClassName: '',
    description: '',
    status: 1
  })
  dialogVisible.value = true
}

// 编辑数据源
const handleEditDataSource = (row: DataSource) => {
  Object.assign(dataSourceForm, row)
  dialogVisible.value = true
}

// 删除数据源
const handleDeleteDataSource = async (row: DataSource) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除数据源 "${row.name}" 吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await dataSourceApi.delete(row.id!)
    ElMessage.success('删除成功')
    loadDataSourceList()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// 测试连接
const handleTestConnection = async () => {
  if (!selectedDataSource.value) {
    ElMessage.warning('请选择要测试的数据源')
    return
  }
  await testSingleConnection(selectedDataSource.value)
}

// 测试单个数据源
const handleTestSingleConnection = async (row: DataSource) => {
  await testSingleConnection(row)
}

// 测试连接通用方法
const testSingleConnection = async (dataSource: DataSource) => {
  try {
    ElMessage.info('正在测试连接...')
    const result = await dataSourceApi.testConnection(dataSource.id!)
    if (result.success) {
      ElMessage.success(result.message || '连接测试成功')
      loadDataSourceList()
    } else {
      ElMessage.error(result.message || '连接测试失败')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '连接测试失败')
  }
}

// 测试当前表单连接
const handleTestSaveConnection = async () => {
  try {
    ElMessage.info('正在测试连接...')
    const result = await dataSourceApi.testConnectionDirect(dataSourceForm)
    if (result.success) {
      ElMessage.success(result.message || '连接测试成功')
    } else {
      ElMessage.error(result.message || '连接测试失败')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '连接测试失败')
  }
}

// 保存数据源
const handleSaveDataSource = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    saveLoading.value = true
    try {
      if (dataSourceForm.id) {
        // 更新
        await dataSourceApi.update(dataSourceForm)
        ElMessage.success('更新成功')
      } else {
        // 创建
        await dataSourceApi.create(dataSourceForm)
        ElMessage.success('创建成功')
      }
      dialogVisible.value = false
      loadDataSourceList()
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
}

// 数据源类型改变
const handleTypeChange = (type: string) => {
  const typeConfig = dataSourceTypes.value.find(t => t.type === type)
  if (typeConfig) {
    dataSourceForm.port = typeConfig.defaultPort
    dataSourceForm.driverClassName = typeConfig.driverClassName
    // 重新生成 URL，保留现有字段
    isUpdatingFromFields.value = true
    dataSourceForm.url = generatePartialUrl(type, dataSourceForm.host , dataSourceForm.port, dataSourceForm.database || '')
    nextTick(() => {
      isUpdatingFromFields.value = false
    })
  }
}

// 获取数据源类型名称
const getDataSourceTypeName = (type: string) => {
  const typeConfig = dataSourceTypes.value.find(t => t.type === type)
  return typeConfig?.name || type
}

// 获取数据源类型标签
const getDataSourceTypeTag = (type: string) => {
  const typeMap: Record<string, "" | "success" | "warning" | "info" | "danger"> = {
    mysql: 'success',
    postgresql: 'success',
    oracle: 'success',
    sqlserver: 'success',
    clickhouse: 'success',
    hive: 'success'
  }
  return typeMap[type] || 'success'
}

// 获取连接状态标签
const getConnectionStatusTag = (status: string) => {
  const statusMap: Record<string, "" | "success" | "warning" | "info" | "danger"> = {
    connected: 'success',
    connecting: 'warning',
    disconnected: 'info',
    error: 'danger'
  }
  return statusMap[status] || 'info'
}

// 生成完整的 JDBC URL
const generateJdbcUrl = (type: string, host: string, port: number, database: string): string => {
  if (!host || !port || !database) return ''

  switch (type) {
    case 'mysql':
      return `jdbc:mysql://${host}:${port}/${database}?useUnicode=true&characterEncoding=UTF-8&useSSL=false&serverTimezone=Asia/Shanghai`
    case 'postgresql':
      return `jdbc:postgresql://${host}:${port}/${database}`
    case 'oracle':
      return `jdbc:oracle:thin:@${host}:${port}:${database}`
    case 'sqlserver':
      return `jdbc:sqlserver://${host}:${port};databaseName=${database}`
    case 'clickhouse':
      return `jdbc:clickhouse://${host}:${port}/${database}`
    case 'hive':
      return `jdbc:hive2://${host}:${port}/${database}`
    default:
      return `jdbc:${type}://${host}:${port}/${database}`
  }
}

// 生成部分 JDBC URL（保留基础结构）
const generatePartialUrl = (type: string, host: string | undefined, port: number | string | undefined, database: string | undefined): string => {
  if (!type) return ''

  // 处理空值
  const cleanHost = host || '[host]'
  const cleanPort = port || '[port]'
  const cleanDatabase = database || ''

  switch (type) {
    case 'mysql':
      return `jdbc:mysql://${cleanHost}:${cleanPort}/${cleanDatabase}${cleanDatabase ? '?' : ''}useUnicode=true&characterEncoding=UTF-8&useSSL=false&serverTimezone=Asia/Shanghai`
    case 'postgresql':
      return `jdbc:postgresql://${cleanHost}:${cleanPort}/${cleanDatabase}`
    case 'oracle':
      return `jdbc:oracle:thin:@${cleanHost}:${cleanPort}:${cleanDatabase}`
    case 'sqlserver':
      return `jdbc:sqlserver://${cleanHost}:${cleanPort};databaseName=${cleanDatabase}`
    case 'clickhouse':
      return `jdbc:clickhouse://${cleanHost}:${cleanPort}/${cleanDatabase}`
    case 'hive':
      return `jdbc:hive2://${cleanHost}:${cleanPort}/${cleanDatabase}`
    default:
      return `jdbc:${type}://${cleanHost}:${cleanPort}/${cleanDatabase}`
  }
}

// 解析 JDBC URL
const parseJdbcUrl = (url: string, type: string): { host: string, port: number, database: string } | null => {
  if (!url) return null

  try {
    let match: RegExpMatchArray | null = null
    let host = ''
    let port = ''
    let database = ''

    switch (type) {
      case 'mysql':
      case 'postgresql':
      case 'clickhouse':
      case 'hive':
        match = url.match(/jdbc:(?:mysql|postgresql|clickhouse|hive):\/\/([^:]+):(\d+)\/([^\/?]+)/)
        if (match) {
          host = match[1]
          port = match[2]
          database = match[3].split('?')[0] // 移除查询参数
        }
        break
      case 'oracle':
        match = url.match(/jdbc:oracle:thin:@([^:]+):(\d+):([^\/?]+)/)
        if (match) {
          host = match[1]
          port = match[2]
          database = match[3].split('?')[0]
        }
        break
      case 'sqlserver':
        match = url.match(/jdbc:sqlserver:\/\/([^:]+):(\d+);databaseName=([^\/?;]+)/)
        if (match) {
          host = match[1]
          port = match[2]
          database = match[3].split('?')[0]
        }
        break
      default:
        match = url.match(/jdbc:[^:]+:\/\/([^:]+):(\d+)\/([^\/?]+)/)
        if (match) {
          host = match[1]
          port = match[2]
          database = match[3].split('?')[0]
        }
    }

    if (host && port && database) {
      return {
        host,
        port: parseInt(port, 10),
        database
      }
    }
  } catch (error) {
    console.error('解析 JDBC URL 失败:', error)
  }

  return null
}

// 获取连接状态文本
const getConnectionStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    connected: '已连接',
    connecting: '连接中',
    disconnected: '未连接',
    error: '连接错误'
  }
  return statusMap[status] || '未知'
}
</script>

<style lang="scss" scoped>
.v-data-source-management {
  padding: 24px;
  height: 100%;
  overflow-y: auto;

  &__header {
    margin-bottom: 24px;

    h2 {
      margin: 0 0 8px 0;
      color: var(--el-text-color-primary);
      font-size: 20px;
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
  }

  &__content {
    height: calc(100% - 120px);
  }
}

.dialog-footer {
  display: flex;
  gap: 8px;
}
</style>
