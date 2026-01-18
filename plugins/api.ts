import type { DebugInfo } from '~/types/interfaces.dto';

/**
 * HTTP 狀態碼錯誤訊息映射
 */
const HTTP_ERROR_MESSAGES: Record<number, string> = {
  302: '請求已重新導向',
  400: '請求參數錯誤',
  401: '身份驗證失敗，請重新登入',
  403: '無此操作權限',
  404: '請求的資源不存在',
  408: '請求逾時',
  409: '資料衝突，該資源已存在',
  410: '請求的資源已被永久刪除',
  413: '請求內容過大',
  414: '請求 URI 過長',
  415: '不支援的媒體類型',
  422: '請求格式正確，但無法處理',
  429: '請求過於頻繁，請稍後再試',
  500: '伺服器內部錯誤',
  501: '伺服器不支援此功能',
  502: '閘道錯誤',
  503: '服務暫時無法使用',
  504: '閘道逾時',
  505: 'HTTP 版本不受支援'
} as const;

/**
 * API 錯誤代碼常數
 */
const API_ERROR_CODES = {
  TOKEN_EXPIRED: ['-000001', '-000002'] as string[],
  AUTH_FAILED: ['-000003', '-000004'] as string[],
  SUCCESS: '000000'
} as const;

/**
 * 不需要認證的 API 端點
 */
const PUBLIC_ENDPOINTS: string[] = [
  '/api/Authentication/SignIn',
  '/api/Authentication/SignOut'
];

/**
 * Nuxt 插件
 */
export default defineNuxtPlugin(() => {
  let isTokenFailModalShow = false;

  /**
   * 處理認證 token 失效情況
   */
  const handleTokenExpired = async (): Promise<never> => {
    clearNuxtState();

    const confirmed = await confirmWithPromise('提示', 'token 已失效!<br>是否返回登入頁?');
    if (confirmed) {
      await navigateTo('/login');
    }

    const error = new Error('認證 token 不存在，請先登入');
    error.name = 'AbortError';
    throw error;
  };

  /**
   * 處理 API 回應錯誤
   */
  const handleApiResponse = async (
    code: string,
    msg: string,
    responseDebugInfo: DebugInfo
  ): Promise<void> => {
    const config = useRuntimeConfig();
    const { envStr } = config.public as { envStr: string };

    // 處理 token 失效
    if (API_ERROR_CODES.TOKEN_EXPIRED.includes(code)) {
      if (!isTokenFailModalShow) {
        isTokenFailModalShow = true;
        clearNuxtState();

        try {
          const confirmed = await confirmWithPromise('提示', 'token 已失效!<br>返回登入頁?');
          if (confirmed) {
            await navigateTo('/login');
          }
        } finally {
          isTokenFailModalShow = false;
        }
      }

      return;
    }

    // 處理帳號密碼錯誤
    if (API_ERROR_CODES.AUTH_FAILED.includes(code)) {
      showMsgBox('注意', '帳號或密碼有誤!');
      return;
    }

    // 處理其他業務錯誤(Code不是000000)
    if (code !== API_ERROR_CODES.SUCCESS) {
      const { ApiUrl, traceId } = responseDebugInfo;
      let debugMessage = `code: ${code}`;
      debugMessage += `<br>msg: ${msg}`;
      if (!envStr.startsWith('prod')) { debugMessage += `<br>API: ${ApiUrl}`; }
      debugMessage += `<br>traceId: ${traceId}`;
      showMsgBox('發生錯誤', debugMessage, {
        type: 'error',
        customStyle: { 'min-width': '600px' }
      });
    }
  };

  /**
   * 檢查請求是否需要認證
   */
  const isAuthRequired = (url: string): boolean => {
    return !PUBLIC_ENDPOINTS.includes(url);
  };

  const api = $fetch.create({
    async onRequest({ request, options }) {
      const rtCfg = useRuntimeConfig();
      const authCookie = useCookie<string | null>('auth_token');
      const dev = useDev();

      // 設定 API 基礎路徑
      options.baseURL = (rtCfg.public.apiBase as string) || '';

      const reqUrl = request as string;

      // 檢查是否需要認證
      if (isAuthRequired(reqUrl)) {
        if (!authCookie.value) {
          await handleTokenExpired();
        }

        // 設定認證標頭
        const token = `Bearer ${authCookie.value ?? ''}`;
        options.headers.set('authorization', token);
      }

      options.headers.set('isdev', String(dev.value));
    },

    onResponse({ response }) {
      const responseData = response._data;
      const { Code: code, Msg: msg } = responseData;
      if (code) {
        const responseDebugInfo = response._data?.debugInfo as DebugInfo;
        handleApiResponse(code, msg, responseDebugInfo);
      }
    },

    onRequestError({ error }) {
      console.error('網路請求錯誤:', error);
      showMsgBox('網路錯誤', '請確認網路連線是否正常', { type: 'error' });
    },

    onResponseError({ response }) {
      const config = useRuntimeConfig();
      const { envStr } = config.public as { envStr: string };

      let errorMessage = `${response.status}: ${HTTP_ERROR_MESSAGES[response.status]}` || '異常問題，請聯繫管理員！';

      if (!response._data?.message) {
        errorMessage = response._data.message;
      }

      const debugInfo = response._data?.data?.debugInfo as DebugInfo;
      if (debugInfo) {
        const { ApiUrl, traceId } = debugInfo;
        if (!envStr.startsWith('prod')) { errorMessage += `<br>API: ${ApiUrl}`; }
        errorMessage += `<br>traceId: ${traceId}`;
      }

      showMsgBox('錯誤', errorMessage, { type: 'error', customStyle: { 'min-width': '600px' } });
    }
  });

  // 提供給 useNuxtApp().$api 使用
  return {
    provide: {
      api
    }
  };
});

