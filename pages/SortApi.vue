<script setup>
import { onMounted, ref } from 'vue';

// 模擬 API 函數
function mockApiGetData(params) {
  console.log('正在呼叫 API，參數為:', params);
  return new Promise((resolve) => {
    setTimeout(() => {
      // 在此處，後端應根據 params.sorts 進行真實的數據排序
      const data = [
        { date: '2023-01-01', name: '員工A', age: 25, address: '地址A' },
        { date: '2023-01-02', name: '員工B', age: 30, address: '地址B' },
        { date: '2023-01-01', name: '員工C', age: 22, address: '地址C' },
        { date: '2023-01-03', name: '員工D', age: 25, address: '地址D' }
      ];
      console.log('API 返回成功');
      resolve({
        data,
        total: data.length
      });
    }, 500);
  });
}

// ----- 響應式狀態 -----
const tableData = ref([]);
const loading = ref(false);

// 核心：用來儲存排序條件的陣列，與後端 API 格式一致
const sorts = ref([]);

// ----- 函數 -----

// 獲取表格數據的函數
async function fetchData() {
  loading.value = true;
  try {
    const params = {
      // 其他分頁、篩選參數可以放在這裡
      // page: 1,
      // pageSize: 10,
      sorts: sorts.value // 將我們的排序狀態傳遞給後端
    };
    const res = await mockApiGetData(params);
    tableData.value = res.data;
  } catch (error) {
    console.error('獲取數據失敗:', error);
  } finally {
    loading.value = false;
  }
}

// sort-change 事件處理器
function handleSortChange({ prop, order }) {
  // prop: 欄位的 prop 值 (例如 'date', 'name')
  // order: 排序順序 ('ascending', 'descending', null 表示取消排序)

  if (!prop) { return; } // 如果沒有 prop，不處理

  // 尋找當前點擊的欄位是否已經在排序陣列中
  const existingSortIndex = sorts.value.findIndex(s => s.key === prop);

  if (order === null) {
    // 如果 order 是 null，表示使用者點擊了第三次（取消此欄位的排序）
    if (existingSortIndex > -1) {
      sorts.value.splice(existingSortIndex, 1); // 從陣列中移除
    }
  } else {
    const isDesc = order === 'descending';
    if (existingSortIndex > -1) {
      // 如果已存在，只更新排序方向
      sorts.value[existingSortIndex].desc = isDesc;
    } else {
      // 如果是新的排序欄位，將其添加到陣列末尾
      sorts.value.push({
        key: prop,
        desc: isDesc
      });
    }
  }

  // 排序狀態更新後，重新呼叫 API
  fetchData();
}

// (可選) 移除某個排序條件
function removeSort(index) {
  sorts.value.splice(index, 1);
  fetchData(); // 移除後也要重新請求數據
}

// (可選) 輔助函數，根據 prop 獲取欄位中文名
function getColumnLabel(prop) {
  const columnMap = {
    date: '日期',
    name: '姓名',
    age: '年齡'
  };
  return columnMap[prop] || prop;
}

// ----- 生命週期鉤子 -----
onMounted(() => {
  // 組件掛載時，進行第一次數據加載
  fetchData();
});
</script>

<template>
  <div>
    <!-- (可選) 用於視覺化顯示當前的排序條件 -->
    <div v-if="sorts.length > 0" class="sort-display">
      <span>當前排序：</span>
      <el-tag
        v-for="(sort, index) in sorts"
        :key="sort.key"
        closable
        @close="removeSort(index)"
      >
        {{ getColumnLabel(sort.key) }} ({{ sort.desc ? '降序' : '升序' }} - 優先級 {{ index + 1 }})
      </el-tag>
    </div>

    <el-table
      v-loading="loading"
      :data="tableData"
      :default-sort="defaultSort"
      style="width: 100%"
      @sort-change="handleSortChange"
    >
      <el-table-column prop="date" label="日期" sortable="custom" />
      <el-table-column prop="name" label="姓名" sortable="custom" />
      <el-table-column prop="age" label="年齡" sortable="custom" />
      <el-table-column prop="address" label="地址" />
    </el-table>
  </div>
</template>

<style scoped>
.sort-display {
  margin-bottom: 15px;
}
.sort-display .el-tag {
  margin-right: 8px;
}
</style>
