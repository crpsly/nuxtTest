<script setup lang="ts">
import { nextTick, onUnmounted, ref, watch } from 'vue';
// 建議安裝 @types/element-plus 以獲得完整的類型提示，此處使用 any 作為通用替代方案
import type { SelectInstance } from 'element-plus';

// 1. 定義選項的介面，並使用新的屬性名稱
interface Stock {
  StockCode: string
  StockName: string
}

// 2. 使用 TypeScript 語法定義 Props
interface Props {
  modelValue?: string | number
}
const props = withDefaults(defineProps<Props>(), {
  modelValue: ''
});

// 3. 使用 TypeScript 語法定義 Emits，並指定事件 payload 的類型
const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
  (e: 'change', stock: Stock | null): void
}>();

// 4. 更新模擬資料和 API，使其符合新的 Stock 介面
const allTargets: Stock[] = Array.from({ length: 100 }, (_, i) => ({
  StockCode: `${2330 + i}`,
  StockName: `台積電-${i + 1}廠`
}));

// 為模擬 API 的參數和回傳值添加類型
function mockApiFetch({ keyword, page, pageSize = 10 }: { keyword: string, page: number, pageSize?: number }): Promise<{ list: Stock[], total: number }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      // 使用新的屬性名稱進行過濾
      const filtered = allTargets.filter(item =>
        item.StockCode.includes(keyword) || item.StockName.toLowerCase().includes(keyword.toLowerCase())
      );
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const pageData = filtered.slice(start, end);
      resolve({ list: pageData, total: filtered.length });
    }, 500);
  });
}

// 5. 為組件內部狀態添加類型
const selectRef = ref<SelectInstance | null>(null);
const options = ref<Stock[]>([]);
const loading = ref(false);
const loadingMore = ref(false);
const page = ref(1);
const total = ref(0);
const currentKeyword = ref('');
const selectedItem = ref<Stock | null>(null);
const hasMoreData = ref(true);

async function fetchData() {
  if (loading.value || loadingMore.value) { return; }
  if (page.value === 1) {
    loading.value = true;
  } else {
    loadingMore.value = true;
  }
  try {
    const { list, total: newTotal } = await mockApiFetch({ keyword: currentKeyword.value, page: page.value });
    if (page.value === 1) {
      options.value = list;
    } else {
      options.value = [...options.value, ...list];
    }
    total.value = newTotal;
    hasMoreData.value = options.value.length < total.value;
  } catch (error) {
    console.error('Failed to fetch data:', error);
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
}

function handleRemoteSearch(query: string) {
  if (query && query.trim()) {
    currentKeyword.value = query.trim();
    page.value = 1;
    hasMoreData.value = true;
    fetchData();
  } else {
    currentKeyword.value = '';
    options.value = [];
    page.value = 1;
    total.value = 0;
    loading.value = false;
    loadingMore.value = false;
  }
}

function loadMore() {
  if (hasMoreData.value && !loadingMore.value) {
    page.value++;
    fetchData();
  }
}

function handleClear() {
  options.value = [];
  currentKeyword.value = '';
  page.value = 1;
  total.value = 0;
  selectedItem.value = null;
  emit('update:modelValue', '');
  emit('change', null);
}

// 6. 更新事件處理函數，使用新的屬性名稱
function handleChange(selectedValue: string | number) {
  emit('update:modelValue', selectedValue);
  if (selectedValue) {
    // 使用 StockCode 進行查找
    const item = options.value.find(o => o.StockCode === selectedValue) || allTargets.find(o => o.StockCode === selectedValue);
    selectedItem.value = item || null; // 確保找不到時設為 null
    emit('change', item || null);
  } else {
    selectedItem.value = null;
    emit('change', null);
  }
}

watch(() => props.modelValue, (newVal) => {
  if (newVal && !options.value.some(o => o.StockCode === newVal)) {
    // 使用 StockCode 進行查找
    const item = allTargets.find(t => t.StockCode === newVal);
    if (item) {
      selectedItem.value = item;
    }
  }
}, { immediate: true });

// --- 無限滾動的實現 (邏輯不變) ---
let scrollContainer: any = null;

function handleScroll() {
  if (!scrollContainer) { return; }
  const { scrollTop, clientHeight, scrollHeight } = scrollContainer;
  if (scrollTop + clientHeight >= scrollHeight - 10) {
    loadMore();
  }
}

function handleVisibleChange(isVisible: boolean) {
  if (isVisible) {
    nextTick(() => {
      scrollContainer = selectRef.value?.popperRef?.querySelector('.el-scrollbar__wrap');
      if (scrollContainer) {
        scrollContainer.addEventListener('scroll', handleScroll);
      }
    });
  } else {
    if (scrollContainer) {
      scrollContainer.removeEventListener('scroll', handleScroll);
      scrollContainer = null;
    }
  }
}

onUnmounted(() => {
  if (scrollContainer) {
    scrollContainer.removeEventListener('scroll', handleScroll);
  }
});
</script>

<template>
  <el-select
    ref="selectRef"
    :model-value="props.modelValue"
    filterable
    remote
    :remote-method="handleRemoteSearch"
    :loading="loading"
    placeholder="請輸入標的代號或名稱"
    class="custom-paginated-select"
    clearable
    @clear="handleClear"
    @visible-change="handleVisibleChange"
    @change="handleChange"
  >
    <!-- 標頭 -->
    <div v-if="options.length > 0" class="custom-select-header">
      <div class="custom-select-row">
        <span class="col-code">標的代號</span>
        <span class="col-name">標的名稱</span>
      </div>
    </div>

    <!-- 7. 更新 Template，綁定到新的屬性名稱 -->
    <el-option
      v-for="item in options"
      :key="item.StockCode"
      :label="`${item.StockCode} ${item.StockName}`"
      :value="item.StockCode"
      class="custom-option-item"
    >
      <div class="custom-select-row">
        <span class="col-code">{{ item.StockCode }}</span>
        <span class="col-name">{{ item.StockName }}</span>
      </div>
    </el-option>

    <!-- 底部提示 -->
    <div class="load-more-prompt">
      <p v-if="loadingMore">載入中...</p>
      <p v-else-if="!hasMoreData && options.length > 0">沒有更多數據了</p>
    </div>

    <!-- 隱藏的 Option，用於在選擇後正確顯示 Label -->
    <el-option
      v-if="selectedItem"
      :key="selectedItem.StockCode"
      :label="`${selectedItem.StockCode} ${selectedItem.StockName}`"
      :value="selectedItem.StockCode"
      style="display: none;"
    />
  </el-select>
</template>

<style>
/* 樣式保持不變 */
.custom-paginated-select .el-select-dropdown__list {
  padding-bottom: 30px;
}
.el-select-dropdown {
  min-width: 350px !important;
}
.custom-select-row {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0 20px;
}
.custom-select-header {
  height: 34px;
  line-height: 34px;
  border-bottom: 1px solid #e4e7ed;
  color: #909399;
  font-weight: bold;
  font-size: 14px;
  position: sticky;
  top: 0;
  background-color: #fff;
  z-index: 10;
}
.custom-option-item.el-option {
  height: auto;
  padding: 0;
}
.custom-option-item .el-select-dropdown__item {
  padding: 8px 0;
  height: auto;
}
.custom-select-row .col-code {
  width: 100px;
  font-weight: 500;
}
.custom-select-row .col-name {
  flex: 1;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-left: 10px;
}
.load-more-prompt {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  text-align: center;
  color: #999;
  font-size: 14px;
  padding: 5px 0;
  background: #fff;
  z-index: 10;
}
</style>
