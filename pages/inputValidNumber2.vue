<script setup lang="ts">
import { ref } from 'vue';
import { ElMessageBox, ElTable } from 'element-plus';

const tableData = ref([
  // ... 資料與之前相同
  { id: 1, name: '張三', age: 30, email: 'user1@example.com', address: '台北市信義區', phone: '' },
  { id: 2, name: '', age: 25, email: 'user2@example.com', address: '新北市板橋區', phone: '' },
  { id: 3, name: '李四', age: null, email: '', address: '高雄市左營區', phone: '' },
  { id: 4, name: '王五', age: 40, email: 'user3@example.com', address: '', phone: '' }
]);

// 1. 定義 ref 來獲取 table 實例
const tableRef = ref<InstanceType<typeof ElTable>>();

// 2. 定義必填欄位的字串陣列
const requiredFields: string[] = ['name', 'age', 'email'];

function handleSubmit() {
  if (!tableRef.value) { return; }

  // 3. 動態建立 prop 到 label 的對照表
  const columnLabels: Record<string, string> = {};
  tableRef.value.columns.forEach((column) => {
    if (column.property) { // column.property 就是 prop 的名稱
      columnLabels[column.property] = column.label;
    }
  });

  // 後續的檢核邏輯與方法一完全相同
  const errors: string[] = [];
  tableData.value.forEach((row, index) => {
    requiredFields.forEach((field) => {
      const value = row[field as keyof typeof row];
      if (!value && value !== 0) {
        const label = columnLabels[field] || field;
        errors.push(`第 ${index + 1} 行，【${label}】為必填`);
      }
    });
  });

  if (errors.length > 0) {
    ElMessageBox.alert(errors.join('<br>'), '欄位檢核失敗', {
      type: 'error',
      dangerouslyUseHTMLString: true,
      confirmButtonText: '確定'
    });
  } else {
    ElMessageBox.alert('檢核通過！', '成功', { type: 'success' });
  }
}
</script>

<template>
  <div class="p-8">
    <!-- 需要給 el-table 加上 ref -->
    <ElTable ref="tableRef" :data="tableData" border style="width: 100%">
      <!-- Template 部分與之前完全相同 -->
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="姓名">
        <template #default="scope"><el-input v-model="scope.row.name" /></template>
      </el-table-column>
      <el-table-column prop="age" label="年齡">
        <template #default="scope"><el-input v-model.number="scope.row.age" type="number" /></template>
      </el-table-column>
      <el-table-column prop="email" label="電子郵件">
        <template #default="scope"><el-input v-model="scope.row.email" /></template>
      </el-table-column>
    </ElTable>

    <div class="mt-4 text-right">
      <el-button type="primary" @click="handleSubmit">提交</el-button>
    </div>
  </div>
</template>
