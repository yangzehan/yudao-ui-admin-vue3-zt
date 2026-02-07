<template>
  <el-dialog
    v-model="dialogVisible"
    title="选择 YAML 模板"
    width="1000px"
    top="5vh"
    :close-on-click-modal="false"
    class="yaml-template-select-dialog"
  >
    <div class="template-select-container">
      <!-- 分类筛选 -->
      <div class="category-tabs">
        <el-radio-group v-model="selectedCategory" @change="handleCategoryChange">
          <el-radio-button label="">全部</el-radio-button>
          <el-radio-button
            v-for="cat in categoryList"
            :key="cat"
            :label="cat"
          >
            {{ getCategoryLabel(cat) }}
          </el-radio-button>
        </el-radio-group>
      </div>

      <!-- 模板卡片网格 -->
      <div class="template-grid">
        <div
          v-for="template in templateList"
          :key="template.id"
          class="template-card"
          :class="{ 'is-selected': selectedId === template.id }"
          @click="handleSelect(template)"
        >
          <div class="card-header">
            <el-icon v-if="getCategoryIcon(template.category)" class="category-icon">
              <component :is="getCategoryIcon(template.category)" />
            </el-icon>
            <span class="template-name">{{ template.name }}</span>
            <el-tag size="small" class="ml-auto">{{ getCategoryLabel(template.category) }}</el-tag>
          </div>
          <div class="card-description">{{ template.description || '暂无描述' }}</div>
          <div class="card-preview">
            <MonacoEditor
              :model-value="getPreviewContent(template)"
              language="yaml"
              :height="180"
              :options="editorOptions"
              readonly
            />
          </div>
          <div class="card-actions">
            <el-button size="small" type="primary" plain @click.stop="handleDetail(template)">
              详情
            </el-button>
          </div>
        </div>

        <!-- 空状态 -->
        <el-empty
          v-if="templateList.length === 0 && !loading"
          description="暂无 YAML 模板，请先创建模板"
          :image-size="120"
        />
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <el-icon class="is-loading" :size="32">
          <Loading />
        </el-icon>
        <span class="ml-8px">加载中...</span>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <div class="selected-info" v-if="selectedTemplate">
          已选择: <strong>{{ selectedTemplate.name }}</strong>
        </div>
        <div>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :disabled="!selectedId" @click="handleNext">
            下一步
          </el-button>
        </div>
      </div>
    </template>

    <!-- 模板详情弹窗 -->
    <YamlTemplateDetailDialog
      v-model="detailDialogVisible"
      :template="currentDetailTemplate"
      @use="handleUseTemplate"
    />
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import MonacoEditor from '@/components/monaco-editor/MonacoEditor.vue'
import YamlTemplateDetailDialog from './YamlTemplateDetailDialog.vue'
import {
  getTemplateList,
  getTemplateCategories,
  getTemplateDetail,
  SqlTemplateVO,
  SqlTemplateDetailVO
} from '@/api/dataStudio/template'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'select': [template: SqlTemplateDetailVO, fileName: string]
}>()

// 响应式数据
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const loading = ref(false)
const templateList = ref<SqlTemplateVO[]>([])
const categoryList = ref<string[]>([])
const selectedCategory = ref('')
const selectedId = ref<number | null>(null)
const selectedTemplate = computed(() =>
  templateList.value.find(t => t.id === selectedId.value)
)

// 详情弹窗
const detailDialogVisible = ref(false)
const currentDetailTemplate = ref<SqlTemplateDetailVO | null>(null)

// 编辑器配置
const editorOptions = {
  fontSize: 12,
  minimap: { enabled: false },
  automaticLayout: true,
  scrollBeyondLastLine: false,
  wordWrap: 'on',
  lineNumbers: 'on',
  folding: true,
  renderWhitespace: 'selection',
  contextmenu: true,
  readOnly: true,
  selectOnLineNumbers: true,
  cursorStyle: 'line',
  cursorBlinking: 'blink',
  foldingHighlight: true,
  showFoldingControls: 'always',
  smoothScrolling: true
}

// 获取分类标签
const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    datasource: '数据源',
    sql: 'SQL',
    etl: 'ETL',
    alert: '告警',
    yaml: 'YAML'
  }
  return labels[category] || category
}

// 获取分类图标
const getCategoryIcon = (category: string) => {
  const icons: Record<string, string> = {
    datasource: 'Connection',
    sql: 'Document',
    etl: 'DataLine',
    alert: 'Warning',
    yaml: 'Document'
  }
  return icons[category] || 'Document'
}

// 获取预览内容（截取前500字符）
const getPreviewContent = (template: SqlTemplateVO) => {
  if (!template.content) return '# 暂无内容'
  const content = template.content
  if (content.length > 500) {
    return content.substring(0, 500) + '\n# ...'
  }
  return content
}

// 加载模板列表
const loadTemplates = async () => {
  loading.value = true
  try {
    const allTemplates = await getTemplateList({
      category: selectedCategory.value || undefined
    })
    // 只保留 YAML 相关的模板，排除 SQL 类型
    templateList.value = allTemplates.filter(t => {
      // 排除 SQL 类型
      if (t.category === 'sql') {
        return false
      }
      // 如果分类是 yaml 或 etl，直接包含
      if (t.category === 'yaml' || t.category === 'etl') {
        return true
      }
      // 如果内容是 YAML 格式，也包含
      if (t.content && (t.content.startsWith('---') || t.content.includes('source:') || t.content.includes('sink:'))) {
        return true
      }
      return false
    })
  } catch (error) {
    console.error('加载模板列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 加载分类列表
const loadCategories = async () => {
  try {
    const allCategories = await getTemplateCategories()
    // 只保留 YAML 相关的分类（排除 SQL）
    categoryList.value = allCategories.filter(cat => cat !== 'sql')
  } catch (error) {
    console.error('加载分类列表失败:', error)
  }
}

// 分类切换
const handleCategoryChange = () => {
  loadTemplates()
}

// 选择模板
const handleSelect = (template: SqlTemplateVO) => {
  selectedId.value = template.id ?? null
}

// 查看详情
const handleDetail = async (template: SqlTemplateVO) => {
  try {
    const detail = await getTemplateDetail(template.id!)
    currentDetailTemplate.value = detail
    detailDialogVisible.value = true
  } catch (error) {
    console.error('获取模板详情失败:', error)
  }
}

// 使用模板（从详情弹窗）
const handleUseTemplate = (template: SqlTemplateDetailVO) => {
  detailDialogVisible.value = false
  selectedId.value = template.id ?? null
}

// 下一步
const handleNext = () => {
  if (!selectedTemplate.value) return

  // 弹出文件命名对话框
  // 这里直接触发select事件，由父组件处理后续流程
  emit('select', selectedTemplate.value as unknown as SqlTemplateDetailVO, '')
  dialogVisible.value = false
}

// 监听弹窗显示
watch(() => props.modelValue, (val) => {
  if (val) {
    loadTemplates()
    loadCategories()
  }
})

onMounted(() => {
  loadCategories()
})
</script>

<style lang="scss" scoped>
.yaml-template-select-dialog {
  :deep(.el-dialog__body) {
    padding: 16px 20px;
  }
}

.template-select-container {
  display: flex;
  flex-direction: column;
  height: 600px;
}

.category-tabs {
  flex-shrink: 0;
  margin-bottom: 16px;
  overflow-x: auto;
}

.template-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  overflow-y: auto;
  padding: 4px;
}

.template-card {
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--el-bg-color);

  &:hover {
    border-color: var(--el-color-primary);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  &.is-selected {
    border-color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    box-shadow: 0 0 0 2px var(--el-color-primary-light-5);
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;

    .category-icon {
      color: var(--el-color-primary);
    }

    .template-name {
      font-weight: 600;
      font-size: 14px;
      color: var(--el-text-color-primary);
    }

    .ml-auto {
      margin-left: auto;
    }
  }

  .card-description {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-bottom: 8px;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .card-preview {
    margin-bottom: 8px;
    border: 1px solid var(--el-border-color-light);
    border-radius: 4px;
    overflow: hidden;
  }

  .card-actions {
    display: flex;
    justify-content: flex-end;
  }
}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: var(--el-text-color-secondary);
}

.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .selected-info {
    color: var(--el-text-color-primary);
  }
}
</style>
