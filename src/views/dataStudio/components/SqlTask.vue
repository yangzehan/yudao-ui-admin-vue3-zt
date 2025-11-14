<template>
  <div class="v-sql-task">
    <!-- SQL 编辑器区域 -->
    <div class="v-sql-task__editor">
      <div class="v-sql-task__editor-header">
        <div class="v-sql-task__editor-tabs">
          <el-tabs v-model="activeEditorTab" type="card" @tab-click="handleEditorTabClick">
            <el-tab-pane label="SQL 编辑器" name="sql">
              <!-- SQL 编辑器内容 -->
              <div class="v-sql-task__sql-editor">
                <div class="v-sql-task__editor-toolbar">
                  <el-select v-model="dialect" placeholder="选择方言" style="width: 120px">
                    <el-option label="Flink SQL" value="flinksql" />
                    <el-option label="MySQL" value="mysql" />
                    <el-option label="PostgreSQL" value="postgresql" />
                    <el-option label="Hive" value="hive" />
                  </el-select>

                  <el-button-group>
                    <el-button type="primary" icon="VideoPlay" @click="handleExecute">
                      执行
                    </el-button>
                    <el-button icon="Switch" @click="handleDebug">
                      调试
                    </el-button>
                    <el-button icon="CloseBold" @click="handleStop">
                      停止
                    </el-button>
                  </el-button-group>

                  <el-button-group>
                    <el-button icon="Check" @click="handleValidate">
                      验证
                    </el-button>
                    <el-button icon="DocumentAdd" @click="handleFormat">
                      格式化
                    </el-button>
                  </el-button-group>

                  <el-button-group>
                    <el-button icon="View" @click="handleExplain">
                      解释
                    </el-button>
                    <el-button icon="Share" @click="handleExport">
                      导出
                    </el-button>
                  </el-button-group>
                </div>

                <div class="v-sql-task__editor-content">
                  <!-- 模拟代码编辑器 -->
                  <div class="v-sql-task__code-editor">
                    <div class="v-sql-task__code-lines">
                      <div v-for="i in 20" :key="i" class="v-sql-task__code-line-number">
                        {{ i }}
                      </div>
                    </div>
                    <div class="v-sql-task__code-content">
                      <pre><code>
-- Flink SQL 示例
CREATE TABLE source_table (
  id INT,
  name STRING,
  age INT,
  create_time TIMESTAMP(3)
) WITH (
  'connector' = 'datagen',
  'rows-per-second' = '1'
);

CREATE TABLE sink_table (
  id INT,
  name STRING,
  age INT,
  create_time TIMESTAMP(3)
) WITH (
  'connector' = 'print'
);

INSERT INTO sink_table
SELECT * FROM source_table;
                      </code></pre>
                    </div>
                  </div>
                </div>
              </div>
            </el-tab-pane>
            <el-tab-pane label="配置" name="config">
              <div class="v-sql-task__config">
                <el-form :model="taskConfig" label-width="120px">
                  <el-form-item label="任务名称">
                    <el-input v-model="taskConfig.name" placeholder="请输入任务名称" />
                  </el-form-item>
                  <el-form-item label="执行模式">
                    <el-select v-model="taskConfig.executionMode" placeholder="请选择执行模式">
                      <el-option label="本地执行" value="local" />
                      <el-option label="远程执行" value="remote" />
                      <el-option label="YARN 会话" value="yarn-session" />
                      <el-option label="YARN 应用" value="yarn-application" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="Flink 版本">
                    <el-select v-model="taskConfig.flinkVersion" placeholder="请选择 Flink 版本">
                      <el-option label="Flink 1.17" value="1.17" />
                      <el-option label="Flink 1.16" value="1.16" />
                      <el-option label="Flink 1.15" value="1.15" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="并行度">
                    <el-input-number v-model="taskConfig.parallelism" :min="1" :max="100" />
                  </el-form-item>
                  <el-form-item label="检查点间隔">
                    <el-input v-model="taskConfig.checkpointInterval" placeholder="检查点间隔(ms)">
                      <template #append>ms</template>
                    </el-input>
                  </el-form-item>
                </el-form>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </div>

    <!-- 结果展示区域 -->
    <div class="v-sql-task__result">
      <div class="v-sql-task__result-header">
        <el-tabs v-model="activeResultTab" type="card">
          <el-tab-pane label="执行结果" name="result">
            <div class="v-sql-task__result-content">
              <el-table :data="resultData" style="width: 100%" height="200">
                <el-table-column prop="id" label="ID" width="80" />
                <el-table-column prop="name" label="姓名" />
                <el-table-column prop="age" label="年龄" width="80" />
                <el-table-column prop="create_time" label="创建时间" width="180" />
              </el-table>
            </div>
          </el-tab-pane>
          <el-tab-pane label="执行日志" name="log">
            <div class="v-sql-task__log-content">
              <pre class="v-sql-task__log-text">
[INFO] 开始执行 SQL 任务...
[INFO] 解析 SQL 语句...
[INFO] 验证 SQL 语法...
[INFO] 生成执行计划...
[INFO] 提交任务到 Flink 集群...
[INFO] 任务执行成功！
              </pre>
            </div>
          </el-tab-pane>
          <el-tab-pane label="任务信息" name="info">
            <div class="v-sql-task__info-content">
              <el-descriptions :column="1" border>
                <el-descriptions-item label="任务ID">task-001</el-descriptions-item>
                <el-descriptions-item label="任务名称">示例任务</el-descriptions-item>
                <el-descriptions-item label="执行模式">本地执行</el-descriptions-item>
                <el-descriptions-item label="Flink版本">1.17</el-descriptions-item>
                <el-descriptions-item label="并行度">1</el-descriptions-item>
                <el-descriptions-item label="状态">
                  <el-tag type="success">运行中</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="开始时间">2024-01-01 10:00:00</el-descriptions-item>
                <el-descriptions-item label="运行时长">5分钟</el-descriptions-item>
              </el-descriptions>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'

// 响应式数据
const activeEditorTab = ref('sql')
const activeResultTab = ref('result')
const dialect = ref('flinksql')

// 任务配置
const taskConfig = reactive({
  name: '',
  executionMode: 'local',
  flinkVersion: '1.17',
  parallelism: 1,
  checkpointInterval: '30000'
})

// 模拟结果数据
const resultData = reactive([
  { id: 1, name: '张三', age: 25, create_time: '2024-01-01 10:00:00' },
  { id: 2, name: '李四', age: 30, create_time: '2024-01-01 10:01:00' },
  { id: 3, name: '王五', age: 28, create_time: '2024-01-01 10:02:00' }
])

// 事件处理
const handleExecute = () => {
  ElMessage.success('开始执行 SQL 任务')
}

const handleDebug = () => {
  ElMessage.info('调试模式开发中...')
}

const handleStop = () => {
  ElMessage.warning('停止任务执行')
}

const handleValidate = () => {
  ElMessage.success('SQL 语法验证通过')
}

const handleFormat = () => {
  ElMessage.info('格式化 SQL 代码')
}

const handleExplain = () => {
  ElMessage.info('显示执行计划')
}

const handleExport = () => {
  ElMessage.info('导出任务配置')
}

const handleEditorTabClick = (tab: any) => {
  console.log('编辑器标签页切换:', tab.props.name)
}
</script>

<style lang="scss" scoped>
.v-sql-task {
  height: 100%;
  display: flex;
  flex-direction: column;

  &__editor {
    flex: 1;
    display: flex;
    flex-direction: column;
    border-bottom: 1px solid var(--el-border-color);

    &-header {
      border-bottom: 1px solid var(--el-border-color);
    }

    &-tabs {
      :deep(.el-tabs) {
        .el-tabs__header {
          margin: 0;
        }

        .el-tabs__content {
          flex: 1;
        }
      }
    }
  }

  &__sql-editor {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  &__editor-toolbar {
    padding: 8px 16px;
    border-bottom: 1px solid var(--el-border-color);
    display: flex;
    align-items: center;
    gap: 16px;
    background: var(--el-bg-color-page);
  }

  &__editor-content {
    flex: 1;
    overflow: hidden;
  }

  &__code-editor {
    height: 100%;
    display: flex;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 14px;
    line-height: 1.5;
  }

  &__code-lines {
    background: var(--el-fill-color-light);
    border-right: 1px solid var(--el-border-color);
    padding: 8px 12px;
    text-align: right;
    color: var(--el-text-color-secondary);
    user-select: none;
    min-width: 60px;
  }

  &__code-line-number {
    height: 22px;
    line-height: 22px;
  }

  &__code-content {
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

  &__config {
    padding: 16px;
  }

  &__result {
    height: 300px;
    display: flex;
    flex-direction: column;

    &-header {
      :deep(.el-tabs) {
        .el-tabs__header {
          margin: 0;
        }

        .el-tabs__content {
          flex: 1;
          padding: 0;
        }
      }
    }

    &-content {
      height: 100%;
      padding: 16px;
    }

    &__log-content {
      height: 100%;
      padding: 16px;
      background: var(--el-bg-color);
      overflow: auto;
    }

    &__log-text {
      margin: 0;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 12px;
      line-height: 1.5;
      color: var(--el-text-color-primary);
      white-space: pre-wrap;
    }

    &__info-content {
      padding: 16px;
    }
  }
}
</style>