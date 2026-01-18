<script lang="ts" setup>
import { reactive, ref } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';

// 獲取 el-form 的實例，用於觸發校驗
const formRef = ref<FormInstance>();

// 表單數據模型
const form = reactive({
  name: '',
  phone: '',
  email: ''
});

/**
 * 自定義校驗器函數
 * @param rule - 規則對象
 * @param value - 當前字段的值
 * @param callback - 校驗完成後的回調函數
 */
function validateContact(rule: any, value: any, callback: any) {
  // 檢查 phone 和 email 是否都為空
  if (!form.phone && !form.email) {
    // 如果都為空，則調用回調函數並傳入一個 Error 對象，表示校驗失敗
    callback(new Error('聯繫電話和電子郵件請至少填寫一項'));
  } else {
    // 如果其中一個或兩個都已填寫，我們需要手動清除另一個字段可能存在的錯誤提示
    // 這是為了更好的用戶體驗：當用戶填寫了 phone，email 上的錯誤提示應該立即消失
    if (form.phone) {
      formRef.value?.clearValidate('email');
    }
    if (form.email) {
      formRef.value?.clearValidate('phone');
    }
    // 調用空的回調函數，表示校驗通過
    callback();
  }
}

// 定義校驗規則
const rules = reactive<FormRules>({
  name: [
    { required: true, message: '請輸入姓名', trigger: 'blur' }
  ],
  phone: [
    // 兩個字段都使用同一個校驗器
    { validator: validateContact, trigger: 'blur' }
  ],
  email: [
    // 兩個字段都使用同一個校驗器
    { validator: validateContact, trigger: 'blur' }
  ]
});

// 提交表單
async function submitForm(formEl: FormInstance | undefined) {
  if (!formEl) { return; }
  await formEl.validate((valid, fields) => {
    if (valid) {
      console.log('校驗通過，可以提交!', form);
      // 在這裡執行你的提交邏輯，例如發送 API 請求
    } else {
      console.log('校驗失敗!', fields);
    }
  });
}

// 重置表單
function resetForm(formEl: FormInstance | undefined) {
  if (!formEl) { return; }
  formEl.resetFields();
}
</script>

<template>
  <el-form
    ref="formRef"
    :model="form"
    :rules="rules"
    label-width="120px"
    status-icon
  >
    <el-form-item label="姓名" prop="name">
      <el-input v-model="form.name" />
    </el-form-item>

    <el-form-item label="聯繫電話" prop="phone">
      <el-input v-model="form.phone" placeholder="與電子郵件擇一填寫" />
    </el-form-item>

    <el-form-item label="電子郵件" prop="email">
      <el-input v-model="form.email" placeholder="與聯繫電話擇一填寫" />
    </el-form-item>

    <el-form-item>
      <el-button type="primary" @click="submitForm(formRef)">提交</el-button>
      <el-button @click="resetForm(formRef)">重置</el-button>
    </el-form-item>
  </el-form>
</template>
