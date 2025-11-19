<template>
  <el-dialog
    v-model="visible"
    :title="`版本详情 v${versionDetail?.versionNumber || ''}`"
    width="70%"
    :before-close="handleClose"
  >
    <div class="version-detail" v-loading="loading">
      <!-- 版本基本信息 -->
      <div class="version-info" v-if="versionDetail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="版本号">
            <el-tag type="primary">v{{ versionDetail.versionNumber }}</el-tag>
          </el-descriptions-item>

          <el-descriptions-item label="版本类型">
            <el-tag :type="versionDetail.versionType === 'manual' ? 'primary' : 'info'">
              {{ versionDetail.versionType === 'manual' ? '手动保存' : '自动保存' }}
            </el-tag>
          </el-descriptions-item>

          <el-descriptions-item label="创建时间">
            {{ formatTime(versionDetail.createTime, 'yyyy-MM-dd HH:mm:ss') }}
          </el-descriptions-item>

          <el-descriptions-item label="创建者">
            {{ versionDetail.creator }}
          </el-descriptions-item>

          <el-descriptions-item label="版本备注" :span="2">
            {{ versionDetail.remark || '无' }}
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 脚本内容 -->
      <div class="content-section">
        <h4>脚本内容</h4>
        <el-input
          v-model="versionDetail.content"
          type="textarea"
          :autosize="{ minRows: 10, maxRows: 20 }"
          readonly
          style="width: 100%"
        />
      </div>

      <!-- 配置信息 -->
      <div class="config-section" v-if="versionDetail?.config">
        <h4>Flink配置</h4>
        <el-card>
          <pre class="config-json">{{ JSON.stringify(versionDetail.config, null, 2) }}</pre>
        </el-card>
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button
          type="danger"
          @click="handleRollback"
          :loading="rollbackLoading"
        >
          回退到此版本
        </el-button>
      </span>
    </template>

    <!-- 回退确认弹窗 -->
    <RollbackConfirmDialog
      v-model="rollbackDialogVisible"
      :version="versionDetail"
      :file-name="fileName"
      @confirm="confirmRollback"
    />
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, defineExpose } from 'vue'
import { ElMessage } from 'element-plus'
import { formatTime } from '@/utils'
import { getVersionDetail, type VersionDetail } from '@/api/dataStudio/version'
import RollbackConfirmDialog from './RollbackConfirmDialog.vue'

// Props
interface Props {
  modelValue: boolean
  versionId?: number
  fileName?: string
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'rollback': []
  'deleted': []
}>()

// 响应式数据
const visible = ref(false)
const versionDetail = ref<VersionDetail>()
const loading = ref(false)
const rollbackLoading = ref(false)
const rollbackDialogVisible = ref(false)

// 监听 visible 变化
watch(
  () => props.modelValue,
  (val) => {
    visible.value = val
    if (val && props.versionId) {
      loadVersionDetail()
    }
  },
  { immediate: true }
)

// 监听 visible 变化，同步到父组件
watch(visible, (val) => {
  emit('update:modelValue', val)
})

// 加载版本详情
const loadVersionDetail = async () => {
  if (!props.versionId) return

  loading.value = true
  try {
    const resp = await getVersionDetail(props.versionId)
    versionDetail.value = resp
  } catch (error: any) {
    ElMessage.error(error.message || '获取版本详情失败')
  } finally {
    loading.value = false
  }
}

// 处理关闭
const handleClose = () => {
  visible.value = false
}

// 处理回退
const handleRollback = () => {
  rollbackDialogVisible.value = true
}

// 确认回退
const confirmRollback = async () => {
  if (!versionDetail.value) return

  rollbackLoading.value = true
  try {
    // 调用回退接口
    const { rollbackVersion } = await import('@/api/dataStudio/version')
    await rollbackVersion(versionDetail.value.id)

    ElMessage.success('版本回退成功')
    rollbackDialogVisible.value = false
    visible.value = false
    emit('rollback')
  } catch (error: any) {
    ElMessage.error(error.message || '版本回退失败')
  } finally {
    rollbackLoading.value = false
  }
}

// 暴露方法
defineExpose({
  show: () => {
    visible.value = true
  }
})
</script>

<style scoped>
.version-detail {
  max-height: 70vh;
  overflow-y: auto;
}

.version-info {
  margin-bottom: 20px;
}

.content-section,
.config-section {
  margin-top: 20px;
}

.content-section h4,
.config-section h4 {
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 600;
}

.config-json {
  margin: 0;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
  font-size: 12px;
  font-family: Monaco, Consolas, 'Courier New', monospace;
  max-height: 300px;
  overflow-y: auto;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
