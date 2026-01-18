import type { DataList } from './interface.dto';
import type { ReadResponse } from '~/types/interfaces.dto';
import type { AsyncData, NuxtError } from '#app';

export function useApis() {
  const { myFetch } = useHttp();

  async function middleware<T = any>(asyncData: AsyncData<any, any>): Promise<Awaited<T> | null> {
    await asyncData.execute();

    if (asyncData.error) {
      // handle Error
    }

    return toRaw(asyncData.data?.value);
  }

  const urls = {
    demoDataList: '/api/Demo/Data/List'
  };

  // Payloads
  // const payloadGetSettings = ref();

  // AsyncDatas
  const asyncGetDemoDataList = useAsyncData(() => myFetch(urls.demoDataList, { method: 'post', body: {} }), { immediate: false });

  async function getDataList(): Promise<ReadResponse<DataList[]> | null> {
    return await middleware(asyncGetDemoDataList);
  }

  return {
    getDataList
  };
}
