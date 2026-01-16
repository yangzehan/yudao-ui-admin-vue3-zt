<template>
  <el-dialog
    v-model="dialogVisible"
    title="填充模板参数"
    width="700px"
    top="10vh"
    :close-on-click-modal="false"
    class="placeholder-dialog"
  >
    <div class="placeholder-container">
      <!-- 占位符列表 -->
      <div class="placeholder-list" v-if="placeholderList.length > 0">
        <el-form label-width="120px">
          <el-form-item
            v-for="placeholder in placeholderList"
            :key="placeholder"
            :label="getPlaceholderLabel(placeholder)"
          >
            <!-- 数据源选择 -->
            <template v-if="isDatasourcePlaceholder(placeholder)">
              <el-select
                v-model="placeholderValues[placeholder]"
                placeholder="选择数据源"
                class="w-full"
                @change="(val) => handleDatasourceChange(placeholder, val)"
              >
                <el-option
                  v-for="ds in datasourceList.filter(d => d.id != null)"
                  :key="ds.id"
                  :label="ds.name"
                  :value="ds.id!"
                />
              </el-select>
            </template>

            <!-- 表名选择（需要先选择数据源） -->
            <template v-else-if="isTablePlaceholder(placeholder)">
              <div class="table-select-container">
                <el-select
                  v-model="tableDatasourceMap[placeholder]"
                  placeholder="先选择数据源"
                  class="w-full mb-8px"
                  @change="(val) => handleTableDatasourceChange(placeholder, val)"
                >
                  <el-option
                    v-for="ds in datasourceList.filter(d => d.id != null)"
                    :key="ds.id"
                    :label="ds.name"
                    :value="ds.id!"
                  />
                </el-select>
                <el-select
                  v-model="placeholderValues[placeholder]"
                  placeholder="选择表名"
                  class="w-full"
                  filterable
                  :disabled="!tableDatasourceMap[placeholder]"
                  :loading="tableLoadingMap[placeholder]"
                >
                  <el-option
                    v-for="table in getTableList(placeholder)"
                    :key="table"
                    :label="table"
                    :value="table"
                  />
                </el-select>
              </div>
            </template>

            <!-- Kafka相关 -->
            <template v-else-if="isKafkaPlaceholder(placeholder)">
              <el-input
                v-model="placeholderValues[placeholder]"
                :placeholder="getPlaceholderHint(placeholder)"
              />
            </template>

            <!-- 通用输入 -->
            <template v-else>
              <el-input
                v-model="placeholderValues[placeholder]"
                :placeholder="getPlaceholderHint(placeholder)"
              />
            </template>
          </el-form-item>
        </el-form>
      </div>

      <!-- 无占位符提示 -->
      <el-empty
        v-else
        description="该模板没有需要填充的参数"
        :image-size="80"
      />

      <!-- 预览 -->
      <div class="preview-section" v-if="placeholderList.length > 0">
        <div class="section-title">
          <el-icon><View /></el-icon>
          <span>内容预览</span>
        </div>
        <div class="preview-content">
          {{ previewContent }}
        </div>
      </div>
    </div>

    <template #footer>
      <div>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :disabled="!canSubmit">
          确认并创建文件
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { View } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import {
  SqlTemplateDetailVO,
  getDataSourceTables,
  parsePlaceholderConfig,
  getPlaceholderLabel as getPlaceholderLabelApi,
  getPlaceholderHint as getPlaceholderHintApi,
  getPlaceholderType,
  PlaceholderConfig
} from '@/api/dataStudio/template'
import { dataSourceApi, DataSource } from '@/api/dataStudio/dataSource'

const props = defineProps<{
  modelValue: boolean
  template: SqlTemplateDetailVO | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'submit': [placeholderValues: Record<string, string>, fileName: string]
}>()

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// 占位符列表
const placeholderList = ref<string[]>([])

// 占位符值
const placeholderValues = ref<Record<string, string>>({})

// 数据源列表
const datasourceList = ref<DataSource[]>([])

// 表名选择关联的数据源（表名占位符 -> 数据源ID）
const tableDatasourceMap = ref<Record<string, number>>({})

// 每个表名占位符对应的表列表
const tableListMap = ref<Record<string, string[]>>({})

// 每个表名占位符的加载状态
const tableLoadingMap = ref<Record<string, boolean>>({})

// 预览内容
const previewContent = computed(() => {
  if (!props.template?.content) return ''
  let content = props.template.content
  for (const [key, value] of Object.entries(placeholderValues.value)) {
    // 如果变量已填充，使用填充值；否则保持原始的 ${变量名} 格式
    const replaceValue =
      value != null && String(value).trim() !== '' ? String(value) : `\${${key}}`
    content = content.replace(new RegExp(`\\$\\{${key}}`, 'g'), replaceValue)
  }
  return content
})

// 是否可以提交
const canSubmit = computed(() => {
  // 至少填写一个占位符，或者没有占位符
  if (placeholderList.value.length === 0) return true
  return Object.values(placeholderValues.value).some(v => v != null && String(v).trim() !== '')
})

// 占位符配置（从模板中获取）
const placeholderConfig = computed<PlaceholderConfig>(() => {
  return parsePlaceholderConfig(props.template?.placeholderConfig)
})

// 默认标签映射
const defaultLabels: Record<string, string> = {
  // MySQL相关
  mysql_host: 'MySQL 主机',
  mysql_port: 'MySQL 端口',
  mysql_database: 'MySQL 数据库',
  mysql_username: 'MySQL 用户名',
  mysql_password: 'MySQL 密码',
  mysql_table: 'MySQL 表名',
  target_table: '目标表名',

  // Kafka相关
  kafka_servers: 'Kafka 服务器',
  kafka_topic: 'Kafka Topic',
  kafka_group_id: '消费者组ID',

  // 通用
  description: '描述',
  hadoop_version: 'Hadoop 版本'
}

// 默认提示映射
const defaultHints: Record<string, string> = {
  mysql_host: '例如: localhost 或 127.0.0.1',
  mysql_port: '例如: 3306',
  mysql_database: '数据库名称',
  mysql_username: '数据库用户名',
  mysql_password: '数据库密码',
  mysql_table: '表名称',
  target_table: '目标表名称',
  kafka_servers: '例如: localhost:9092',
  kafka_topic: 'Topic 名称',
  kafka_group_id: '消费者组 ID'
}

// 获取占位符显示标签
const getPlaceholderLabel = (placeholder: string) => {
  return getPlaceholderLabelApi(placeholder, placeholderConfig.value, defaultLabels)
}

// 获取占位符提示
const getPlaceholderHint = (placeholder: string) => {
  return getPlaceholderHintApi(placeholder, placeholderConfig.value, defaultHints)
}

// 判断占位符类型
const getPlaceholderTypeInfo = (placeholder: string) => {
  return getPlaceholderType(placeholder, placeholderConfig.value)
}

const isDatasourcePlaceholder = (placeholder: string) => {
  return getPlaceholderTypeInfo(placeholder) === 'datasource'
}

const isTablePlaceholder = (placeholder: string) => {
  return getPlaceholderTypeInfo(placeholder) === 'table'
}

const isKafkaPlaceholder = (placeholder: string) => {
  return getPlaceholderTypeInfo(placeholder) === 'kafka'
}

// 获取指定占位符的表列表
const getTableList = (placeholder: string) => {
  return tableListMap.value[placeholder] || []
}

// 表名选择的数据源变化
const handleTableDatasourceChange = async (placeholder: string, datasourceId: number) => {
  if (!datasourceId) {
    tableListMap.value[placeholder] = []
    placeholderValues.value[placeholder] = ''
    return
  }

  // 重置表名选择
  placeholderValues.value[placeholder] = ''

  // 加载表列表
  tableLoadingMap.value[placeholder] = true
  try {
    const tables = await getDataSourceTables(datasourceId)
    tableListMap.value[placeholder] = tables
  } catch (error) {
    console.error('获取表列表失败:', error)
    ElMessage.error('获取表列表失败')
    tableListMap.value[placeholder] = []
  } finally {
    tableLoadingMap.value[placeholder] = false
  }
}

// 加载占位符
const loadPlaceholders = () => {
  if (!props.template?.content) {
    placeholderList.value = []
    return
  }

  // 解析 ${xxx} 格式的占位符
  const pattern = /\$\{([^}]+)}/g
  const matches = props.template.content.matchAll(pattern)
  const placeholders = new Set<string>()

  for (const match of matches) {
    if (match[1]) {
      placeholders.add(match[1])
    }
  }

  placeholderList.value = Array.from(placeholders)

  // 初始化占位符值
  placeholderValues.value = {}
  placeholderList.value.forEach(p => {
    placeholderValues.value[p] = ''
  })
}

// 加载数据源列表
const loadDatasourceList = async () => {
  try {
    datasourceList.value = await dataSourceApi.getList()
  } catch (error) {
    console.error('加载数据源列表失败:', error)
  }
}

// 数据源选择变化
const handleDatasourceChange = async (placeholder: string, datasourceId: number) => {
  if (!datasourceId) return

  // 根据选择的占位符，填充相关的其他占位符
  tableLoadingMap.value[placeholder] = true
  try {
    const tables = await getDataSourceTables(datasourceId)
    tableListMap.value[placeholder] = tables

    // 如果有表名占位符，自动填充第一个表名
    const tablePlaceholder = placeholderList.value.find(p => p.endsWith('_table') || p === 'target_table')
    if (tablePlaceholder && tableListMap.value[placeholder]?.length > 0) {
      placeholderValues.value[tablePlaceholder] = tableListMap.value[placeholder][0]
    }
  } catch (error) {
    console.error('获取表列表失败:', error)
    ElMessage.error('获取表列表失败')
  } finally {
    tableLoadingMap.value[placeholder] = false
  }
}

// 提交
const handleSubmit = () => {
  emit('submit', placeholderValues.value, '')
  dialogVisible.value = false
}

// 监听弹窗显示
watch(() => props.modelValue, (val) => {
  if (val) {
    loadPlaceholders()
    loadDatasourceList()
  }
})

onMounted(() => {
  if (props.modelValue) {
    loadPlaceholders()
    loadDatasourceList()
  }
})
</script>

<style lang="scss" scoped>
.placeholder-dialog {
  :deep(.el-dialog__body) {
    padding: 16px 20px;
  }
}

.placeholder-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.placeholder-list {
  max-height: 400px;
  overflow-y: auto;
}

.table-select-container {
  width: 100%;
}

.preview-section {
  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    font-weight: 600;
    color: var(--el-text-color-primary);

    .el-icon {
      color: var(--el-color-primary);
    }
  }

  .preview-content {
    padding: 12px;
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-light);
    border-radius: 4px;
    font-family: monospace;
    font-size: 12px;
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 150px;
    overflow-y: auto;
    color: var(--el-text-color-primary);
  }
}
</style>
