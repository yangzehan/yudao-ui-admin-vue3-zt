<script setup lang="ts">
import { defineProps, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { QuestionFilled, InfoFilled } from '@element-plus/icons-vue'

// 定义props
const props = defineProps<{
  file?: {
    id?: number
    name: string
    content: string
    config?: any
    [key: string]: any
  }
}>()

// 配置项数据
const configData = ref({
  executionMode: 'local',
  flinkVersion: '1.16',
  parallelism: 1,
  checkpointInterval: 5000
})

// 监听文件配置变化，更新本地配置
watch(() => props.file?.config, (newConfig) => {
  if (newConfig) {
    configData.value = { ...newConfig }
  }
}, { immediate: true })

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

  // Flink版本验证
  const validVersions = ['1.14', '1.15', '1.16', '1.17', '1.18']
  if (!validVersions.includes(config.flinkVersion)) {
    ElMessage.warning('请选择有效的Flink版本')
    return false
  }

  // 执行模式验证
  const validModes = ['local', 'remote', 'cluster']
  if (!validModes.includes(config.executionMode)) {
    ElMessage.warning('请选择有效的执行模式')
    return false
  }

  return true
}

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
        <div>
          <div class="flex items-center gap-8px mb-8px">
            <label class="text-14px font-600 text-[var(--el-text-color-primary)]">执行模式</label>
            <el-tooltip content="选择Flink任务的执行环境模式" placement="top">
              <el-icon class="text-[var(--el-text-color-placeholder)] cursor-help" :size="14">
                <QuestionFilled />
              </el-icon>
            </el-tooltip>
          </div>
          <el-select v-model="configData.executionMode" class="w-full">
            <el-option label="本地模式 - 在本地机器上运行" value="local" />
            <el-option label="远程模式 - 连接远程Flink集群" value="remote" />
            <el-option label="集群模式 - 在Flink集群上运行" value="cluster" />
          </el-select>
        </div>

        <div>
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
            <li>• 配置项以JSON格式存储，支持未来扩展</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
</style>
