<template>
  <div class="v-resource-management">
    <div class="v-resource-management__header">
      <h2>资源管理</h2>
      <p>上传和管理资源文件</p>
    </div>

    <div class="v-resource-management__toolbar">
      <el-button type="primary" icon="Plus" @click="handleUploadResource">
        上传资源
      </el-button>
      <el-button icon="Download" @click="handleDownloadResource">
        下载
      </el-button>
      <el-button icon="Refresh" @click="handleRefresh">
        刷新
      </el-button>
    </div>

    <div class="v-resource-management__content">
      <el-table :data="resourceList" style="width: 100%" border v-loading="loading">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="资源名称" width="200" />
        <el-table-column prop="type" label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getResourceTypeTag(row.name)">{{ getResourceType(row.name) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="size" label="大小" width="120">
          <template #default="{ row }">
            {{ formatFileSize(row.size) }}
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="createTime" label="上传时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createTime, 'yyyy-MM-dd HH:mm:ss') }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" icon="Download" @click="handleDownload(row)">
              下载
            </el-button>
            <el-button size="small" icon="Delete" type="danger" @click="handleDeleteResource(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 上传资源对话框 -->
    <el-dialog v-model="uploadDialogVisible" title="上传资源" width="500px">
      <el-upload
        class="v-resource-management__upload"
        drag
        action="#"
        :auto-upload="false"
        :on-change="handleFileChange"
        :on-remove="handleFileRemove"
        :file-list="fileList"
        :before-upload="beforeUpload"
        :limit="1"
        accept=".jar"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          将 JAR 文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持上传 JAR 格式文件，单个文件不超过 16MB
          </div>
        </template>
      </el-upload>
      <el-form :model="uploadForm" label-width="80px" style="margin-top: 16px;">
        <el-form-item label="资源描述">
          <el-input v-model="uploadForm.description" type="textarea" :rows="3" placeholder="请输入资源描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="uploading" :disabled="fileList.length === 0" @click="handleUploadSubmit">
          {{ uploading ? '上传中...' : '上传' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { UploadFile, UploadProps } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import { formatTime } from '@/utils'
import { uploadResource, getResourcePage, deleteResource, type ResourceVO } from '@/api/dataStudio/resource'

// 加载状态
const loading = ref(false)
const uploading = ref(false)

// 上传对话框显示状态
const uploadDialogVisible = ref(false)

// 文件列表
const fileList = ref<UploadFile[]>([])

// 资源列表
const resourceList = ref<ResourceVO[]>([])

// 上传表单
const uploadForm = reactive({
  description: ''
})

// 挂载时获取资源列表
onMounted(() => {
  getResourceListData()
})

// 获取资源列表数据
const getResourceListData = async () => {
  loading.value = true
  try {
    const data = await getResourcePage({})
    resourceList.value = data.list
  } catch (error: any) {
    ElMessage.error(error.message || '获取资源列表失败')
  } finally {
    loading.value = false
  }
}

// 上传前校验
const beforeUpload: UploadProps['beforeUpload'] = (rawFile) => {
  // 文件类型校验（JAR）
  const isJar = rawFile.name.toLowerCase().endsWith('.jar')
  if (!isJar) {
    ElMessage.warning('仅支持上传 JAR 格式文件！')
    return false
  }
  // 文件大小校验 (16MB = 16 * 1024 * 1024)
  const isLt16M = rawFile.size / 1024 / 1024 < 16
  if (!isLt16M) {
    ElMessage.warning('上传文件大小不能超过 16MB！')
    return false
  }
  return true
}

// 文件选择变化
const handleFileChange = (file: UploadFile) => {
  // 检查文件类型
  if (file.name && !file.name.toLowerCase().endsWith('.jar')) {
    ElMessage.warning('仅支持上传 JAR 格式文件！')
    fileList.value = []
    return
  }
  // 检查文件大小
  if (file.size && file.size > 16 * 1024 * 1024) {
    ElMessage.warning('上传文件大小不能超过 16MB！')
    fileList.value = []
    return
  }
  fileList.value = [file]
}

// 文件移除
const handleFileRemove = () => {
  fileList.value = []
}

// 事件处理
const handleUploadResource = () => {
  uploadForm.description = ''
  fileList.value = []
  uploadDialogVisible.value = true
}

const handleDownloadResource = () => {
  if (resourceList.value.length === 0) {
    ElMessage.warning('请先选择要下载的资源')
    return
  }
  ElMessage.info('请在操作列点击下载按钮选择要下载的资源')
}

const handleRefresh = () => {
  getResourceListData()
  ElMessage.success('资源列表已刷新')
}

const handleDownload = (row: ResourceVO) => {
  if (row.fileUrl) {
    window.open(row.fileUrl, '_blank')
  } else {
    ElMessage.warning('文件地址不存在')
  }
}

const handleDeleteResource = (row: ResourceVO) => {
  ElMessageBox.confirm(`确定要删除资源 "${row.name}" 吗？`, '删除确认', {
    type: 'warning'
  }).then(async () => {
    try {
      await deleteResource(row.id!)
      ElMessage.success('删除成功')
      getResourceListData()
    } catch (error: any) {
      ElMessage.error(error.message || '删除失败')
    }
  }).catch(() => {})
}

const handleUploadSubmit = async () => {
  if (fileList.value.length === 0) {
    ElMessage.warning('请选择要上传的文件')
    return
  }

  const file = fileList.value[0]
  if (!file.raw) {
    ElMessage.warning('文件无效')
    return
  }

  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file.raw)
    formData.append('description', uploadForm.description)

    await uploadResource(formData)
    ElMessage.success('上传成功')
    uploadDialogVisible.value = false
    getResourceListData()
  } catch (error: any) {
    ElMessage.error(error.message || '上传失败')
  } finally {
    uploading.value = false
  }
}

// 获取资源类型
const getResourceType = (name: string): string => {
  if (name.toLowerCase().endsWith('.jar')) {
    return 'jar'
  }
  const ext = name.substring(name.lastIndexOf('.') + 1)
  return ext
}

// 获取资源类型标签
const getResourceTypeTag = (name: string): string => {
  const type = getResourceType(name)
  const typeMap: Record<string, string> = {
    jar: '',
    zip: 'success',
    sql: 'info',
    yaml: 'warning',
    properties: 'danger'
  }
  return typeMap[type] || ''
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>

<style lang="scss" scoped>
.v-resource-management {
  padding: 24px;
  height: 100%;
  overflow-y: auto;

  &__header {
    margin-bottom: 24px;

    h2 {
      margin: 0 0 8px 0;
      color: var(--el-text-color-primary);
      font-size: 20px;
    }

    p {
      margin: 0;
      color: var(--el-text-color-secondary);
      font-size: 14px;
    }
  }

  &__toolbar {
    margin-bottom: 16px;
    display: flex;
    gap: 8px;
  }

  &__content {
    height: calc(100% - 120px);
  }

  &__upload {
    :deep(.el-upload-dragger) {
      width: 100%;
    }
  }
}
</style>
