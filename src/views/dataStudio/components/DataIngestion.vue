/<template>
  <ContentWrap>
    <!-- 主要内容区域：Splitter 布局 -->
    <div class="h-[calc(100vh-120px)] mt-16px">
      <el-splitter class="h-full">
      <!-- 左侧文件管理窗口 -->
      <el-splitter-panel size="20%" :min="200" class="flex flex-col bg-[var(--el-bg-color)]">
        <!-- 文件管理头部 -->
        <div class="flex-shrink-0 px-16px py-12px border-b border-[var(--el-border-color)] bg-[var(--el-fill-color-light)]">
          <h3 class="m-0 text-14px font-600 text-[var(--el-text-color-primary)]">文件管理</h3>
        </div>
        <!-- 搜索框 -->
        <div class="flex-shrink-0 px-16px py-12px border-b border-[var(--el-border-color)]">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索文件..."
            :prefix-icon="Search"
            clearable
            @input="handleSearch"
          />
        </div>
        <!-- 文件树区域 -->
        <div class="flex-1 overflow-y-auto p-8px">
          <el-tree
            :data="filteredFileTreeData"
            :props="treeProps"
            default-expand-all
            @node-click="handleNodeClick"
          >
            <template #default="{  data }">
              <div
                class="flex items-center gap-8px text-14px w-full cursor-default"
                @contextmenu.prevent="handleNodeContextMenu($event, data)"
              >
                <el-icon v-if="data.type === 'folder'" class="text-[var(--el-color-primary)]"><FolderOpened /></el-icon>
                <el-icon v-else-if="data.type === 'yaml'" class="text-[var(--el-color-primary)]"><Document /></el-icon>
                <el-icon v-else class="text-[var(--el-color-primary)]"><FileText /></el-icon>
                <span>{{ hideFileExtension(data.name, data.type) }}</span>
              </div>
            </template>
          </el-tree>

          <!-- 右键菜单 -->
          <div
            v-if="contextMenuVisible"
            class="fixed bg-[var(--el-bg-color)] border border-[var(--el-border-color)] rounded-4px shadow-lg p-4px z-2000 min-w-140px"
            :style="{ top: contextMenuY + 'px', left: contextMenuX + 'px' }"
            @click.stop
          >
            <template v-if="contextMenuTarget?.type === 'folder'">
              <div class="flex items-center gap-8px px-16px py-8px text-14px text-[var(--el-text-color-primary)] cursor-pointer transition-colors-300 hover:bg-[var(--el-fill-color-light)]" @click="handleCreateFile">
                <el-icon class="text-16px"><Document /></el-icon>
                <span>新增文件</span>
              </div>
              <div class="flex items-center gap-8px px-16px py-8px text-14px text-[var(--el-text-color-primary)] cursor-pointer transition-colors-300 hover:bg-[var(--el-fill-color-light)]" @click="handleCreateFolder">
                <el-icon class="text-16px"><FolderOpened /></el-icon>
                <span>新增子文件夹</span>
              </div>
              <div class="flex items-center gap-8px px-16px py-8px text-14px text-[var(--el-text-color-primary)] cursor-pointer transition-colors-300 hover:bg-[var(--el-fill-color-light)]" @click="handleRename">
                <el-icon class="text-16px"><EditPen /></el-icon>
                <span>重命名</span>
              </div>
            </template>
            <template v-else>
              <div class="flex items-center gap-8px px-16px py-8px text-14px text-[var(--el-color-danger)] cursor-pointer transition-colors-300 hover:bg-[var(--el-color-danger-light-9)]" @click="handleDelete">
                <el-icon class="text-16px"><Delete /></el-icon>
                <span>删除</span>
              </div>
              <div class="flex items-center gap-8px px-16px py-8px text-14px text-[var(--el-text-color-primary)] cursor-pointer transition-colors-300 hover:bg-[var(--el-fill-color-light)]" @click="handleRename">
                <el-icon class="text-16px"><EditPen /></el-icon>
                <span>重命名</span>
              </div>
              <div class="flex items-center gap-8px px-16px py-8px text-14px text-[var(--el-text-color-primary)] cursor-pointer transition-colors-300 hover:bg-[var(--el-fill-color-light)]" @click="handleMove">
                <el-icon class="text-16px"><Rank /></el-icon>
                <span>移动</span>
              </div>
            </template>
          </div>
        </div>
      </el-splitter-panel>

      <!-- 右侧内容区域（编辑器 + 工具栏） -->
      <el-splitter-panel size="80%" :min="600" class="flex flex-col bg-[var(--el-bg-color)]">
        <!-- 编辑器和工具栏的Splitter -->
        <el-splitter class="h-full" horizontal>
          <!-- 中间编辑器区域 -->
          <el-splitter-panel :min="400" class="flex flex-col">
            <!-- 编辑器工具栏 -->
            <div class="flex-shrink-0 px-16px py-12px border-b border-[var(--el-border-color)] bg-[var(--el-fill-color-light)] flex justify-end items-center gap-8px">
              <el-button type="primary" size="small" icon="Upload">
                导入
              </el-button>
              <el-button type="warning" size="small" icon="Refresh">
                刷新
              </el-button>
              <el-button
                ref="saveButtonRef"
                type="success"
                size="small"
                icon="DocumentChecked"
                :loading="isSaving"
                @click="handleSave"
              >
                保存
              </el-button>
            </div>
            <!-- 编辑器标签页和内容区 -->
            <div class="flex-1 flex flex-col overflow-hidden">
              <template v-if="openedFiles.length > 0">
                <el-tabs
                  v-model="activeTabId"
                  type="card"
                  closable
                  @tab-remove="handleRemoveTab"
                  @tab-click="handleTabClick"
                  class="h-full flex flex-col"
                >
                  <el-tab-pane
                    v-for="file in openedFiles"
                    :key="file.id"
                    :label="hideFileExtension(file.name, file.type) + (file.isDirty ? ' •' : '')"
                    :name="file.id!.toString()"
                  >
                    <el-splitter class="h-full" >
                      <el-splitter-panel class="flex flex-col">
                        <!-- 编辑器区域 -->
                        <el-splitter class="h-full" horizontal>
                          <el-splitter-panel :size="100 - toolBarSize" class="flex flex-col">
                            <!-- 编辑器主体 -->
                            <div class="flex-1 flex flex-col">
                              <MonacoEditor
                                v-model="file.content"
                                language="yaml"
                                :height="'100%'"
                                :options="editorOptions"
                                @change="handleContentChange(file)"
                              />
                            </div>
                          </el-splitter-panel>

                          <!-- 动态工具面板 -->
                          <el-splitter-panel v-if="file.activeToolbarKey" :size="toolBarSize">
                            <ConfigPanel
                              v-if="file.activeToolbarKey === 'config'"
                              :file="file"
                              @update:config="(newConfig) => handleConfigUpdate(file, newConfig)"
                            />
                          </el-splitter-panel>

                          <!-- 细窄的右侧导航栏 -->
                          <div class="flex flex-col p-2 items-center justify-start h-full w-48 bg-[var(--el-fill-color-light)] border-l border-[var(--el-border-color)]">
                            <div
                              v-for="button in toolbarButtons"
                              :key="button.key"
                              class="flex items-center gap-2 px-3 py-2 my-1 rounded cursor-pointer hover:bg-[var(--el-fill-color-blank)] w-full transition-colors-300"
                              :class="{ 'bg-[var(--el-color-primary-light-8)]': file.activeToolbarKey === button.key }"
                              @click="handleTabToolbarButtonClick(file, button.key)"
                            >
                              <el-icon :size="18">
                                <component :is="button.icon" />
                              </el-icon>
                              <span class="text-[var(--el-text-color-primary)]">{{ button.label }}</span>
                            </div>
                          </div>
                        </el-splitter>
                      </el-splitter-panel>
                    </el-splitter>
                  </el-tab-pane>
                </el-tabs>
              </template>
              <div v-else class="flex-1 flex items-center justify-center">
                <el-empty description="请从左侧选择文件进行编辑" />
              </div>
            </div>
          </el-splitter-panel>
        </el-splitter>
      </el-splitter-panel>
    </el-splitter>

    <!-- 移动文件对话框 -->
    <el-dialog
      v-model="moveDialogVisible"
      title="移动文件"
      width="500px"
      @close="moveDialogVisible = false"
    >
      <div class="p-20px">
        <p class="mb-16px text-14px text-[var(--el-text-color-primary)]">
          请选择目标文件夹：
        </p>
        <el-select
          v-model="targetFolderId"
          placeholder="选择文件夹"
          class="w-full"
          filterable
        >
          <el-option
            v-for="folder in flattenFolders(fileTreeData)"
            :key="folder.value"
            :label="folder.label"
            :value="folder.value"
          />
        </el-select>
      </div>
      <template #footer>
        <el-button @click="moveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmMove">确定</el-button>
      </template>
    </el-dialog>

    <!-- 版本面板 -->
    <VersionPanel
      ref="versionPanelRef"
      v-model="versionPanelVisible"
      :current-file-id="activeTabId ? Number(activeTabId) : undefined"
      :file-name="(openedFiles.find(f => f.id?.toString() === activeTabId) as OpenedFile | undefined)?.name"
      @rollback="handleVersionRollback"
    />
    </div>
  </ContentWrap>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useMessage } from '@/hooks/web/useMessage'
import MonacoEditor from '@/components/monaco-editor/MonacoEditor.vue'

import { Search, Clock } from '@element-plus/icons-vue'
import { Document, EditPen, Delete, Rank, FolderOpened, Close, Setting } from '@element-plus/icons-vue'
import { ElSelect } from 'element-plus'
import {
  getDataIngestionTree as getFileTree,
  createDataIngestion as createFile,
  deleteDataIngestion as deleteFile,
  renameDataIngestion as renameFile,
  moveDataIngestion as moveFile,
  getDataIngestionContent as getFileContent,
  getDataIngestionData as getFileData,
  saveDataIngestionContent as saveFileContent,
  saveDataIngestionData as saveFileData,
  generateDataIngestionPath as generateFilePath,
  getDataIngestionFileType as getFileType,
  DataIngestionVO as FileManageVO,
  DataIngestionDataSaveReqVO
} from '@/api/dataStudio/dataIngestion'
import { createVersion } from '@/api/dataStudio/dataIngestionVersion'
import { ElMessageBox } from 'element-plus'
import VersionPanel from './dataIngestion/components/VersionPanel.vue'
import ConfigPanel from '@/components/dataStudio/ConfigPanel.vue'

const message = useMessage() // 消息弹窗

// 文件树数据
const fileTreeData = ref<FileManageVO[]>([])

// 搜索关键词
const searchKeyword = ref('')

// 保存按钮引用
const saveButtonRef = ref()

// 保存状态（防重复点击）
const isSaving = ref(false)

// 已打开的文件列表
interface OpenedFile extends FileManageVO {
  content: string
  isDirty: boolean
  activeToolbarKey?: string
  config?: any
}
const openedFiles = ref<OpenedFile[]>([])

// 当前激活的标签页ID
const activeTabId = ref<string | null>(null)

// 右键菜单状态
const contextMenuVisible = ref(false)
const contextMenuX = ref(0)
const contextMenuY = ref(0)
const contextMenuTarget = ref<any>(null)

// 移动文件对话框状态
const moveDialogVisible = ref(false)
const targetFolderId = ref<number>(0)

// 版本面板状态
const versionPanelVisible = ref(false)
const versionPanelRef = ref()

// ==================== 工具栏数据 ====================

// 工具栏按钮配置
const toolbarButtons = [
  {
    key: 'config',
    label: '配置',
    icon: Setting
  },
  {
    key: 'version',
    label: '版本',
    icon: Clock
  }
]

// 工具栏大小（百分比）
const toolBarSize = ref(20)

// ==================== 数据加载 ====================

// 文件树排序函数：文件排在文件夹前面，文件按创建时间降序排序
const sortFileTreeData = (nodes: FileManageVO[]): FileManageVO[] => {
  return nodes
    .map(node => ({
      ...node,
      children: node.children ? sortFileTreeData(node.children) : []
    }))
    .sort((a, b) => {
      // 如果一个是文件，一个是文件夹，文件排在前面
      if (a.type === 'folder' && b.type !== 'folder') {
        return 1 // a在b后面
      }
      if (a.type !== 'folder' && b.type === 'folder') {
        return -1 // a在b前面
      }

      // 如果都是文件或都是文件夹，按创建时间降序排序
      if (a.createTime && b.createTime) {
        return new Date(b.createTime).getTime() - new Date(a.createTime).getTime()
      }

      // 如果没有创建时间，按sort字段排序
      if (a.sort !== undefined && b.sort !== undefined) {
        return a.sort - b.sort
      }

      // 最后按名称排序
      return a.name.localeCompare(b.name)
    })
}

// 加载文件树
const loadFileTree = async () => {
  try {
    const data = await getFileTree()
    fileTreeData.value = sortFileTreeData(data)
  } catch (error) {
    console.error('加载文件树失败:', error)
    message.error('加载文件树失败')
  }
}

// 加载文件内容并添加到已打开文件列表
const loadFileContent = async (file: FileManageVO) => {
  try {
    // 使用新的get-data接口获取文件数据和配置信息
    const fileData = await getFileData(file.id!)
    const newFile: OpenedFile = {
      ...file,
      content: fileData.content || `# ${file.name}\n# 数据摄取配置\n`,
      config: fileData.config,
      isDirty: false,
      activeToolbarKey: undefined
    }
    openedFiles.value.push(newFile)
    activeTabId.value = file.id!.toString()
  } catch (error) {
    console.error('加载文件内容失败:', error)
    message.error('加载文件内容失败')
  }
}

// 刷新文件树
const refreshFileTree = async () => {
  await loadFileTree()
}

// ==================== 事件处理 ====================

// 键盘事件处理
const handleKeyboard = (event: KeyboardEvent) => {
  // 检查 Ctrl+S (Windows/Linux) 或 Cmd+S (Mac)
  if ((event.ctrlKey || event.metaKey) && event.key === 's') {
    event.preventDefault() // 阻止浏览器默认的保存行为
    event.stopPropagation() // 阻止事件冒泡
    handleSave()
  }
}

// 右键节点菜单处理
const handleNodeContextMenu = (event: MouseEvent, data: FileManageVO) => {
  contextMenuX.value = event.clientX
  contextMenuY.value = event.clientY
  contextMenuTarget.value = data
  contextMenuVisible.value = true
}

// 隐藏右键菜单
const hideContextMenu = () => {
  contextMenuVisible.value = false
}

// 点击其他地方隐藏菜单
const handleDocumentClick = () => {
  hideContextMenu()
}

// ==================== 工具函数 ====================

// 隐藏文件扩展名（用于显示）
const hideFileExtension = (fileName: string, type: string): string => {
  if (type === 'yaml') {
    return fileName.replace(/\.(yaml|yml)$/i, '')
  }
  return fileName
}

// 扁平化文件夹树为选项列表
const flattenFolders = (nodes: FileManageVO[], parentPath: string = ''): { value: number; label: string }[] => {
  const result: { value: number; label: string }[] = []

  const traverse = (nodes: FileManageVO[], currentPath: string) => {
    nodes.forEach(node => {
      if (node.type === 'folder' && node.id !== undefined && node.id !== null) {
        const fullPath = currentPath ? `${currentPath}/${node.name}` : node.name
        result.push({
          value: node.id,
          label: fullPath
        })
        if (node.children && node.children.length > 0) {
          traverse(node.children, fullPath)
        }
      }
    })
  }

  traverse(nodes, parentPath)
  return result
}

// ==================== 右键菜单操作 ====================

// 新增文件
const handleCreateFile = async () => {
  const folder = contextMenuTarget.value
  try {
    const { value: fileName } = await ElMessageBox.prompt('请输入YAML文件名称（无需输入.yaml扩展名）', '新增YAML文件', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /.+/,
      inputErrorMessage: '文件名称不能为空'
    })

    const parentId = folder?.type === 'folder' ? folder.id : folder?.parentId || 0
    // 自动添加 .yaml 扩展名
    const finalFileName = fileName.endsWith('.yaml') || fileName.endsWith('.yml') ? fileName : `${fileName}.yaml`
    const filePath = generateFilePath(folder?.filePath || '/datastudio', finalFileName)
    const type = 'yaml'

    await createFile({
      name: finalFileName,
      type,
      parentId,
      filePath,
      sort: 0,
      status: 1
    })

    message.success('创建成功')
    await refreshFileTree()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('创建文件失败:', error)
      message.error('创建文件失败')
    }
  } finally {
    hideContextMenu()
  }
}

// 新增子文件夹
const handleCreateFolder = async () => {
  const folder = contextMenuTarget.value
  try {
    const { value: folderName } = await ElMessageBox.prompt('请输入文件夹名称', '新增子文件夹', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /.+/,
      inputErrorMessage: '文件夹名称不能为空'
    })

    const parentId = folder.id
    const filePath = generateFilePath(folder?.filePath || '/datastudio', folderName)

    await createFile({
      name: folderName,
      type: 'folder',
      parentId,
      filePath,
      sort: 0,
      status: 1
    })

    message.success('创建成功')
    await refreshFileTree()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('创建文件夹失败:', error)
      message.error('创建文件夹失败')
    }
  } finally {
    hideContextMenu()
  }
}

// 重命名
const handleRename = async () => {
  const item = contextMenuTarget.value
  if (!item) return

  try {
    const { value: newName } = await ElMessageBox.prompt('请输入新名称', '重命名', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputValue: hideFileExtension(item.name, item.type),
      inputPattern: /.+/,
      inputErrorMessage: '名称不能为空'
    })

    await renameFile(item.id!, newName)
    message.success('重命名成功')
    await refreshFileTree()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('重命名失败:', error)
      message.error('重命名失败')
    }
  } finally {
    hideContextMenu()
  }
}

// 删除文件
const handleDelete = async () => {
  const item = contextMenuTarget.value
  if (!item) return

  try {
    await ElMessageBox.confirm(
      `确定要删除 "${item.name}" ${item.type === 'folder' ? '及其所有子文件' : ''} 吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await deleteFile(item.id!)
    message.success('删除成功')
    await refreshFileTree()

    // 如果删除的是已打开的文件，关闭对应的标签页
    const openedIndex = openedFiles.value.findIndex(f => f.id === item.id)
    if (openedIndex !== -1) {
      const isActive = activeTabId.value === item.id?.toString()
      openedFiles.value.splice(openedIndex, 1)

      // 如果删除的是当前激活的标签页，切换到其他标签页
      if (isActive) {
        if (openedFiles.value.length > 0) {
          const newIndex = Math.min(openedIndex, openedFiles.value.length - 1)
          const newFile = openedFiles.value[newIndex] as OpenedFile
          activeTabId.value = newFile.id!.toString()
        } else {
          activeTabId.value = null
        }
      }
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      message.error('删除失败：' + (error as Error).message)
    }
  } finally {
    hideContextMenu()
  }
}

// 移动文件
const handleMove = () => {
  const item = contextMenuTarget.value
  if (!item) return

  targetFolderId.value = item.parentId || 0 // 重置为目标目录为当前文件的父目录
  moveDialogVisible.value = true
  hideContextMenu()
}

// 确认移动文件
const confirmMove = async () => {
  const item = contextMenuTarget.value
  if (!item) return

  try {
    // 修复移动文件功能，确保正确传递参数
    await moveFile(item.id!, targetFolderId.value)
    message.success('移动成功')
    await refreshFileTree()
    moveDialogVisible.value = false
  } catch (error) {
    console.error('移动失败:', error)
    message.error('移动失败')
  }
}

// 保存处理
const handleSave = async () => {
  if (!activeTabId.value) {
    message.warning('请先选择文件')
    return
  }

  // 防重复点击
  if (isSaving.value) {
    return
  }

  const currentFile = openedFiles.value.find(f => f.id?.toString() === activeTabId.value)
  if (!currentFile) {
    message.warning('未找到要保存的文件')
    return
  }

  try {
    isSaving.value = true

    // 使用统一的saveData接口，同时保存内容和创建版本
    // config保存用户在配置面板中修改的Flink配置信息
    const config = currentFile.config

    await saveFileData({
      id: currentFile.id!,
      name: currentFile.name,
      type: currentFile.type,
      parentId: currentFile.parentId,
      filePath: currentFile.filePath,
      content: currentFile.content,
      sort: currentFile.sort,
      status: currentFile.status,
      config: config
    })

    // 保存成功后，重新加载文件数据确保同步
    const fileData = await getFileData(currentFile.id!)
    currentFile.content = fileData.content || currentFile.content
    currentFile.config = fileData.config
    currentFile.isDirty = false

    message.success('保存成功')
  } catch (error: any) {
    console.error('保存失败:', error)
    message.error(error.message || '保存失败')
  } finally {
    isSaving.value = false
  }
}

// 版本回滚处理
const handleVersionRollback = async () => {
  // 重新加载当前文件内容
  const currentFile = openedFiles.value.find(f => f.id?.toString() === activeTabId.value)
  if (currentFile) {
      const fileData = await getFileData(currentFile.id!)
      // 更新当前文件对象的内容和配置
      currentFile.content = fileData.content || currentFile.content
      currentFile.config = fileData.config
      currentFile.isDirty = false

      // 刷新版本面板的版本列表
      if (versionPanelRef.value?.refresh) {
        versionPanelRef.value.refresh()
      }
    }
}

// 工具栏按钮点击事件
const handleTabToolbarButtonClick = (file: OpenedFile, key: string) => {
  if (file.activeToolbarKey === key) {
    // 如果点击的是当前已激活的工具栏，则关闭它
    file.activeToolbarKey = undefined
    toolBarSize.value = 0
  } else {
    // 如果点击的是版本按钮，先检查是否有激活的文件，然后显示版本面板
    if (key === 'version') {
      versionPanelVisible.value = true
      return
    }

    // 否则激活对应的工具栏
    file.activeToolbarKey = key
    toolBarSize.value = 40
  }

  // 根据按钮key执行相应操作
  if (key === 'version') {
    versionPanelVisible.value = true
  }
}

// 处理配置更新
const handleConfigUpdate = (file: OpenedFile, newConfig: any) => {
  file.config = newConfig
}


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

// 树配置
const treeProps = {
  children: 'children',
  label: 'name'
}

// 搜索过滤函数
const filterTreeNodes = (node: FileManageVO, keyword: string): FileManageVO | null => {
  if (!keyword) {
    return node
  }

  const { name, children } = node
  const isMatch = name.toLowerCase().includes(keyword.toLowerCase())

  if (children && children.length > 0) {
    const filteredChildren = children
      .map(child => filterTreeNodes(child, keyword))
      .filter(child => child !== null) as FileManageVO[]

    if (filteredChildren.length > 0) {
      // 对过滤后的子节点应用排序
      return {
        ...node,
        children: sortFileTreeData(filteredChildren)
      }
    }
  }

  return isMatch ? node : null
}

// 过滤后的文件树数据
const filteredFileTreeData = computed(() => {
  if (!searchKeyword.value) {
    return fileTreeData.value
  }
  const filtered = fileTreeData.value
    .map(node => filterTreeNodes(node, searchKeyword.value))
    .filter(node => node !== null) as FileManageVO[]
  // 对根节点应用排序
  return sortFileTreeData(filtered)
})

// 搜索处理
const handleSearch = () => {
  // 搜索逻辑已在 computed 中处理
}

// 节点点击处理
const handleNodeClick = (data: FileManageVO) => {
  if (data.type !== 'folder') {
    // 检查文件是否已经打开
    const existingFile = openedFiles.value.find(f => f.id === data.id)
    if (existingFile) {
      // 如果文件已存在，切换到该标签页
      activeTabId.value = data.id!.toString()
    } else {
      // 如果文件不存在，加载并添加为新标签页
      loadFileContent(data)
    }
  }
}

// 关闭标签页
const handleRemoveTab = (tabId: string) => {
  const index = openedFiles.value.findIndex(f => f.id?.toString() === tabId)
  if (index !== -1) {
    openedFiles.value.splice(index, 1)
  }

  // 如果关闭的是当前激活的标签页，切换到其他标签页
  if (activeTabId.value === tabId) {
    if (openedFiles.value.length > 0) {
      const newIndex = Math.min(index, openedFiles.value.length - 1)
      const newFile = openedFiles.value[newIndex] as OpenedFile
      activeTabId.value = newFile.id!.toString()
    } else {
      activeTabId.value = null
    }
  }
}

// 标签页点击切换
const handleTabClick = (tab: any) => {
  activeTabId.value = tab.paneName
}

// 内容变更处理
const handleContentChange = (file: OpenedFile) => {
  file.isDirty = true
}

// 组件挂载时初始化
onMounted(async () => {
  window.addEventListener('keydown', handleKeyboard)
  document.addEventListener('click', handleDocumentClick)
  // 添加ESC键关闭菜单
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hideContextMenu()
    }
  })

  // 加载文件树
  await loadFileTree()
})

// 组件卸载时移除事件监听
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyboard)
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<style lang="scss" scoped>
/*
 * 编辑器样式优化
 * 使用深选择器确保Monaco编辑器正确继承高度
 */
:deep(.el-tabs) {
  .el-tabs__content {
    position: relative;
  }

  .el-tab-pane {
    height: 100%;
    position: relative;
  }
}
</style>
