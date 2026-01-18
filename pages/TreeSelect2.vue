<script setup>
import { computed, nextTick, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';

const props = defineProps({
  visible: { type: Boolean, default: false },
  defaultSelected: { type: Array, default: () => [] },
  max: { type: Number, default: 0 }
});

const emit = defineEmits(['update:visible', 'confirm']);

// --- 模擬資料 ---
const sourceData = {
  Code: '000000',
  Msg: 'successful',
  Timestamp: '2025-11-25 10:58:19',
  TimeElapsed: '7',
  Data: {
    items: [
      { empId: '5', name: 'AAA', dept: 'YY部', title: '專員', role: 'USER-E', email: 'user1@example.com' },
      { empId: '4', name: 'OOO', dept: 'AA部', title: '專員', role: 'USER-M', email: 'user2@example.com' },
      { empId: '3', name: 'BBB', dept: 'CC部', title: '協理', role: 'USER-M', email: 'user3@example.com' },
      { empId: '2', name: 'AAA', dept: 'DD處', title: '副總經理', role: 'USER-M', email: 'user4@example.com' },
      { empId: '99', name: 'CCCD', dept: 'EE部', title: '副理', role: 'USER-E', email: 'user5@example.com' },
      { empId: '1', name: 'CCC', dept: 'OO部', title: '副理', role: 'USER-E', email: 'user6@example.com' }
    ]
  }
};

// --- 資料處理 ---
const treeData = computed(() => {
  const items = sourceData.Data.items || [];
  const deptMap = new Map();
  items.forEach((item) => {
    if (!deptMap.has(item.dept)) {
      deptMap.set(item.dept, {
        uniqueId: `dept_${item.dept}`,
        name: item.dept,
        type: 'dept',
        children: []
      });
    }
    deptMap.get(item.dept).children.push({
      ...item,
      type: 'emp',
      uniqueId: `emp_${item.empId}`
    });
  });
  return Array.from(deptMap.values());
});

const filterText = ref('');
const treeRef = ref(null);
const tempSelected = ref([]);

const defaultProps = {
  label: 'name',
  children: 'children',
  class: data => (data.type === 'dept' ? 'hide-checkbox' : '')
};

const defaultCheckedKeys = computed(() => tempSelected.value.map(item => item.uniqueId));

// *** 修改處：篩選邏輯增強 ***
// 現在搜尋時，會同時比對「姓名」與「職稱」
function filterNode(value, data) {
  if (!value) { return true; }
  const nameMatch = data.name.includes(value);
  const titleMatch = data.title && data.title.includes(value);
  return nameMatch || titleMatch;
}

watch(filterText, val => treeRef.value?.filter(val));

watch(() => props.visible, (val) => {
  if (val) {
    tempSelected.value = [...props.defaultSelected];
    nextTick(() => {
      if (treeRef.value) { treeRef.value.setCheckedKeys(defaultCheckedKeys.value); }
    });
  }
});

function handleCheck(currentObj, { checkedNodes }) {
  const currentEmps = checkedNodes.filter(n => n.type === 'emp');
  if (props.max > 0 && currentEmps.length > props.max) {
    ElMessage.warning(`最多只能選擇 ${props.max} 人`);
    treeRef.value.setChecked(currentObj.uniqueId, false);
    return;
  }
  tempSelected.value = currentEmps;
}

function removeTag(node) {
  tempSelected.value = tempSelected.value.filter(n => n.uniqueId !== node.uniqueId);
  if (treeRef.value) { treeRef.value.setChecked(node.uniqueId, false); }
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
    top="5vh"
    @update:model-value="handleClose"
  >
    <el-input
      v-model="filterText"
      class="w-60 mb-2"
      placeholder="搜尋姓名或職稱..."
      clearable
    />

    <div class="tree-scroll-container">
      <el-tree
        ref="treeRef"
        node-key="uniqueId"
        show-checkbox
        :data="treeData"
        :props="defaultProps"
        :default-checked-keys="defaultCheckedKeys"
        :default-expand-all="true"
        :filter-node-method="filterNode"
        :expand-on-click-node="true"
        @check="handleCheck"
      >
        <!-- *** 修改處：使用 Slot 自定義節點內容 *** -->
        <template #default="{ node, data }">
          <span class="custom-tree-node">
            <!-- 如果是員工，顯示 [職稱] 姓名 -->
            <template v-if="data.type === 'emp'">
              <span v-if="data.title" class="emp-title">[{{ data.title }}]</span>
              <span>{{ data.name }}</span>
            </template>
            <!-- 如果是部門，只顯示部門名稱 -->
            <template v-else>
              {{ data.name }}
            </template>
          </span>
        </template>
      </el-tree>
    </div>

    <!-- 暫存顯示區 -->
    <div class="selected-area">
      <span class="label">
        目前選取 ({{ tempSelected.length }} / {{ max > 0 ? max : '不限' }} 人)：
      </span>
      <div class="tags-container">
        <el-tag
          v-for="node in tempSelected"
          :key="node.uniqueId"
          closable
          size="small"
          style="margin-right: 5px; margin-bottom: 5px;"
          @close="removeTag(node)"
        >
          <!-- 這裡維持只顯示姓名，比較乾淨，如果要加職稱也可以加 -->
          {{ node.name }}
        </el-tag>
      </div>
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
.tree-scroll-container {
  height: 430px;
  overflow-y: auto;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 5px 0;
}

.selected-area {
  margin-top: 15px;
  padding-top: 10px;
  border-top: 1px solid #eee;
}

.tags-container {
  margin-top: 5px;
  max-height: 100px;
  overflow-y: auto;
}

/* *** 修改處：職稱樣式 *** */
.emp-title {
  color: #909399; /* 灰色 */
  margin-right: 4px;
  font-size: 0.9em;
}

:deep(.hide-checkbox > .el-tree-node__content .el-checkbox) {
  display: none;
}

:deep(.hide-checkbox > .el-tree-node__content) {
  padding-left: 5px;
}
</style>
