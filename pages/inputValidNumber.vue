<script lang="ts" setup>
import { reactive, ref } from 'vue';
import type { FormInstance } from 'element-plus';
import { ElMessage } from 'element-plus';

// --- 資料結構 ---
const formRef = ref<FormInstance>();
const commodELNPeriod = ref({
  // 表單的 model 必須包含 Details 陣列
  Details: [
    { startDays: '10', endDays: '20' },
    { startDays: '30', endDays: '' }, // 應觸發校驗錯誤
    { startDays: '', endDays: '' }, // 應校驗通過
    { startDays: 'abc', endDays: '50' } // 應觸發校驗錯誤
  ]
});

// --- 校驗邏輯 ---

// 校驗器1：檢查是否為正整數或零
function validateInteger(rule: any, value: any, callback: any) {
  if (!value) {
    // 如果值為空或undefined，則通過，交給關聯校驗器處理
    return callback();
  }
  const reg = /^\d+$/;
  if (!reg.test(value)) {
    return callback(new Error('只能輸入正整數或零'));
  }
  callback();
}

// 校驗器2：檢查關聯欄位（startDays 和 endDays）
function validatePeerField(rule: any, value: any, callback: any) {
  // rule.field 會是 "Details.0.startDays" 這樣的字串
  const path = rule.field.split('.'); // ["Details", "0", "startDays"]
  const index = Number.parseInt(path[1], 10);
  const currentField = path[2] as 'startDays' | 'endDays';

  const currentRow = commodELNPeriod.value.Details[index];
  const peerField = currentField === 'startDays' ? 'endDays' : 'startDays';
  const peerValue = currentRow[peerField];

  // 如果關聯欄位有值，而當前欄位為空，則報錯
  if (!value) {
    return callback(new Error('此欄位為必填'));
  }

  // (關鍵) 當前欄位輸入內容後，手動觸發關聯欄位的校驗，以便清除其可能存在的錯誤提示
  // 這可以確保使用者在修復一個輸入框後，另一個輸入框的 "必填" 錯誤會立即消失
  if (value && formRef.value) {
    const peerProp = `Details.${index}.${peerField}`;
    // 使用 nextTick 確保 DOM 更新後再校驗，體驗更佳
    formRef.value.validateField(peerProp, () => {});
  }

  callback();
}

// 3. 將校驗器組合進 rules 物件
const rules = reactive({
  startDays: [
    { validator: validateInteger, trigger: 'blur' },
    { validator: validatePeerField, trigger: 'blur' }
  ],
  endDays: [
    { validator: validateInteger, trigger: 'blur' },
    { validator: validatePeerField, trigger: 'blur' }
  ]
});

// --- 表單操作 ---

function addRow() {
  commodELNPeriod.value.Details.push({
    startDays: '',
    endDays: ''
  });
}

function deleteRow(index: number) {
  commodELNPeriod.value.Details.splice(index, 1);
}

async function submitForm(formEl: FormInstance | undefined) {
  if (!formEl) { return; }
  await formEl.validate((valid, fields) => {
    if (valid) {
      ElMessage.success('全部校驗通過!');
      console.log('submit!', commodELNPeriod.value.Details);
    } else {
      ElMessage.error('校驗失敗，請檢查表格中的紅色欄位!');
      console.log('error submit!', fields);
    }
  });
}

function resetForm(formEl: FormInstance | undefined) {
  if (!formEl) { return; }
  formEl.resetFields();
}
</script>

<template>
  <!-- 1. Form 包裹 Table，model 綁定頂層物件 -->
  <el-form
    ref="formRef"
    :model="commodELNPeriod"
    label-width="0px"
    class="demo-ruleForm"
  >
    <el-table :data="commodELNPeriod.Details" style="width: 100%">
      <el-table-column label="開始天數 (startDays)" width="280">
        <template #default="scope">
          <!-- 2. FormItem 的 prop 是動態的 -->
          <el-form-item
            :prop="`Details.${scope.$index}.startDays`"
            :rules="rules.startDays"
          >
            <el-input
              v-model="scope.row.startDays"
              placeholder="請輸入數字"
            />
          </el-form-item>
        </template>
      </el-table-column>

      <el-table-column label="結束天數 (endDays)" width="280">
        <template #default="scope">
          <el-form-item
            :prop="`Details.${scope.$index}.endDays`"
            :rules="rules.endDays"
          >
            <el-input
              v-model="scope.row.endDays"
              placeholder="請輸入數字"
            />
          </el-form-item>
        </template>
      </el-table-column>

      <el-table-column label="操作">
        <template #default="scope">
          <el-button
            link
            type="danger"
            @click.prevent="deleteRow(scope.$index)"
          >
            刪除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-form>

  <div style="margin-top: 20px">
    <el-button @click="addRow">新增一列</el-button>
    <el-button type="primary" @click="submitForm(formRef)">
      提交驗證
    </el-button>
    <el-button @click="resetForm(formRef)">重置表單</el-button>
  </div>
</template>

<style>
/* 讓表格中的錯誤提示不佔用額外空間，避免行高變化 */
.el-form-item {
  margin-bottom: 0;
}
.el-table .el-form-item__error {
  position: absolute;
  top: 100%;
  left: 0;
  padding-top: 2px;
}
</style>
