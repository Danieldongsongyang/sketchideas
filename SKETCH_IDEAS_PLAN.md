# Sketch Ideas 视觉老虎机站 - 改造计划

## 项目概览

**目标**: 将 ShipAny Template Two 改造为 "Sketch Ideas" 视觉老虎机站

**核心功能**:
1. **Features 页面** - Spin 视觉老虎机（核心引流功能）
2. **Showcases 页面** - 素材商城（付费/免费图集）
3. **AI 页面** - 图片转线稿（AI 增值服务）

**素材情况**: lineart/ 目录包含 21 个分类，共约 10,904 张图片

---

## 第一阶段：核心基础设施改造

### 1.1 数据库 Schema 扩展

**新增表**:
```sql
-- 预生成线稿图库
sketch_images (
  id, url, prompt, difficulty, category,
  tags, created_at, is_active, file_path
)

-- 素材图集（Showcases）
sketch_collections (
  id, title, description, cover_image,
  category, difficulty, image_count,
  price, is_free, created_at
)

-- 图集图片关联
collection_images (
  collection_id, image_id, order_index
)

-- 用户额度（AI 转换功能）
user_sketch_credits (
  user_id, daily_limit, used_today,
  last_reset_date
)

-- 图片转换历史
sketch_conversions (
  id, user_id, original_image_url, result_image_url,
  parameters, created_at
)
```

**文件**: `src/config/db/schema.postgres.ts`

### 1.2 素材数据导入系统

**任务**:
- 创建脚本扫描 lineart/ 目录
- 提取图片元数据（文件名、路径、分类）
- 生成 prompts（基于文件名和分类）
- 导入数据库

**文件**: `scripts/import-sketch-data.ts`

**分类映射**:
```
lineart/ 分类 → 数据库 category
├── Animals → animals
├── Anime_Bleach → anime_bleach
├── Anime_Characters → anime_characters
├── Anime_Characters_Ancient_Style → anime_characters_ancient
├── Anime_Characters_Full_Body → anime_characters_full_body
├── Anime_Chibi → anime_chibi
├── Anime_Naruto → anime_naruto
├── Dynamic_Sketches → dynamic_sketches
├── Flowers → flowers
├── Flowers_and_Birds → flowers_birds
├── Flowers_Plants_and_Trees → flowers_plants_trees
├── Food → food
├── Forest → forest
├── Kids_Cartoons → kids_cartoons
├── Objects_and_Scenes → objects_scenes
├── Ocean → ocean
├── Pen_Control_Practice → pen_control_practice
├── Toddler_Cartoons → toddler_cartoons
└── Random → random (全分类随机)
```

### 1.3 静态资源服务

**任务**:
- 将 lineart/ 目录移至 `public/lineart/`
- 配置 CDN 缓存策略
- WebP 格式优化（可选）

---

## 第二阶段：Features 页面（视觉老虎机）

### 2.1 页面路由

**文件**: `src/app/[locale]/(landing)/features/page.tsx`

### 2.2 核心组件

**组件结构**:
```
features/
├── page.tsx                    # 页面入口
├── components/
│   ├── slot-machine.tsx        # 老虎机核心组件
│   ├── filter-panel.tsx        # 筛选面板
│   ├── result-display.tsx      # 结果展示区
│   ├── spin-button.tsx         # Spin 按钮
│   └── action-bar.tsx          # 底部操作栏
├── hooks/
│   ├── useSlotMachine.ts       # 老虎机逻辑
│   └── useSketchData.ts        # 数据获取
└── styles/
    └── slot-machine.css        # 动画样式
```

### 2.3 API 路由

**文件**: `src/app/api/sketches/`

**端点**:
- `GET /api/sketches/random` - 随机获取线稿（支持 category + difficulty 筛选）
- `GET /api/sketches/[id]` - 获取单个线稿详情
- `POST /api/sketches/[id]/save` - 保存线稿（用户收藏）

### 2.4 设计还原

**参考**: `sketch-ideas-slot.html`

**关键元素**:
- 纸质纹理背景
- 温暖配色（cream、warm-orange、coral）
- 老虎机滚动动画
- 火花粒子效果
- 响应式布局

### 2.5 功能清单

- [x] 难度筛选（Warm-up / Sketch / Challenge）
- [x] 分类筛选（19 个分类）
- [x] Spin 按钮（老虎机动画）
- [x] Next 按钮（连续刷）
- [x] 下载线稿图
- [x] 复制 Prompt
- [x] 社交分享（Pinterest、Twitter）
- [x] 会话统计（Spin 次数、保存次数）

---

## 第三阶段：Showcases 页面（素材商城）

### 3.1 页面路由

**文件**: `src/app/[locale]/(landing)/showcases/page.tsx`（已存在，需改造）

### 3.2 数据模型

**图集配置**: `content/showcases/` 目录或数据库

**示例**:
```yaml
- title: "Dynamic Sketches Pack"
  description: "100+ dynamic action poses for gesture drawing practice"
  category: "dynamic_sketches"
  difficulty: "sketch"
  image_count: 100
  price: 4.99
  is_free: false
  cover_image: "/lineart/Dynamic_Sketches/Dynamic_Sketches_1.jpg"
```

### 3.3 组件结构

```
showcases/
├── page.tsx                    # 页面入口
├── components/
│   ├── collection-grid.tsx     # 图集网格
│   ├── collection-card.tsx     # 单个图集卡片
│   ├── filter-bar.tsx          # 筛选栏
│   └── collection-detail.tsx   # 图集详情（模态框/页面）
└── hooks/
    └── useCollections.ts       # 图集数据
```

### 3.4 功能清单

- [x] 图集展示网格
- [x] 分类与难度筛选
- [x] 免费/付费标识
- [x] 图集详情预览
- [x] 免费图集下载（邮箱收集）
- [ ] 付费图集支付（Stripe 集成）
- [ ] 购物车功能（MVP 后）

### 3.5 支付集成

**使用现有 Payment 扩展**:
- `src/extensions/payment/` - Stripe 已集成
- 订单表复用 `order` 表
- 产品配置在数据库或代码中

---

## 第四阶段：AI 页面（图片转线稿）

### 4.1 页面路由

**文件**: `src/app/[locale]/(landing)/ai-sketch/page.tsx`

### 4.2 组件结构

```
ai-sketch/
├── page.tsx                    # 页面入口
├── components/
│   ├── upload-zone.tsx         # 拖拽上传区
│   ├── result-preview.tsx      # 结果对比预览
│   ├── conversion-status.tsx   # 转换状态
│   └── credit-display.tsx      # 额度显示
└── hooks/
    └── useImageConversion.ts   # 转换逻辑
```

### 4.3 API 路由

**文件**: `src/app/api/ai/sketch/convert/route.ts`

**功能**:
- 接收图片上传
- 调用 AI 扩展（Replicate/Fal）
- 返回转换结果
- 扣除用户额度

### 4.4 AI 扩展集成

**使用现有 AI 扩展**:
- `src/extensions/ai/` - 已支持 Replicate/Fal
- 模型: ControlNet Scribble/Canny

### 4.5 额度系统

**免费额度**:
- 未登录: 每日 3 次（基于 IP）
- 已登录: 每日 5 次

**付费额度**:
- $4.99 / 30 次
- $9.99 / 100 次
- 订阅用户无限

---

## 第五阶段：页面配置与 SEO

### 5.1 内容文件

**文件**: `messages/pages.{locale}.json` 或类似配置

```json
{
  "features": {
    "metadata": {
      "title": "Sketch Ideas - Visual Slot Machine for Artists",
      "description": "Get instant sketch inspiration with our visual slot machine. Random prompts and line art references for artists of all levels."
    },
    "page": {
      "title": "Sketch Ideas",
      "sections": { ... }
    }
  },
  "showcases": { ... },
  "ai-sketch": { ... }
}
```

### 5.2 Programmatic SEO

**动态页面生成**:
```
/sketch-ideas/{category}/{difficulty}
├── /sketch-ideas/animals/warmup
├── /sketch-ideas/anime-characters/sketch
├── /sketch-ideas/dynamic-sketches/challenge
└── ...
```

**实现**: 使用 Next.js 动态路由 + `generateStaticParams`

---

## 第六阶段：主题与样式

### 6.1 主题定义

**文件**: `src/themes/sketch-ideas/`

**配色方案**:
```javascript
colors: {
  cream: '#f5f0e6',
  creamLight: '#faf8f3',
  creamDark: '#e8dfd8',
  warmOrange: '#e67e5c',
  coral: '#ff6b4a',
  charcoal: '#2d2a2e',
  softBlack: '#1a1a1a',
  warmGray: '#8a8580',
  lightBrown: '#c4b5a0',
}
```

**字体**:
- 标题: DM Serif Display
- 正文: Inter
- 代码/prompt: JetBrains Mono

### 6.2 动画定义

**文件**: `src/themes/sketch-ideas/animations.ts`

- `slot-spin`: 老虎机滚动
- `pulse-glow`: 发光脉冲
- `shake`: 震动效果
- `spark`: 火花粒子
- `float`: 悬浮动画

---

## 实施优先级

### Phase 1 - MVP 核心（1-2 周）

**Week 1**:
1. 数据库 Schema 扩展
2. 素材数据导入脚本
3. Features 页面基础组件

**Week 2**:
4. Spin 老虎机逻辑
5. API 路由实现
6. 样式与动画还原

### Phase 2 - 商城与变现（2-3 周）

**Week 3**:
7. Showcases 页面改造
8. 图集数据模型
9. 筛选与展示功能

**Week 4-5**:
10. 支付集成
11. 邮箱收集
12. 订单管理

### Phase 3 - AI 功能（2 周）

**Week 6-7**:
13. AI 页面开发
14. 图片上传与转换
15. 额度系统

### Phase 4 - 优化与 SEO（持续）

**Week 8+**:
16. SEO 页面生成
17. 性能优化
18. 数据分析集成

---

## 技术栈总结

**复用现有**:
- Next.js 16 + App Router
- Drizzle ORM + PostgreSQL
- Better Auth（身份验证）
- Payment 扩展（Stripe）
- AI 扩展（Replicate/Fal）
- Storage 扩展（Cloudflare R2）

**新增**:
- 线稿图库 Schema
- 图片转换 API
- 额度系统
- 新主题

---

## 风险与注意事项

1. **素材版权**: 确保 AI 生成声明
2. **AI 转换成本**: 限制免费额度，缓存结果
3. **支付流程**: 复用现有 Payment 扩展
4. **性能优化**: WebP 格式、CDN、懒加载
5. **SEO 策略**: 动态页面生成、元数据优化

---

## 下一步

如果计划确认，我将开始执行：

1. **立即执行**: Phase 1.1-1.2（数据库 + 导入脚本）
2. **并行开发**: Phase 2（Features 页面）
3. **验证**: 确保 Spin 功能可用后再继续

请确认是否按此计划执行，或提出调整建议。
