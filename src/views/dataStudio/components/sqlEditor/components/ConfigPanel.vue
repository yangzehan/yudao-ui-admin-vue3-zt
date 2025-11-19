<script setup lang="ts">
import { defineProps, defineEmits, ref, watch } from 'vue'

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

// 定义emits
const emit = defineEmits<{
  (e: 'save', file: any): void
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

// 保存配置
const handleSave = () => {
  emit('save', {
    ...props.file,
    config: configData.value
  })
}
</script>

<template>
  <div class="h-full flex flex-col bg-[var(--el-bg-color)]">
    <!-- 配置面板头部 -->
    <div class="flex-shrink-0 px-16px py-12px border-b border-[var(--el-border-color)] bg-[var(--el-fill-color-light)]">
      <h3 class="m-0 text-14px font-600 text-[var(--el-text-color-primary)]">配置面板</h3>
    </div>

    <!-- 配置内容区域 -->
    <div class="flex-1 overflow-y-auto p-16px">
      <div class="space-y-16px">
        <div>
          <label class="block text-14px text-[var(--el-text-color-primary)] mb-8px">执行模式</label>
          <el-select v-model="configData.executionMode" class="w-full">
            <el-option label="本地模式" value="local" />
            <el-option label="远程模式" value="remote" />
            <el-option label="集群模式" value="cluster" />
          </el-select>
        </div>

        <div>
          <label class="block text-14px text-[var(--el-text-color-primary)] mb-8px">Flink版本</label>
          <el-select v-model="configData.flinkVersion" class="w-full">
            <el-option label="1.14" value="1.14" />
            <el-option label="1.15" value="1.15" />
            <el-option label="1.16" value="1.16" />
            <el-option label="1.17" value="1.17" />
          </el-select>
        </div>

        <div>
          <label class="block text-14px text-[var(--el-text-color-primary)] mb-8px">并行度</label>
          <el-input-number v-model="configData.parallelism" :min="1" :max="100" class="w-full" />
        </div>

        <div>
          <label class="block text-14px text-[var(--el-text-color-primary)] mb-8px">检查点间隔 (ms)</label>
          <el-input-number v-model="configData.checkpointInterval" :min="1000" :step="1000" class="w-full" />
        </div>
      </div>
    </div>

    <!-- 配置面板底部 -->
    <div class="flex-shrink-0 px-16px py-12px border-t border-[var(--el-border-color)] bg-[var(--el-fill-color-light)]">
      <el-button type="primary" class="w-full" @click="handleSave">
        保存配置
      </el-button>
    </div>
  </div>
</template>

<style scoped lang="scss">
</style>
