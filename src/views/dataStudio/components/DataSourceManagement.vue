<template>
  <div class="v-data-source-management">
    <div class="v-data-source-management__header">
      <h2>数据源管理</h2>
      <p>配置和管理数据源连接</p>
    </div>

    <div class="v-data-source-management__toolbar">
      <el-button type="primary" icon="Plus" @click="handleCreateDataSource">
        新建数据源
      </el-button>
      <el-button icon="Connection" @click="handleTestConnection">
        测试连接
      </el-button>
      <el-button icon="Refresh" @click="handleRefresh">
        刷新
      </el-button>
    </div>

    <div class="v-data-source-management__content">
      <el-table :data="dataSourceList" style="width: 100%" border>
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="数据源名称" width="180" />
        <el-table-column prop="type" label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getDataSourceTypeTag(row.type)">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="host" label="主机地址" width="180" />
        <el-table-column prop="port" label="端口" width="100" />
        <el-table-column prop="database" label="数据库" width="150" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'connected' ? 'success' : 'danger'">
              {{ row.status === 'connected' ? '已连接' : '未连接' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" icon="Edit" @click="handleEditDataSource(row)">
              编辑
            </el-button>
            <el-button size="small" icon="Delete" type="danger" @click="handleDeleteDataSource(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 数据源详情对话框 -->
    <el-dialog v-model="dialogVisible" title="数据源详情" width="600px">
      <el-form :model="dataSourceForm" label-width="100px">
        <el-form-item label="数据源名称">
          <el-input v-model="dataSourceForm.name" placeholder="请输入数据源名称" />
        </el-form-item>
        <el-form-item label="数据源类型">
          <el-select v-model="dataSourceForm.type" placeholder="请选择数据源类型">
            <el-option label="MySQL" value="mysql" />
            <el-option label="PostgreSQL" value="postgresql" />
            <el-option label="Oracle" value="oracle" />
            <el-option label="SQL Server" value="sqlserver" />
            <el-option label="ClickHouse" value="clickhouse" />
            <el-option label="Hive" value="hive" />
          </el-select>
        </el-form-item>
        <el-form-item label="主机地址">
          <el-input v-model="dataSourceForm.host" placeholder="请输入主机地址" />
        </el-form-item>
        <el-form-item label="端口">
          <el-input-number v-model="dataSourceForm.port" :min="1" :max="65535" />
        </el-form-item>
        <el-form-item label="数据库">
          <el-input v-model="dataSourceForm.database" placeholder="请输入数据库名" />
        </el-form-item>
        <el-form-item label="用户名">
          <el-input v-model="dataSourceForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="dataSourceForm.password" type="password" placeholder="请输入密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveDataSource">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'

// 对话框显示状态
const dialogVisible = ref(false)

// 数据源列表
const dataSourceList = ref([
  {
    id: 1,
    name: 'MySQL 测试数据库',
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    database: 'test_db',
    status: 'connected',
    createTime: '2024-01-01 10:00:00'
  },
  {
    id: 2,
    name: 'PostgreSQL 生产库',
    type: 'postgresql',
    host: '192.168.1.100',
    port: 5432,
    database: 'production_db',
    status: 'connected',
    createTime: '2024-01-01 11:00:00'
  },
  {
    id: 3,
    name: 'Hive 数据仓库',
    type: 'hive',
    host: 'hive-server',
    port: 10000,
    database: 'warehouse',
    status: 'disconnected',
    createTime: '2024-01-01 12:00:00'
  }
])

// 数据源表单
const dataSourceForm = reactive({
  name: '',
  type: 'mysql',
  host: '',
  port: 3306,
  database: '',
  username: '',
  password: ''
})

// 事件处理
const handleCreateDataSource = () => {
  // 重置表单
  Object.assign(dataSourceForm, {
    name: '',
    type: 'mysql',
    host: '',
    port: 3306,
    database: '',
    username: '',
    password: ''
  })
  dialogVisible.value = true
}

const handleTestConnection = () => {
  ElMessage.info('测试连接功能开发中...')
}

const handleRefresh = () => {
  ElMessage.success('数据源列表已刷新')
}

const handleEditDataSource = (row: any) => {
  Object.assign(dataSourceForm, row)
  dialogVisible.value = true
}

const handleDeleteDataSource = (row: any) => {
  ElMessage.warning(`删除数据源: ${row.name}`)
}

const handleSaveDataSource = () => {
  ElMessage.success('保存数据源成功')
  dialogVisible.value = false
}

// 获取数据源类型标签
const getDataSourceTypeTag = (type: string) => {
  const typeMap: Record<string, string> = {
    mysql: '',
    postgresql: 'success',
    oracle: 'warning',
    sqlserver: 'info',
    clickhouse: 'danger',
    hive: ''
  }
  return typeMap[type] || ''
}
</script>

<style lang="scss" scoped>
.v-data-source-management {
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
}
</style>