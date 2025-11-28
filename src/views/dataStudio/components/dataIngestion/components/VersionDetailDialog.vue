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
      <div class="content-section" v-if="versionDetail">
        <h4>文件内容</h4>
        <el-input
          :model-value="versionDetail.content || ''"
          type="textarea"
          :autosize="{ minRows: 10, maxRows: 20 }"
          readonly
          style="width: 100%"
        />
      </div>

      <!-- 配置信息 -->
      <div class="config-section" v-if="versionDetail?.config">
        <h4>文件配置</h4>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="文件类型">
            <el-tag type="success">{{ versionDetail.config.type || 'file' }}</el-tag>
          </el-descriptions-item>

          <el-descriptions-item label="父文件夹ID">
            <span>{{ versionDetail.config.parentId || '-' }}</span>
          </el-descriptions-item>

          <el-descriptions-item label="文件路径">
            <span>{{ versionDetail.config.filePath || '-' }}</span>
          </el-descriptions-item>

          <el-descriptions-item label="显示顺序">
            <el-tag type="warning">{{ versionDetail.config.sort || 0 }}</el-tag>
          </el-descriptions-item>

          <el-descriptions-item label="文件大小">
            <span>{{ formatFileSize(versionDetail.config.fileSize) }}</span>
          </el-descriptions-item>

          <el-descriptions-item label="状态">
            <el-tag :type="versionDetail.config.status === 1 ? 'success' : 'info'">
              {{ versionDetail.config.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- Flink任务配置信息 -->
      <div class="flink-config-section" v-if="hasFlinkConfig">
        <h4>Flink任务配置</h4>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="执行模式">
            <el-tag v-if="versionDetail.config?.executionMode" type="primary">
              {{ getExecutionModeLabel(versionDetail.config.executionMode) }}
            </el-tag>
            <span v-else>-</span>
          </el-descriptions-item>

          <!-- 集群信息（remote和yarn-application模式显示） -->
          <el-descriptions-item
            v-if="versionDetail.config?.clusterId"
            label="选择的集群"
          >
            <div v-if="clusterInfo">
              <div class="flex items-center gap-8px">
                <span>{{ clusterInfo.name }}</span>
                <el-tag size="small" :type="clusterInfo.status === 'available' ? 'success' : 'info'">
                  {{ clusterInfo.status }}
                </el-tag>
              </div>
              <div class="text-12px text-[var(--el-color-info)] mt-4px">
                类型: {{ clusterInfo.type === 'remote' ? '远程集群' : 'Yarn集群' }}
                <span v-if="clusterInfo.flinkVersion"> | Flink {{ clusterInfo.flinkVersion }}</span>
              </div>
            </div>
            <div v-else class="text-[var(--el-color-info)]">
              集群ID: {{ versionDetail.config.clusterId }}
            </div>
          </el-descriptions-item>

          <!-- Flink版本（local和yarn-application模式显示） -->
          <el-descriptions-item
            v-if="versionDetail.config?.flinkVersion &&
                  (versionDetail.config?.executionMode === 'local' ||
                   versionDetail.config?.executionMode === 'yarn-application')"
            label="Flink版本"
          >
            <el-tag type="success">
              {{ versionDetail.config.flinkVersion }}
            </el-tag>
          </el-descriptions-item>

          <el-descriptions-item label="并行度">
            <el-tag v-if="versionDetail.config?.parallelism !== undefined" type="warning">
              {{ versionDetail.config.parallelism }}
            </el-tag>
            <span v-else>-</span>
          </el-descriptions-item>

          <el-descriptions-item label="检查点间隔 (ms)">
            <span v-if="versionDetail.config?.checkpointInterval !== undefined">
              {{ versionDetail.config.checkpointInterval }}
            </span>
            <span v-else>-</span>
          </el-descriptions-item>
        </el-descriptions>
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
import {defineExpose, ref, watch, onUnmounted, computed} from 'vue'
import {ElMessage} from 'element-plus'
import {formatTime} from '@/utils'
import {getVersionDetail, type VersionDetail} from '@/api/dataStudio/dataIngestionVersion'
import {flinkClusterApi, FlinkCluster} from '@/api/dataStudio/flinkCluster'
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
const versionDetail = ref<VersionDetail>({} as VersionDetail)
const loading = ref(false)
const rollbackLoading = ref(false)
const rollbackDialogVisible = ref(false)
const isUnmounted = ref(false)
const clusterInfo = ref<FlinkCluster | null>(null)

// 计算是否有Flink配置信息
const hasFlinkConfig = computed(() => {
  const config = versionDetail.value.config
  return config && (
    config.executionMode ||
    config.flinkVersion ||
    config.parallelism !== undefined ||
    config.checkpointInterval !== undefined
  )
})

// 获取执行模式标签
const getExecutionModeLabel = (mode: string): string => {
  const modeMap: Record<string, string> = {
    'local': '本地模式',
    'remote': '远程模式',
    'yarn-application': 'Yarn Application模式',
    'cluster': '集群模式'
  }
  return modeMap[mode] || mode
}

// 监听 visible 变化
watch(
  () => props.modelValue,
  (val) => {
    console.log("visible变化")
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

// 监听 versionId 变化，加载详情
watch(
  () => props.versionId,
  (newVal) => {
    if (newVal && visible.value) {
      loadVersionDetail()
    }
  }
)

// 加载集群信息
const loadClusterInfo = async (clusterId: number) => {
  try {
    const cluster = await flinkClusterApi.getDetail(clusterId)
    if (!isUnmounted.value && visible.value) {
      clusterInfo.value = cluster
    }
  } catch (error) {
    console.error('加载集群信息失败:', error)
    clusterInfo.value = null
  }
}

// 加载版本详情
const loadVersionDetail = async () => {
  if (!props.versionId || !visible.value || isUnmounted.value) return

  loading.value = true
  try {
    const detail = await getVersionDetail(props.versionId)
    // 确保组件未卸载且仍然可见
    if (!isUnmounted.value && visible.value) {
      versionDetail.value = detail

      // 如果配置中有clusterId，加载集群信息
      if (detail.config?.clusterId) {
        await loadClusterInfo(detail.config.clusterId)
      } else {
        clusterInfo.value = null
      }
    }
  } catch (error: any) {
    // 确保组件未卸载才显示错误
    if (!isUnmounted.value && visible.value) {
      ElMessage.error(error.message || '获取版本详情失败')
    }
  } finally {
    // 确保组件未卸载才更新 loading 状态
    if (!isUnmounted.value) {
      loading.value = false
    }
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
    const { rollbackVersion } = await import('@/api/dataStudio/dataIngestionVersion')
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

// 组件卸载时设置标志，防止异步更新
onUnmounted(() => {
  isUnmounted.value = true
})

// 格式化文件大小
const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '-'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
}
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

.config-section,
.flink-config-section {
  margin-top: 20px;
}

.config-section h4,
.flink-config-section h4 {
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 600;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
