<!-- Parent.vue -->
<script setup>
import { ref } from 'vue';
import EmployeeSelector from './TreeSelect2.vue';

const showSelector = ref(false);

// 這是父元件保存的「最終正確名單」，包含完整物件 {id, name, uniqueId...}
const selectedEmployees = ref([]);

/**
 * 接收子元件傳回來的完整陣列
 */
function handleConfirm(newSelection) {
  selectedEmployees.value = newSelection;
  console.log('父元件收到資料:', selectedEmployees.value);
}
</script>

<template>
  <div class="app-container">
    <h2>人員選取範例</h2>

    <!-- 顯示已選取的人員 (在彈窗外) -->
    <div class="result-card">
      <h4>已選取人員清單：</h4>

      <div v-if="selectedEmployees.length === 0" style="color: #999;">
        尚未選擇任何人員
      </div>

      <el-tag
        v-for="emp in selectedEmployees"
        :key="emp.uniqueId"
        type="success"
        size="large"
        style="margin-right: 10px; margin-bottom: 10px;"
      >
        {{ emp.name }} (ID: {{ emp.id }})
      </el-tag>
    </div>

    <el-button type="primary" @click="showSelector = true">
      開啟選人彈窗
    </el-button>

    <!-- 引入子元件 -->
    <!--
      visible: 控制彈窗顯示
      default-selected: 將目前的結果傳進去，讓彈窗知道要回顯誰
      @confirm: 當彈窗按確定時，更新這裡的資料
    -->
    <EmployeeSelector
      v-model:visible="showSelector"
      :max="1"
      :default-selected="selectedEmployees"
      @confirm="handleConfirm"
    />
  </div>
</template>

<style scoped>
.app-container {
  padding: 20px;
}
.result-card {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  min-height: 50px;
}
</style>
