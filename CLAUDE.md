# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此代码仓库中工作时提供指导。

## 项目概述

**重要提示：**
- 除非用户要求，否则无需检查代码格式
- 除非用户要求，否则无需启动应用
- 这是一个基于 Vue 3 的前端项目，是芋道快速开发平台的企业级管理后台

yudao-ui-admin-vue3-zt 是芋道（Yudao）快速开发平台的前端项目，采用 Vue 3、Vite 4、Element Plus 和 TypeScript 构建的综合企业管理系统。项目支持多业务模块，包括系统管理、工作流引擎、CRM、ERP、AI 能力、物联网等功能。

## 开发环境

### 前置要求
- Node.js >= 16.18.0
- pnpm >= 8.6.0（**必须使用 pnpm，不支持 npm**）

### 常用命令

#### 开发环境
```bash
pnpm i                    # 安装依赖
pnpm dev                  # 启动开发服务器（本地环境）
pnpm dev-server           # 启动开发服务器（开发环境）
pnpm preview              # 构建并本地预览
```

#### 构建命令
```bash
pnpm build:local          # 构建本地环境版本
pnpm build:dev            # 构建开发环境版本
pnpm build:test           # 构建测试环境版本
pnpm build:stage          # 构建预发布环境版本
pnpm build:prod           # 构建生产环境版本
```

#### 代码质量
```bash
pnpm ts:check             # TypeScript 类型检查
pnpm lint:eslint          # ESLint 自动修复
pnpm lint:format          # Prettier 代码格式化
pnpm lint:style           # Stylelint 自动修复
```

#### 维护命令
```bash
pnpm clean                # 清理 node_modules
pnpm clean:cache          # 清理构建缓存
```

## 技术架构

### 核心技术栈
- **Vue 3** - 使用组合式 API 和 `<script setup>` 语法
- **Vite 4** - 快速的开发服务器和构建工具
- **TypeScript** - 类型安全的 JavaScript 超集
- **Element Plus** - Vue 3 的 UI 组件库
- **Pinia** - Vue 3 官方推荐的状态管理库
- **Vue Router 4** - Vue 3 路由管理器
- **Vue I18n** - 国际化解决方案
- **UnoCSS** - 原子化 CSS 引擎

### 关键依赖库
- **@element-plus/icons-vue** - Element Plus 图标库
- **@form-create/designer & @form-create/element-ui** - 动态表单生成器
- **axios** - HTTP 请求库
- **@vueuse/core** - Vue 组合式 API 工具集
- **@wangeditor/editor** - 富文本编辑器
- **echarts** - 图表可视化库
- **monaco-editor** - 代码编辑器（VS Code 同款）
- **lodash-es** - JavaScript 工具库
- **crypto-js** - 加密库
- **dayjs** - 日期处理库

### 目录结构

```
src/
├── api/                   # API 模块，按业务域组织
│   ├── ai/               # AI 模块
│   ├── bpm/              # 工作流模块
│   ├── crm/              # CRM 客户关系管理
│   ├── dataStudio/       # 数据工作室（Flink SQL 开发）
│   ├── erp/              # ERP 企业资源规划
│   ├── infra/            # 基础设施
│   ├── iot/              # 物联网
│   ├── system/           # 系统管理
│   └── ...
├── components/           # 可复用组件
│   ├── ConfigGlobal/     # 全局配置组件
│   ├── ContentWrap/      # 通用页面容器
│   ├── ContentDetailWrap/# 详情页容器（带返回按钮）
│   ├── Descriptions/     # 描述列表组件
│   ├── DictTag/          # 字典标签组件
│   ├── Form/             # 表单组件
│   ├── FormCreate/       # 动态表单组件
│   ├── Dialog/           # 弹窗组件
│   ├── Echart/           # 图表组件
│   └── ...
├── views/                # 页面组件，按功能模块组织
│   ├── system/           # 系统管理页面
│   ├── bpm/              # 工作流页面
│   ├── crm/              # CRM 页面
│   ├── erp/              # ERP 页面
│   ├── ai/               # AI 页面
│   ├── iot/              # 物联网页面
│   └── ...
├── store/                # Pinia 状态管理
│   └── modules/          # 状态模块
├── router/               # Vue Router 路由配置
│   └── modules/          # 路由模块
├── hooks/                # 组合式 API Hooks
├── utils/                # 工具函数
├── styles/               # 全局样式和 SCSS 变量
├── locales/              # 国际化文件
├── plugins/              # 插件配置
└── types/                # TypeScript 类型定义
```

### 构建配置

- **Vite 配置**：位于 `vite.config.ts`，插件设置在 `build/vite/` 目录
- **自动导入**：通过 `unplugin-auto-import` 和 `unplugin-vue-components` 自动导入组件和 API
- **代码分割**：为大库配置手动分块（echarts、form-create、monaco-editor）
- **环境变量**：支持多种构建模式（local、dev、test、stage、prod）

### 插件系统

项目使用完整的插件系统：
- `@/plugins/unocss` - UnoCSS 配置
- `@/plugins/svgIcon` - SVG 图标管理
- `@/plugins/vueI18n` - 国际化配置
- `@/plugins/elementPlus` - Element Plus 集成
- `@/plugins/formCreate` - 动态表单生成
- `@/plugins/animate.css` - CSS 动画

### 业务模块

系统支持多个企业级模块：

#### 1. 系统管理 (System)
- 用户管理、角色管理、权限管理
- 部门管理、岗位管理、菜单管理
- 字典管理、通知公告
- 租户管理、租户套餐
- 操作日志、登录日志
- 短信管理、邮件管理、站内信

#### 2. 工作流引擎 (BPM)
- 基于 BPMN 标准的工作流引擎
- 支持钉钉/飞书设计器和 BPMN 设计器双模式
- 会签、或签、依次审批
- 抄送、驳回、转办、委派、加签、减签
- 超时审批、自动提醒
- 父子流程、条件分支、并行分支
- 触发节点、延迟节点

#### 3. CRM 客户关系管理
- 客户管理、商机管理、合同管理
- 线索管理、联系人管理
- 跟进记录、权限管理
- 客户池配置、业绩统计
- 销售漏斗、客户画像

#### 4. ERP 企业资源规划
- 采购管理（订单、入库、退货、供应商）
- 销售管理（订单、出库、退货、客户）
- 库存管理（入库、出库、盘点、仓库）
- 财务管理（账户、收付款）
- 产品管理（产品、分类、单位）

#### 5. AI 能力
- 聊天对话、消息管理
- 图像生成
- 知识库管理
- 思维导图
- 音乐生成
- 工作流自动化
- 智能写作

#### 6. 物联网 (IoT)
- 产品管理、设备管理
- 设备分组、固件管理
- OTA 升级任务
- 告警配置、告警记录
- 数据规则、数据转发

#### 7. 数据工作室 (DataStudio)
- 从 Dinky-web 迁移过来的 Flink SQL 开发环境
- 支持多种 SQL 方言（Flink、MySQL、PostgreSQL、Hive）
- SQL 任务编辑、执行、调试
- 结果可视化、执行日志
- 多标签页管理

#### 8. 基础设施 (Infra)
- 代码生成、系统接口文档
- 数据库文档、表单构建
- 配置管理、定时任务
- 文件服务、WebSocket
- API 日志、监控
- 消息队列、日志中心

## 开发指南

### 组件结构
- 使用组合式 API 和 `<script setup>`
- 使用 `useDesign()` Hook 确保类名一致性
- 利用 `@/hooks/web/` 中自动导入的工具函数
- 实现proper TypeScript 类型定义

### API 集成
- API 模块按业务域组织在 `src/api/`
- 使用自动导入的 `useTable` 和 `useCrudSchemas` Hook 进行 CRUD 操作
- 遵循已建立的错误处理模式

### 状态管理
- 使用 Pinia 存储全局状态
- 存储模块位于 `src/store/modules/`
- 为存储实现 proper TypeScript 类型定义

### 国际化
- 使用 `useI18n()` Hook 进行翻译
- 翻译文件位于 `src/locales/`
- 遵循既定的键命名约定

## 样式系统

### 样式原则
项目采用**优先使用全局样式 + UnoCSS + 公共组件**的策略，避免重复造轮子，提高开发效率。

### UnoCSS 使用规范（核心样式解决方案）
- **默认使用 UnoCSS**：所有样式优先使用 UnoCSS 工具类实现，避免自定义 CSS
- **常用工具类**：
  - 布局：`flex`, `grid`, `w-full`, `h-full`, `inline-block`
  - 间距：`p-10px`, `m-5px`, `px-20px`, `py-15px`, `gap-16px`
  - 尺寸：`w-240px`, `h-50px`, `max-w-200px`, `min-h-100px`
  - 字体：`text-14px`, `text-16px`, `text-20px`, `font-700`, `font-bold`
  - 颜色：`text-gray-500`, `text-white`, `bg-[var(--el-color-primary)]`
  - 边框：`b-1`, `b-b-1`, `border-solid`, `rounded-6px`
  - 间距：`mt-10px`, `mb-20px`, `ml-16px`, `mr-5px`
- **响应式前缀**：`lt-sm:`(小于640px), `sm:`, `md:`, `lg:`, `xl:`, `2xl:`
  - 示例：`lt-sm:mt-10px`（小屏幕下才生效的上边距）
- **深色模式支持**：使用 `dark:` 前缀
  - 示例：`dark:bg-[var(--el-bg-color)]`

### CSS 变量系统
- **全局变量**：定义在 `src/styles/var.css`，包含：
  - 菜单样式：`--left-menu-*`
  - 头部样式：`--top-header-*`
  - 内容区样式：`--app-content-*`
  - 主题过渡：`--transition-time-02`

### SCSS 使用场景（仅在必要时）
- **组件作用域样式**：`style lang="scss" scoped`
- **复杂选择器**：`::before`、`::after` 伪元素
- **动态计算**：`calc()` 等复杂运算
- **命名空间隔离**：使用 `$namespace` 变量（`v-` 前缀）

## DataStudio 模块（从 Dinky-web 迁移）

### 概述
DataStudio 是从 Dinky-web 项目迁移过来的 Flink SQL 开发环境，提供全面的 Flink SQL 任务开发、执行、调试和监控工具。

### 目录结构
```
src/
├── api/dataStudio/          # DataStudio API 模块
├── views/dataStudio/        # DataStudio 页面
│   ├── index.vue            # 主页面
│   └── components/          # 组件
│       ├── QuickStartPage.vue  # 快速开始页面
│       └── SqlTask.vue      # SQL 任务编辑器（核心组件）
├── components/dataStudio/   # DataStudio 特定组件
└── store/modules/dataStudio/ # DataStudio 状态管理
```

### 核心组件

#### 主页面 (`src/views/dataStudio/index.vue`)
- **布局**：三栏布局，左右工具栏和中间内容区
- **工具栏**：
  - 左侧：项目、数据源、函数、资源管理
  - 右侧：目录、全局变量
- **内容区**：基于标签页的 SQL 任务和配置界面
- **状态栏**：底部状态显示

#### 快速开始页面 (`src/views/dataStudio/components/QuickStartPage.vue`)
- **功能卡片**：快速访问主要功能
- **入门指南**：新用户分步指南

### 主要功能
- **SQL 任务开发**：Flink SQL 编辑和执行
- **多方言支持**：Flink SQL、MySQL、PostgreSQL、Hive
- **任务配置**：执行模式、Flink 版本、并行度
- **结果可视化**：表格结果、执行日志、任务信息
- **多标签页管理**：支持多个并发任务

### 集成说明
- 使用 `ContentWrap` 组件保持一致的页面布局
- 遵循项目的 UnoCSS 样式系统
- 支持主题切换（浅色/深色）
- 全程使用 Element Plus 组件
- 为 Vue 和 Element Plus API 配置了自动导入

### 迁移状态
- ✅ 基础布局和 UI 组件已迁移
- ✅ 核心功能已实现
- ✅ 路由和菜单集成完成
- 🔄 API 集成待完成
- 🔄 状态管理（Pinia）待完成
- 🔄 Monaco Editor 集成待完成

## 重要提示

- 项目**仅使用** `pnpm` 进行包管理
- 通过不同模式配置环境特定构建
- 自动导入配置在 `src/types/` 生成类型定义
- 系统支持 SaaS 多租户和单租户部署
- 富文本编辑使用 WangEditor 并支持插件
- 文件上传支持多种存储后端（本地、S3、FTP 等）
- DataStudio 模块从 Dinky-web 迁移而来，遵循既定模式

## 公共组件使用规范

### 组件库架构
项目遵循**优先复用公共组件**原则，所有业务页面应优先使用预制组件，减少重复开发。

### 核心公共组件目录
```
src/components/
├── ConfigGlobal/          # 全局配置（必须包裹根组件）
├── ContentWrap/           # 通用页面容器
├── ContentDetailWrap/     # 详情页容器（带返回按钮）
├── Descriptions/          # 描述列表组件
├── DictTag/               # 字典标签
├── Form/                  # 表单组件
├── FormCreate/            # 动态表单生成
├── Dialog/                # 弹窗组件
├── Card/                  # 卡片组件
├── Icon/                  # 图标组件
├── Echart/                # 图表组件
└── ... (更多组件)
```

### 核心组件使用指南

#### 1. ContentWrap - 通用页面容器（核心组件）
- **用途**：90% 业务页面的首选容器
- **特性**：自动头部、边距、卡片样式
- **示例**：
  ```vue
  <ContentWrap title="用户列表" message="这是提示信息">
    <!-- 业务内容 -->
    <el-table>...</el-table>
  </ContentWrap>
  ```
- **插槽**：
  - `#header`：自定义头部（按钮等）
  - 默认插槽：页面内容

#### 2. ContentDetailWrap - 详情页容器
- **用途**：详情页、编辑页（带返回按钮）
- **特性**：粘性顶部、返回按钮、标题居中
- **示例**：
  ```vue
  <ContentDetailWrap title="用户详情" @back="goBack">
    <template #title>自定义标题</template>
    <template #right>操作按钮</template>
    <!-- 详情内容 -->
  </ContentDetailWrap>
  ```
- **事件**：`@back` 返回按钮点击

#### 3. Descriptions - 描述列表
- **用途**：展示键值对数据（如详情页）
- **特性**：自动格式化、字典转换、日期格式化
- **示例**：
  ```vue
  <Descriptions
    title="用户信息"
    :columns="columns"
    :data="userData"
  />
  ```
- **字段类型**：
  - `dateFormat`：自动格式化日期
  - `dictType`：自动转换字典标签
  - `mappedField`：映射其他字段

#### 4. DictTag - 字典标签
- **用途**：根据字典类型显示标签
- **示例**：
  ```vue
  <DictTag type="system_user_status" :value="user.status" />
  ```
- **支持类型**：字符串、数字、布尔值、数组

#### 5. Form & FormCreate - 表单组件
- **Form**：基础表单（配合 el-form）
- **FormCreate**：动态表单（JSON 配置生成）
- **示例**：
  ```vue
  <FormCreate
    v-model="formData"
    :schema="formSchema"
    @submit="handleSubmit"
  />
  ```

#### 6. Icon - 图标组件
- **用途**：统一图标管理
- **示例**：
  ```vue
  <Icon icon="ep:search" :size="16" />
  ```
- **图标库**：Element Plus Icons (`ep:*`)

### 组件命名规范
- **BEM 风格**：使用 `useDesign().getPrefixCls()` 生成前缀
- **示例**：组件名 `descriptions` → 类名 `v-descriptions-header`
- **使用**：
  ```ts
  const { getPrefixCls } = useDesign()
  const prefixCls = getPrefixCls('descriptions') // 'v-descriptions'
  ```

### 组件使用优先级
1. **公共组件**（如 ContentWrap、Descriptions）
2. **Element Plus 组件**（如 el-table、el-form）
3. **第三方库组件**（如 Echart）
4. **自定义组件**（最后选择）

### 开发规范
- **避免重复造轮子**：实现功能前先检查是否有现成组件
- **组件解耦**：业务逻辑与 UI 分离
- **props 规范**：使用 `propTypes` 定义类型和默认值
- **插槽优先**：通过插槽扩展组件而非继承
- **尽量不适用div a h 等等html标签**：使用公共组件或Element Plus替代

## Element Plus Splitter
组件使用 Element Plus Splitter 组件进行布局：
```vue
<el-splitter>
  <el-splitter-panel size="30%" :min="200">
    <!-- 左侧面板：文件管理器 -->
  </el-splitter-panel>
  <el-splitter-panel :min="400">
    <!-- 右侧面板：Monaco Editor -->
  </el-splitter-panel>
</el-splitter>
```
