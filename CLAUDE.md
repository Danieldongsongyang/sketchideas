# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 提供在此代码库中工作的指导。

## 项目概述

ShipAny Template Two 是一个 Next.js 16 AI SaaS 样板项目，包含身份验证、支付、多语言支持和可扩展的扩展系统。它使用 Drizzle ORM、Better Auth，并支持 PostgreSQL、MySQL 和 SQLite/Turso 数据库。

## 开发命令

```bash
# 开发
pnpm dev              # 使用 Turbopack 启动开发服务器
pnpm build            # 生产环境构建
pnpm build:fast       # 增加内存的快速构建
pnpm start            # 启动生产服务器
pnpm lint             # 运行 ESLint
pnpm format           # 使用 Prettier 格式化代码

# 数据库（需要通过 scripts/with-env.ts 加载 .env 文件）
pnpm db:generate      # 从 schema 变更生成迁移文件
pnpm db:migrate       # 运行待处理的迁移
pnpm db:push          # 直接推送 schema（无需迁移文件）
pnpm db:studio        # 打开 Drizzle Studio

# 身份验证
pnpm auth:generate    # 生成 Better Auth 配置
pnpm rbac:init        # 初始化 RBAC 角色
pnpm rbac:assign      # 为用户分配角色

# Cloudflare Workers 部署
pnpm cf:preview       # 本地构建和预览
pnpm cf:deploy        # 部署到 Cloudflare
pnpm cf:upload        # 上传静态资源
pnpm cf:typegen       # 生成 Cloudflare 类型
```

## 架构

### 数据库层 (`src/core/db/`)

[src/core/db/index.ts](src/core/db/index.ts#L186) 中的 `db()` 函数提供了一个**通用数据库访问器**，抽象了 PostgreSQL、MySQL 和 SQLite/Turso 方言：

- 返回 `any` 类型以保持调用点与方言无关
- 通过 Proxy 包含兼容性填充：
  - **MySQL**: 填充 `.returning()` 和 `.onConflictDoUpdate()`（Drizzle 使用 `.onDuplicateKeyUpdate()`）
  - **SQLite**: 将 `.for('update')` 行锁填充为空操作
- 事务会自动使用相同的兼容层包装回调

仅在需要方言特定功能时使用 `dbPostgres()`、`dbMysql()` 或 `dbSqlite()`。

### 配置系统 (`src/config/`, `src/shared/models/config.ts`)

**混合配置系统**，合并环境变量和数据库存储的设置：

1. `envConfigs` ([src/config/index.ts](src/config/index.ts#L8)) - 带有默认值的环境变量
2. `getConfigs()` ([src/shared/models/config.ts](src/shared/models/config.ts#L52)) - 带有 Next.js 缓存标签的数据库配置
3. `getAllConfigs()` ([src/shared/models/config.ts](src/shared/models/config.ts#L78)) - 合并两者，环境变量优先

关键模式：
- 环境变量在 `.env` 中使用 `UPPER_CASE`，但在代码中使用 `lower_case`
- 客户端配置使用 `NEXT_PUBLIC_` 前缀
- 更新后使用 `revalidateTag(CACHE_TAG_CONFIGS, 'max')` 使缓存失效

### 扩展系统 (`src/extensions/`)

用于集成的模块化插件架构：

- **AI** ([src/extensions/ai/](src/extensions/ai/)) - 通过 `AIManager` 支持 OpenRouter、Replicate、Fal、Gemini、Kie 提供商
- **Payment** ([src/extensions/payment/](src/extensions/payment/)) - Stripe、Creem、PayPal
- **Email** ([src/extensions/email/](src/extensions/email/)) - Resend
- **Storage** ([src/extensions/storage/](src/extensions/storage/)) - Cloudflare R2

每个扩展遵循一致的接口模式：类型、提供商接口和管理器/服务类。

### 设置系统 (`src/shared/services/settings.ts`)

在 `getSettings()` 中定义的管理员可配置设置：
- 每个设置都有 `name`、`title`、`type`、`group`、`tab`
- 设置存储在数据库中并缓存
- `publicSettingNames` 数组定义了哪些设置可以安全地暴露给客户端
- 设置组组织相关配置（例如 `stripe`、`google_auth`、`resend`）

### 身份验证 (`src/core/auth/`)

Better Auth，通过 `getAuth()` ([src/core/auth/index.ts](src/core/auth/index.ts#L8)) 动态获取配置：
- 使用 `getAuthOptions()` 合并数据库配置
- 支持邮箱/密码、Google OAuth、GitHub OAuth
- 通过 Resend 进行邮箱验证（可选）
- RBAC 集成，实现基于角色的访问控制

### 国际化 (`src/core/i18n/`)

Next-intl 基于语言的路由：
- 路由位于 `[locale]` 目录下
- 每种语言使用单独的 MDX 文件（例如英语用 `index.mdx`，中文用 `index.zh.mdx`）
- 通过 `NEXT_PUBLIC_LOCALE_DETECT_ENABLED` 自动语言检测
- 使用 `getTranslations()` hook/服务端函数获取 UI 字符串

### 内容管理 (`content/`)

基于 MDX 的 CMS，使用 Fumadocs：
- `content/docs/` - 文档页面
- `content/logs/` - 发布日志/更新日志
- `content/pages/` - 静态页面
- `content/posts/` - 博客文章

MDX 文件支持 frontmatter，并在构建期间由 `fumadocs-mdx` 处理。

## Schema 定义

数据库 schema 位于 `src/config/db/schema.ts`：
- 每个表导出 `$inferSelect` 和 `$inferInsert` 类型
- 使用这些类型而不是手动定义接口
- 关系通过 Drizzle 的 relations API 定义

## 迁移策略

- 生成迁移：`pnpm db:generate` 在 `src/config/db/migrations/` 中创建 SQL
- 应用迁移：`pnpm db:migrate` 对数据库运行
- 快速原型开发：`pnpm db:push` 同步 schema 无需迁移文件

## 环境配置

必需的环境变量（参见 [src/config/index.ts](src/config/index.ts)）：

```bash
# 应用
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=ShipAny App
NEXT_PUBLIC_DEFAULT_LOCALE=en

# 数据库
DATABASE_URL=postgresql://...
DATABASE_PROVIDER=postgresql  # 或 mysql, sqlite, turso
DB_SCHEMA=public
DB_MIGRATIONS_SCHEMA=drizzle

# 身份验证
AUTH_URL=http://localhost:3000
AUTH_SECRET=使用_openssl_生成
```

## 关键模式

1. **仅服务端检查**：在数据库/配置访问前检查 `typeof window === 'undefined'`
2. **配置获取**：始终使用 `getAllConfigs()` 获取合并的配置
3. **数据库查询**：使用 `db()` 进行与方言无关的访问
4. **扩展初始化**：服务通过 `get[Service]Name()` 函数延迟加载
5. **缓存**：对昂贵操作使用 `unstable_cache()` 和 `revalidateTag`

## 文件组织

```
src/
├── app/[locale]/          # 本地化页面路由
├── config/                # 静态配置文件
├── core/                  # 核心基础设施（auth, db, i18n, rbac）
├── extensions/            # 插件式功能集成
├── shared/                # 共享工具、组件、模型、服务
└── themes/                # 主题定义
```
