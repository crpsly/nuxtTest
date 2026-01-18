import type { NitroFetchOptions } from 'nitropack';
import type { UseFetchOptions } from 'nuxt/app';
import type { FetchError } from 'ofetch';

/**
 * 自訂錯誤介面
 * 定義 API 錯誤回應的資料結構
 */
interface CustomError {
  /** 錯誤訊息 */
  message: string
  /** HTTP 狀態碼 */
  statusCode: number
}

/**
 * HTTP 請求處理 Composable
 *
 * 提供統一的 HTTP 請求介面，包含 GET、POST 方法和自訂 fetch 功能。
 */
export function useHttp() {
  const { $api } = useNuxtApp();

  /**
   * 自訂 fetch 函數
   *
   * 基於 Nuxt 的 useFetch 建立的自訂請求函數，使用專案的 $api 插件。
   * 提供響應式資料、載入狀態和錯誤處理。
   *
   * @template T - 回應資料的型別
   * @param url - 請求的 URL 或返回 URL 的函數
   * @param options - useFetch 的選項配置
   * @returns useFetch 的回應物件，包含 data、pending、error 等響應式狀態
   */
  function useMyFetch<T>(url: string | (() => string), options?: UseFetchOptions<T>) {
    return useFetch<T, FetchError<CustomError>>(url, { ...options, $fetch: $api } as any);
  }

  return {
    /** 自訂 useFetch 函數，提供響應式的 HTTP 請求 */
    useMyFetch,
    /**
     * GET 請求方法
     *
     * @template T - 回應資料的型別
     * @param url - 請求的 URL
     * @param params - 查詢參數物件
     * @returns Promise，解析為型別 T 的資料
     */
    myFetch: $api,
    get: <T>(url: string, params?: Record<string, any>, options?: NitroFetchOptions<any>) => {
      const requestOptions = { ...options, method: 'GET' as const, params };
      return $api<T>(url, requestOptions);
    },
    /**
     * POST 請求方法
     *
     * @template T - 回應資料的型別
     * @param url - 請求的 URL
     * @param body - 請求主體資料
     * @returns Promise，解析為型別 T 的資料
     */
    post: <T>(url: string, body?: Record<string, any>, options?: NitroFetchOptions<any>) => {
      const requestOptions = { ...options, method: 'POST' as const, body };
      return $api<T>(url, requestOptions);
    }
  };
}
