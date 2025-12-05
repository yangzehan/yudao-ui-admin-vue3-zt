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
        <h4>脚本内容</h4>
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
        <h4>Flink配置</h4>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="执行类型">
            <el-tag :type="(versionDetail.config.executionType || 'stream') === 'stream' ? 'primary' : 'info'">
              {{
                (versionDetail.config.executionType || 'stream') === 'stream' ? '流处理' :
                (versionDetail.config.executionType || 'stream') === 'batch' ? '批处理' :
                versionDetail.config.executionType || '-'
              }}
            </el-tag>
          </el-descriptions-item>

          <el-descriptions-item label="部署模式">
            <el-tag
              :type="(versionDetail.config.deployMode || versionDetail.config.executionMode || 'local') === 'local' ? 'success' :
                     (versionDetail.config.deployMode || versionDetail.config.executionMode || 'local') === 'remote' ? 'warning' : 'primary'"
            >
              {{
                (versionDetail.config.deployMode || versionDetail.config.executionMode || 'local') === 'local' ? '本地模式' :
                (versionDetail.config.deployMode || versionDetail.config.executionMode || 'local') === 'remote' ? '远程模式' :
                (versionDetail.config.deployMode || versionDetail.config.executionMode || 'local') === 'yarn-application' ? 'Yarn Application模式' :
                versionDetail.config.deployMode || versionDetail.config.executionMode || '-'
              }}
            </el-tag>
          </el-descriptions-item>

          <!-- 集群信息（remote和yarn-application模式显示） -->
          <el-descriptions-item
            v-if="versionDetail.config.clusterId"
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
            v-if="versionDetail.config.flinkVersion &&
                  ((versionDetail.config.deployMode || versionDetail.config.executionMode) === 'local' ||
                   (versionDetail.config.deployMode || versionDetail.config.executionMode) === 'yarn-application')"
            label="Flink版本"
          >
            <el-tag type="info">{{ versionDetail.config.flinkVersion }}</el-tag>
          </el-descriptions-item>

          <el-descriptions-item label="并行度">
            <el-tag type="warning">{{ versionDetail.config.parallelism || 1 }}</el-tag>
          </el-descriptions-item>

          <el-descriptions-item label="检查点间隔">
            <span>{{ (versionDetail.config.checkpointInterval || 5000) + 'ms' }}</span>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 扩展配置项 -->
        <div v-if="versionDetail.config.extendedConfig && Object.keys(versionDetail.config.extendedConfig).length > 0" class="extended-config">
          <h4>扩展配置</h4>
          <el-descriptions :column="2" border>
            <template v-for="(value, key) in versionDetail.config.extendedConfig" :key="key">
              <el-descriptions-item :label="formatConfigKey(key)">
                <span>{{ formatConfigValue(value) }}</span>
              </el-descriptions-item>
            </template>
          </el-descriptions>
        </div>
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
import {defineExpose, ref, watch, onUnmounted} from 'vue'
import {ElMessage} from 'element-plus'
import {formatTime} from '@/utils'
import {getVersionDetail, type VersionDetail} from '@/api/dataStudio/version'
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
      // 兼容性处理：如果旧版本数据中只有executionMode，则转换为新的配置结构
      if (detail.config && detail.config.executionMode && !detail.config.executionType) {
        detail.config.executionType = 'stream'  // 默认值
      }
      if (detail.config && detail.config.executionMode && !detail.config.deployMode) {
        detail.config.deployMode = detail.config.executionMode
      }

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

// 组件卸载时设置标志，防止异步更新
onUnmounted(() => {
  isUnmounted.value = true
})

// 格式化配置项的键名
const formatConfigKey = (key: string): string => {
  // 将驼峰命名转换为中文描述
  const keyMap: Record<string, string> = {
    'restartStrategy': '重启策略',
    'checkpointingMode': '检查点模式',
    'checkpointTimeout': '检查点超时',
    'minPauseBetweenCheckpoints': '检查点最小间隔',
    'maxConcurrentCheckpoints': '最大并发检查点数',
    'restartAttempts': '重启次数',
    'delayInterval': '重启延迟间隔',
    'stateBackend': '状态后端',
    'checkpointStorage': '检查点存储',
    'sqlDialect': 'SQL方言',
    'jobName': '任务名称',
    'description': '任务描述'
  }
  return keyMap[key] || key
}

// 格式化配置项的值
const formatConfigValue = (value: any): string => {
  if (value === null || value === undefined) {
    return '-'
  }
  if (typeof value === 'boolean') {
    return value ? '是' : '否'
  }
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return String(value)
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

.config-section {
  margin-top: 20px;
}

.config-section h4 {
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 600;
}

.extended-config {
  margin-top: 20px;
}

.extended-config h4 {
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
