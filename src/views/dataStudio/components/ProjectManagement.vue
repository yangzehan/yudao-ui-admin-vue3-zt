<template>
  <div class="v-project-management">
    <div class="v-project-management__header">
      <h2>项目管理</h2>
      <p>创建和管理 Flink SQL 项目</p>
    </div>

    <div class="v-project-management__toolbar">
      <el-button type="primary" icon="Plus" @click="handleCreateProject">
        新建项目
      </el-button>
      <el-button icon="FolderOpened" @click="handleImportProject">
        导入项目
      </el-button>
      <el-button icon="Refresh" @click="handleRefresh">
        刷新
      </el-button>
    </div>

    <div class="v-project-management__content">
      <el-row :gutter="16">
        <el-col :span="8">
          <div class="v-project-management__tree">
            <div class="v-project-management__tree-header">
              <el-input
                v-model="searchText"
                placeholder="搜索项目"
                prefix-icon="Search"
                clearable
              />
            </div>
            <div class="v-project-management__tree-content">
              <el-tree
                ref="treeRef"
                :data="projectTree"
                :props="treeProps"
                :filter-node-method="filterNode"
                node-key="id"
                default-expand-all
                :contextmenu="handleContextMenu"
                @node-contextmenu="handleRightClick"
                @node-click="handleNodeClick"
              >
                <template #default="{ node, data }">
                  <span class="v-project-management__tree-node">
                    <el-icon v-if="data.type === 'project'"><Folder /></el-icon>
                    <el-icon v-else-if="data.type === 'folder'"><FolderOpened /></el-icon>
                    <el-icon v-else><Document /></el-icon>
                    <span>{{ node.label }}</span>
                  </span>
                </template>
              </el-tree>
            </div>
          </div>
        </el-col>

        <el-col :span="16">
          <div class="v-project-management__ide">
            <!-- IDE 工具栏 -->
            <div class="v-project-management__ide-toolbar">
              <div class="v-project-management__ide-toolbar-left">
                <span class="ide-title">{{ selectedNode?.label || 'IDE 编辑器' }}</span>
                <el-tag v-if="selectedNode" size="small" :type="getNodeTagType(selectedNode.type)">
                  {{ getNodeTypeLabel(selectedNode.type) }}
                </el-tag>
              </div>
              <div class="v-project-management__ide-toolbar-right">
                <el-button-group>
                  <el-button size="small" icon="Edit" @click="handleEditProject" :disabled="!selectedNode">编辑</el-button>
                  <el-button size="small" icon="Delete" @click="handleDeleteProject" :disabled="!selectedNode">删除</el-button>
                </el-button-group>
                <el-divider direction="vertical" />
                <el-button-group>
                  <el-button size="small" icon="VideoPlay" @click="handleExecute" :disabled="!selectedNode || selectedNode.type !== 'file'">执行</el-button>
                  <el-button size="small" icon="Connection" @click="handleDebug" :disabled="!selectedNode || selectedNode.type !== 'file'">调试</el-button>
                  <el-button size="small" icon="Switch" @click="handleStop" :disabled="!selectedNode || selectedNode.type !== 'file'">停止</el-button>
                </el-button-group>
                <el-divider direction="vertical" />
                <el-button-group>
                  <el-button size="small" icon="DocumentAdd" @click="handleNewFile">新建</el-button>
                  <el-button size="small" icon="FolderAdd" @click="handleNewFolder">新建文件夹</el-button>
                </el-button-group>
              </div>
            </div>

            <!-- IDE 内容区域 -->
            <div class="v-project-management__ide-content">
              <template v-if="selectedNode && selectedNode.type === 'file'">
                <!-- 文件编辑器 -->
                <div class="v-project-management__editor-container">
                  <div class="v-project-management__editor-tabs">
                    <el-tabs v-model="activeTab" type="card" closable @tab-remove="handleTabRemove">
                      <el-tab-pane
                        v-for="tab in editorTabs"
                        :key="tab.id"
                        :label="tab.label"
                        :name="tab.id"
                      >
                        <div class="editor-wrapper">
                          <MonacoEditor
                            v-model="tab.content"
                            :language="getFileLanguage(tab.label)"
                            :height="'100%'"
                            :options="editorOptions"
                            @change="handleEditorChange(tab.id, $event)"
                          />
                        </div>
                      </el-tab-pane>
                    </el-tabs>
                  </div>
                </div>
              </template>
              <template v-else-if="selectedNode">
                <!-- 项目/文件夹详情 -->
                <div class="v-project-management__node-detail">
                  <el-descriptions :column="2" border>
                    <el-descriptions-item label="名称">{{ selectedNode.label }}</el-descriptions-item>
                    <el-descriptions-item label="类型">{{ getNodeTypeLabel(selectedNode.type) }}</el-descriptions-item>
                    <el-descriptions-item label="创建时间">2024-01-01 10:00:00</el-descriptions-item>
                    <el-descriptions-item label="修改时间">2024-01-01 12:00:00</el-descriptions-item>
                    <el-descriptions-item label="描述" :span="2">
                      {{ getNodeDescription(selectedNode.type) }}
                    </el-descriptions-item>
                  </el-descriptions>
                </div>
              </template>
              <template v-else>
                <!-- 欢迎页面 -->
                <div class="v-project-management__welcome">
                  <el-empty description="请选择一个项目或文件开始编辑" />
                  <div class="welcome-tips">
                    <h3>快速开始</h3>
                    <ul>
                      <li>在左侧选择一个项目或文件进行编辑</li>
                      <li>右键点击项目树可以创建新文件或文件夹</li>
                      <li>支持 Flink SQL、Python、Java 等多种语言</li>
                      <li>使用工具栏按钮执行、调试和停止任务</li>
                    </ul>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 右键菜单 -->
    <el-dialog
      v-model="contextMenuVisible"
      :show-close="false"
      :modal="false"
      :width="contextMenuWidth"
      :style="contextMenuStyle"
      class="v-project-management__context-menu"
    >
      <div class="context-menu-content">
        <div class="context-menu-item" @click="handleContextMenuAction('new-folder')">
          <el-icon><FolderAdd /></el-icon>
          <span>新建文件夹</span>
        </div>
        <div class="context-menu-item" @click="handleContextMenuAction('new-file')">
          <el-icon><DocumentAdd /></el-icon>
          <span>新建文件</span>
        </div>
        <el-divider />
        <div class="context-menu-item danger" @click="handleContextMenuAction('delete')">
          <el-icon><Delete /></el-icon>
          <span>删除</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import MonacoEditor from '@/components/monaco-editor/MonacoEditor.vue'

// 搜索文本
const searchText = ref('')

// 树组件引用
const treeRef = ref()

// 选中的节点
const selectedNode = ref<any>(null)

// 右键菜单相关
const contextMenuVisible = ref(false)
const contextMenuStyle = ref({
  position: 'fixed',
  left: '0px',
  top: '0px'
})
const contextMenuWidth = ref('150px')
const contextMenuX = ref(0)
const contextMenuY = ref(0)
const contextMenuNode = ref<any>(null)

// IDE 编辑器相关
const activeTab = ref('')
const editorTabs = ref<Array<{
  id: string
  label: string
  content: string
  node: any
}>>([])

// 编辑器配置
const editorOptions = {
  fontSize: 14,
  minimap: { enabled: true },
  automaticLayout: true,
  scrollBeyondLastLine: false,
  wordWrap: 'on',
  lineNumbers: 'on',
  folding: true,
  renderWhitespace: 'selection',
  contextmenu: true,
  selectOnLineNumbers: true,
  roundedSelection: false,
  cursorStyle: 'line',
  cursorBlinking: 'blink',
  foldingHighlight: true,
  showFoldingControls: 'always',
  smoothScrolling: true
}

// 项目树数据
const projectTree = ref([
  {
    id: 1,
    label: '示例项目',
    type: 'project',
    children: [
      {
        id: 2,
        label: 'SQL 任务',
        type: 'folder',
        children: [
          { id: 3, label: '示例任务.sql', type: 'file' },
          { id: 6, label: '数据分析.sql', type: 'file' },
          { id: 7, label: 'ETL处理.sql', type: 'file' }
        ]
      },
      {
        id: 4,
        label: '配置文件',
        type: 'folder',
        children: [
          { id: 5, label: 'flink-conf.yaml', type: 'file' },
          { id: 8, label: 'log4j.properties', type: 'file' }
        ]
      },
      {
        id: 9,
        label: '数据字典',
        type: 'folder',
        children: [
          { id: 10, label: 'user-dict.json', type: 'file' },
          { id: 11, label: 'status-dict.csv', type: 'file' }
        ]
      }
    ]
  },
  {
    id: 12,
    label: '数据处理项目',
    type: 'project',
    children: [
      {
        id: 13,
        label: '实时计算',
        type: 'folder',
        children: [
          { id: 14, label: '实时统计.sql', type: 'file' },
          { id: 15, label: '告警检测.sql', type: 'file' }
        ]
      }
    ]
  }
])

// 树配置
const treeProps = {
  children: 'children',
  label: 'label'
}

// 获取节点类型标签
const getNodeTypeLabel = (type: string) => {
  const typeMap = {
    'project': '项目',
    'folder': '文件夹',
    'file': '文件'
  }
  return typeMap[type] || type
}

// 获取节点描述
const getNodeDescription = (type: string) => {
  const descMap = {
    'project': 'Flink SQL 项目，用于组织和管理数据开发任务',
    'folder': '文件夹，用于分类管理相关文件',
    'file': 'SQL 脚本文件，包含 Flink SQL 处理逻辑'
  }
  return descMap[type] || ''
}

// 获取节点标签类型
const getNodeTagType = (type: string) => {
  const typeMap = {
    'project': 'primary',
    'folder': 'success',
    'file': 'info'
  }
  return typeMap[type] || 'info'
}

// 根据文件名获取语言类型
const getFileLanguage = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase()
  const languageMap: Record<string, string> = {
    'sql': 'sql',
    'py': 'python',
    'java': 'java',
    'js': 'javascript',
    'ts': 'typescript',
    'json': 'json',
    'xml': 'xml',
    'yaml': 'yaml',
    'yml': 'yaml',
    'md': 'plaintext',
    'txt': 'plaintext',
    'properties': 'properties',
    'sh': 'shell'
  }
  return languageMap[ext || ''] || 'plaintext'
}

// 事件处理
const handleCreateProject = () => {
  ElMessage.info('创建项目功能开发中...')
}

const handleImportProject = () => {
  ElMessage.info('导入项目功能开发中...')
}

const handleRefresh = () => {
  ElMessage.success('项目列表已刷新')
}

const handleEditProject = () => {
  if (!selectedNode.value) {
    ElMessage.warning('请先选择一个项目')
    return
  }
  ElMessage.info(`编辑 ${selectedNode.value.label} 功能开发中...`)
}

const handleDeleteProject = () => {
  if (!selectedNode.value) {
    ElMessage.warning('请先选择一个项目')
    return
  }
  ElMessage.warning(`删除 ${selectedNode.value.label} 功能开发中...`)
}

const handleNodeClick = (data: any) => {
  selectedNode.value = data
  console.log('节点点击:', data)

  // 如果是文件，打开编辑器标签页
  if (data.type === 'file') {
    openEditorTab(data)
  }
}

// 打开编辑器标签页
const openEditorTab = (node: any) => {
  const existingTab = editorTabs.value.find(tab => tab.id === node.id.toString())

  if (existingTab) {
    // 如果标签页已存在，激活它
    activeTab.value = existingTab.id
  } else {
    // 创建新的标签页
    const newTab = {
      id: node.id.toString(),
      label: node.label,
      content: getFileContent(node),
      node: node
    }
    editorTabs.value.push(newTab)
    activeTab.value = newTab.id
  }
}

// 获取文件内容（模拟数据）
const getFileContent = (node: any) => {
  // 这里应该从API获取文件内容，现在使用模拟数据
  const contentMap: Record<string, string> = {
    '3': `-- 示例 Flink SQL 任务
-- 创建数据源表
CREATE TABLE source_table (
    id INT,
    name STRING,
    age INT,
    event_time TIMESTAMP(3),
    WATERMARK FOR event_time AS event_time - INTERVAL '5' SECOND
) WITH (
    'connector' = 'datagen',
    'rows-per-second' = '10'
);

-- 创建结果表
CREATE TABLE sink_table (
    name STRING,
    avg_age DOUBLE
) WITH (
    'connector' = 'print'
);

-- 执行数据处理
INSERT INTO sink_table
SELECT
    name,
    AVG(age) as avg_age
FROM source_table
GROUP BY name;`,
    '6': `-- 数据分析任务
-- 统计用户行为数据
SELECT
    user_id,
    COUNT(*) as action_count,
    AVG(duration) as avg_duration
FROM user_actions
WHERE event_date >= CURRENT_DATE - INTERVAL '7' DAY
GROUP BY user_id
ORDER BY action_count DESC;`,
    '7': `-- ETL 处理任务
-- 数据清洗和转换
WITH cleaned_data AS (
    SELECT
        user_id,
        TRIM(username) as username,
        CASE
            WHEN age < 0 THEN NULL
            WHEN age > 120 THEN NULL
            ELSE age
        END as age,
        event_time
    FROM raw_user_data
    WHERE user_id IS NOT NULL
)
SELECT * FROM cleaned_data;`,
    '14': `-- 实时统计任务
-- 实时计算用户活跃度
SELECT
    window_start,
    window_end,
    COUNT(DISTINCT user_id) as active_users,
    SUM(amount) as total_amount
FROM TABLE(
    TUMBLE(TABLE user_transactions, DESCRIPTOR(event_time), INTERVAL '1' HOUR)
)
GROUP BY window_start, window_end;`,
    '15': `-- 告警检测任务
-- 监控异常交易
SELECT
    user_id,
    COUNT(*) as suspicious_count,
    MAX(amount) as max_amount
FROM transactions
WHERE amount > 10000
    AND transaction_time >= CURRENT_TIMESTAMP - INTERVAL '1' HOUR
GROUP BY user_id
HAVING COUNT(*) > 3;`
  }

  return contentMap[node.id] || `-- ${node.label}
-- 文件内容加载中...`
}

// 编辑器内容变化
const handleEditorChange = (tabId: string, content: string) => {
  const tab = editorTabs.value.find(t => t.id === tabId)
  if (tab) {
    tab.content = content
  }
}

// 移除标签页
const handleTabRemove = (tabId: string) => {
  const index = editorTabs.value.findIndex(tab => tab.id === tabId)
  if (index !== -1) {
    editorTabs.value.splice(index, 1)
    // 如果移除的是当前激活的标签页，激活下一个标签页
    if (activeTab.value === tabId) {
      activeTab.value = editorTabs.value.length > 0 ? editorTabs.value[0].id : ''
    }
  }
}

// IDE 工具栏事件
const handleExecute = () => {
  if (!selectedNode.value) return
  ElMessage.success(`执行任务: ${selectedNode.value.label}`)
}

const handleDebug = () => {
  if (!selectedNode.value) return
  ElMessage.info(`调试任务: ${selectedNode.value.label}`)
}

const handleStop = () => {
  if (!selectedNode.value) return
  ElMessage.warning(`停止任务: ${selectedNode.value.label}`)
}

const handleNewFile = () => {
  ElMessage.info('新建文件功能开发中...')
}

const handleNewFolder = () => {
  ElMessage.info('新建文件夹功能开发中...')
}

// 右键点击处理
const handleRightClick = (event: any, data: any) => {
  event.preventDefault()
  contextMenuNode.value = data
  contextMenuX.value = event.clientX
  contextMenuY.value = event.clientY

  // 计算菜单位置，避免超出屏幕
  const menuWidth = 150
  const menuHeight = 120
  const screenWidth = window.innerWidth
  const screenHeight = window.innerHeight

  let left = event.clientX
  let top = event.clientY

  if (left + menuWidth > screenWidth) {
    left = screenWidth - menuWidth - 10
  }

  if (top + menuHeight > screenHeight) {
    top = screenHeight - menuHeight - 10
  }

  contextMenuStyle.value = {
    position: 'fixed',
    left: `${left}px`,
    top: `${top}px`,
    zIndex: 9999
  }

  contextMenuVisible.value = true
}

// 处理右键菜单操作
const handleContextMenuAction = (action: string) => {
  if (!contextMenuNode.value) return

  switch (action) {
    case 'new-folder':
      ElMessage.success(`在 ${contextMenuNode.value.label} 下新建文件夹`)
      break
    case 'new-file':
      ElMessage.success(`在 ${contextMenuNode.value.label} 下新建文件`)
      break
    case 'delete':
      ElMessage.warning(`删除 ${contextMenuNode.value.label}`)
      break
  }

  contextMenuVisible.value = false
  contextMenuNode.value = null
}

// 点击其他地方关闭右键菜单
const handleClickOutside = () => {
  contextMenuVisible.value = false
  contextMenuNode.value = null
}

// 节点过滤
const filterNode = (value: string, data: any) => {
  if (!value) return true
  return data.label.toLowerCase().includes(value.toLowerCase())
}

// 监听搜索文本变化并应用过滤
watch(searchText, (val) => {
  nextTick(() => {
    if (treeRef.value) {
      treeRef.value.filter(val)
    }
  })
})

// 监听右键菜单状态，点击外部关闭
watch(contextMenuVisible, (val) => {
  if (val) {
    document.addEventListener('click', handleClickOutside)
  } else {
    document.removeEventListener('click', handleClickOutside)
  }
})
</script>

<style lang="scss" scoped>
.v-project-management {
  padding: 24px;
  height: calc(100vh - 120px);
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

  &__tree {
    height: 100%;
    border: 1px solid var(--el-border-color);
    border-radius: 4px;
    background: var(--el-bg-color);

    &-header {
      padding: 12px;
      border-bottom: 1px solid var(--el-border-color);
    }

    &-content {
      height: calc(100% - 60px);
      overflow-y: auto;
      padding: 8px;
    }

    &-node {
      display: flex;
      align-items: center;
      gap: 8px;

      .el-icon {
        color: var(--el-color-primary);
      }
    }
  }

  &__detail {
    height: 100%;
    border: 1px solid var(--el-border-color);
    border-radius: 4px;
    background: var(--el-bg-color);

    &-header {
      padding: 16px;
      border-bottom: 1px solid var(--el-border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;

      h3 {
        margin: 0;
        color: var(--el-text-color-primary);
      }
    }

    &-content {
      padding: 16px;
    }
  }

  &__ide {
    height: 100%;
    border: 1px solid var(--el-border-color);
    border-radius: 4px;
    background: var(--el-bg-color);
    display: flex;
    flex-direction: column;

    &-toolbar {
      padding: 12px 16px;
      border-bottom: 1px solid var(--el-border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--el-fill-color-light);

      &-left {
        display: flex;
        align-items: center;
        gap: 12px;

        .ide-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--el-text-color-primary);
        }
      }

      &-right {
        display: flex;
        align-items: center;
        gap: 8px;
      }
    }

    &-content {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
  }

  &__editor-container {
    flex: 1;
    height: 100%;
    display: flex;
    flex-direction: column;

    &-tabs {
      flex: 1;
      display: flex;
      flex-direction: column;
      height: 100%;

      :deep(.el-tabs) {
        flex: 1;
        display: flex;
        flex-direction: column;
        height: 100%;

        .el-tabs__header {
          margin: 0;
        }

        .el-tabs__content {
          flex: 1;
          padding: 0;
          height: 100%;

          .el-tab-pane {
            height: 100%;
            padding: 0;
            display: flex;
            flex-direction: column;
          }
        }
      }
    }

    .editor-wrapper {
      flex: 1;
      height: 100%;
      width: 100%;
    }
  }

  &__node-detail {
    padding: 24px;
  }

  &__welcome {
    padding: 40px 24px;
    text-align: center;

    .welcome-tips {
      margin-top: 24px;
      max-width: 500px;
      margin: 24px auto 0;

      h3 {
        margin: 0 0 16px 0;
        color: var(--el-text-color-primary);
        font-size: 18px;
      }

      ul {
        text-align: left;
        margin: 0;
        padding-left: 20px;

        li {
          margin-bottom: 8px;
          color: var(--el-text-color-secondary);
          line-height: 1.5;
        }
      }
    }
  }
}

// 右键菜单样式
:deep(.v-project-management__context-menu) {
  .el-dialog__header,
  .el-dialog__body {
    display: none;
  }
}

.context-menu-content {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 4px 0;
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  color: var(--el-text-color-primary);
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--el-color-primary-light-9);
  }

  &.danger {
    color: var(--el-color-danger);

    &:hover {
      background-color: var(--el-color-danger-light-9);
    }
  }

  .el-icon {
    font-size: 16px;
    color: var(--el-text-color-secondary);
  }
}
</style>
