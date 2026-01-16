<template>
  <el-dialog
    v-model="dialogVisible"
    :title="`模板详情 - ${template?.name || ''}`"
    width="900px"
    top="5vh"
    :close-on-click-modal="false"
    class="template-detail-dialog"
  >
    <div class="template-detail-container" v-if="template">
      <!-- 基本信息 -->
      <el-descriptions :column="2" border>
        <el-descriptions-item label="模板名称">
          {{ template.name }}
        </el-descriptions-item>
        <el-descriptions-item label="模板分类">
          <el-tag>{{ getCategoryLabel(template.category) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建者">
          {{ template.creator || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ formatDate(template.createTime) }}
        </el-descriptions-item>
        <el-descriptions-item label="模板描述" :span="2">
          {{ template.description || '暂无描述' }}
        </el-descriptions-item>
      </el-descriptions>

      <!-- 默认配置 -->
      <div class="config-section" v-if="template.defaultConfig">
        <div class="section-title">
          <el-icon><Setting /></el-icon>
          <span>默认配置</span>
        </div>
        <MonacoEditor
          :model-value="formatConfig(template.defaultConfig)"
          language="json"
          :height="120"
          :options="configEditorOptions"
          readonly
        />
      </div>

      <!-- 模板内容 -->
      <div class="content-section">
        <div class="section-title">
          <el-icon><Document /></el-icon>
          <span>模板内容</span>
          <el-button
            type="primary"
            size="small"
            class="ml-auto"
            :icon="CopyDocument"
            @click="handleCopyContent"
          >
            复制内容
          </el-button>
        </div>
        <MonacoEditor
          :model-value="template.content"
          language="sql"
          :height="350"
          :options="contentEditorOptions"
          readonly
        />
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <div class="placeholder-hint" v-if="hasPlaceholders">
          <el-icon><InfoFilled /></el-icon>
          <span>模板中包含占位符，创建文件时可自动填充</span>
        </div>
        <div>
          <el-button @click="dialogVisible = false">关闭</el-button>
          <el-button type="primary" @click="handleUse" :icon="Check">
            使用此模板
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { CopyDocument, Check, Setting, Document, InfoFilled } from '@element-plus/icons-vue'
import MonacoEditor from '@/components/monaco-editor/MonacoEditor.vue'
import { useMessage } from '@/hooks/web/useMessage'
import { SqlTemplateDetailVO } from '@/api/dataStudio/template'

const props = defineProps<{
  modelValue: boolean
  template: SqlTemplateDetailVO | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'use': [template: SqlTemplateDetailVO]
}>()

const { message, msgSuccess } = useMessage()

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// 检查是否有占位符
const hasPlaceholders = computed(() => {
  if (!props.template?.content) return false
  return props.template.content.includes('${')
})

// 格式化配置显示
const formatConfig = (config: any) => {
  if (typeof config === 'string') {
    try {
      return JSON.stringify(JSON.parse(config), null, 2)
    } catch {
      return config
    }
  }
  return JSON.stringify(config, null, 2)
}

// 获取分类标签
const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    datastream: 'Datastream作业',
    datasource: '数据源',
    sql: '通用SQL',
    etl: '数据清洗',
    alert: '告警'
  }
  return labels[category] || category
}

// 格式化日期
const formatDate = (date: string | Date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

// 编辑器配置
const configEditorOptions = {
  fontSize: 12,
  minimap: { enabled: false },
  automaticLayout: true,
  scrollBeyondLastLine: false,
  wordWrap: 'on',
  readOnly: true
}

const contentEditorOptions = {
  fontSize: 14,
  minimap: { enabled: true },
  automaticLayout: true,
  scrollBeyondLastLine: false,
  wordWrap: 'on',
  lineNumbers: 'on',
  readOnly: true
}

// 复制内容
const handleCopyContent = async () => {
  if (!props.template?.content) return
  try {
    await navigator.clipboard.writeText(props.template.content)
    msgSuccess('已复制到剪贴板')
  } catch {
    message.error('复制失败')
  }
}

// 使用模板
const handleUse = () => {
  if (props.template) {
    emit('use', props.template)
    dialogVisible.value = false
  }
}
</script>

<style lang="scss" scoped>
.template-detail-dialog {
  :deep(.el-dialog__body) {
    padding: 16px 20px;
  }
}

.template-detail-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.config-section,
.content-section {
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

  :deep(.monaco-editor) {
    border: 1px solid var(--el-border-color-light);
    border-radius: 4px;
  }
}

.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .placeholder-hint {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--el-color-warning);
    font-size: 13px;
  }
}
</style>
