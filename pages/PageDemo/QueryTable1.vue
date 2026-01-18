<script setup lang="ts">
import dayjs from 'dayjs';
import { useEvents } from './useEvents';

definePageMeta({
  MenuID: 'QueryTable1',
  keep: true
});

const {
  query,
  currentPage,
  pageSize,
  tableRef,
  handleQuery,
  handleReset,
  handleSelectionChange,
  handleGoDetial,
  handleDelete,
  handleSizeChange,
  handleCurrentChange,
  handleExport,
  canSelect,
  searchText,
  filterTableData,
  paginatedTableData
} = useEvents();

function formatterCol2(row: any, _column?: any, _cellValue?: any, _index?: number): VNode | string {
  return dayjs(Number(row.col2)).format('YYYY/MM/DD HH:mm:ss');
};
</script>

<template>
  <el-main>
    <el-row justify="space-between" class="my-1">
      <el-col :span="6">
        <div class="mx-1 bold text-xl text-red-500" type="danger">功能頁面 Title</div>
      </el-col>
      <el-col :span="4" style="text-align: right;">
        <el-text class="mx-1" size="large">編號：XXXXXXXXXX</el-text>
      </el-col>
    </el-row>
    <!-- 查詢區塊 -->
    <el-row class="row-bg" justify="center" style="margin-bottom: 30px;">
      <el-card style="width: 2400px" shadow="never">
        <el-col>
          <el-form :model="query">
            <el-row :gutter="20">
              <el-col :span="6">
                <el-form-item label="日期範圍：">
                  <el-date-picker
                    v-model="query.dateRange"
                    type="daterange"
                    range-separator="~"
                    start-placeholder="開始日期"
                    end-placeholder="結束日期"
                    style="width: 100%;"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="下拉選單：">
                  <el-select v-model="query.dropdownSelected" placeholder="---全部類型---">
                    <el-option label="類型 A" value="0001" />
                    <el-option label="類型 B" value="0002" />
                    <el-option label="類型 C" value="0003" />
                    <el-option label="類型 D" value="0004" />
                    <el-option label="類型 E" value="0005" />
                    <el-option label="類型 F" value="0006" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="資料輸入：">
                  <el-input v-model="query.inputText" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24" style="text-align: center;">
                <el-button type="primary" plain @click="handleQuery">查詢</el-button>
                <el-button type="warning" plain @click="handleReset">清除</el-button>
              </el-col>
            </el-row>
          </el-form>
        </el-col>
      </el-card>
    </el-row>
    <!-- 資料表 -->
    <el-row :gutter="20" class="row-bg my-4" justify="space-between">
      <el-col :span="4" />
      <div :span="6" class="!flex !justify-center">
        <el-button type="success" @click="() => handleGoDetial()">新增</el-button>
        <el-button type="danger" @click="handleDelete">刪除</el-button>
        <el-button type="info" @click="handleExport">匯出</el-button>
      </div>
      <el-col :span="4" class="flex jusitfy-end p-0">
        <el-input v-model="searchText" size="large" placeholder="搜尋" clearable />
      </el-col>
    </el-row>
    <el-table ref="tableRef" :data="paginatedTableData" empty-text="無資料" stripe @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" :selectable="canSelect" />
      <el-table-column prop="col1" label="資料欄1" sortable>
        <template #default="scope">
          <el-button link type="primary" @click="handleGoDetial(scope.row)">{{ scope.row.col1 }}</el-button>
        </template>
      </el-table-column>
      <el-table-column prop="col2" label="資料欄2" sortable :formatter="formatterCol2" />
      <el-table-column prop="col3" label="資料欄3" sortable />
      <el-table-column prop="col4" label="資料欄4" sortable />
      <el-table-column prop="col5" label="資料欄5" sortable />
      <el-table-column prop="col6" label="資料欄6" sortable />
      <el-table-column prop="col7" label="資料欄7" sortable />
      <el-table-column prop="col8" label="資料欄8" sortable />
      <el-table-column prop="col9" label="資料欄9" sortable />
    </el-table>
    <!-- 分頁 -->
    <el-row justify="end" style="margin-top: 10px;">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 30, 40]"
        size="large"
        :disabled="false"
        :background="false"
        layout="sizes, prev, pager, next, total"
        :total="filterTableData.length"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </el-row>
  </el-main>
</template>

 <style scoped>
.demo-form-inline .el-select {
  --el-select-width: 300px;
}
</style>
