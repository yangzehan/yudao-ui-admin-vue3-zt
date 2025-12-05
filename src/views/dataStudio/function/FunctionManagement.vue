<template>
  <div class="v-function-management">
    <div class="v-function-management__header">
      <h2>函数管理</h2>
      <p>创建和管理 UDF 函数</p>
    </div>

    <div class="v-function-management__toolbar">
      <el-button type="primary" icon="Plus" @click="handleCreateFunction">
        新建函数
      </el-button>
      <el-button icon="Upload" @click="handleUploadFunction">
        上传函数
      </el-button>
      <el-button icon="Refresh" @click="handleRefresh">
        刷新
      </el-button>
    </div>

    <div class="v-function-management__content">
      <el-table :data="functionList" style="width: 100%" border>
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="函数名称" width="180" />
        <el-table-column prop="type" label="函数类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getFunctionTypeTag(row.type)">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="language" label="语言" width="120">
          <template #default="{ row }">
            <el-tag>{{ row.language }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="函数描述" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'warning'">
              {{ row.status === 'active' ? '已启用' : '未启用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" icon="Edit" @click="handleEditFunction(row)">
              编辑
            </el-button>
            <el-button size="small" icon="Delete" type="danger" @click="handleDeleteFunction(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 函数详情对话框 -->
    <el-dialog v-model="dialogVisible" title="函数详情" width="800px">
      <el-form :model="functionForm" label-width="100px">
        <el-form-item label="函数名称">
          <el-input v-model="functionForm.name" placeholder="请输入函数名称" />
        </el-form-item>
        <el-form-item label="函数类型">
          <el-select v-model="functionForm.type" placeholder="请选择函数类型">
            <el-option label="标量函数" value="scalar" />
            <el-option label="聚合函数" value="aggregate" />
            <el-option label="表值函数" value="table" />
          </el-select>
        </el-form-item>
        <el-form-item label="编程语言">
          <el-select v-model="functionForm.language" placeholder="请选择编程语言">
            <el-option label="Java" value="java" />
            <el-option label="Scala" value="scala" />
            <el-option label="Python" value="python" />
          </el-select>
        </el-form-item>
        <el-form-item label="函数描述">
          <el-input v-model="functionForm.description" type="textarea" :rows="3" placeholder="请输入函数描述" />
        </el-form-item>
        <el-form-item label="函数代码">
          <div class="v-function-management__code-editor">
            <div class="v-function-management__code-lines">
              <div v-for="i in 20" :key="i" class="v-function-management__code-line-number">
                {{ i }}
              </div>
            </div>
            <div class="v-function-management__code-content">
              <pre><code>
// UDF 函数示例
public class MyUDF extends ScalarFunction {
  public String eval(String input) {
    return input.toUpperCase();
  }
}
              </code></pre>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveFunction">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'

// 对话框显示状态
const dialogVisible = ref(false)

// 函数列表
const functionList = ref([
  {
    id: 1,
    name: 'to_upper',
    type: 'scalar',
    language: 'java',
    description: '将字符串转换为大写',
    status: 'active',
    createTime: '2024-01-01 10:00:00'
  },
  {
    id: 2,
    name: 'string_length',
    type: 'scalar',
    language: 'java',
    description: '计算字符串长度',
    status: 'active',
    createTime: '2024-01-01 11:00:00'
  },
  {
    id: 3,
    name: 'my_aggregate',
    type: 'aggregate',
    language: 'scala',
    description: '自定义聚合函数',
    status: 'inactive',
    createTime: '2024-01-01 12:00:00'
  }
])

// 函数表单
const functionForm = reactive({
  name: '',
  type: 'scalar',
  language: 'java',
  description: '',
  code: ''
})

// 事件处理
const handleCreateFunction = () => {
  // 重置表单
  Object.assign(functionForm, {
    name: '',
    type: 'scalar',
    language: 'java',
    description: '',
    code: ''
  })
  dialogVisible.value = true
}

const handleUploadFunction = () => {
  ElMessage.info('上传函数功能开发中...')
}

const handleRefresh = () => {
  ElMessage.success('函数列表已刷新')
}

const handleEditFunction = (row: any) => {
  Object.assign(functionForm, row)
  dialogVisible.value = true
}

const handleDeleteFunction = (row: any) => {
  ElMessage.warning(`删除函数: ${row.name}`)
}

const handleSaveFunction = () => {
  ElMessage.success('保存函数成功')
  dialogVisible.value = false
}

// 获取函数类型标签
const getFunctionTypeTag = (type: string) => {
  const typeMap: Record<string, string> = {
    scalar: '',
    aggregate: 'success',
    table: 'warning'
  }
  return typeMap[type] || ''
}
</script>

<style lang="scss" scoped>
.v-function-management {
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

  &__code-editor {
    height: 200px;
    display: flex;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 14px;
    line-height: 1.5;
    border: 1px solid var(--el-border-color);
    border-radius: 4px;
    overflow: hidden;

    &-lines {
      background: var(--el-fill-color-light);
      border-right: 1px solid var(--el-border-color);
      padding: 8px 12px;
      text-align: right;
      color: var(--el-text-color-secondary);
      user-select: none;
      min-width: 60px;
    }

    &-line-number {
      height: 22px;
      line-height: 22px;
    }

    &-content {
      flex: 1;
      padding: 8px 16px;
      overflow: auto;
      background: var(--el-bg-color);

      pre {
        margin: 0;
        color: var(--el-text-color-primary);
      }

      code {
        font-family: inherit;
      }
    }
  }
}
</style>