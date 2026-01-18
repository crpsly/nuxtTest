<script setup>
// --- Script 內容與前一版完全相同，此處省略以保持簡潔 ---
import { ref } from 'vue';

// --- Refs for component state ---
const selectedUserId = ref(null);
const selectedUser = ref(null); // 儲存已選中的完整物件
const loading = ref(false);
const hasSearched = ref(false); // 判斷是否已執行過搜尋
const options = ref([]);

// --- 模擬後端數據 ---
const allUsers = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' },
  { id: 3, name: 'Charlie', email: 'charlie@example.com' },
  { id: 4, name: 'David', email: 'david@example.com' },
  { id: 5, name: 'Eve', email: 'eve@example.com' },
  { id: 6, name: 'Frank', email: 'frank@example.com' }
];

// --- 模擬後端 API ---
function mockApiFetch(query) {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (!query) {
        resolve([]);
      } else {
        const lowerCaseQuery = query.toLowerCase();
        const results = allUsers.filter(
          user =>
            user.name.toLowerCase().includes(lowerCaseQuery)
            || user.email.toLowerCase().includes(lowerCaseQuery)
        );
        resolve(results);
      }
    }, 500); // 模擬 500ms 網路延遲
  });
}

// --- Event Handlers ---
async function remoteMethod(query) {
  if (query) {
    loading.value = true;
    hasSearched.value = true;
    options.value = await mockApiFetch(query);
    loading.value = false;
  } else {
    options.value = [];
    hasSearched.value = false;
  }
}
function handleChange(selectedId) {
  if (selectedId) {
    let user = options.value.find(item => item.id === selectedId);
    // 如果在當前選項中找不到 (例如，是通過預設值設定的)，可以從所有數據中找
    if (!user) {
      user = allUsers.find(item => item.id === selectedId);
    }
    selectedUser.value = user;
  } else {
    selectedUser.value = null;
  }
}
function handleClear() {
  selectedUserId.value = null;
  selectedUser.value = null;
  options.value = [];
  hasSearched.value = false;
}
</script>

<template>
  <div class="custom-select-container">
    <p>已選中的值 (ID): {{ selectedUserId }}</p>
    <el-select
      v-model="selectedUserId"
      filterable
      remote
      :remote-method="remoteMethod"
      :loading="loading"
      placeholder="請輸入使用者名稱或Email搜尋"
      class="custom-layout-select"
      clearable
      @clear="handleClear"
      @change="handleChange"
    >
      <!-- 步驟 1: 客製化標頭 -->
      <!-- 套用共用的 .custom-select-row class -->
      <div v-if="options.length > 0" class="custom-select-header">
        <div class="custom-select-row">
          <span class="col-id">ID</span>
          <span class="col-name">名稱</span>
          <span class="col-email">Email</span>
        </div>
      </div>

      <!-- 步驟 2: 使用 v-for 渲染客製化的 el-option -->
      <el-option
        v-for="item in options"
        :key="item.id"
        :label="item.name"
        :value="item.id"
        class="custom-option-item"
      >
        <!-- 在 el-option 內部也使用共用的 .custom-select-row class -->
        <div class="custom-select-row">
          <span class="col-id">{{ item.id }}</span>
          <span class="col-name">{{ item.name }}</span>
          <span class="col-email">{{ item.email }}</span>
        </div>
      </el-option>

      <!-- 步驟 3: 處理無資料或未搜尋時的提示 -->
      <div v-if="!loading && options.length === 0" class="no-data-prompt">
        <p v-if="hasSearched">找不到結果</p>
        <p v-else>請輸入關鍵字進行搜尋</p>
      </div>

      <!-- 隱藏的 el-option，用於選擇後顯示 label -->
      <el-option
        v-if="selectedUser"
        :key="selectedUser.id"
        :label="selectedUser.name"
        :value="selectedUser.id"
        style="display: none;"
      />
    </el-select>
  </div>
</template>

<style>
/*
  關鍵優化點:
  使用 CSS 變數和共用 class 來確保標頭和選項內容的佈局與對齊完全一致。
*/

/* 1. 定義共用的欄位寬度 */
:root {
  --col-id-width: 80px;
  --col-name-width: 120px;
  --col-padding: 20px; /* 定義共用內邊距 */
}

/* 2.
<template>
  <div class="custom-select-container">
    <p>已選中的值 (ID): {{ selectedUserId }}</p>
    <el-select
      v-model="selectedUserId"
      filterable
      remote
      :remote-method="remoteMethod"
      :loading="loading"
      placeholder="請輸入使用者名稱或Email搜尋"
      class="custom-layout-select"
      clearable
      @clear="handleClear"
      @change="handleChange"
    >
      <!-- 步驟 1: 客製化標頭 -->
      <!-- 套用共用的 .custom-select-row class -->
      <div v-if="options.length > 0" class="custom-select-header">
        <div class="custom-select-row">
          <span class="col-id">ID</span>
          <span class="col-name">名稱</span>
          <span class="col-email">Email</span>
        </div>
      </div>

      <!-- 步驟 2: 使用 v-for 渲染客製化的 el-option -->
      <el-option
        v-for="item in options"
        :key="item.id"
        :label="item.name"
        :value="item.id"
        class="custom-option-item"
      >
        <!-- 在 el-option 內部也使用共用的 .custom-select-row class -->
        <div class="custom-select-row">
          <span class="col-id">{{ item.id }}</span>
          <span class="col-name">{{ item.name }}</span>
          <span class="col-email">{{ item.email }}</span>
        </div>
      </el-option>

      <!-- 步驟 3: 處理無資料或未搜尋時的提示 -->
      <div v-if="!loading && options.length === 0" class="no-data-prompt">
        <p v-if="hasSearched">找不到結果</p>
        <p v-else>請輸入關鍵字進行搜尋</p>
      </div>

      <!-- 隱藏的 el-option，用於選擇後顯示 label -->
      <el-option
        v-if="selectedUser"
        :key="selectedUser.id"
        :label="selectedUser.name"
        :value="selectedUser.id"
        style="display: none;"
      />
    </el-select>
  </div>
</template>

<script setup>
// --- Script 內容與前一版完全相同，此處省略以保持簡潔 ---
import { ref } from 'vue';

// --- Refs for component state ---
const selectedUserId = ref(null);
const selectedUser = ref(null); // 儲存已選中的完整物件
const loading = ref(false);
const hasSearched = ref(false); // 判斷是否已執行過搜尋
const options = ref([]);

// --- 模擬後端數據 ---
const allUsers = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' },
  { id: 3, name: 'Charlie', email: 'charlie@example.com' },
  { id: 4, name: 'David', email: 'david@example.com' },
  { id: 5, name: 'Eve', email: 'eve@example.com' },
  { id: 6, name: 'Frank', email: 'frank@example.com' },
];

// --- 模擬後端 API ---
const mockApiFetch = (query) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (!query) {
        resolve([]);
      } else {
        const lowerCaseQuery = query.toLowerCase();
        const results = allUsers.filter(
          (user) =>
            user.name.toLowerCase().includes(lowerCaseQuery) ||
            user.email.toLowerCase().includes(lowerCaseQuery)
        );
        resolve(results);
      }
    }, 500); // 模擬 500ms 網路延遲
  });
};

// --- Event Handlers ---
const remoteMethod = async (query) => {
  if (query) {
    loading.value = true;
    hasSearched.value = true;
    options.value = await mockApiFetch(query);
    loading.value = false;
  } else {
    options.value = [];
    hasSearched.value = false;
  }
};
const handleChange = (selectedId) => {
  if (selectedId) {
    let user = options.value.find(item => item.id === selectedId);
    // 如果在當前選項中找不到 (例如，是通過預設值設定的)，可以從所有數據中找
    if (!user) {
      user = allUsers.find(item => item.id === selectedId);
    }
    selectedUser.value = user;
  } else {
    selectedUser.value = null;
  }
};
const handleClear = () => {
  selectedUserId.value = null;
  selectedUser.value = null;
  options.value = [];
  hasSearched.value = false;
};
</script>

<style>
/*
  關鍵優化點:
  使用 CSS 變數和共用 class 來確保標頭和選項內容的佈局與對齊完全一致。
*/

/* 1. 定義共用的欄位寬度 */
:root {
  --col-id-width: 80px;
  --col-name-width: 120px;
  --col-padding: 20px; /* 定義共用內邊距 */
}

/* 2. 擴大下拉選單的寬度以容納內容 */
.el-select-dropdown.is-multiple,
.el-select-dropdown__list {
  min-width: 450px !important;
}

/* 3. 定義共用的行佈局 class */
.custom-select-row {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0 var(--col-padding); /* 使用共用內邊距 */
}

/* 4. 設定標頭樣式 */
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
  box-sizing: border-box; /* 確保 padding 不會增加總高度 */
}
.custom-select-header .custom-select-row {
  height: 100%; /* 讓行填滿標頭高度 */
}

/* 5. 重置 el-option 的預設樣式並套用新樣式 */
.custom-option-item.el-option {
  height: auto; /* 高度自適應 */
  padding: 0;   /* 關鍵: 重置 el-option 的預設 padding */
}

.custom-option-item .el-select-dropdown__item {
  padding: 8px 0; /* 只給予垂直 padding，水平 padding 由 .custom-select-row 控制 */
  height: auto;
}

/* 6. 設定各欄位的寬度和樣式 */
.custom-select-row .col-id,
.custom-select-row .col-name,
.custom-select-row .col-email {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  box-sizing: border-box;
}

.col-id {
  width: var(--col-id-width);
}
.col-name {
  width: var(--col-name-width);
  margin: 0 10px; /* 欄位間距 */
}
.col-email {
  flex: 1; /* 剩餘空間都給 email */
  color: #888;
}

/* 無資料提示樣式 */
.no-data-prompt {
  padding: 10px 0;
  text-align: center;
  color: #999;
  font-size: 14px;
}
</style>
