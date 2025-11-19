<template>
  <div class="version-panel">
    <el-drawer
      v-model="visible"
      title="版本历史"
      direction="rtl"
      size="600px"
      :before-close="handleClose"
    >
      <div class="version-header">
        <div class="version-stats">
          <el-tag type="primary">共 {{ total }} 个版本</el-tag>
          <el-tag :type="currentVersion ? 'success' : 'info'">
            当前版本：{{ currentVersion || '无' }}
          </el-tag>
        </div>
        <el-button
          v-if="currentFileId"
          type="primary"
          @click="handleRefresh"
          :loading="loading"
        >
          刷新
        </el-button>
      </div>

      <div class="version-content">
        <el-table
          :data="versionList"
          v-loading="loading"
          stripe
          style="width: 100%"
          @row-click="handleRowClick"
        >
          <el-table-column prop="versionNumber" label="版本号" width="80">
            <template #default="{ row }">
              <el-tag size="small">v{{ row.versionNumber }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="versionType" label="类型" width="80">
            <template #default="{ row }">
              <el-tag
                :type="row.versionType === 'manual' ? 'primary' : 'info'"
                size="small"
              >
                {{ row.versionType === 'manual' ? '手动' : '自动' }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="remark" label="备注" show-overflow-tooltip />

          <el-table-column prop="creator" label="修改人" width="100" />

          <el-table-column prop="createTime" label="修改时间" width="180">
            <template #default="{ row }">
              {{ formatTime(row.createTime,'yyyy-MM-dd HH:mm:ss') }}
            </template>
          </el-table-column>

          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link @click.stop="handleViewDetail(row)">
                详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination" v-if="total > pageSize">
          <el-pagination
            v-model:current-page="current"
            v-model:page-size="pageSize"
            :total="total"
            layout="prev, pager, next, total"
            @current-change="handlePageChange"
          />
        </div>
      </div>
    </el-drawer>

    <!-- 版本详情弹窗 -->
    <VersionDetailDialog
      v-model="detailDialogVisible"
      :version-id="selectedVersionId"
      :file-name="fileName"
      @rollback="handleRollback"
      @deleted="handleVersionDeleted"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, defineExpose } from 'vue'
import { ElMessage } from 'element-plus'
import { formatTime } from '@/utils'
import { getVersionList, type VersionItem } from '@/api/dataStudio/version'
import VersionDetailDialog from './VersionDetailDialog.vue'

// Props
interface Props {
  modelValue: boolean
  currentFileId?: number
  fileName?: string
  currentVersion?: string
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'rollback': []
}>()

// 响应式数据
const visible = ref(false)
const versionList = ref<VersionItem[]>([])
const total = ref(0)
const loading = ref(false)
const current = ref(1)
const pageSize = ref(20)

const detailDialogVisible = ref(false)
const selectedVersionId = ref<number>()

// 监听 visible 变化
watch(
  () => props.modelValue,
  (val) => {
    visible.value = val
    if (val && props.currentFileId) {
      loadVersionList()
    }
  },
  { immediate: true }
)

// 监听 visible 变化，同步到父组件
watch(visible, (val) => {
  emit('update:modelValue', val)
})

// 监听当前文件变化，重新加载版本列表
watch(
  () => props.currentFileId,
  (newVal) => {
    if (visible.value && newVal) {
      loadVersionList()
    }
  }
)

// 加载版本列表
const loadVersionList = async () => {
  if (!props.currentFileId) return

  loading.value = true
  try {
    const resp = await getVersionList({
      sqlEditId: props.currentFileId,
      current: current.value,
      pageSize: pageSize.value
    })

    versionList.value = resp.list
    total.value = resp.total
  } catch (error: any) {
    ElMessage.error(error.message || '获取版本列表失败')
  } finally {
    loading.value = false
  }
}

// 处理关闭
const handleClose = () => {
  visible.value = false
}

// 处理刷新
const handleRefresh = () => {
  loadVersionList()
}

// 处理分页变化
const handlePageChange = () => {
  loadVersionList()
}

// 处理行点击
const handleRowClick = (row: VersionItem) => {
  // 可选：点击行时显示详情
}

// 处理查看详情
const handleViewDetail = (row: VersionItem) => {
  selectedVersionId.value = row.id
  detailDialogVisible.value = true
}

// 处理版本回退
const handleRollback = () => {
  ElMessage.success('版本回退成功')
  loadVersionList()
  emit('rollback')
}

// 处理版本删除
const handleVersionDeleted = () => {
  loadVersionList()
}

// 暴露方法
defineExpose({
  show: () => {
    visible.value = true
  }
})
</script>

<style scoped>
.version-panel {
  height: 100%;
}

.version-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.version-stats {
  display: flex;
  gap: 10px;
  align-items: center;
}

.version-content {
  height: calc(100% - 80px);
  overflow-y: auto;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.el-table {
  cursor: pointer;
}

.el-table :deep(.el-table__row) {
  cursor: pointer;
}
</style>
