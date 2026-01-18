<script setup>
import { reactive, ref } from 'vue';

// 表單的 ref，用於觸發驗證
const formRef = ref(null);

// 表單數據
const formData = reactive({
  quantity: ''
});

// 自定義驗證函數 (或直接使用正則表達式)
function validateInteger(rule, value, callback) {
  // 正則表達式：^ 表示開始，\d+ 表示一個或多個數字，$ 表示結束。
  // 這確保了整個字串都必須是數字。
  // 如果允許為空，可以用 /^\d*$/
  const reg = /^\d+$/;
  if (value === '' || reg.test(value)) {
    callback(); // 驗證通過
  } else {
    callback(new Error('只能輸入正整數')); // 驗證失敗
  }
}

// 驗證規則
const rules = reactive({
  quantity: [
    { required: true, message: '數量不能為空', trigger: 'blur' },
    // 使用自定義驗證器
    { validator: validateInteger, trigger: 'blur' }
    // 或者直接使用 pattern 正則表達式，效果相同
    // { pattern: /^\d+$/, message: '只能輸入正整數', trigger: 'blur' }
  ]
});

// 提交表單
function submitForm() {
  if (!formRef.value) { return; }
  formRef.value.validate((valid) => {
    if (valid) {
      console.log('驗證通過，提交成功!', formData);
      alert('提交成功！');
    } else {
      console.log('驗證失敗!');
      return false;
    }
  });
}
</script>

<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="rules"
    label-width="120px"
    style="width: 400px;"
  >
    <el-form-item label="數量" prop="quantity">
      <el-input
        v-model="formData.quantity"
        placeholder="請輸入正整數"
        clearable
      />
    </el-form-item>

    <el-form-item>
      <el-button type="primary" @click="submitForm">提交</el-button>
    </el-form-item>
  </el-form>
</template>
