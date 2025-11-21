<template>
  <el-dialog
    v-model="visible"
    title="确认回退"
    width="500px"
    :before-close="handleClose"
  >
    <div class="rollback-confirm">
      <el-alert
        title="警告"
        type="warning"
        :closable="false"
        show-icon
        style="margin-bottom: 20px"
      >
        <template #default>
          回退操作将会覆盖当前文件内容，该操作不可撤销！
        </template>
      </el-alert>

      <div class="rollback-info" v-if="version">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="文件名">
            <strong>{{ fileName || '未知文件' }}</strong>
          </el-descriptions-item>

          <el-descriptions-item label="目标版本">
            <el-tag type="primary" size="large">v{{ version.versionNumber }}</el-tag>
          </el-descriptions-item>

          <el-descriptions-item label="版本信息">
            <div class="version-meta">
              <div>创建时间：{{ formatTime(version.createTime,'yyyy-MM-dd HH:mm:ss') }}</div>
              <div>创建者：{{ version.creator }}</div>
              <div v-if="version.remark">备注：{{ version.remark }}</div>
            </div>
          </el-descriptions-item>

          <el-descriptions-item label="配置信息" v-if="version.config">
            <div class="version-config">
              <el-tag size="small" type="success">{{ version.config.executionMode || 'local' }}</el-tag>
              <span class="config-divider">|</span>
              <el-tag size="small" type="warning">并行度: {{ version.config.parallelism || 1 }}</el-tag>
              <span class="config-divider">|</span>
              <el-tag size="small" type="info">Flink: {{ version.config.flinkVersion || '1.16' }}</el-tag>
              <div class="checkpoint-info">检查点间隔：{{ (version.config.checkpointInterval || 5000) + 'ms' }}</div>
            </div>
          </el-descriptions-item>

          <el-descriptions-item label="操作说明" :span="2">
            <div class="rollback-desc">
              <p>1. 该版本的脚本内容将覆盖当前文件内容</p>
              <p>2. <strong>该版本的配置信息（执行模式、并行度、Flink版本等）将覆盖当前文件配置</strong></p>
              <p>3. 回退操作会创建一个新的版本记录</p>
            </div>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button
          type="danger"
          @click="handleConfirm"
          :loading="loading"
        >
          确认回退
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, defineExpose } from 'vue'
import { formatTime } from '@/utils'
import type { VersionDetail } from '@/api/dataStudio/version'

// Props
interface Props {
  modelValue: boolean
  version?: VersionDetail
  fileName?: string
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'confirm': []
}>()

// 响应式数据
const visible = ref(false)
const loading = ref(false)

// 监听 visible 变化
watch(
  () => props.modelValue,
  (val) => {
    visible.value = val
  },
  { immediate: true }
)

// 监听 visible 变化，同步到父组件
watch(visible, (val) => {
  emit('update:modelValue', val)
})

// 处理关闭
const handleClose = () => {
  visible.value = false
}

// 处理确认
const handleConfirm = () => {
  emit('confirm')
}

// 暴露方法
defineExpose({
  show: () => {
    visible.value = true
  }
})
</script>

<style scoped>
.rollback-confirm {
  padding: 10px 0;
}

.rollback-info {
  margin-bottom: 10px;
}

.version-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
  color: #606266;
}

.version-config {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
}

.config-divider {
  color: var(--el-text-color-disabled);
  font-size: 12px;
}

.checkpoint-info {
  color: #606266;
  font-size: 12px;
}

.rollback-desc {
  font-size: 13px;
  color: #606266;
}

.rollback-desc p {
  margin: 5px 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
