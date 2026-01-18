<script setup lang="ts">
import { reactive, ref } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage } from 'element-plus';

// 步驟 3: 準備表單數據和 ref
const formRef = ref<FormInstance>();

// 表格數據結構
interface TableRow {
  name: string
  value: string // 使用 string 類型以方便 v-model 處理輸入
  price: string
}

// 將 tableData 包裝在一個對象中，以便 el-form 的 :model 可以正確追蹤
const formModel = reactive<{ tableData: TableRow[] }>({
  tableData: [
    { name: '蘋果', value: '10.5', price: '50' },
    { name: '香蕉', value: '', price: '30' },
    { name: '橘子', value: '5', price: '25' },
    { name: '西瓜', value: '-10', price: '200' },
    { name: '葡萄', value: 'abc', price: '150' }
  ]
});

// 步驟 4: 定義驗證規則
// 自定義驗證函式
function validatePositiveDecimal(rule: any, value: any, callback: any) {
  // 1. 檢核不能為空
  if (!value) {
    return callback(new Error('此欄位不能為空'));
  }

  // 2. 檢核是否為數字格式 (可以包含小數點)
  //    正規表達式 ^\d+(?:\.\d+)?$ 解釋:
  //    ^      - 字串開頭
  //    \d+    - 一個或多個數字
  //    (?:\.\d+)? - 一個可選的小數部分 (點 + 一個或多個數字)，非捕獲群組
  //    $      - 字串結尾
  if (!/^\d+(?:\.\d+)?$/.test(value)) {
    return callback(new Error('請輸入有效的數值'));
  }

  // 3. 檢核是否為 "正數"
  if (Number(value) <= 0) {
    return callback(new Error('數值必須大於 0'));
  }

  // 4. 如果所有檢核都通過
  callback();
}

// 將規則整理成一個物件
const rules = reactive<FormRules>({
  positiveDecimal: [
    // Element Plus 的 required: true 也能做到非空驗證，但我們在自訂函式中處理了，所以這裡可以只用 validator
    // { required: true, message: '此欄位不能為空', trigger: 'blur' },
    { validator: validatePositiveDecimal, trigger: 'blur' }
  ]
});

// 當 input 失去焦點時的處理函式 (可選，但有助於 UX)
function handleInputBlur(row: TableRow) {
  // 你可以在這裡做一些即時的格式化，例如去掉多餘的0
  console.log(`${row.name} 的輸入框失去焦點，值為: ${row.value}`);
}

// 步驟 5: 提交表單並觸發驗證
async function submitForm() {
  if (!formRef.value) { return; }

  await formRef.value.validate((valid, fields) => {
    if (valid) {
      console.log('驗證通過!', formModel.tableData);
      ElMessage({
        message: '所有欄位驗證通過！',
        type: 'success'
      });
      // 在這裡執行提交到後端的邏輯
    } else {
      console.log('驗證失敗!', fields);
      ElMessage({
        message: '部分欄位驗證失敗，請檢查！',
        type: 'error'
      });
    }
  });
}

// 重置表單
function resetForm() {
  if (!formRef.value) { return; }
  formRef.value.resetFields();
}
</script>

<template>
  <div class="p-8">
    <h1 class="text-2xl mb-4">Element Plus 表格輸入驗證</h1>

    <!-- 步驟 1: 將 el-table 包在 el-form 中 -->
    <el-form
      ref="formRef"
      :model="formModel"
      label-width="0px"
    >
      <el-table :data="formModel.tableData" style="width: 100%">
        <el-table-column prop="name" label="品項" width="180" />

        <el-table-column label="數量 (必須為正小數)">
          <template #default="scope">
            <!--
              步驟 2: 在 slot 中使用 el-form-item
              - :prop 是關鍵，它將驗證規則與數據模型中的具體欄位關聯起來
              - :rules 直接應用我們定義的規則
            -->
            <el-form-item
              :prop="`tableData.${scope.$index}.value`"
              :rules="rules.positiveDecimal"
            >
              <el-input
                v-model="scope.row.value"
                placeholder="請輸入數量"
                @blur="handleInputBlur(scope.row)"
              />
            </el-form-item>
          </template>
        </el-table-column>

        <el-table-column label="價格 (可選)">
          <template #default="scope">
            <el-input
              v-model="scope.row.price"
              placeholder="請輸入價格"
            />
          </template>
        </el-table-column>
      </el-table>

      <div class="mt-4 text-right">
        <el-button type="primary" @click="submitForm">
          提交驗證
        </el-button>
        <el-button @click="resetForm">
          重置
        </el-button>
      </div>
    </el-form>
  </div>
</template>

<style>
/* 讓 el-form-item 的錯誤訊息在表格中也能正常顯示 */
.el-table .el-form-item {
  margin-bottom: 0;
}
.el-table .el-form-item .el-form-item__error {
  position: absolute;
  top: 100%;
  left: 0;
  padding-top: 2px;
}
</style>
