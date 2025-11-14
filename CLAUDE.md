# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the Vue 3 frontend for the Yudao (芋道) rapid development platform - a comprehensive enterprise management system built with Vue 3, Vite 4, Element Plus, and TypeScript. The project supports multiple business modules including system management, workflow engine, CRM, ERP, AI capabilities, and more.

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

### Internationalization
- Use the `useI18n()` hook for translations
- Translation files are in `src/locales/`
- Follow the established key naming conventions

### Styling
- Use UnoCSS for utility classes
- SCSS for component-specific styles
- Follow the established design system patterns
- Use CSS variables for theming

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