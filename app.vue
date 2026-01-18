<script setup lang="ts">
/**
 * app.vue - 應用程式主入口檔案
 * 此文件是整個 Nuxt 3 應用程式的根組件，所有路由都會在此組件內渲染
 */

const router = useRouter();
const MAX = ref(10);
const keepAliveComponentNames = ref<string[]>([]);

/**
 * 取得最後一個path
 */
function getLastPathSegment(path: string): string {
  const segments = path.split('/').filter(Boolean); // 避免空字串
  return segments[segments.length - 1] || '';
}
/**
 * 遞歸遍歷路由配置，找出所有 meta.keep === true 的路由，
 * 並收集它們的組件
 */
function collectKeepAliveComponents(): string[] {
  const paths = new Set<string>(); // 使用 Set 避免重複

  for (const route of router.options.routes) {
    if (route.meta?.keep === true && route.path) {
      const path = getLastPathSegment(route.path as string);
      paths.add(path);
    }
  }
  return Array.from(paths);
}

keepAliveComponentNames.value = collectKeepAliveComponents();
</script>

<template>
  <NuxtLayout>
    <NuxtPage :keepalive="{ include: keepAliveComponentNames, max: MAX }" />
  </NuxtLayout>
</template>

<style lang="scss">
body {
  margin: 0; /* 移除頁面邊距，防止出現滾動條 */
}
</style>

