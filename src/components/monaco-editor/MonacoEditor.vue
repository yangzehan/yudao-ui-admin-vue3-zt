<template>
  <div
    ref="editorContainer"
    class="monaco-editor-container"
    :style="{ height: props.height }"
  ></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import { language as sqlLanguage } from 'monaco-editor/esm/vs/basic-languages/sql/sql';

interface Props {
  modelValue?: string
  language?: string
  theme?: string
  readonly?: boolean
  height?: string
  options?: any
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  language: 'sql',
  theme: 'vs-dark',
  readonly: false,
  height: '100%'
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'change': [value: string]
  'selectionChange': [selection: any]
}>()

const editorContainer = ref<HTMLElement>()
let editor: monaco.editor.IStandaloneCodeEditor | null = null
let keydownHandler: ((e: KeyboardEvent) => void) | null = null

// 初始化编辑器
const initEditor = () => {
  if (!editorContainer.value) return

  // 配置 Monaco Editor Worker
  self.MonacoEnvironment = {
    getWorker: function (moduleId, label) {
      // 根据标签返回对应的 worker 文件路径
      if (label === 'json') {
        return new jsonWorker()
      }
      // 默认返回编辑器 worker
      return new editorWorker()
    }
  }

  // 创建编辑器实例
  editor = monaco.editor.create(editorContainer.value, {
    value: props.modelValue,
    language: props.language,
    theme: props.theme,
    automaticLayout: true,
    fontSize: 14,
    minimap: {
      enabled: true
    },
    scrollBeyondLastLine: false,
    readOnly: props.readonly,
    wordWrap: 'on',
    lineNumbers: 'on',
    glyphMargin: true,
    folding: true,
    lineDecorationsWidth: 10,
    lineNumbersMinChars: 3,
    renderWhitespace: 'selection',
    contextmenu: true,
    selectOnLineNumbers: true,
    roundedSelection: false,
    cursorStyle: 'line',
    cursorBlinking: 'blink',
    foldingHighlight: true,
    showFoldingControls: 'always',
    smoothScrolling: true,
    ...props.options
  })

  // 监听内容变化
  editor.onDidChangeModelContent(() => {
    const value = editor?.getValue() || ''
    emit('update:modelValue', value)
    emit('change', value)
  })

  // 为 SQL 语言添加智能补全
  if (props.language === 'sql') {
    monaco.languages.registerCompletionItemProvider('sql', {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        };
        
        // 获取 SQL 关键字
        const keywords = sqlLanguage.keywords || [];
        const functions = sqlLanguage.functions || [];
        const operators = sqlLanguage.operators || [];
        const builtinVariables = sqlLanguage.builtinVariables || [];
        
        const suggestions = [
          // 关键字建议
          ...keywords.map(keyword => ({
            label: keyword,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: keyword,
            range: range,
            detail: 'SQL 关键字'
          })),
          
          // 函数建议
          ...functions.map(func => ({
            label: func,
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: func + '($0)',
            range: range,
            detail: 'SQL 函数',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
          })),
          
          // 操作符建议
          ...operators.map(op => ({
            label: op,
            kind: monaco.languages.CompletionItemKind.Operator,
            insertText: op,
            range: range,
            detail: 'SQL 操作符'
          })),
          
          // 内置变量建议
          ...builtinVariables.map(variable => ({
            label: variable,
            kind: monaco.languages.CompletionItemKind.Variable,
            insertText: variable,
            range: range,
            detail: 'SQL 内置变量'
          }))
        ];
        
        return { suggestions };
      }
    });
  }

  // 监听选择变化
  editor.onDidChangeCursorSelection((e) => {
    emit('selectionChange', e)
  })

  // 添加键盘快捷键处理 - Ctrl+W 选中当前单词
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyE, () => {
    const position = editor.getPosition()
    if (!position) return

    const model = editor.getModel()
    if (!model) return

    const lineContent = model.getLineContent(position.lineNumber)

    // 定义单词字符的正则表达式（包含字母、数字、下划线）
    const wordRegex = /[a-zA-Z0-9_]/

    // 向前查找单词开始位置
    let startColumn = position.column
    while (startColumn > 1 && wordRegex.test(lineContent[startColumn - 2])) {
      startColumn--
    }

    // 向后查找单词结束位置
    let endColumn = position.column
    while (endColumn <= lineContent.length && wordRegex.test(lineContent[endColumn - 1])) {
      endColumn++
    }

    // 如果找到了有效的单词范围，则选中它
    if (endColumn > startColumn) {
      editor.setSelection({
        startLineNumber: position.lineNumber,
        startColumn: startColumn,
        endLineNumber: position.lineNumber,
        endColumn: endColumn
      })
    }
  })

  // 监听DOM键盘事件，确保Ctrl+W不会关闭浏览器标签页
  keydownHandler = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
      e.preventDefault()
      e.stopPropagation()
    }
  }
  editorContainer.value?.addEventListener('keydown', keydownHandler)
}

// 更新编辑器内容
const updateContent = (value: string) => {
  if (editor && editor.getValue() !== value) {
    editor.setValue(value)
  }
}

// 设置语言
const setLanguage = (language: string) => {
  if (editor) {
    const model = editor.getModel()
    if (model) {
      monaco.editor.setModelLanguage(model, language)
    }
  }
}

// 设置主题
const setTheme = (theme: string) => {
  monaco.editor.setTheme(theme)
}

// 获取编辑器内容
const getContent = () => {
  return editor?.getValue() || ''
}

// 格式化代码
const format = () => {
  if (editor) {
    editor.getAction('editor.action.formatDocument')?.run()
  }
}

// 全选
const selectAll = () => {
  if (editor) {
    editor.getAction('editor.action.selectAll')?.run()
  }
}

// 查找
const find = () => {
  if (editor) {
    editor.getAction('actions.find')?.run()
  }
}

// 替换
const replace = () => {
  if (editor) {
    editor.getAction('editor.action.startFindReplaceAction')?.run()
  }
}

onMounted(async () => {
  await nextTick()
  initEditor()
})

onUnmounted(() => {
  if (editor) {
    editor.dispose()
    editor = null
  }
  if (editorContainer.value && keydownHandler) {
    editorContainer.value.removeEventListener('keydown', keydownHandler)
    keydownHandler = null
  }
})

// 监听props变化
watch(() => props.modelValue, (newValue) => {
  if (editor && editor.getValue() !== newValue) {
    updateContent(newValue)
  }
})

watch(() => props.language, (newLanguage) => {
  setLanguage(newLanguage)
})

watch(() => props.theme, (newTheme) => {
  setTheme(newTheme)
})

// 暴露方法给父组件
defineExpose({
  getContent,
  setLanguage,
  setTheme,
  format,
  selectAll,
  find,
  replace,
  getEditor: () => editor
})
</script>

<style lang="scss" scoped>
.monaco-editor-container {
  width: 100%;
  height: 100%;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  overflow: hidden;

  // 确保编辑器能够正确填充容器
  :deep(.monaco-editor) {
    .overflow-guard {
      height: 100% !important;
    }

    .monaco-editor-background {
      height: 100% !important;
    }

    .monaco-scrollable-element {
      height: 100% !important;
    }
  }
}
</style>
