<template>
  <ContentWrap>
    <div class="v-data-studio">
      <!-- 欢迎页面 -->
      <div class="v-data-studio__welcome">
        <div class="v-data-studio__welcome-header">
          <h1>欢迎使用 DataStudio</h1>
          <p>Flink SQL 开发环境</p>
        </div>

        <div class="v-data-studio__welcome-content">
          <el-row :gutter="24">
            <el-col :span="8">
              <div class="v-data-studio__feature-card">
                <div class="v-data-studio__feature-icon">
                  <el-icon><HomeFilled /></el-icon>
                </div>
                <h3>快速开始</h3>
                <p>新用户快速入门指南，了解 DataStudio 的基本功能和使用方法</p>
                <el-button type="primary" @click="navigateTo('quick-start')">
                  开始使用
                </el-button>
              </div>
            </el-col>

            <el-col :span="8">
              <div class="v-data-studio__feature-card">
                <div class="v-data-studio__feature-icon">
                  <el-icon><Folder /></el-icon>
                </div>
                <h3>项目管理</h3>
                <p>创建和管理 Flink SQL 项目，组织您的数据开发工作</p>
                <el-button type="primary" @click="navigateTo('project')">
                  管理项目
                </el-button>
              </div>
            </el-col>

            <el-col :span="8">
              <div class="v-data-studio__feature-card">
                <div class="v-data-studio__feature-icon">
                  <el-icon><DataLine /></el-icon>
                </div>
                <h3>数据源管理</h3>
                <p>配置和管理数据源连接，支持多种数据库和数据存储</p>
                <el-button type="primary" @click="navigateTo('datasource')">
                  管理数据源
                </el-button>
              </div>
            </el-col>

            <el-col :span="8">
              <div class="v-data-studio__feature-card">
                <div class="v-data-studio__feature-icon">
                  <el-icon><MagicStick /></el-icon>
                </div>
                <h3>函数管理</h3>
                <p>创建和管理 UDF 函数，扩展 Flink SQL 处理能力</p>
                <el-button type="primary" @click="navigateTo('function')">
                  管理函数
                </el-button>
              </div>
            </el-col>

            <el-col :span="8">
              <div class="v-data-studio__feature-card">
                <div class="v-data-studio__feature-icon">
                  <el-icon><Files /></el-icon>
                </div>
                <h3>资源管理</h3>
                <p>上传和管理资源文件，如 JAR 包、配置文件等</p>
                <el-button type="primary" @click="navigateTo('resource')">
                  管理资源
                </el-button>
              </div>
            </el-col>

            <el-col :span="8">
              <div class="v-data-studio__feature-card">
                <div class="v-data-studio__feature-icon">
                  <el-icon><Monitor /></el-icon>
                </div>
                <h3>服务管理</h3>
                <p>查看任务执行状态和历史，监控系统运行情况</p>
                <el-button type="primary" @click="navigateTo('service')">
                  查看服务
                </el-button>
              </div>
            </el-col>
          </el-row>
        </div>

        <div class="v-data-studio__welcome-footer">
          <h3>开始使用 DataStudio</h3>
          <el-steps :active="1" align-center>
            <el-step title="创建项目" description="新建一个 Flink SQL 项目" />
            <el-step title="配置数据源" description="连接数据源进行数据开发" />
            <el-step title="编写 SQL" description="编写 Flink SQL 处理逻辑" />
            <el-step title="执行任务" description="执行 SQL 任务查看结果" />
          </el-steps>
        </div>
      </div>
    </div>
  </ContentWrap>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

// 导航到指定页面
const navigateTo = (page: string) => {
  router.push(`/datastudio/${page}`)
}
</script>

<style lang="scss" scoped>
.v-data-studio {
  height: calc(100vh - 120px);
  overflow-y: auto;

  &__welcome {
    padding: 40px 24px;
    max-width: 1200px;
    margin: 0 auto;
  }

  &__welcome-header {
    text-align: center;
    margin-bottom: 48px;

    h1 {
      margin: 0 0 16px 0;
      color: var(--el-text-color-primary);
      font-size: 32px;
      font-weight: 600;
    }

    p {
      margin: 0;
      color: var(--el-text-color-secondary);
      font-size: 16px;
    }
  }

  &__welcome-content {
    margin-bottom: 48px;
  }

  &__feature-card {
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color);
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
    text-align: center;
    transition: all 0.3s;
    height: 240px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    &:hover {
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      transform: translateY(-4px);
      border-color: var(--el-color-primary);
    }
  }

  &__feature-icon {
    margin-bottom: 16px;

    .el-icon {
      font-size: 48px;
      color: var(--el-color-primary);
    }
  }

  &__feature-card h3 {
    margin: 0 0 12px 0;
    color: var(--el-text-color-primary);
    font-size: 18px;
    font-weight: 600;
  }

  &__feature-card p {
    margin: 0 0 20px 0;
    color: var(--el-text-color-secondary);
    font-size: 14px;
    line-height: 1.5;
  }

  &__welcome-footer {
    text-align: center;

    h3 {
      margin: 0 0 32px 0;
      color: var(--el-text-color-primary);
      font-size: 20px;
      font-weight: 600;
    }
  }
}
</style>