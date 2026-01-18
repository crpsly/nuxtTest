export enum Action {
  ADD = 'ADD', // 新增
  UPDATE = 'UPDATE' // 修改
}

export interface ShareData<T> {
  from?: string
  action?: Action
  data?: T
  reloadData?: boolean
};

export interface BaseResponse {
  Code: string
  Msg: string
  Timestamp: number
  TimeElapsed: number
}

export interface ReadResponse<T = any> extends BaseResponse {
  Data: T
}

export interface DataResponse<T = any> {
  Data: T | null
  Code: string
  Msg: string
  Timestamp: number
  TimeElapsed: number
}

export interface DebugInfo {
  ApiUrl: string
  traceId: string
}

export interface AuthUser {
  userId: string
  userName: string
  token?: string
  ErrorCode?: string
  [key: string]: any
}
