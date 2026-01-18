// RemotePaginatedSelect.vue

<script setup>
import { nextTick, onUnmounted, ref, watch } from 'vue';

// --- Props & Emits and other setup code remains the same ---
// ... (props, emits, 模擬 API 等程式碼省略) ...
const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  }
});
const emit = defineEmits(['update:modelValue', 'change']);
const allTargets = Array.from({ length: 100 }, (_, i) => ({ code: `${2330 + i}`, name: `台積電-${i + 1}廠` }));
function mockApiFetch({ keyword, page, pageSize = 10 }) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const filtered = allTargets.filter(item => item.code.includes(keyword) || item.name.toLowerCase().includes(keyword.toLowerCase()));
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const pageData = filtered.slice(start, end);
      resolve({ list: pageData, total: filtered.length });
    }, 500);
  });
}
const selectRef = ref(null);
const options = ref([]);
const loading = ref(false);
const loadingMore = ref(false);
const page = ref(1);
const total = ref(0);
const currentKeyword = ref('');
const selectedItem = ref(null);
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
// 遠端搜尋觸發 (修改此函數)
function handleRemoteSearch(query) {
  // 檢查 query 是否存在且不為空。
  // 在 JavaScript 中，非空字串為 "truthy"，空字串 '' 為 "falsy"。
  // trim() 可以去除前後空格，防止使用者只輸入空格就觸發搜尋。
  if (query && query.trim()) {
    // 只有在有有效輸入時，才執行搜尋邏輯
    currentKeyword.value = query.trim();
    page.value = 1; // 重置頁碼
    hasMoreData.value = true;
    fetchData(); // 呼叫 API
  } else {
    // 如果輸入被清空，則重置選項列表
    currentKeyword.value = '';
    options.value = [];
    page.value = 1;
    total.value = 0;
    // 確保 loading 狀態被關閉
    loading.value = false;
    loadingMore.value = false;
  }
}
function loadMore() {
  if (hasMoreData.value && !loadingMore.value) { // 增加判斷 !loadingMore.value
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
function handleChange(selectedValue) {
  emit('update:modelValue', selectedValue);
  if (selectedValue) {
    const item = options.value.find(o => o.code === selectedValue) || allTargets.find(o => o.code === selectedValue);
    selectedItem.value = item;
    emit('change', item);
  } else {
    selectedItem.value = null;
    emit('change', null);
  }
}
watch(() => props.modelValue, (newVal) => {
  if (newVal && !options.value.some(o => o.code === newVal)) {
    const item = allTargets.find(t => t.code === newVal);
    if (item) {
      selectedItem.value = item;
    }
  }
}, { immediate: true });

// --- 無限滾動的實現 (這裡是修改重點) ---
let scrollContainer = null;

function handleScroll() {
  if (!scrollContainer) { return; }

  const { scrollTop, clientHeight, scrollHeight } = scrollContainer;
  // 留出 10px 的緩衝區，防止觸底判斷過於嚴格
  if (scrollTop + clientHeight >= scrollHeight - 10) {
    loadMore();
  }
}

// 當下拉框顯示/隱藏時，綁定/解綁滾動事件
function handleVisibleChange(isVisible) {
  if (isVisible) {
    nextTick(() => {
      // 舊的寫法 (已失效):
      // scrollContainer = selectRef.value?.scrollbar$?.wrap$;
      console.log('selectRef.value:', selectRef.value);
      // 新的、更可靠的寫法:
      scrollContainer = selectRef.value?.popperRef?.querySelector('.el-scrollbar__wrap');

      if (scrollContainer) {
        scrollContainer.addEventListener('scroll', handleScroll);
      }
    });
  } else {
    if (scrollContainer) {
      scrollContainer.removeEventListener('scroll', handleScroll);
      scrollContainer = null; // 隱藏時重置
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

    <!-- 選項列表 -->
    <el-option
      v-for="item in options"
      :key="item.code"
      :label="`${item.code} ${item.name}`"
      :value="item.code"
      class="custom-option-item"
    >
      <div class="custom-select-row">
        <span class="col-code">{{ item.code }}</span>
        <span class="col-name">{{ item.name }}</span>
      </div>
    </el-option>

    <!-- 底部提示：加載更多 或 無更多數據 -->
    <div class="load-more-prompt">
      <p v-if="loadingMore">載入中...</p>
      <p v-else-if="hasMoreData === false && options.length > 0">沒有更多數據了</p>
    </div>

    <!-- 隱藏的 Option，用於在選擇後正確顯示 Label -->
    <el-option
      v-if="selectedItem"
      :key="selectedItem.code"
      :label="`${selectedItem.code} ${selectedItem.name}`"
      :value="selectedItem.code"
      style="display: none;"
    />
  </el-select>
</template>

<style>
/* 使用 :global 或移除 scoped，以便樣式能作用於 el-select-dropdown */
.custom-paginated-select .el-select-dropdown__list {
  padding-bottom: 30px; /* 為底部提示留出空間 */
}

/* 擴大下拉選單的寬度 */
.el-select-dropdown {
  min-width: 350px !important;
}

/* 共用的行佈局 */
.custom-select-row {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0 20px;
}

/* 標頭樣式 */
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

/* 選項樣式重置 */
.custom-option-item.el-option {
  height: auto;
  padding: 0;
}
.custom-option-item .el-select-dropdown__item {
  padding: 8px 0;
  height: auto;
}

/* 欄位寬度與樣式 */
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

/* 底部提示樣式 */
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
