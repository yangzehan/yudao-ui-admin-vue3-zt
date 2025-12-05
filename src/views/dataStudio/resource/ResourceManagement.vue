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
      <el-table :data="resourceList" style="width: 100%" border>
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="资源名称" width="200" />
        <el-table-column prop="type" label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getResourceTypeTag(row.type)">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="size" label="大小" width="120">
          <template #default="{ row }">
            {{ formatFileSize(row.size) }}
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="uploadTime" label="上传时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" icon="View" @click="handleViewResource(row)">
              查看
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
        :file-list="fileList"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持上传 JAR、ZIP、SQL 等格式文件，单个文件不超过 100MB
          </div>
        </template>
      </el-upload>
      <el-form :model="uploadForm" label-width="80px">
        <el-form-item label="资源描述">
          <el-input v-model="uploadForm.description" type="textarea" :rows="3" placeholder="请输入资源描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleUploadSubmit">上传</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'

// 上传对话框显示状态
const uploadDialogVisible = ref(false)

// 文件列表
const fileList = ref([])

// 资源列表
const resourceList = ref([
  {
    id: 1,
    name: 'flink-connector-mysql.jar',
    type: 'jar',
    size: 1024 * 1024 * 5, // 5MB
    description: 'Flink MySQL 连接器',
    uploadTime: '2024-01-01 10:00:00'
  },
  {
    id: 2,
    name: 'udf-functions.zip',
    type: 'zip',
    size: 1024 * 1024 * 2, // 2MB
    description: '自定义 UDF 函数包',
    uploadTime: '2024-01-01 11:00:00'
  },
  {
    id: 3,
    name: 'sample-data.sql',
    type: 'sql',
    size: 1024 * 50, // 50KB
    description: '示例数据 SQL 文件',
    uploadTime: '2024-01-01 12:00:00'
  }
])

// 上传表单
const uploadForm = reactive({
  description: ''
})

// 事件处理
const handleUploadResource = () => {
  uploadDialogVisible.value = true
}

const handleDownloadResource = () => {
  ElMessage.info('下载资源功能开发中...')
}

const handleRefresh = () => {
  ElMessage.success('资源列表已刷新')
}

const handleViewResource = (row: any) => {
  ElMessage.info(`查看资源: ${row.name}`)
}

const handleDeleteResource = (row: any) => {
  ElMessage.warning(`删除资源: ${row.name}`)
}

const handleFileChange = (file: any) => {
  console.log('文件选择:', file)
}

const handleUploadSubmit = () => {
  ElMessage.success('上传资源成功')
  uploadDialogVisible.value = false
}

// 获取资源类型标签
const getResourceTypeTag = (type: string) => {
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
const formatFileSize = (bytes: number) => {
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