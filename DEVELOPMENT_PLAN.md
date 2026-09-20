# Cyber Bible — 开发计划

> 基于 PRD.md 制定的分阶段开发计划，每个任务可直接执行。
> 技术栈：纯 HTML/CSS/JS + IndexedDB + D3.js（CDN）

---

## 项目结构

```
D:\Codex\Cyber_Bible\
├── PRD.md                  # 产品需求文档
├── DEVELOPMENT_PLAN.md     # 本文档
├── index.html              # 入口页面
├── css/
│   └── style.css           # 全局样式
├── js/
│   ├── app.js              # 应用入口、路由、导航
│   ├── db.js               # IndexedDB 封装（数据库层）
│   ├── store.js            # 数据操作层（CRUD）
│   ├── ui/
│   │   ├── layout.js       # 页面布局渲染
│   │   ├── home.js         # 首页模块
│   │   ├── groups.js       # 分组管理模块
│   │   ├── search.js       # 搜索模块
│   │   ├── graph.js        # 关系图谱模块
│   │   ├── database.js     # 可视化数据库模块
│   │   ├── prompt-detail.js # 提示词详情/编辑模块
│   │   └── components.js   # 通用组件（卡片、弹窗等）
│   └── utils.js            # 工具函数
```

---

## 阶段一：项目基础搭建

### 任务 1.1：创建项目目录结构
**目标**：建立所有必要的文件夹和空文件
**操作步骤**：
1. 创建 `css/` 目录
2. 创建 `js/` 目录
3. 创建 `js/ui/` 目录
4. 创建所有空文件（index.html, css/style.css, js/*.js, js/ui/*.js）
**验收**：目录结构完整，所有文件存在

### 任务 1.2：编写 index.html 骨架
**目标**：创建入口页面，包含左侧导航、顶部工具栏、主内容区容器
**操作步骤**：
1. 编写 HTML5 文档结构
2. 引入 D3.js CDN（v7）
3. 引入 css/style.css
4. 引入所有 js 文件（按依赖顺序）
5. 搭建布局 DOM 结构：
   - `<header>`：Logo + 搜索框 + 新建按钮
   - `<nav id="sidebar">`：首页/分组/图谱/数据库 四个导航项
   - `<main id="content">`：主内容区容器
**验收**：浏览器打开 index.html 能看到基本布局框架

### 任务 1.3：编写全局样式 css/style.css
**目标**：定义 CSS 变量、基础布局样式、导航样式
**操作步骤**：
1. 定义 CSS 变量（颜色、间距、字号）
2. 编写 reset 样式
3. 编写 flex 布局（body → header + sidebar + main）
4. 编写导航栏样式（选中态、hover 态）
5. 编写顶部工具栏样式
6. 编写通用组件样式（按钮、卡片、输入框、标签）
**验收**：页面有统一的视觉风格，布局正确

---

## 阶段二：数据层

### 任务 2.1：编写 IndexedDB 封装 js/db.js
**目标**：封装 IndexedDB 操作为 Promise API
**操作步骤**：
1. 定义 `openDB()` 函数：打开/创建数据库 `CyberBibleDB`（版本 1）
2. 在 `onupgradeneeded` 中创建三个对象存储：
   - `prompts`：keyPath=id，索引 by_groupId、by_updated
   - `groups`：keyPath=id，索引 by_name
   - `annotations`：keyPath=id，索引 by_promptId
3. 封装通用方法：
   - `getAll(storeName)` → 返回所有记录
   - `get(storeName, id)` → 返回单条记录
   - `add(storeName, data)` → 添加记录
   - `update(storeName, data)` → 更新记录
   - `delete(storeName, id)` → 删除记录
   - `clear(storeName)` → 清空表
**验收**：在浏览器控制台能调用 db.getAll('prompts') 返回空数组

### 任务 2.2：编写数据操作层 js/store.js
**目标**：提供业务级别的数据操作 API
**操作步骤**：
1. **提示词操作**：
   - `createPrompt({title, content, groupId, tags})` → 生成 id（crypto.randomUUID），设置 created/updated 时间戳
   - `updatePrompt(id, updates)` → 更新字段，自动更新 updated 时间
   - `deletePrompt(id)` → 删除提示词及其所有批注
   - `getPrompt(id)` → 获取单条提示词
   - `getAllPrompts()` → 获取所有提示词
2. **分组操作**：
   - `createGroup({name, color})`
   - `updateGroup(id, updates)`
   - `deleteGroup(id, moveToGroupId)` → 删除分组，提示词转移到 moveToGroupId 或设为无分组
   - `getAllGroups()`
3. **批注操作**：
   - `createAnnotation({promptId, content})`
   - `updateAnnotation(id, content)`
   - `deleteAnnotation(id)`
   - `getAnnotationsByPrompt(promptId)`
4. **标签操作**：
   - `getAllTags()` → 从所有提示词中提取去重标签，返回 [{name, count}]
5. **导入导出**：
   - `exportAll()` → 返回 {prompts, groups, annotations}
   - `importAll(data, mode)` → mode: 'merge' | 'overwrite'
**验收**：控制台能完成增删改查操作，数据持久化

---

## 阶段三：页面框架与路由

### 任务 3.1：编写布局渲染 js/ui/layout.js
**目标**：渲染页面框架，处理导航切换
**操作步骤**：
1. 导出 `renderLayout()` 函数：渲染 header、sidebar、main 容器
2. 导出 `switchView(viewName)` 函数：根据视图名切换主内容区
3. 绑定导航点击事件
4. 绑定顶部搜索框事件（聚焦时展开/输入时触发搜索）
5. 绑定「新建」按钮事件
**验收**：点击左侧导航，主内容区能切换显示不同占位内容

### 任务 3.2：编写应用入口 js/app.js
**目标**：初始化应用，协调各模块
**操作步骤**：
1. 监听 DOMContentLoaded 事件
2. 调用 db.js 打开数据库
3. 调用 layout.js 渲染布局
4. 默认加载首页视图
5. 初始化全局搜索功能
**验收**：打开 index.html 自动渲染完整页面框架

---

## 阶段四：首页模块

### 任务 4.1：编写首页模块 js/ui/home.js
**目标**：实现首页总览功能
**操作步骤**：
1. 导出 `renderHome()` 函数
2. **统计卡片区**：
   - 调用 store 获取 prompts/groups/annotations 数量
   - 调用 store.getAllTags() 获取标签数
   - 渲染 4 个统计卡片
3. **最近添加**：
   - 获取所有提示词，按 updated 倒序取前 5 条
   - 渲染提示词卡片列表（标题、分组名、更新时间）
   - 绑定点击事件 → 跳转到 prompt-detail
4. **热门标签**：
   - 获取标签列表，按 count 降序
   - 根据频次计算字体大小（12px ~ 28px）
   - 渲染标签云，点击标签 → 跳转到搜索结果页（带标签筛选）
5. **快捷操作**：
   - 渲染「新建提示词」按钮
**验收**：首页能正确显示统计数据、最近提示词、标签云

---

## 阶段五：提示词管理（核心模块）

### 任务 5.1：编写提示词详情/编辑模块 js/ui/prompt-detail.js
**目标**：实现提示词的查看、编辑、批注功能
**操作步骤**：
1. 导出 `renderPromptDetail(promptId, mode)` 函数（mode: 'view' | 'edit'）
2. **详情模式**：
   - 显示标题、内容（代码块样式，带复制按钮）
   - 显示所属分组（点击可切换）
   - 显示标签列表（每个标签带 × 可移除）
   - 显示批注列表（时间倒序）
   - 显示「编辑」按钮
3. **编辑模式**：
   - 标题输入框
   - 内容 textarea
   - 分组 select 下拉框
   - 标签输入框（自动补全，回车添加）
   - 保存/取消按钮
4. **批注区**：
   - 添加批注输入框 + 按钮
   - 每条批注显示时间、内容、编辑/删除按钮
5. 绑定所有交互事件
**验收**：能完整查看、编辑提示词，批注功能正常

### 任务 5.2：编写通用组件 js/ui/components.js
**目标**：提供可复用的 UI 组件
**操作步骤**：
1. `showModal(title, contentHTML, onConfirm)` → 确认弹窗
2. `showToast(message, type)` → 提示消息（success/error/info）
3. `createPromptCard(prompt)` → 提示词卡片 DOM
4. `createTag(tagName, removable, onRemove)` → 标签 DOM
5. `createEmptyState(message)` → 空状态占位
**验收**：各组件能正常渲染和交互

---

## 阶段六：分组管理模块

### 任务 6.1：编写分组管理模块 js/ui/groups.js
**目标**：实现分组 CRUD 和分组下的提示词列表
**操作步骤**：
1. 导出 `renderGroups()` 函数
2. **左侧分组列表**：
   - 调用 store.getAllGroups() 获取所有分组
   - 渲染分组列表，每项显示名称 + 提示词数量徽章
   - 「新建分组」按钮
   - 点击分组 → 选中态 → 右侧显示该分组提示词
   - 右键/长按分组 → 重命名/删除菜单
3. **右侧提示词列表**：
   - 根据选中分组过滤提示词
   - 使用 components.js 的 createPromptCard 渲染
   - 空分组显示空状态
4. **分组操作**：
   - 新建分组：弹窗输入名称
   - 重命名：弹窗输入新名称
   - 删除：确认弹窗，提示转移提示词
**验收**：能创建/重命名/删除分组，分组下提示词正确显示

---

## 阶段七：搜索模块

### 任务 7.1：编写搜索模块 js/ui/search.js
**目标**：实现全局搜索和搜索结果页
**操作步骤**：
1. 导出 `renderSearchResults(query, filters)` 函数
2. **搜索逻辑**（在 store.js 中添加 `searchPrompts(query, filters)`）：
   - 获取所有提示词
   - 对每条提示词检查 title/content/tags/annotations 是否包含 query（不区分大小写）
   - 计算匹配字段数量作为相关度
   - 按相关度降序 > updated 倒序排列
   - 应用 filters（groupId、标签、时间范围）
3. **搜索结果页渲染**：
   - 显示搜索关键词和结果数量
   - 左侧筛选面板（分组、标签、时间）
   - 结果列表（使用 createPromptCard，高亮匹配词）
4. **高亮函数**：`highlightText(text, query)` → 用 <mark> 包裹匹配词
5. **顶部搜索框**：
   - 输入防抖（300ms）
   - 实时显示搜索结果
   - 按 Enter 或点击结果跳转详情
**验收**：搜索能匹配标题/内容/标签/批注，结果正确高亮

---

## 阶段八：关系图谱模块

### 任务 8.1：编写关系图谱模块 js/ui/graph.js
**目标**：使用 D3.js 实现力导向关系图谱
**操作步骤**：
1. 导出 `renderGraph()` 函数
2. **数据准备**：
   - 获取所有提示词、分组、标签
   - 构建节点数组：
     - 提示词节点：{id, type:'prompt', name, color:'#4A90D9', shape:'circle'}
     - 分组节点：{id, type:'group', name, color:'#5CB85C', shape:'rect'}
     - 标签节点：{id, type:'tag', name, color:'#F0AD4E', shape:'diamond'}
   - 构建边数组：
     - 提示词 → 分组（source: promptId, target: groupId）
     - 提示词 → 标签（source: promptId, target: tagId）
3. **D3 力导向图配置**：
   - forceSimulation：charge(-300)、linkDistance(80)、center 力
   - 节点拖拽行为
   - 滚轮缩放/平移（zoom behavior）
4. **节点渲染**：
   - 圆形（提示词）、方形（分组）、菱形（标签）
   - 节点上显示名称（简短）
   - 不同颜色区分类型
5. **交互**：
   - 点击节点：高亮该节点及所有关联节点和边，右侧显示详情面板
   - 双击节点：跳转到提示词详情
   - 鼠标悬停：显示 tooltip
6. **图例**：左下角显示节点类型图例
7. **详情面板**：右侧滑出，显示选中节点的详细信息
**验收**：图谱能正确渲染，节点可拖拽，点击显示详情

---

## 阶段九：可视化数据库模块

### 任务 9.1：编写可视化数据库模块 js/ui/database.js
**目标**：实现表格视图和数据导入导出
**操作步骤**：
1. 导出 `renderDatabase()` 函数
2. **表格渲染**：
   - 表头：标题、分组、标签、创建时间、修改时间、批注数、操作
   - 数据行：每条提示词一行
   - 点击表头排序（升序/降序切换）
3. **筛选功能**：
   - 顶部筛选栏：分组下拉、标签下拉
   - 筛选后表格实时更新
4. **操作列**：
   - 查看按钮 → 跳转详情
   - 编辑按钮 → 跳转编辑
   - 删除按钮 → 确认后删除
5. **导出功能**：
   - 「导出 JSON」按钮
   - 调用 store.exportAll() 获取数据
   - 创建 Blob → 触发下载
   - 文件名：cyber_bible_backup_YYYYMMDD.json
6. **导入功能**：
   - 「导入 JSON」按钮 + 隐藏 file input
   - 选择文件后读取内容
   - JSON 格式校验
   - 弹窗选择「合并」或「覆盖」
   - 调用 store.importAll(data, mode)
   - 导入完成后刷新表格
**验收**：表格正确显示数据，排序筛选正常，导入导出功能正常

---

## 阶段十：集成测试与收尾

### 任务 10.1：端到端功能测试
**目标**：对照 PRD 验收标准逐项测试
**操作步骤**：
1. 测试数据持久化（刷新页面、重启浏览器）
2. 测试分组 CRUD
3. 测试提示词 CRUD
4. 测试标签功能
5. 测试批注功能
6. 测试全局搜索
7. 测试关系图谱
8. 测试数据库视图
9. 测试数据导出/导入
10. 测试导航切换
**验收**：PRD 中 10.1 所有验收项通过

### 任务 10.2：性能优化
**目标**：确保满足性能验收标准
**操作步骤**：
1. 首页渲染时间检查（< 2s / 100条数据）
2. 搜索防抖优化（300ms）
3. 图谱渲染优化（节点数 > 50 时考虑聚合）
4. 大数据量测试（手动添加 100+ 条提示词测试流畅度）
**验收**：PRD 中 10.2 所有性能验收项通过

### 任务 10.3：兼容性测试
**目标**：确保主流浏览器正常运行
**操作步骤**：
1. Chrome 最新版测试
2. Edge 最新版测试
3. Firefox 最新版测试
4. 1366×768 分辨率测试
**验收**：PRD 中 10.3 所有兼容性验收项通过

---

## 执行顺序总结

| 阶段 | 任务 | 依赖 | 预估工作量 |
|------|------|------|-----------|
| 一 | 1.1 目录结构 | 无 | 5 min |
| 一 | 1.2 index.html | 1.1 | 15 min |
| 一 | 1.3 style.css | 1.1 | 30 min |
| 二 | 2.1 db.js | 无 | 30 min |
| 二 | 2.2 store.js | 2.1 | 45 min |
| 三 | 3.1 layout.js | 1.2, 1.3 | 20 min |
| 三 | 3.2 app.js | 2.1, 3.1 | 15 min |
| 四 | 4.1 home.js | 2.2, 3.2 | 30 min |
| 五 | 5.1 prompt-detail.js | 2.2 | 45 min |
| 五 | 5.2 components.js | 1.3 | 20 min |
| 六 | 6.1 groups.js | 2.2, 5.2 | 30 min |
| 七 | 7.1 search.js | 2.2, 5.2 | 30 min |
| 八 | 8.1 graph.js | 2.2, D3 | 60 min |
| 九 | 9.1 database.js | 2.2, 5.2 | 40 min |
| 十 | 10.1-10.3 测试 | 全部 | 30 min |

**总预估**：约 7-8 小时

---

## 注意事项

1. **D3.js 使用 CDN**：`<script src="https://d3js.org/d3.v7.min.js"></script>`
2. **不使用构建工具**：所有 JS 通过 `<script>` 标签按顺序加载
3. **全局命名空间**：为避免模块化复杂性，使用全局对象 `window.CyberBible` 作为命名空间
4. **ID 生成**：使用 `crypto.randomUUID()`
5. **时间戳**：使用 `Date.now()`
6. **样式方案**：纯 CSS，不使用预处理器
7. **图标**：使用 emoji 或 Unicode 符号代替图标库
