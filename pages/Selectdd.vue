<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import type { ElTable } from 'element-plus';

// --- 模擬數據 ---
const tableData = ref(
  Array.from({ length: 50 }, (_, i) => ({ id: i + 1, name: `項目 ${i + 1}` }))
);
const tableRef = ref<InstanceType<typeof ElTable>>();
const multipleSelection = computed(() => tableRef.value?.getSelectionRows() || []);

// --- 分頁 ---
const currentPage = ref(1);
const pageSize = 10;
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return tableData.value.slice(start, end);
});

// --- 核心邏輯 ---
const headerCheckboxState = ref('未選中');

/**
 * 處理 @select-all 事件
 */
async function onSelectAll() {
  // 使用 nextTick 確保 DOM 已經更新完畢
  // 當你點擊 checkbox 後，它的 class 不會立即改變，而是在下一個 DOM 更新週期
  await nextTick();

  // 1. 獲取表頭的 checkbox 元素
  // el-table__header-wrapper 是表頭容器的 class
  // el-checkbox 是 checkbox 組件的 class
  const headerCheckboxEl = tableRef.value?.$el.querySelector(
    '.el-table__header-wrapper .el-checkbox__input'
  );

  if (!headerCheckboxEl) {
    headerCheckboxState.value = '未找到元素';
    return;
  }
  console.log('Header Checkbox Element:', headerCheckboxEl);
  // 2. 判斷 class
  if (headerCheckboxEl.classList.contains('is-indeterminate')) {
    headerCheckboxState.value = '半選中 (is-indeterminate)';
    // 這種情況通常不會在 @select-all 事件中直接出現，
    // 因為點擊半選中狀態會直接跳到全選狀態。但作為邏輯判斷是完整的。
    cancel();
  } else if (headerCheckboxEl.classList.contains('is-checked')) {
    headerCheckboxState.value = '已選中 (is-checked)';
    // 既然表頭是 "已選中"，我們的邏輯就是全選所有數據
    selectAllRows(true);
  } else {
    console.log('全不選');
    headerCheckboxState.value = '未選中';
    // 既然表頭是 "未選中"，我們的邏輯就是取消所有選擇
    cancel();
  }
}

/**
 * 處理 @selection-change 事件
 */
// function onSelectionChange(selection: { id: number, name: string }[]) {
//   // 這個事件只負責更新我們的數據模型
//   // multipleSelection.value = selection;
// }

/**
 * 輔助函數：全選或取消全選所有行
 * @param checked - true 為全選, false 為取消全選
 */
function selectAllRows(checked: boolean) {
  if (checked) {
    tableData.value.forEach((row) => {
      tableRef.value?.toggleRowSelection(row, true);
    });
  } else {
    tableData.value.forEach((row) => {
      tableRef.value?.toggleRowSelection(row, false);
    });
  }
}
function cancel() {
  // multipleSelection.value = [];
  headerCheckboxState.value = '未選中';
  tableRef.value?.clearSelection();
}
</script>

<template>
  <div style="padding: 20px;">
    <h3>通過 Class 判斷 Checkbox 狀態</h3>
    <p>當前偵測到的狀態: <strong>{{ headerCheckboxState }}</strong></p>
    <p>已選中 {{ multipleSelection.length }} / {{ tableData.length }} 項</p>

    <el-table
      ref="tableRef"
      :data="paginatedData"
      :row-key="row => row.id"
      @select-all="onSelectAll"
    >
      <el-table-column type="selection" width="55" reserve-selection />
      <el-table-column prop="name" label="名稱" />
      <el-table-column prop="id" label="ID" />
    </el-table>

    <el-pagination
      v-model:current-page="currentPage"
      style="margin-top: 20px;"
      :page-size="pageSize"
      layout="prev, pager, next"
      :total="tableData.length"
    />
    <el-button
      type="primary"
      style="margin-top: 10px;"
      @click="cancel"
    />
  </div>
</template>

<style>
/* 為了讓範例更清晰，給狀態加點顏色 */
strong {
  padding: 2px 6px;
  border-radius: 4px;
  color: white;
  background-color: #409eff;
}
</style>
