<script setup>
import { ref } from 'vue';
import RemotePaginatedSelect from '~/components/RemotePaginatedSelect.vue'; // 確認路徑正確

const selectedTargetCode = ref('2335'); // 可以給一個預設值
const selectedTargetObject = ref(null);

function onTargetChange(target) {
  console.log('父組件收到 change 事件:', target);
  selectedTargetObject.value = target;
}
</script>

<template>
  <div id="app">
    <h1>可重用遠端分頁選擇器範例</h1>
    <p>請在下方選擇器中輸入 '23' 或 '台積' 進行搜尋，並嘗試滾動加載更多。</p>

    <RemotePaginatedSelect
      v-model="selectedTargetCode"
      style="width: 300px;"
      @change="onTargetChange"
    />

    <div v-if="selectedTargetCode" class="result-display">
      <h3>當前選擇的項目:</h3>
      <p><strong>v-model 綁定的值 (標的代號):</strong> {{ selectedTargetCode }}</p>
      <p><strong>@change 事件收到的完整物件:</strong></p>
      <pre>{{ JSON.stringify(selectedTargetObject, null, 2) }}</pre>
    </div>
  </div>
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  padding: 20px;
}
.result-display {
  margin-top: 20px;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #f9f9f9;
}
pre {
  background-color: #eee;
  padding: 10px;
  border-radius: 4px;
}
</style>
