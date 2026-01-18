
import type { Action, ElMessageBoxOptions } from 'element-plus';

async function showMsgBox(title: string, msg: string, options?: Partial<ElMessageBoxOptions>, returnBool: boolean = false) {
  await ElMessageBox.alert(msg, title, {
    type: 'info',
    dangerouslyUseHTMLString: true,
    confirmButtonText: '確定',
    showClose: false,
    draggable: true,
    ...options
  });
  return returnBool;
}

function showConfirm(title: string, msg: string, options?: Partial<ElMessageBoxOptions>) {
  ElMessageBox.confirm(msg, title, {
    type: 'info',
    dangerouslyUseHTMLString: true,
    confirmButtonText: '確定',
    cancelButtonText: '取消',
    showClose: false,
    draggable: true,
    ...options
  });
}

/**
 * 使用 Promise 封裝 ElMessageBox.confirm 的回呼結果
 * @param title 對話框標題
 * @param msg 對話框訊息內容
 * @param options 其他選項
 * @returns Promise<boolean> - true 表示使用者點擊確認，false 表示使用者點擊取消
 */
function confirmWithPromise(
  title: string,
  msg: string,
  options?: Partial<Omit<ElMessageBoxOptions, 'callback'>>
): Promise<boolean> {
  return new Promise((resolve) => {
    showConfirm(title, msg, {
      ...options,
      callback: (action: Action) => {
        resolve(action === 'confirm');
      }
    });
  });
}

async function delay(millisecond: number) {
  return new Promise((resolve) => {
    const _id = setTimeout(() => {
      resolve('');
      clearTimeout(_id);
    }, millisecond);
  });
}

function downFile(blob: Blob, fileName: string) {
  const url = window.URL.createObjectURL(new Blob([blob]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export {
  showMsgBox,
  showConfirm,
  confirmWithPromise,
  delay,
  downFile
};

