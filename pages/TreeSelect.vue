<script setup>
import { computed, nextTick, ref, watch } from 'vue';

const props = defineProps({
  visible: { type: Boolean, default: false },
  defaultSelected: { type: Array, default: () => [] }
});
const emit = defineEmits(['update:visible', 'confirm']);
// 假設 hooks
// import { useHttp } from '@/hooks/useHttp';
// import { useSetting } from '@/hooks/useSetting';

// 為了範例能跑，我先模擬這兩個，實際請用您的 import
function useHttp() {
  return {
    post: () => new Promise(r => setTimeout(() => r({ /* 模擬資料在下方 queryEmp */ }), 500))
  };
}
function useSetting() {
  return {
    getDept: () => [
      { id: 1, dept: '技術部' },
      { id: 2, dept: '業務部' },
      { id: 3, dept: '管理部' } // 測試過濾用
    ]
  };
}

const { post } = useHttp();
const { getDept } = useSetting();

// --- 搜尋關鍵字 ---
const filterText = ref('');

// --- 監聽搜尋文字改變，觸發 Tree 的過濾 ---
watch(filterText, (val) => {
  treeRef.value?.filter(val);
});

// --- API: 取得員工 ---
function queryEmp(deptName) {
  // 這裡模擬您的 API 回傳結構
  // 實際請直接 return post(...) 即可
  return new Promise((resolve) => {
    // 模擬網路延遲
    setTimeout(() => {
      resolve({
        Code: '000000',
        Msg: 'successful',
        Data: {
          data: {
            // 模擬回傳資料
            empDataList: [
              { empId: Math.random().toString().slice(2, 8), name: '張三', title: '副理', role: 'USER-E' },
              { empId: Math.random().toString().slice(2, 8), name: '李四', title: '專員', role: 'USER-E' }
            ]
          }
        }
      });
    }, 300);
  });

  // 實際專案請用這行:
  // return post('/api_rs/queryEmp', { dept: deptName }).catch(err => { console.error(err); return null; });
}

const treeRef = ref(null);
const tempSelected = ref([]);
const dataCache = ref(new Map());

const defaultProps = {
  label: 'name',
  children: 'zones',
  isLeaf: 'leaf',
  class: (data, node) => {
    if (data.type === 'dept') { return 'hide-checkbox'; }

    return '';
  }
};

const defaultCheckedKeys = computed(() => {
  return tempSelected.value.map(item => item.uniqueId);
});

watch(() => props.visible, (val) => {
  if (val) {
    tempSelected.value = [...props.defaultSelected];
    filterText.value = ''; // 每次打開清空搜尋
    if (treeRef.value) {
      treeRef.value.setCheckedKeys(defaultCheckedKeys.value);
    }
  }
});

// --- 過濾邏輯 ---
function filterNode(value, data) {
  if (!value) { return true; }

  // 規則：如果是「部門」，檢查名稱是否包含關鍵字
  if (data.type === 'dept') {
    return data.name.includes(value);
  }

  // 規則：如果是「員工」，一律顯示 (前提是他的部門已經顯示了)
  // 如果你也想搜尋員工姓名，可以改成: return data.name.includes(value);
  if (data.type === 'emp') {
    return true;
  }

  return true;
}

async function loadNode(node, resolve) {
  // Level 0: 部門
  if (node.level === 0) {
    const depts = getDept() || [];
    const deptNodes = depts.map((d, index) => ({
      id: index + 1,
      name: d.dept,
      type: 'dept',
      uniqueId: `dept_${d.id || index}`,
      leaf: false
    }));
    return resolve(deptNodes);
  }

  // Level 1: 員工
  if (node.level > 0) {
    const deptId = node.data.id;
    const deptName = node.data.name;
    const cacheKey = `dept_${deptId}`;

    if (dataCache.value.has(cacheKey)) {
      const cachedData = dataCache.value.get(cacheKey);
      resolve(cachedData);
      recheckNodes(cachedData);
      return;
    }

    try {
      const empsRes = await queryEmp(deptName);

      // 解析 JSON 結構：Code check & Path check
      if (!empsRes || empsRes.Code !== '000000' || !empsRes.Data?.data?.empDataList) {
        resolve([]);
        return;
      }

      const emps = empsRes.Data.data.empDataList;

      const nodes = emps.map(e => ({
        ...e,
        // 確保 name 存在
        name: e.name,
        // 將 title 存入節點 data，供 template 使用
        title: e.title,
        type: 'emp',
        uniqueId: `emp_${deptId}_${e.empId}`,
        leaf: true,
        deptName
      }));

      dataCache.value.set(cacheKey, nodes);
      resolve(nodes);
      recheckNodes(nodes);
    } catch (error) {
      console.error('loadNode Error:', error);
      resolve([]);
    }
  } else {
    resolve([]);
  }
}

function recheckNodes(nodes) {
  nextTick(() => {
    const selectedIds = tempSelected.value.map(item => item.uniqueId);
    nodes.forEach((n) => {
      if (selectedIds.includes(n.uniqueId)) {
        treeRef.value.setChecked(n.uniqueId, true);
      }
    });
  });
}

function handleCheck(currentObj, { checkedNodes }) {
  tempSelected.value = checkedNodes.filter(n => n.type === 'emp');
}

function removeTag(node) {
  tempSelected.value = tempSelected.value.filter(n => n.uniqueId !== node.uniqueId);
  if (treeRef.value) {
    treeRef.value.setChecked(node.uniqueId, false);
  }
}

function handleClose() {
  emit('update:visible', false);
}

function confirm() {
  emit('confirm', tempSelected.value);
  handleClose();
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="選擇部門人員"
    width="500px"
    :destroy-on-close="false"
    @update:model-value="handleClose"
  >
    <!-- 新增過濾輸入框 -->
    <el-input
      v-model="filterText"
      placeholder="輸入部門名稱進行過濾"
      clearable
      style="margin-bottom: 15px;"
    >
      <template #prefix>
        <el-icon><Search /></el-icon> <!-- 需引入 Element Plus Icon -->
      </template>
    </el-input>

    <el-tree
      ref="treeRef"
      node-key="uniqueId"
      lazy
      show-checkbox
      :load="loadNode"
      :props="defaultProps"
      :default-checked-keys="defaultCheckedKeys"
      :expand-on-click-node="true"
      :filter-node-method="filterNode"
      @check="handleCheck"
    >
      <!-- 自定義節點內容：顯示 姓名 (職稱) -->
      <template #default="{ node, data }">
        <span class="custom-tree-node">
          <span>{{ node.label }}</span>
          <!-- 只有員工類型才顯示職稱，且職稱存在時才顯示 -->
          <span v-if="data.type === 'emp' && data.title" class="emp-title">
            ({{ data.title }})
          </span>
        </span>
      </template>
    </el-tree>

    <!-- 暫存顯示區 -->
    <div class="selected-area">
      <span class="label">目前選取 ({{ tempSelected.length }}人)：</span>
      <el-tag
        v-for="node in tempSelected"
        :key="node.uniqueId"
        closable
        size="small"
        style="margin-right: 5px; margin-bottom: 5px;"
        @close="removeTag(node)"
      >
        <!-- 下方 Tag 也可以加上職稱 -->
        {{ node.name }} <span v-if="node.title">({{ node.title }})</span>
      </el-tag>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="confirm">確定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped>
.selected-area {
  margin-top: 15px;
  padding-top: 10px;
  border-top: 1px solid #eee;
}

/* 隱藏部門 checkbox */
:deep(.hide-checkbox > .el-tree-node__content .el-checkbox) {
  display: none;
}
:deep(.hide-checkbox > .el-tree-node__content) {
  padding-left: 5px;
}

/* 職稱樣式 */
.emp-title {
  color: #909399; /* 淺灰色 */
  font-size: 0.9em;
  margin-left: 4px;
}
</style>
