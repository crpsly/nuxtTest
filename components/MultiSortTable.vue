<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import type { Column } from '~/composables/useExcelExport';

// 定义表格数据的接口 (推荐)
interface User {
  id: number
  name: string
  email: string
  city: string
  company: string
}

// 模拟的原始数据 (实际项目中通常来自 API)
const mockUsers: User[] = Array.from({ length: 55 }, (_, i) => ({
  id: i + 1,
  name: `用户 ${String.fromCharCode(65 + (i % 26))}${i}`,
  email: `user${i + 1}@example.com`,
  city: ['北京', '上海', '广州', '深圳', '杭州'][i % 5],
  company: `科技公司 ${String.fromCharCode(65 + (i % 10))}`
}));

// --- State ---
const allTableData = ref<User[]>([]); // 存储所有原始数据
const loading = ref(false);
const searchKeyword = ref('');
const currentPage = ref(1);
const pageSize = ref(10);

// --- Computed Properties ---

// 1. 过滤后的数据
const filteredData = computed<User[]>(() => {
  if (!searchKeyword.value.trim()) {
    return allTableData.value;
  }
  const keyword = searchKeyword.value.toLowerCase().trim();
  return allTableData.value.filter((item) => {
    // 检查 item 的每个属性值是否包含关键字
    // 你可以指定搜索哪些列，例如：
    // return item.name.toLowerCase().includes(keyword) || item.email.toLowerCase().includes(keyword);
    return Object.values(item).some(value =>
      String(value).toLowerCase().includes(keyword)
    );
  });
});

// 2. 当前页要显示的数据
const paginatedData = computed<User[]>(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredData.value.slice(start, end);
});

// 3. 总条目数 (用于分页器)
const totalItems = computed<number>(() => filteredData.value.length);

// Excel 匯出相關
const { exportToExcel } = useExcelExport();

const tableColumns: Column[] = [
  { prop: 'id', label: 'ID', width: 80 },
  { prop: 'name', label: '姓名', width: 180 },
  { prop: 'email', label: '邮箱' },
  { prop: 'city', label: '城市', width: 180 },
  { prop: 'company', label: '公司' }
];

function handleExport(): void {
  exportToExcel(
    filteredData.value,
    tableColumns,
    '用户列表'
  );
}

// --- Methods ---
async function fetchData() {
  loading.value = true;
  // 模拟 API 调用
  await new Promise(resolve => setTimeout(resolve, 500));
  allTableData.value = mockUsers;
  loading.value = false;
  // ElMessage.success('数据加载成功！') // 可选
}

function handleSizeChange(val: number) {
  pageSize.value = val;
  currentPage.value = 1; // 更改每页大小时，通常重置到第一页
}

function handleCurrentChange(val: number) {
  currentPage.value = val;
}

// 当搜索框输入时，如果希望立即重置到第一页，可以这样做
function handleSearchInput() {
  // 如果当前页在过滤后不存在，则重置到第一页
  if (currentPage.value > Math.ceil(totalItems.value / pageSize.value) && totalItems.value > 0) {
    currentPage.value = 1;
  } else if (totalItems.value === 0) {
    currentPage.value = 1; // 如果没有结果，也确保是第一页
  }
  // 或者，更简单粗暴地，每次搜索都重置到第一页
  // currentPage.value = 1;
}

// --- Lifecycle Hooks ---
onMounted(() => {
  fetchData();
});

// 监听搜索关键字变化，如果需要，可以在这里重置页码
// (上面的 handleSearchInput 已经部分处理了，这里是另一种方式)
watch(searchKeyword, () => {
  // 每次搜索关键字变化时，都将当前页重置为1
  // 这样可以确保用户总是从第一页开始看搜索结果
  // 如果不希望这样，可以移除这个 watcher 或 handleSearchInput 中的重置逻辑
  currentPage.value = 1;
});

// 如果希望在 pageSize 变化时，也确保 currentPage 的有效性
watch(pageSize, () => {
  if (currentPage.value > Math.ceil(totalItems.value / pageSize.value) && totalItems.value > 0) {
    currentPage.value = Math.ceil(totalItems.value / pageSize.value);
  }
});
</script>

<template>
  <div class="p-4">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户列表 (Nuxt3 + Element Plus)</span>
        </div>
      </template>

      <el-row :gutter="20" class="mb-4">
        <el-col :span="8">
          <el-input
            v-model="searchKeyword"
            placeholder="输入关键字搜索 (姓名、邮箱、城市)"
            clearable
            @input="handleSearchInput"
          />
        </el-col>
        <el-col :span="4">
          <el-button type="primary" @click="handleExport">
            匯出 Excel
          </el-button>
        </el-col>
      </el-row>

      <el-table v-loading="loading" :data="paginatedData" stripe border style="width: 100%">
        <el-table-column
          v-for="col in tableColumns" :key="col.prop"
          :prop="col.prop"
          :label="col.label"
          :width="col.width"
        />
      </el-table>

      <div class="mt-4 flex justify-end">
        <el-pagination
          v-if="totalItems > 0"
          :current-page="currentPage"
          :page-size="pageSize"
          :page-sizes="[5, 10, 20, 50]"
          :total="totalItems"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<style scoped>
/* 組件特定樣式 */
.table-wrapper {
  margin: 1rem 0;
}

.search-bar {
  margin-bottom: 1rem;
}

.pagination-wrapper {
  margin-top: 1rem;
  display: flex;
  justify-content: flex-end;
}
</style>
