import { Workbook } from 'exceljs';
import dayjs from 'dayjs';

export interface Column {
  prop: string
  label: string
  width?: number
  formatter?: (value: any) => string
}

export function useExcelExport() {
  const exportToExcel = async <T extends Record<string, any>>(
    data: T[],
    columns: Column[],
    filename: string
  ) => {
    // 建立新的工作簿
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');

    // 設定表頭
    worksheet.addRow(columns.map(col => col.label));

    // 設定表頭樣式
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 25;

    // 添加數據
    data.forEach((item) => {
      const rowData = columns.map((col) => {
        const value = item[col.prop];
        if (col.formatter) {
          return col.formatter(value);
        }

        return value;
      });
      worksheet.addRow(rowData);
    });

    // 自動調整欄寬
    worksheet.columns.forEach((column, index) => {
      let maxLength = columns[index].label.length;
      if (column && typeof column.eachCell === 'function') {
        column.eachCell((cell) => {
          const cellLength = cell.value ? cell.value.toString().length : 0;
          if (cellLength > maxLength) {
            maxLength = cellLength;
          }
        });
      }
      // 設定欄寬，最小 8，最大 30
      column.width = Math.max(8, Math.min(maxLength + 2, 30));
    });

    // 設定每個儲存格的樣式
    worksheet.eachRow((row, rowNumber) => {
      row.alignment = { vertical: 'middle', horizontal: 'left' };
      if (rowNumber === 1) {
        row.alignment = { vertical: 'middle', horizontal: 'center' };
      }
    });

    // 生成檔案並下載
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return {
    exportToExcel
  };
}
