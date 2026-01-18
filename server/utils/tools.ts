import process from 'node:process';
import path from 'node:path';
import crypto from 'node:crypto';
import fs from 'node:fs';
import type { H3Event } from 'h3';
import { getRequestHeader, setCookie } from 'h3';
import jwt from 'jsonwebtoken';
import type { AuthUser } from '~/types/interfaces.dto';

/**
 * 生成追蹤 ID
 * @returns 生成的追蹤 ID 字串
 */
export function createTraceId(): string {
  const version = '00';
  const traceId = crypto.randomBytes(16).toString('hex');
  const parentId = crypto.randomBytes(8).toString('hex');
  const traceFlags = '00';

  return `${version}-${traceId}-${parentId}-${traceFlags}`;
}

/**
 * 檢查當前請求是否處於開發模式。
 * @param event - 請求的事件物件。
 * @returns 如果是開發模式則返回 true，否則返回 false。
 */
export function isDevMode(event: H3Event): boolean {
  return event.headers.get('isdev') === 'true';
}

/**
 * 開發模式下獲取模擬資料
 * @param event - 請求的事件物件。
 * @returns 模擬資料
 */
export async function checkIsDevAndGetFakeData(event: H3Event) {
  const isDev = isDevMode(event);

  // 從請求中獲取 API 路徑
  const { apiPath: pathFromParams } = (event.context.params || {}) as { apiPath?: string };
  const apiPath = pathFromParams || event.path;

  // 只在開發環境和開發模式下使用模擬資料
  if (process.env.NODE_ENV === 'development' && isDev) {
    const fileName = `${apiPath.replaceAll('/', '')}.json`;
    const filePath = path.join(process.cwd(), 'fakeData', fileName);
    console.warn('取 mock 資料: ', filePath);

    try {
      const resStr = await checkFileExistOrNotThenReturn(filePath);
      const result = JSON.parse(resStr);

      // 如果是登入 API，則設置 Cookie
      if (event.path === '/api/Authentication/SignIn') {
        saveCookie(event, result.Data);
      }

      return result;
    } catch (error) {
      console.error('讀取模擬資料失敗:', error);
      return {
        Code: '999999',
        Data: null,
        Msg: '讀取模擬資料失敗',
        ResponseTimestamp: Date.now(),
        TimeElapsed: 0
      };
    }
  }
}

/**
 * 檢查文件是否存在，不存在則創建並返回內容
 * @param filePath - 文件路徑
 * @returns 文件內容
 */
export function checkFileExistOrNotThenReturn(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf-8', (err, data) => {
      if (err) {
        if (err.code === 'ENOENT') {
          console.warn(`沒有檔案,已建立: ${filePath}`);
          const newContent = `
{
  "Code": "000000",
  "Data": null,
  "Msg": "",
  "ResponseTimestamp": "",
  "TimeElapsed": ""
}
          `;
          fs.writeFile(filePath, newContent, (writeErr) => {
            if (writeErr) {
              reject(writeErr);
            } else {
              resolve(newContent);
            }
          });
        } else {
          // 處理其他錯誤
          reject(err);
        }
      } else {
        resolve(data);
      }
    });
  });
}

/**
 * 延遲函數
 * @param seconds - 延遲的秒數
 * @returns Promise
 */
export async function delay(seconds: number): Promise<string> {
  return new Promise((resolve) => {
    const _id = setTimeout(() => {
      resolve('');
      clearTimeout(_id);
    }, seconds * 1000);
  });
}

/**
 * 檢查請求是否已通過認證
 * @param event - 請求的事件物件
 * @returns 認證結果
 */
export async function ensureAuth(event: H3Event): Promise<string | jwt.JwtPayload | undefined> {
  const config = useRuntimeConfig(event);
  const authHeaderValue = getRequestHeader(event, 'authorization');

  // 檢查認證頭是否存在
  if (!authHeaderValue) {
    return 'E1';
  }

  // 解析 Bearer token
  const [, token] = authHeaderValue.split('Bearer ');
  if (!token) {
    return 'E1';
  }

  // 驗證 JWT token
  const result = await verifyJwt(token, config.secret);
  if (result === 'error') {
    return 'E2';
  }

  return result;
}

/**
 * 驗證 JWT token
 * @param token - JWT token
 * @param secret - 密鑰
 * @returns 驗證結果
 */
async function verifyJwt(token: string, secret: string): Promise<string | jwt.JwtPayload | undefined> {
  return new Promise((resolve) => {
    jwt.verify(token, secret, (error, decoded) => {
      if (error) {
        resolve('error');
      } else {
        resolve(decoded);
      }
    });
  });
}

/**
 * 儲存認證 Cookie
 * @param event - 請求的事件物件
 * @param user - 使用者資訊
 */
export function saveCookie(event: H3Event, user: AuthUser): void {
  const config = useRuntimeConfig(event);
  const { secret, cookiEexpiresTime: cookieExpiresTime, cookieName, public: cfgPublic } = config;
  const { apiBase } = cfgPublic;

  // 產生 JWT token
  const accessToken = jwt.sign(user, secret, { expiresIn: cookieExpiresTime });

  // 設置 Cookie
  setCookie(event, cookieName, accessToken, {
    httpOnly: false,
    path: apiBase,
    maxAge: cookieExpiresTime,
    secure: process.env.NODE_ENV === 'production', // 生產環境使用 secure
    sameSite: 'strict'
  });
}
