<template>
  <div class="v-quick-start">
    <div class="v-quick-start__header">
      <h2>欢迎使用 DataStudio</h2>
      <p>Flink SQL 开发环境</p>
    </div>

    <div class="v-quick-start__content">
      <el-row :gutter="24">
        <el-col :span="12">
          <div class="v-quick-start__card">
            <div class="v-quick-start__card-header">
              <el-icon><Folder /></el-icon>
              <h3>项目管理</h3>
            </div>
            <div class="v-quick-start__card-content">
              <p>创建和管理 Flink SQL 项目</p>
              <el-button type="primary" @click="handleCreateProject">
                创建项目
              </el-button>
            </div>
          </div>
        </el-col>

        <el-col :span="12">
          <div class="v-quick-start__card">
            <div class="v-quick-start__card-header">
              <el-icon><DataLine /></el-icon>
              <h3>数据源管理</h3>
            </div>
            <div class="v-quick-start__card-content">
              <p>配置和管理数据源连接</p>
              <el-button type="primary" @click="handleManageDataSource">
                管理数据源
              </el-button>
            </div>
          </div>
        </el-col>

        <el-col :span="12">
          <div class="v-quick-start__card">
            <div class="v-quick-start__card-header">
              <el-icon><MagicStick /></el-icon>
              <h3>函数管理</h3>
            </div>
            <div class="v-quick-start__card-content">
              <p>创建和管理 UDF 函数</p>
              <el-button type="primary" @click="handleManageFunction">
                管理函数
              </el-button>
            </div>
          </div>
        </el-col>

        <el-col :span="12">
          <div class="v-quick-start__card">
            <div class="v-quick-start__card-header">
              <el-icon><Files /></el-icon>
              <h3>资源管理</h3>
            </div>
            <div class="v-quick-start__card-content">
              <p>上传和管理资源文件</p>
              <el-button type="primary" @click="handleManageResource">
                管理资源
              </el-button>
            </div>
          </div>
        </el-col>

        <el-col :span="12">
          <div class="v-quick-start__card">
            <div class="v-quick-start__card-header">
              <el-icon><Connection /></el-icon>
              <h3>SQL 任务</h3>
            </div>
            <div class="v-quick-start__card-content">
              <p>创建和执行 Flink SQL 任务</p>
              <el-button type="primary" @click="handleCreateSqlTask">
                创建 SQL 任务
              </el-button>
            </div>
          </div>
        </el-col>

        <el-col :span="12">
          <div class="v-quick-start__card">
            <div class="v-quick-start__card-header">
              <el-icon><Monitor /></el-icon>
              <h3>服务管理</h3>
            </div>
            <div class="v-quick-start__card-content">
              <p>查看任务执行状态和历史</p>
              <el-button type="primary" @click="handleManageService">
                查看服务
              </el-button>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <div class="v-quick-start__footer">
      <h3>快速开始</h3>
      <el-steps :active="1" align-center>
        <el-step title="创建项目" description="新建一个 Flink SQL 项目" />
        <el-step title="配置数据源" description="连接数据源进行数据开发" />
        <el-step title="编写 SQL" description="编写 Flink SQL 处理逻辑" />
        <el-step title="执行任务" description="执行 SQL 任务查看结果" />
      </el-steps>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'

// 事件处理
const handleCreateProject = () => {
  ElMessage.info('创建项目功能开发中...')
}

const handleManageDataSource = () => {
  ElMessage.info('数据源管理功能开发中...')
}

const handleManageFunction = () => {
  ElMessage.info('函数管理功能开发中...')
}

const handleManageResource = () => {
  ElMessage.info('资源管理功能开发中...')
}

const handleCreateSqlTask = () => {
  ElMessage.info('创建 SQL 任务功能开发中...')
}

const handleManageService = () => {
  ElMessage.info('服务管理功能开发中...')
}
</script>

<style lang="scss" scoped>
.v-quick-start {
  padding: 24px;
  height: 100%;
  overflow-y: auto;

  &__header {
    text-align: center;
    margin-bottom: 32px;

    h2 {
      margin: 0 0 8px 0;
      color: var(--el-text-color-primary);
      font-size: 24px;
    }

    p {
      margin: 0;
      color: var(--el-text-color-secondary);
      font-size: 14px;
    }
  }

  &__content {
    margin-bottom: 32px;
  }

  &__card {
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color);
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 24px;
    transition: all 0.3s;

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }

    &-header {
      display: flex;
      align-items: center;
      margin-bottom: 16px;

      .el-icon {
        font-size: 24px;
        color: var(--el-color-primary);
        margin-right: 12px;
      }

      h3 {
        margin: 0;
        color: var(--el-text-color-primary);
        font-size: 16px;
      }
    }

    &-content {
      p {
        margin: 0 0 16px 0;
        color: var(--el-text-color-secondary);
        font-size: 14px;
        line-height: 1.5;
      }
    }
  }

  &__footer {
    h3 {
      margin: 0 0 24px 0;
      color: var(--el-text-color-primary);
      text-align: center;
      font-size: 18px;
    }
  }
}
</style>