import { performance } from 'node:perf_hooks';
import { type EventHandler, type EventHandlerRequest, type H3Event, defineEventHandler } from 'h3';
import type { AuthUser, DataResponse } from '~/types/interfaces.dto';
import { checkIsDevAndGetFakeData, isDevMode } from '~/server/utils/tools';

// 統一的錯誤碼映射，與 apiAuth.ts 保持一致
const ERROR_CODES = {
  'E1': '-000001', // 未提供認證令牌
  'E2': '-000002', // 認證令牌無效或過期
  '-666': '-000003',
  '-888': '-000004'
} as const;

export function defineWrappedResponseHandler<T extends EventHandlerRequest, D>(handler: EventHandler<T, D>): EventHandler<T, D> {
  return defineEventHandler<T>(async (event: H3Event) => {
    // 開發模式下使用模擬資料
    if (isDevMode(event)) {
      return await checkIsDevAndGetFakeData(event);
    }

    const start = performance.now();

    // 初始化回應物件
    const returnObject: DataResponse<unknown> = {
      Data: null,
      Code: '000000',
      Msg: '',
      Timestamp: 0,
      TimeElapsed: 0
    };

    // 處理請求並獲取結果
    const res = await handler(event);
    const path = event.path;

    // 根據路徑處理不同的回應邏輯
    if (path.includes('/api/Authentication/SignIn')) {
      const user = res as AuthUser;

      if (!user.ErrorCode) {
        returnObject.Data = user;
      } else {
        returnObject.Code = ERROR_CODES[user.ErrorCode as keyof typeof ERROR_CODES] || '999999';
      }
    } else if (path.includes('/api/Authentication/session')) {
      if (typeof res !== 'string') {
        returnObject.Data = res;
      } else {
        returnObject.Code = ERROR_CODES[res as keyof typeof ERROR_CODES] || '999999';
      }
    } else if (path.includes('/api/Authorization')) {
      returnObject.Data = res;
    }

    // 計算處理時間並填入回應物件
    const end = performance.now();
    returnObject.Timestamp = getTodayDateTimeString();
    returnObject.TimeElapsed = Math.round(end - start);

    return returnObject;
  });
}

function getTodayDateTimeString() {
  const now = new Date();

  const year = now.getFullYear(); // 4位年
  const month = String(now.getMonth() + 1).padStart(2, '0'); // 月份從0開始，補0至2位
  const day = String(now.getDate()).padStart(2, '0'); // 補0至2位
  const hour = String(now.getHours()).padStart(2, '0'); // 補0至2位
  const minute = String(now.getMinutes()).padStart(2, '0'); // 補0至2位
  const second = String(now.getSeconds()).padStart(2, '0'); // 補0至2位
  const millisecond = String(now.getMilliseconds()).padStart(3, '0'); // 補0至3位

  return Number(`${year}${month}${day}${hour}${minute}${second}${millisecond}`);
}
