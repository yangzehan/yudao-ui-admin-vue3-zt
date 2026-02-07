<template>
  <div ref="editorRef" class="monaco-editor-container"></div>
</template>

<script setup lang="ts">
import * as monaco from 'monaco-editor'
import { ref, watch, onMounted, onBeforeUnmount, shallowRef } from 'vue'
import { useAppStore } from '@/store/modules/app'


interface Options extends monaco.editor.IStandaloneEditorConstructionOptions {}

const props = defineProps<{
  modelValue: string
  language?: string
  theme?: string
  options?: Options
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'editorDidMount': [editor: monaco.editor.IStandaloneCodeEditor]
}>()

const editorRef = ref<HTMLElement>()
const editor = shallowRef<monaco.editor.IStandaloneCodeEditor>()
const appStore = useAppStore()

// 获取Monaco主题名称
const getMonacoTheme = () => {
  return appStore.isDark ? 'vs-dark' : 'vs'
}

// 配置 SQL 代码模板补全（保持与内置补全共存）
const configureSqlCompletions = () => {
  monaco.languages.registerCompletionItemProvider('sql', {
    provideCompletionItems: async (model, position) => {
      const word = model.getWordUntilPosition(position)
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn
      }

      const suggestions: any[] = []

      try {
        // 动态导入 monaco-editor 内置 SQL 语言配置
        const sqlLanguageModule = await import('monaco-editor/esm/vs/basic-languages/sql/sql.js')
        const sqlLanguage = sqlLanguageModule.language

        // 获取光标前的内容
        const { lineNumber, column } = position
        const textBeforePointer = model.getValueInRange({
          startLineNumber: lineNumber,
          startColumn: 0,
          endLineNumber: lineNumber,
          endColumn: column,
        })
        const contents = textBeforePointer.trim().split(/\s+/)
        const lastContents = contents[contents?.length - 1]

        if (lastContents) {
          const sqlConfigKeys = ['builtinFunctions', 'keywords', 'operators']
          sqlConfigKeys.forEach(key => {
            if (sqlLanguage[key]) {
              sqlLanguage[key].forEach((sql: string) => {
                suggestions.push({
                  label: sql,
                  insertText: sql,
                  kind: key === 'builtinFunctions'
                    ? monaco.languages.CompletionItemKind.Function
                    : key === 'keywords'
                    ? monaco.languages.CompletionItemKind.Keyword
                    : monaco.languages.CompletionItemKind.Operator,
                  range: range
                })
              })
            }
          })
        }
      } catch (error) {
        console.warn('Failed to load built-in SQL completions:', error)
      }

      return { suggestions }
    }
  })
}

onMounted(() => {
  if (!editorRef.value) return

  // 配置自定义 SQL 代码模板补全（Monaco 内置补全会自动合并）
  if (props.language === 'sql') {
    configureSqlCompletions()
  }

  editor.value = monaco.editor.create(editorRef.value, {
    value: props.modelValue || '',
    language: props.language || 'javascript',
    theme: props.theme || getMonacoTheme(),
    automaticLayout: true,
    minimap: { enabled: true },
    scrollBeyondLastLine: false,
    // 添加滚动条配置以支持滚轮滚动
    scrollbar: {
      vertical: 'visible',
      horizontal: 'visible',
      useShadows: false,
      verticalScrollbarSize: 14,
      horizontalScrollbarSize: 14,
    },
    // 启用平滑滚动
    smoothScrolling: true,
    // 支持 Ctrl+滚轮缩放
    mouseWheelZoom: true,
    // 禁用默认的 Ctrl+S 等保存相关快捷键，避免与外部保存逻辑冲突
    keybindings: {
      default: [],
      added: []
    },
    ...props.options
  })

  editor.value.onDidChangeModelContent(() => {
    const value = editor.value?.getValue() || ''
    emit('update:modelValue', value)
  })

  // 使用 Monaco Editor 的 addAction 注册快捷键
  editor.value.addAction({
    id: 'select-current-line',
    label: '选中当前行',
    keybindings: [
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyR
    ],
    run: (ed) => {
      const position = ed.getPosition()
      if (!position) return

      const model = ed.getModel()
      if (!model) return

      const lineNumber = position.lineNumber
      const lineContent = model.getLineContent(lineNumber)
      const lineLength = lineContent.length

      // 选中整行（从行首到行尾）
      const range = new monaco.Range(lineNumber, 1, lineNumber, lineLength + 1)
      ed.setSelection(range)
    }
  })

  emit('editorDidMount', editor.value)
})

watch(
  () => props.modelValue,
  (newValue) => {
    if (editor.value && newValue !== editor.value.getValue()) {
      editor.value.setValue(newValue || '')
    }
  }
)

// 监听主题变化
watch(
  () => appStore.isDark,
  () => {
    if (editor.value) {
      monaco.editor.setTheme(getMonacoTheme())
    }
  }
)

// 监听语言变化
watch(
  () => props.language,
  (newLanguage) => {
    if (editor.value && newLanguage) {
      const model = editor.value.getModel()
      if (model) {
        monaco.editor.setModelLanguage(model, newLanguage)
      }
    }
  }
)

onBeforeUnmount(() => {
  editor.value?.dispose()
})
</script>

<style scoped>
.monaco-editor-container {
  width: 100%;
  height: 100%;
  min-height: 300px;
  /* 确保容器有明确的边界，允许内容滚动 */
  overflow: hidden;
}
</style>
