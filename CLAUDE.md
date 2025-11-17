# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

- 无需检查代码格式除非用户要求你这么做
- 无需启动应用除非用户要求你这么做
- This is the Vue 3 frontend for the Yudao (芋道) rapid development platform - a comprehensive enterprise management system built with Vue 3, Vite 4, Element Plus, and TypeScript. The project supports multiple business modules including system management, workflow engine, CRM, ERP, AI capabilities, and more.

## Development Environment

### Prerequisites
- Node.js >= 16.18.0
- pnpm >= 8.6.0 (required, not npm)

### Common Commands

#### Development
```bash
pnpm i                    # Install dependencies
pnpm dev                  # Start development server with local env
pnpm dev-server           # Start development server with dev env
pnpm preview              # Build and preview locally
```

#### Building
```bash
pnpm build:local          # Build for local environment
pnpm build:dev            # Build for development environment
pnpm build:test           # Build for test environment
pnpm build:stage          # Build for staging environment
pnpm build:prod           # Build for production environment
```

#### Code Quality
```bash
pnpm ts:check             # TypeScript type checking
pnpm lint:eslint          # ESLint with auto-fix
pnpm lint:format          # Prettier formatting
pnpm lint:style           # Stylelint with auto-fix
```

#### Maintenance
```bash
pnpm clean                # Remove node_modules
pnpm clean:cache          # Clear build cache
```

## Architecture

### Core Technologies
- **Vue 3** with Composition API and `<script setup>`
- **Vite 4** for fast development and building
- **TypeScript** for type safety
- **Element Plus** as UI component library
- **Pinia** for state management
- **Vue Router 4** for routing
- **Vue I18n** for internationalization
- **UnoCSS** for atomic CSS

### Key Directories

- `src/api/` - API modules organized by business domain (ai, bpm, crm, erp, infra, iot, etc.)
- `src/components/` - Reusable components including:
  - `ConfigGlobal` - Global configuration wrapper
  - `ContentWrap` / `ContentDetailWrap` - Layout containers
  - `DictTag` - Dictionary display component
  - `DiyEditor` - Visual page editor components
- `src/views/` - Page components organized by feature modules
- `src/store/` - Pinia stores for state management
- `src/router/` - Vue Router configuration with dynamic routing
- `src/hooks/` - Composition API hooks
- `src/utils/` - Utility functions and helpers
- `src/styles/` - Global styles and SCSS variables
- `src/locales/` - Internationalization files

### Build Configuration

- **Vite Configuration**: Located in `vite.config.ts` with plugin setup in `build/vite/`
- **Auto Import**: Components and APIs are auto-imported via `unplugin-auto-import` and `unplugin-vue-components`
- **Code Splitting**: Manual chunks configured for large libraries (echarts, form-create)
- **Environment Variables**: Multiple build modes (local, dev, test, stage, prod)

### Plugin System

The project uses a comprehensive plugin system:
- `@/plugins/unocss` - UnoCSS setup
- `@/plugins/svgIcon` - SVG icon management
- `@/plugins/vueI18n` - Internationalization
- `@/plugins/elementPlus` - Element Plus integration
- `@/plugins/formCreate` - Dynamic form generation
- `@/plugins/animate.css` - CSS animations

### Business Modules

The system supports multiple enterprise modules:
- **System Management**: Users, roles, permissions, departments, menus
- **Workflow Engine**: BPMN-based workflow with dual designers (BPMN + Simple)
- **CRM**: Customer management, sales pipeline, contracts
- **ERP**: Inventory, procurement, sales, finance
- **AI Capabilities**: Chat, image generation, knowledge base, workflows
- **IoT**: Device management, alerts, data rules
- **Infrastructure**: Code generation, file management, monitoring
- **DataStudio**: Flink SQL development environment (migrated from Dinky-web)

## Development Guidelines

### Component Structure
- Use Composition API with `<script setup>`
- Follow the `useDesign()` hook for consistent class naming
- Utilize auto-imported utilities from `@/hooks/web/`
- Implement proper TypeScript typing

### API Integration
- API modules are organized by business domain in `src/api/`
- Use the auto-imported `useTable` and `useCrudSchemas` hooks for CRUD operations
- Follow the established error handling patterns

### State Management
- Use Pinia stores for global state
- Store modules are located in `src/store/modules/`
- Implement proper TypeScript typing for stores

### 公共组件使用规范

#### 组件库架构
项目遵循**优先复用公共组件**原则，所有业务页面应优先使用预制组件，减少重复开发。

#### 核心公共组件目录
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

#### 核心组件使用指南

##### 1. ContentWrap - 通用页面容器（核心组件）
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

##### 2. ContentDetailWrap - 详情页容器
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

##### 3. Descriptions - 描述列表
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

##### 4. DictTag - 字典标签
- **用途**：根据字典类型显示标签
- **示例**：
  ```vue
  <DictTag type="system_user_status" :value="user.status" />
  ```
- **支持类型**：字符串、数字、布尔值、数组

##### 5. Form & FormCreate - 表单组件
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

##### 6. Icon - 图标组件
- **用途**：统一图标管理
- **示例**：
  ```vue
  <Icon icon="ep:search" :size="16" />
  ```
- **图标库**：Element Plus Icons (`ep:*`)

#### 组件命名规范
- **BEM 风格**：使用 `useDesign().getPrefixCls()` 生成前缀
- **示例**：组件名 `descriptions` → 类名 `v-descriptions-header`
- **使用**：
  ```ts
  const { getPrefixCls } = useDesign()
  const prefixCls = getPrefixCls('descriptions') // 'v-descriptions'
  ```

#### 组件使用优先级
1. **公共组件**（如 ContentWrap、Descriptions）
2. **Element Plus 组件**（如 el-table、el-form）
3. **第三方库组件**（如 Echart）
4. **自定义组件**（最后选择）

#### 开发规范
- **避免重复造轮子**：实现功能前先检查是否有现成组件
- **组件解耦**：业务逻辑与 UI 分离
- **props 规范**：使用 `propTypes` 定义类型和默认值
- **插槽优先**：通过插槽扩展组件而非继承

### Internationalization
- Use the `useI18n()` hook for translations
- Translation files are in `src/locales/`
- Follow the established key naming conventions

### Styling

#### 样式系统原则
项目采用**优先使用全局样式 + UnoCSS + 公共组件**的策略，避免重复造轮子，提高开发效率。

#### UnoCSS 使用规范（核心样式解决方案）
- **默认使用 UnoCSS**：所有样式优先使用 UnoCSS 工具类实现，避免自定义 CSS
- **常用工具类**：
  - 布局：`flex`, `grid`, `w-full`, `h-full`, `inline-block`
  - 间距：`p-10px`, `m-5px`, `px-20px`, `py-15px`, `gap-16px`
  - 尺寸：`w-240px`, `h-50px`, `max-w-200px`, `min-h-100px`
  - 字体：`text-14px`, `text-16px`, `text-20px`, `font-700`, `font-bold`
  - 颜色：`text-gray-500`, `text-white`, `bg-[var(--el-color-primary)]`
  - 边框：`b-1`, `b-b-1`, `border-solid`, `rounded-6px`
  - 间距间距：`mt-10px`, `mb-20px`, `ml-16px`, `mr-5px`
- **响应式前缀**：`lt-sm:`(小于640px), `sm:`, `md:`, `lg:`, `xl:`, `2xl:`
  - 示例：`lt-sm:mt-10px`（小屏幕下才生效的上边距）
- **深色模式支持**：使用 `dark:` 前缀
  - 示例：`dark:bg-[var(--el-bg-color)]`
- **自定义工具类**：在 `uno.config.ts` 中已预定义
  - `custom-hover`: 通用悬停效果
  - `layout-border__left/right/top/bottom`: 布局边框线
  - `wh-full`: `w-full h-full` 的简写

#### CSS 变量系统
- **全局变量**：定义在 `src/styles/var.css`，包含：
  - 菜单样式：`--left-menu-*`
  - 头部样式：`--top-header-*`
  - 内容区样式：`--app-content-*`
  - 主题过渡：`--transition-time-02`
- **使用方式**：
  - Vue/SCSS：`var(--left-menu-bg-color)`
  - UnoCSS：`bg-[var(--el-color-primary)]`
  - JS：`import { setCssVar } from '@/utils'`

#### SCSS 使用场景（仅在必要时）
- **组件作用域样式**：`style lang="scss" scoped`
- **复杂选择器**：`::before`、`::after` 伪元素
- **动态计算**：`calc()` 等复杂运算
- **命名空间隔离**：使用 `$namespace` 变量（`v-` 前缀）
- **Element Plus 覆盖**：
  ```scss
  .#{$namespace}-descriptions {
    &-header {
      &::after {
        background: var(--el-color-primary);
      }
    }
  }
  ```

#### 样式优先级顺序
1. **UnoCSS 工具类**（首选）
2. **CSS 变量**（主题定制）
3. **公共组件**（复用）
4. **内联样式**（仅用于动态值）
5. **自定义 SCSS**（兜底）

#### 样式开发建议
- 先查找是否有可用的 CSS 变量或 UnoCSS 类
- 再考虑复用现有公共组件
- 最后才编写自定义样式
- 保持样式原子化，避免重复定义

## DataStudio Module (Migrated from Dinky-web)

### Overview
DataStudio is a Flink SQL development environment migrated from Dinky-web project. It provides comprehensive tools for Flink SQL task development, execution, debugging, and monitoring.

### Directory Structure
```
src/
├── api/dataStudio/          # DataStudio API modules
├── views/dataStudio/        # DataStudio pages
│   ├── index.vue            # Main DataStudio page
│   └── components/          # DataStudio components
│       ├── QuickStartPage.vue  # Quick start guide
│       └── SqlTask.vue      # SQL task editor (core component)
├── components/dataStudio/   # DataStudio specific components
└── store/modules/dataStudio/ # DataStudio state management
```

### Core Components

#### Main Page (`src/views/dataStudio/index.vue`)
- **Layout**: Three-column layout with left/right toolbars and center content
- **Toolbars**:
  - Left: Project, DataSource, Function, Resource management
  - Right: Catalog, Global Variables
- **Content Area**: Tab-based interface for SQL tasks and configurations
- **Status Bar**: Bottom status display

#### SQL Task Component (`src/views/dataStudio/components/SqlTask.vue`)
- **Code Editor**: SQL code editing area (simulated)
- **Execution Toolbar**: Execute, Debug, Stop operations
- **Configuration Panel**: Task settings, Flink environment, execution mode
- **Result Display**: Execution results, logs, task information

#### Quick Start Page (`src/views/dataStudio/components/QuickStartPage.vue`)
- **Feature Cards**: Quick access to main DataStudio features
- **Getting Started**: Step-by-step guide for new users

### Key Features
- **SQL Task Development**: Flink SQL editing and execution
- **Multiple Dialects**: Support for Flink SQL, MySQL, PostgreSQL, Hive
- **Task Configuration**: Execution mode, Flink version, parallelism
- **Result Visualization**: Table results, execution logs, task info
- **Multi-tab Management**: Support for multiple concurrent tasks

### Integration Notes
- Uses `ContentWrap` component for consistent page layout
- Follows project's UnoCSS styling system
- Supports theme switching (light/dark)
- Uses Element Plus components throughout
- Auto-imports configured for Vue and Element Plus APIs

### Migration Status
- ✅ Basic layout and UI components migrated
- ✅ Core functionality implemented
- ✅ Routing and menu integration complete
- 🔄 API integration pending
- 🔄 State management (Pinia) pending
- 🔄 Monaco Editor integration pending

## Important Notes

- The project uses `pnpm` exclusively for package management
- Environment-specific builds are configured via different modes
- Auto-import configuration generates type definitions in `src/types/`
- The system supports both SaaS multi-tenant and single-tenant deployments
- Rich text editing uses WangEditor with plugin support
- File uploads support multiple storage backends (local, S3, FTP, etc.)
- DataStudio module is a migration from Dinky-web and follows established patterns

## Recent Updates

### ProjectManagement2 Component
- **Path**: `src/views/dataStudio/components/ProjectManagement2.vue`
- **Created**: New project management page with Splitter layout
- **Features**:
  - Uses Element Plus `el-splitter` for responsive layout
  - Left panel: File management tree view
  - Right panel: Monaco Editor for code editing
  - Top toolbar with Run, Debug, and Save buttons
  - Supports SQL file editing with syntax highlighting
  - Custom styling using global CSS variables

### Routing Configuration
- **File**: `src/router/modules/remaining.ts`
- **Route Path**: `/datastudio/project2`
- **Route Name**: `DataStudioProject2`
- **Menu Title**: `项目管理2` (Project Management 2)
- **Icon**: `ep:folder`
- **Meta**: `{ noCache: false }`

### Component Features
- **File Tree**: Hierarchical file/folder structure with icons
- **Monaco Editor**: Full-featured code editor with:
  - SQL syntax highlighting
  - Minimap navigation
  - Code folding
  - Word wrapping
  - Customizable settings
- **Toolbar Actions**:
  - Run button (primary)
  - Debug button (warning)
  - Save button (success)
- **Styling**: Follows project design system with:
  - CSS variables for theming
  - Element Plus consistent styling
  - Responsive layout

### Element Plus Splitter
The component uses Element Plus Splitter component for layout:
```vue
<el-splitter>
  <el-splitter-panel size="30%" :min="200">
    <!-- Left panel: File manager -->
  </el-splitter-panel>
  <el-splitter-panel :min="400">
    <!-- Right panel: Monaco Editor -->
  </el-splitter-panel>
</el-splitter>
```