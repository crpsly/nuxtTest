import fs from 'node:fs';
import { eventHandler, readBody } from 'h3';
import type { H3Event } from 'h3';
import type { FetchError } from 'ofetch';
import FormData from 'form-data';
import { readFiles } from 'h3-formidable';
import { checkIsDevAndGetFakeData, createTraceId, isDevMode } from '~/server/utils/tools';

export default eventHandler(async (event: H3Event) => {
  // 從請求的參數中取得 apiPath
  const { apiPath } = event.context.params as { apiPath: string };

  // 如果是開發模式，直接返回模擬數據
  if (isDevMode(event)) {
    // const result = [];
    // for (let i = 0; i < 100; i++) {
    //   const res = await checkIsDevAndGetFakeData(event);
    //   result.push(...res);
    // }
    // return result;
    return await checkIsDevAndGetFakeData(event);
  }

  // 獲取運行時配置，組合目標 API 的 URL
  const config = useRuntimeConfig(event);
  const url = `${config.ApiHost}/${apiPath}`;
  const contentType = event.node.req.headers['content-type'];
  const headers = getRequestHeaders(event);
  const traceparent = createTraceId(); // 創建追蹤 ID

  try {
    // 根據請求的內容類型準備請求主體和額外的標頭
    const { body, additionalHeaders } = await prepareRequestBody(event, contentType, headers);
    // 發送請求到目標 API，並返回結果
    const response = await sendRequest(url, body, { traceparent, ...additionalHeaders });
    setResponseHeaders(event, { 'My-IPs': headers['x-forwarded-for'] });
    return response;
  } catch (error) {
    // 處理請求過程中的錯誤
    handleRequestError(error, url, traceparent);
  }
});

/**
 * 根據內容類型準備請求的主體。
 * @param event - 請求的事件物件。
 * @param contentType - 請求的內容類型。
 * @param headers - 請求的標頭。
 * @returns 準備好的主體和額外的標頭。
 */
async function prepareRequestBody(event: H3Event, contentType: string | undefined, headers: any) {
  // 如果內容類型是 form-data，則準備 FormData 主體
  if (contentType?.includes('form-data')) {
    return prepareFormDataBody(event, headers);
  } else {
    // 否則直接讀取請求主體
    const body = await readBody(event);
    return { body, additionalHeaders: headers };
  }
}

/**
 * 為 form-data 類型的內容準備請求主體。
 * @param event - 請求的事件物件。
 * @param headers - 請求的標頭。
 * @returns 準備好的 form-data 主體和額外的標頭。
 */
async function prepareFormDataBody(event: H3Event, headers: any) {
  const data = new FormData();
  const { userid, authorization } = headers;
  const { files, fields } = await readFiles(event); // 讀取請求中的檔案和欄位

  // 將檔案和欄位附加到 FormData 中
  appendFilesToFormData(data, files);
  appendFieldsToFormData(data, fields);

  return {
    body: data.getBuffer(), // 獲取 FormData 的緩衝區作為請求主體
    additionalHeaders: {
      ...data.getHeaders(), // 包含 FormData 的標頭
      userid: userid as string,
      authorization: authorization as string
    }
  };
}

/**
 * 將檔案附加到 FormData 物件中。
 * @param data - FormData 物件。
 * @param files - 要附加的檔案。
 */
function appendFilesToFormData(data: FormData, files: any) {
  for (const [key, value] of Object.entries(files)) {
    if (Array.isArray(value) && value.length > 0) {
      const [file] = value;
      const fileContent = fs.readFileSync(file.filepath); // 讀取檔案內容
      data.append(key, fileContent, {
        filename: file.originalFilename, // 設定檔案名稱
        contentType: file.mimetype // 設定檔案類型
      });
    }
  }
}

/**
 * 將欄位附加到 FormData 物件中。
 * @param data - FormData 物件。
 * @param fields - 要附加的欄位。
 */
function appendFieldsToFormData(data: FormData, fields: any) {
  for (const [key, value] of Object.entries(fields)) {
    if (Array.isArray(value) && value.length > 0) {
      value.forEach((item: string) => {
        data.append(key, item); // 將欄位值附加到 FormData
      });
    }
  }
}

/**
 * 發送 POST 請求到指定的 URL，並附帶主體和標頭。
 * @param url - 請求的目標 URL。
 * @param body - 請求的主體。
 * @param headers - 請求的標頭。
 * @returns 伺服器的回應。
 */
async function sendRequest(url: string, body: any, headers: any) {
  return await $fetch(url, {
    method: 'POST', // 使用 POST 方法
    body, // 請求主體
    headers // 請求標頭
  });
}

/**
 * 處理請求過程中發生的錯誤。
 * @param error - 錯誤物件。
 * @param url - 請求的 URL。
 * @param traceparent - 請求的追蹤 ID。
 * @throws 格式化的錯誤物件。
 */
function handleRequestError(error: any, url: string, traceparent: string) {
  const err = error as FetchError;
  throw createError({
    status: err.statusCode, // 錯誤狀態碼
    message: err.message, // 錯誤訊息
    data: {
      Code: err.data?.Code, // 自定義錯誤代碼
      Msg: err.data?.Msg, // 錯誤訊息
      ApiUrl: url, // 請求的 URL
      traceparent // 追蹤 ID
    }
  });
}
