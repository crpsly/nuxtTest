
# Nuxt 3 專案開發指南

## 技術框架
本專案基於以下技術棧：
- Nuxt 3 - Vue 3 框架
- Element Plus - UI 組件庫
- Tailwind CSS - 原子化 CSS 框架
- TypeScript - 強類型 JavaScript
- **重要：利用 Nuxt 3 的自動導入功能，無需手動導入 Vue 組合式 API**
  - 不需要手動導入 `ref`, `reactive`, `computed`, `watch` 等
  - 不需要手動導入 `defineProps`, `defineEmits` 等
  - 不需要手動導入 `useRoute`, `useRouter` 等 Nuxt 特有的組合式函數

## 代碼風格與格式化
- 使用 ESLint 進行代碼風格檢查，遵循專案設定的規則
- 使用 2 個空格的縮排
- 避免使用 Prettier 格式化
- 優先使用單引號

## 組件開發規範
- 使用 TypeScript 定義型別和介面
- 組件名稱使用 PascalCase 方式命名
- 使用 Composition API 和 `<script setup>` 語法
- 將通用組件放在 `components/` 目錄下
- 特定頁面組件放在對應的 `pages/` 子目錄中

## 路由導航
- 使用 Nuxt 的文件結構自動生成路由
- 使用 `useRouter` 和 `navigateTo` 進行程式化導航

## API 調用方式
- 使用 `useHttp` 封裝的方法處理 API 請求
- API 端點定義在 server/api 目錄中
- 使用 DTO 介面來定義請求和響應的類型

## 狀態管理
- 使用 `useShareData` 或 Nuxt 的 `useState` 進行狀態管理
- 複雜資料流優先使用 Composables

## 頁面載入與認證
- 使用全局中間件處理頁面載入和認證
- 遵循現有的認證和頁面載入模式

## 錯誤處理
- 使用 try-catch 處理異步操作的錯誤
- 遵循項目中已有的錯誤處理模式

## 開發環境配置
- 使用環境配置文件（如 dev.json, prod.json 等）載入不同環境的設定

## CSS 處理
- 全局樣式放在 `assets/css` 或 `assets/scss` 目錄下
- 組件樣式使用 scoped CSS 或 Tailwind classes
- 遵循 Element Plus 的設計語言和元素變量

## 專案結構
```
app.vue                # 應用程式入口
composables/           # 共享邏輯 (hooks)
  useHttp.ts           # HTTP 請求處理
  useShareData.ts      # 全局狀態管理
components/            # 全局通用組件
layouts/               # 頁面佈局模板
  components/          # 佈局相關的組件
middleware/            # 全局中間件
  00.check-login.global.ts  # 登入檢查
  01.loading-start.global.ts # 頁面載入開始
pages/                 # 頁面組件
server/                # 伺服器端邏輯
  api/                 # API 端點
  dto/                 # 資料傳輸對象
```

## 常用模式示例

### 組件定義
```vue
<script setup lang="ts">
// Nuxt3 Auto Import
// 無需手動導入 Vue 組合式 API
// import { ref } from 'vue';

interface Props {
  buttonText: string
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'click', value: string): void
}>();

function handleClick() {
  emit('click', 'clicked');
}
</script>

<template>
  <div class="component-class">
    <el-button type="primary" @click="handleClick">{{ buttonText }}</el-button>
  </div>
</template>

<style scoped>
.component-class {
  @apply p-4 rounded;
}
</style>
```

### API 調用
```ts
const { post, get } = useHttp();

// 使用 try-catch 處理非同步操作錯誤
try {
  const response = await post<ResponseDTO>('/api/endpoint', requestData);
  // 處理成功響應
} catch (error) {
  // 處理錯誤
  console.error('API 調用失敗', error);
}
```

### 狀態管理
```ts
// 使用 useShareData 進行狀態管理
const { state, setState } = useShareData();

// 獲取狀態
const userData = computed(() => state.value.user);

// 更新狀態
function updateUserData(newData) {
  setState('user', newData);
}
