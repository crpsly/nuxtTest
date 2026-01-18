import { useState } from 'nuxt/app';

export const useDev = () => useState<boolean>('dev', () => false);
