<script setup lang="ts">
// 如果 MultiSortTable.vue 在 components/ 目錄下，Nuxt 會自動導入
import MultiSortTable from '~/components/MultiSortTable.vue';
</script>

<template>
  <div>
    <h1>可多重排序的表格</h1>
    <MultiSortTable />
  </div>
</template>
