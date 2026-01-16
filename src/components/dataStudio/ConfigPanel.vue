<script setup lang="ts">
import { defineProps, ref, watch, computed, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { QuestionFilled, InfoFilled } from '@element-plus/icons-vue'
import { flinkClusterApi, FlinkCluster, ClusterType, ClusterStatus } from '@/api/dataStudio/flinkCluster'

// 定义props
const props = defineProps<{
  file?: {
    id?: number
    name: string
    content: string
    config?: any
    [key: string]: any
  }
  showExecutionType?: boolean  // 是否显示执行类型选项
  showFlinkCdcDistJarPath?: boolean  // 是否显示Flink CDC Dist Jar包路径字段（仅数据集成页面显示）
}>()

// 默认值
const propsWithDefaults = computed(() => ({
  showExecutionType: props.showExecutionType ?? true,  // 默认显示执行类型
  showCdcDistJarPath: props.showFlinkCdcDistJarPath ?? true  // 默认显示CDC Jar路径
}))

// 定义emit事件
const emit = defineEmits<{
  (e: 'update:config', value: any): void
}>()

// 配置项数据 - 使用 ref
const configData = ref({
  executionType: 'stream',
  deployMode: 'local',
  flinkVersion: '1.16',
  parallelism: 1,
  checkpointInterval: 5000,
  checkpointPath: '',  // 检查点路径，不填则使用后端默认配置
  clusterId: undefined as number | undefined,
  savepointPath: ''  // 保存点路径，不填则使用后端默认配置
})

// 监听 showExecutionType 变化，决定是否保留 executionType
watch(() => propsWithDefaults.value.showExecutionType, (newVal) => {
  if (!newVal) {
    // 如果不显示执行类型，则从配置中移除
    delete configData.value.executionType
  } else if (!configData.value.executionType) {
    // 如果需要显示但没有值，则设置默认值
    configData.value.executionType = 'stream'
  }
}, { immediate: true })

// 集群列表状态
const clusterList = ref<FlinkCluster[]>([])
const clusterLoading = ref(false)

// 标记是否正在从外部同步数据（避免循环更新）
const isSyncingFromExternal = ref(false)

// 同步外部配置到本地
watch(() => props.file?.config, (newConfig) => {
  if (newConfig) {
    isSyncingFromExternal.value = true
    configData.value = {
      ...configData.value,
      ...newConfig
    }
    // 使用 nextTick 确保配置同步完成后再重置标志位
    nextTick(() => {
      isSyncingFromExternal.value = false
    })
  }
}, { immediate: true, deep: true })

// 监听本地配置变化，通知父组件（排除同步操作）
watch(configData, (newConfig) => {
  if (!isSyncingFromExternal.value) {
    emit('update:config', { ...newConfig })
  }
}, { deep: true })

// 是否显示Flink CDC Dist Jar包路径（仅yarn-application模式且props为true时显示）
const shouldShowCdcDistJarPath = computed(() => {
  return propsWithDefaults.value.showCdcDistJarPath && configData.value.deployMode === 'yarn-application'
})

// 是否显示Flink版本选择
const showFlinkVersion = computed(() => {
  return configData.value.deployMode === 'local' ||
         configData.value.deployMode === 'yarn-application'
})

// 是否显示集群选择
const showClusterSelect = computed(() => {
  return configData.value.deployMode === 'remote' ||
         configData.value.deployMode === 'yarn-application'
})

// 集群类型
const clusterType = computed<ClusterType | null>(() => {
  if (configData.value.deployMode === 'remote') return ClusterType.REMOTE
  if (configData.value.deployMode === 'yarn-application') return ClusterType.YARN
  return null
})

// 集群类型描述
const clusterTypeDesc = computed(() => {
  if (clusterType.value === ClusterType.REMOTE) return '远程独立部署的Flink集群'
  if (clusterType.value === ClusterType.YARN) return 'Flink on Yarn集群'
  return ''
})

// 加载集群列表
const loadClusters = async (type: ClusterType) => {
  try {
    clusterLoading.value = true
    const resp = await flinkClusterApi.getList({
      type,
      page: 1,
      pageSize: 100
    })
    clusterList.value = resp.list || []
  } catch (error) {
    console.error('加载集群列表失败:', error)
    ElMessage.error('加载集群列表失败')
    clusterList.value = []
  } finally {
    clusterLoading.value = false
  }
}

// 监听部署模式变化，自动加载对应的集群列表
watch(() => configData.value.deployMode, (newMode) => {
  if (newMode === 'remote') {
    loadClusters(ClusterType.REMOTE)
  } else if (newMode === 'yarn-application') {
    loadClusters(ClusterType.YARN)
  } else if (newMode === 'local') {
    // 切换到local模式时清空clusterId
    configData.value.clusterId = undefined
  }
}, { immediate: false })

// 验证配置项
const validateConfig = (config: typeof configData.value): boolean => {
  // 并行度验证
  if (config.parallelism < 1 || config.parallelism > 1000) {
    ElMessage.warning('并行度必须在 1-1000 之间')
    return false
  }

  // 检查点间隔验证
  if (config.checkpointInterval < 1000) {
    ElMessage.warning('检查点间隔不能小于 1000ms')
    return false
  }

  if (config.checkpointInterval > 3600000) {
    ElMessage.warning('检查点间隔不能大于 3600000ms（1小时）')
    return false
  }

  // 执行类型验证
  const validExecutionTypes = ['batch', 'stream']
  if (!validExecutionTypes.includes(config.executionType)) {
    ElMessage.warning('请选择有效的执行类型')
    return false
  }

  // 部署模式验证
  const validdeployModes = ['local', 'remote', 'yarn-application']
  if (!validdeployModes.includes(config.deployMode)) {
    ElMessage.warning('请选择有效的部署模式')
    return false
  }

  // Flink版本验证（local和yarn-application模式必填）
  if (config.deployMode === 'local' || config.deployMode === 'yarn-application') {
    const validVersions = ['1.14', '1.15', '1.16', '1.17', '1.18']
    if (!config.flinkVersion || !validVersions.includes(config.flinkVersion)) {
      ElMessage.warning('请选择有效的Flink版本')
      return false
    }
  }

  // 集群选择验证（remote和yarn-application模式必填）
  if (config.deployMode === 'remote' || config.deployMode === 'yarn-application') {
    if (!config.clusterId) {
      ElMessage.warning('请选择集群')
      return false
    }
  }

  // Flink CDC Dist Jar包路径验证（yarn-application模式必填）
  if (config.deployMode === 'yarn-application') {
    if (!config.flinkCdcDistJarPath || !config.flinkCdcDistJarPath.trim()) {
      ElMessage.warning('请填写Flink CDC Dist Jar包路径')
      return false
    }
  }

  return true
}

// 组件挂载时加载集群列表
onMounted(() => {
  // 如果当前配置已选择了remote或yarn-application模式，加载对应集群列表
  const mode = configData.value.deployMode
  if (mode === 'remote') {
    loadClusters(ClusterType.REMOTE)
  } else if (mode === 'yarn-application') {
    loadClusters(ClusterType.YARN)
  }
})

// 向外暴露方法和数据，供父组件使用
defineExpose({
  getConfig: () => configData.value,
  validateConfig
})
</script>

<template>
  <div class="h-full flex flex-col bg-[var(--el-bg-color)]">
    <!-- 配置面板头部 -->
    <div class="flex-shrink-0 px-16px py-12px border-b border-[var(--el-border-color)] bg-[var(--el-fill-color-light)]">
      <h3 class="m-0 text-14px font-600 text-[var(--el-text-color-primary)]">配置面板</h3>
    </div>

    <!-- 配置内容区域 -->
    <div class="flex-1 overflow-y-auto p-16px">
      <div class="space-y-20px">
        <!-- 执行类型（条件显示） -->
        <div v-if="propsWithDefaults.showExecutionType">
          <div class="flex items-center gap-8px mb-8px">
            <label class="text-14px font-600 text-[var(--el-text-color-primary)]">执行类型</label>
            <el-tooltip content="选择Flink任务的执行类型" placement="top">
              <el-icon class="text-[var(--el-text-color-placeholder)] cursor-help" :size="14">
                <QuestionFilled />
              </el-icon>
            </el-tooltip>
          </div>
          <el-select v-model="configData.executionType" class="w-full">
            <el-option label="批处理 - 批量处理数据" value="batch" />
            <el-option label="流处理 - 实时流式处理数据" value="stream" />
          </el-select>
        </div>

        <!-- 部署模式 -->
        <div>
          <div class="flex items-center gap-8px mb-8px">
            <label class="text-14px font-600 text-[var(--el-text-color-primary)]">部署模式</label>
            <el-tooltip content="选择Flink任务的部署环境模式" placement="top">
              <el-icon class="text-[var(--el-text-color-placeholder)] cursor-help" :size="14">
                <QuestionFilled />
              </el-icon>
            </el-tooltip>
          </div>
          <el-select v-model="configData.deployMode" class="w-full">
            <el-option label="本地模式 - 在本地机器上运行" value="local" />
            <el-option label="远程模式 - 连接远程Flink集群" value="remote" />
            <el-option label="Yarn Application模式 - 在Yarn上以Application模式运行" value="yarn-application" />
          </el-select>
        </div>

        <!-- 集群选择（remote和yarn-application模式显示） -->
        <div v-if="showClusterSelect">
          <div class="flex items-center gap-8px mb-8px">
            <label class="text-14px font-600 text-[var(--el-text-color-primary)]">选择集群</label>
            <el-tooltip :content="`选择要连接的${clusterTypeDesc}`" placement="top">
              <el-icon class="text-[var(--el-text-color-placeholder)] cursor-help" :size="14">
                <QuestionFilled />
              </el-icon>
            </el-tooltip>
          </div>
          <el-select
            v-model="configData.clusterId"
            placeholder="请选择集群"
            :loading="clusterLoading"
            clearable
            filterable
            class="w-full"
          >
            <el-option
              v-for="cluster in clusterList"
              :key="cluster.id"
              :label="cluster.name"
              :value="cluster.id"
            >
              <div class="flex items-center justify-between">
                <span>{{ cluster.name }}</span>
                <el-tag
                  size="small"
                  :type="cluster.status === 'available' ? 'success' : 'info'"
                >
                  {{ cluster.status }}
                </el-tag>
              </div>
            </el-option>
          </el-select>
          <div class="text-12px text-[var(--el-color-info)] mt-4px">
            {{ clusterTypeDesc }}
          </div>
        </div>

        <!-- Flink版本（local和yarn-application模式显示） -->
        <div v-if="showFlinkVersion">
          <div class="flex items-center gap-8px mb-8px">
            <label class="text-14px font-600 text-[var(--el-text-color-primary)]">Flink版本</label>
            <el-tooltip content="选择要使用的Flink版本，建议使用1.16或更高版本" placement="top">
              <el-icon class="text-[var(--el-text-color-placeholder)] cursor-help" :size="14">
                <QuestionFilled />
              </el-icon>
            </el-tooltip>
          </div>
          <el-select v-model="configData.flinkVersion" class="w-full">
            <el-option label="1.14.x" value="1.14" />
            <el-option label="1.15.x" value="1.15" />
            <el-option label="1.16.x" value="1.16" />
            <el-option label="1.17.x" value="1.17" />
            <el-option label="1.18.x" value="1.18" />
          </el-select>
        </div>

        <!-- Flink CDC Dist Jar包路径（仅yarn-application模式显示） -->
        <div v-if="shouldShowCdcDistJarPath">
          <div class="flex items-center gap-8px mb-8px">
            <label class="text-14px font-600 text-[var(--el-text-color-primary)]">flink cdc dist jar包路径</label>
            <el-tooltip content="填写Flink CDC Dist的JAR包路径，用于CDC数据同步" placement="top">
              <el-icon class="text-[var(--el-text-color-placeholder)] cursor-help" :size="14">
                <QuestionFilled />
              </el-icon>
            </el-tooltip>
          </div>
          <el-input
            v-model="configData.flinkCdcDistJarPath"
            placeholder="请输入flink cdc dist jar包路径"
            class="w-full"
          />
        </div>

        <!-- 并行度 -->
        <div>
          <div class="flex items-center gap-8px mb-8px">
            <label class="text-14px font-600 text-[var(--el-text-color-primary)]">并行度</label>
            <el-tooltip content="设置任务并行执行的线程数，范围1-1000" placement="top">
              <el-icon class="text-[var(--el-text-color-placeholder)] cursor-help" :size="14">
                <QuestionFilled />
              </el-icon>
            </el-tooltip>
          </div>
          <el-input-number v-model="configData.parallelism" :min="1" :max="1000" :step="1" class="w-full" />
        </div>

        <!-- 检查点间隔 -->
        <div>
          <div class="flex items-center gap-8px mb-8px">
            <label class="text-14px font-600 text-[var(--el-text-color-primary)]">检查点间隔 (ms)</label>
            <el-tooltip content="设置Flink检查点的时间间隔，建议不小于1000ms" placement="top">
              <el-icon class="text-[var(--el-text-color-placeholder)] cursor-help" :size="14">
                <QuestionFilled />
              </el-icon>
            </el-tooltip>
          </div>
          <el-input-number v-model="configData.checkpointInterval" :min="1000" :max="3600000" :step="1000" class="w-full" />
        </div>

        <!-- 检查点路径（所有部署模式显示） -->
        <div>
          <div class="flex items-center gap-8px mb-8px">
            <label class="text-14px font-600 text-[var(--el-text-color-primary)]">检查点路径</label>
            <el-tooltip content="设置Flink检查点的存储路径，不填则使用后端默认配置" placement="top">
              <el-icon class="text-[var(--el-text-color-placeholder)] cursor-help" :size="14">
                <QuestionFilled />
              </el-icon>
            </el-tooltip>
          </div>
          <el-input
            v-model="configData.checkpointPath"
            placeholder="请输入检查点路径，如 hdfs://namenode:8020/flink/checkpoints"
            class="w-full"
            clearable
          />
        </div>

        <!-- 配置说明 -->
        <div class="mt-24px p-12px bg-[var(--el-fill-color-light)] rounded-4px border border-[var(--el-border-color)]">
          <div class="flex items-center gap-8px mb-8px">
            <el-icon class="text-[var(--el-color-primary)]"><InfoFilled /></el-icon>
            <span class="text-12px font-600 text-[var(--el-text-color-primary)]">配置说明</span>
          </div>
          <ul class="text-12px text-[var(--el-text-color-secondary)] space-y-4px pl-24px">
            <li>• 配置修改后需要点击文件保存按钮才会生效</li>
            <li>• 并行度影响任务执行性能，建议根据集群资源调整</li>
            <li>• 检查点用于容错，间隔过小可能影响性能</li>
            <li>• 检查点路径不填时使用后端默认配置</li>
            <li>• 配置项以JSON格式存储，支持未来扩展</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
</style>
