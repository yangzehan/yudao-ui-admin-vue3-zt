<template>
  <ContentWrap>
    <div class="flex justify-between items-center mb-16px">
      <div class="flex items-center gap-12px">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索模板名称"
          :prefix-icon="Search"
          clearable
          class="w-240px"
          @input="handleSearch"
        />
        <el-select v-model="searchCategory" placeholder="模板分类" clearable class="w-140px">
          <el-option
            v-for="cat in categoryList"
            :key="cat"
            :label="getCategoryLabel(cat)"
            :value="cat"
          />
        </el-select>
        <el-select v-model="searchStatus" placeholder="状态" clearable class="w-100px">
          <el-option label="禁用" :value="0" />
          <el-option label="启用" :value="1" />
        </el-select>
      </div>
      <el-button type="primary" @click="handleAdd">新增模板</el-button>
    </div>

    <el-table
      v-loading="loading"
      :data="tableData"
      stripe
      border
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="50" />
      <el-table-column prop="name" label="模板名称" min-width="150" show-overflow-tooltip />
      <el-table-column prop="description" label="模板描述" min-width="200" show-overflow-tooltip />
      <el-table-column prop="category" label="分类" width="120">
        <template #default="{ row }">
          <el-tag>{{ getCategoryLabel(row.category) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="sort" label="排序" width="80" align="center" />
      <el-table-column prop="status" label="状态" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="creator" label="创建者" width="100" />
      <el-table-column prop="createTime" label="创建时间" width="160">
        <template #default="{ row }">
          {{ formatDate(row.createTime) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
          <el-button link type="primary" @click="handleCopy(row)">复制</el-button>
          <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-row justify="end" class="mt-16px">
      <el-pagination
        v-model:current-page="pageNo"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @change="getList"
      />
    </el-row>

    <!-- 新增/编辑模板弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增模板' : '编辑模板'"
      width="900px"
      top="5vh"
      @close="handleDialogClose"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="模板名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入模板名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="模板分类" prop="category">
              <el-select v-model="formData.category" placeholder="请选择分类" filterable allow-create>
                <el-option label="SQL" value="sql" />
                <el-option label="YAML" value="yaml" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="模板描述" prop="description">
          <el-input v-model="formData.description" type="textarea" :rows="2" placeholder="请输入模板描述" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="排序" prop="sort">
              <el-input-number v-model="formData.sort" :min="0" :max="9999" controls-position="right" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="formData.status">
                <el-radio :label="1">启用</el-radio>
                <el-radio :label="0">禁用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="模板内容" prop="content">
          <MonacoEditor
            v-model="formData.content"
            :language="getEditorLanguage"
            :height="300"
            :options="{ minimap: { enabled: false }, wordWrap: 'on' }"
          />
        </el-form-item>
        <el-form-item label="默认配置" prop="defaultConfig">
          <MonacoEditor
            v-model="formData.defaultConfig"
            language="json"
            :height="150"
            :options="{ minimap: { enabled: false }, wordWrap: 'on' }"
          />
        </el-form-item>
        <el-form-item label="变量配置">
          <div class="placeholder-config-section">
            <div class="section-header">
              <el-button size="small" type="primary" plain @click="handleParsePlaceholders">
                <el-icon class="mr-4px"><Refresh /></el-icon>
                解析变量
              </el-button>
              <span class="hint-text">点击解析从模板内容中提取变量</span>
            </div>
            <el-table
              v-if="placeholderList.length > 0"
              :data="placeholderList"
              size="small"
              border
              max-height="300"
              class="mt-8px"
            >
              <el-table-column prop="placeholder" label="变量名" width="150">
                <template #default="{ row }">
                  <el-tag size="small" type="info">{{ row.placeholder }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="显示标签" min-width="120">
                <template #default="{ row }">
                  <el-input
                    v-model="placeholderConfig[row.placeholder].label"
                    size="small"
                    placeholder="请输入显示标签"
                  />
                </template>
              </el-table-column>
              <el-table-column label="提示信息" min-width="150">
                <template #default="{ row }">
                  <el-input
                    v-model="placeholderConfig[row.placeholder].hint"
                    size="small"
                    placeholder="请输入提示信息"
                  />
                </template>
              </el-table-column>
              <el-table-column label="输入类型" width="120">
                <template #default="{ row }">
                  <el-select
                    v-model="placeholderConfig[row.placeholder].type"
                    size="small"
                    placeholder="选择类型"
                  >
                    <el-option label="文本输入" value="input" />
                    <el-option label="数据源选择" value="datasource" />
                    <el-option label="表名选择" value="table" />
                    <el-option label="Kafka配置" value="kafka" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column width="60" align="center">
                <template #default="{ $index }">
                  <el-button
                    link
                    type="danger"
                    size="small"
                    @click="handleRemovePlaceholder($index)"
                  >
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-else description="暂无变量，请点击解析" :image-size="60" />
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </ContentWrap>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import MonacoEditor from '@/components/monaco-editor/MonacoEditor.vue'
import { Search, Refresh } from '@element-plus/icons-vue'
import {
  getTemplatePage,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getTemplateCategories,
  SqlTemplateVO,
  parsePlaceholders,
  PlaceholderConfigItem
} from '@/api/dataStudio/template'

// 消息提示函数
const msgSuccess = (content: string) => ElMessage.success(content)
const msgError = (content: string) => ElMessage.error(content)

// 搜索条件
const searchKeyword = ref('')
const searchCategory = ref('')
const searchStatus = ref<number | null>(null)

// 分页
const pageNo = ref(1)
const pageSize = ref(20)
const total = ref(0)
const loading = ref(false)
const tableData = ref<SqlTemplateVO[]>([])

// 分类列表
const categoryList = ref<string[]>([])

// 弹窗
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const formRef = ref()
const formData = reactive({
  id: undefined as number | undefined,
  name: '',
  description: '',
  category: '',
  content: '',
  defaultConfig: '{}',
  placeholderConfig: '',
  sort: 0,
  status: 1
})

// 占位符列表
const placeholderList = ref<{ placeholder: string }[]>([])

// 占位符配置
const placeholderConfig = ref<Record<string, PlaceholderConfigItem>>({})

// 默认标签
const defaultLabels: Record<string, string> = {
  mysql_host: 'MySQL 主机',
  mysql_port: 'MySQL 端口',
  mysql_database: 'MySQL 数据库',
  mysql_username: 'MySQL 用户名',
  mysql_password: 'MySQL 密码',
  mysql_table: 'MySQL 表名',
  target_table: '目标表名',
  kafka_servers: 'Kafka 服务器',
  kafka_topic: 'Kafka Topic',
  kafka_group_id: '消费者组ID',
  description: '描述',
  hadoop_version: 'Hadoop 版本'
}

// 默认提示
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

const formRules = {
  name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择模板分类', trigger: 'change' }],
  content: [{ required: true, message: '请输入模板内容', trigger: 'blur' }]
}

// 解析占位符
const handleParsePlaceholders = async () => {
  if (!formData.content) {
    ElMessage.warning('请先输入模板内容')
    return
  }
  try {
    const placeholders = await parsePlaceholders(formData.content)
    placeholderList.value = placeholders.map(p => ({ placeholder: p }))

    // 保留现有配置，添加新配置
    const newConfig: Record<string, PlaceholderConfigItem> = {}
    placeholders.forEach(p => {
      if (placeholderConfig.value[p]) {
        // 保留现有配置
        newConfig[p] = { ...placeholderConfig.value[p] }
      } else {
        // 使用默认值
        newConfig[p] = {
          label: defaultLabels[p] || p,
          hint: defaultHints[p] || `请输入 ${p}`,
          type: getDefaultPlaceholderType(p)
        }
      }
    })
    placeholderConfig.value = newConfig
    msgSuccess(`成功解析 ${placeholders.length} 个变量`)
  } catch (error) {
    console.error('解析占位符失败:', error)
    msgError('解析变量失败')
  }
}

// 获取默认占位符类型
const getDefaultPlaceholderType = (placeholder: string): 'input' | 'datasource' | 'table' | 'kafka' => {
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

// 删除占位符
const handleRemovePlaceholder = (index: number) => {
  const removed = placeholderList.value.splice(index, 1)[0]
  delete placeholderConfig.value[removed.placeholder]
}

// 保存占位符配置
const savePlaceholderConfig = () => {
  // 只有当有有效配置时才保存
  const configStr = JSON.stringify(placeholderConfig.value)
  if (configStr !== '{}' && Object.keys(placeholderConfig.value).length > 0) {
    formData.placeholderConfig = configStr
  } else {
    formData.placeholderConfig = ''
  }
}

// 加载占位符配置
const loadPlaceholderConfig = (configStr: string | undefined) => {
  if (!configStr) {
    placeholderConfig.value = {}
    return
  }
  try {
    placeholderConfig.value = JSON.parse(configStr)
  } catch {
    placeholderConfig.value = {}
  }
}

// 获取分类标签
const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    sql: 'SQL',
    yaml: 'YAML'
  }
  return labels[category] || category
}

// 格式化日期
const formatDate = (date: string | Date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

// 获取编辑器语言
const getEditorLanguage = computed(() => {
  const category = formData.category?.toLowerCase()
  if (category === 'yaml') return 'yaml'
  return 'sql'
})

// 搜索防抖
let searchTimer: ReturnType<typeof setTimeout>
const handleSearch = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    pageNo.value = 1
    getList()
  }, 300)
}

// 获取列表
const getList = async () => {
  loading.value = true
  try {
    const data = await getTemplatePage({
      pageNo: pageNo.value,
      pageSize: pageSize.value,
      name: searchKeyword.value || undefined,
      category: searchCategory.value || undefined,
      status: searchStatus.value ?? undefined
    })
    tableData.value = data.list
    total.value = data.total
  } catch (error) {
    console.error('获取模板列表失败:', error)
    msgError('获取模板列表失败')
  } finally {
    loading.value = false
  }
}

// 获取分类列表
const getCategoryList = async () => {
  try {
    categoryList.value = await getTemplateCategories()
  } catch (error) {
    console.error('获取分类列表失败:', error)
  }
}

// 新增
const handleAdd = () => {
  dialogType.value = 'add'
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row: SqlTemplateVO) => {
  dialogType.value = 'edit'
  Object.assign(formData, {
    id: row.id,
    name: row.name,
    description: row.description || '',
    category: row.category,
    content: row.content || '',
    defaultConfig: row.defaultConfig || '{}',
    placeholderConfig: row.placeholderConfig || '',
    sort: row.sort || 0,
    status: row.status || 1
  })
  // 加载占位符配置
  loadPlaceholderConfig(row.placeholderConfig)
  // 解析占位符
  if (row.content) {
    parsePlaceholders(row.content).then(placeholders => {
      placeholderList.value = placeholders.map(p => ({ placeholder: p }))
      // 确保每个占位符都有配置对象
      placeholders.forEach(p => {
        if (!placeholderConfig.value[p]) {
          placeholderConfig.value[p] = {
            label: defaultLabels[p] || p,
            hint: defaultHints[p] || `请输入 ${p}`,
            type: getDefaultPlaceholderType(p)
          }
        }
      })
    })
  }
  dialogVisible.value = true
}

// 复制
const handleCopy = async (row: SqlTemplateVO) => {
  dialogType.value = 'add'
  Object.assign(formData, {
    id: undefined,
    name: `${row.name}_副本`,
    description: row.description || '',
    category: row.category,
    content: row.content || '',
    defaultConfig: row.defaultConfig || '{}',
    placeholderConfig: row.placeholderConfig || '{}',
    sort: row.sort || 0,
    status: row.status || 1
  })
  // 加载占位符配置
  loadPlaceholderConfig(row.placeholderConfig)
  // 解析占位符
  if (row.content) {
    parsePlaceholders(row.content).then(placeholders => {
      placeholderList.value = placeholders.map(p => ({ placeholder: p }))
      // 确保每个占位符都有配置对象
      placeholders.forEach(p => {
        if (!placeholderConfig.value[p]) {
          placeholderConfig.value[p] = {
            label: defaultLabels[p] || p,
            hint: defaultHints[p] || `请输入 ${p}`,
            type: getDefaultPlaceholderType(p)
          }
        }
      })
    })
  }
  dialogVisible.value = true
}

// 删除
const handleDelete = async (row: SqlTemplateVO) => {
  try {
    await ElMessageBox.confirm(`确定要删除模板"${row.name}"吗？`, '删除确认')
    await deleteTemplate(row.id!)
    msgSuccess('删除成功')
    getList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除模板失败:', error)
      msgError('删除失败')
    }
  }
}

// 弹窗关闭
const handleDialogClose = () => {
  formRef.value?.resetFields()
  Object.assign(formData, {
    id: undefined,
    name: '',
    description: '',
    category: '',
    content: '',
    defaultConfig: '{}',
    placeholderConfig: '',
    sort: 0,
    status: 1
  })
  placeholderList.value = []
  placeholderConfig.value = {}
}

// 提交
const handleSubmit = async () => {
  try {
    // 表单验证
    await formRef.value?.validate()
    // 保存占位符配置
    savePlaceholderConfig()
    if (dialogType.value === 'add') {
      await createTemplate(formData)
      msgSuccess('创建成功')
    } else {
      await updateTemplate(formData)
      msgSuccess('更新成功')
    }
    // 关闭弹窗并刷新列表
    dialogVisible.value = false
    getList()
  } catch (error) {
    console.error('保存模板失败:', error)
    // 如果是验证错误或API错误，显示错误消息
    msgError(error?.message || '保存失败，请检查表单信息')
  }
}

// 多选
const handleSelectionChange = (rows: SqlTemplateVO[]) => {
  // TODO: 批量操作
}

onMounted(() => {
  getList()
  getCategoryList()
})
</script>

<style lang="scss" scoped>
.placeholder-config-section {
  width: 100%;

  .section-header {
    display: flex;
    align-items: center;
    gap: 12px;

    .hint-text {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }
}
</style>
