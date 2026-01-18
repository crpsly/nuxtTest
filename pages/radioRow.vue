<script setup>
import { ref, watch } from 'vue';

const tableRef = ref(null);
// 用於 v-model 綁定，存儲選中行的 id
const selectedRowId = ref(null);
const selectedRowData = ref(null); // 用於存儲完整的選中行數據

// 表格數據
const tableData = ref([
  { id: 1, date: '2016-05-03', name: 'Tom', address: 'No. 189, Grove St, Los Angeles' },
  { id: 2, date: '2016-05-02', name: 'Jerry', address: 'No. 189, Grove St, Los Angeles' },
  { id: 3, date: '2016-05-04', name: 'Spike', address: 'No. 189, Grove St, Los Angeles' },
  { id: 4, date: '2016-05-01', name: 'Tyke', address: 'No. 189, Grove St, Los Angeles' }
]);

// 點擊整行時觸發
function handleRowClick(row) {
  // 將點擊的行的 id 賦值給 selectedRowId
  selectedRowId.value = row.id;
  selectedRowData.value = row;
  console.log('點擊行觸發:', row);
}

// 點擊 Radio 按鈕時觸發
function handleRadioChange(row) {
  selectedRowData.value = row;
  console.log('點擊 Radio 觸發:', row);
}

// 監聽 selectedRowId 的變化，以同步表格的高亮行
watch(selectedRowId, (newId) => {
  if (tableRef.value) {
    const row = tableData.value.find(item => item.id === newId);
    // setCurrentRow 是 el-table 的方法，用於手動設置高亮行
    tableRef.value.setCurrentRow(row);
  }
});
</script>

<template>
  <div>
    <h3>當前選中行的 ID: {{ selectedRowId || '未選擇' }}</h3>

    <!--
      @row-click 是為了優化體驗，讓點擊整行也能選中
      ref="tableRef" 是為了在點擊 radio 時，能手動設置高亮行
    -->
    <el-table
      ref="tableRef"
      :data="tableData"
      style="width: 100%"
      highlight-current-row
      @row-click="handleRowClick"
    >
      <el-table-column label="選擇" width="65">
        <template #default="scope">
          <!--
            使用 el-radio-group 和 v-model 達成單選效果
            label 綁定為每行的唯一值，這裡用 id
            @change 事件可以監聽 radio 點擊後的變化
          -->
          <el-radio
            v-model="selectedRowId"
            :label="scope.row.id"
            @change="handleRadioChange(scope.row)"
          >
            <!-- 為了 UI 簡潔，radio 的標籤文字留空 -->
          </el-radio>
        </template>
      </el-table-column>
      <el-table-column prop="date" label="日期" width="180" />
      <el-table-column prop="name" label="姓名" width="180" />
      <el-table-column prop="address" label="地址" />
    </el-table>
  </div>
</template>

<style scoped>
/* 可選：讓滑鼠在行上時顯示為可點擊的手型指標 */
.el-table :deep(.el-table__body tr) {
  cursor: pointer;
}
</style>
