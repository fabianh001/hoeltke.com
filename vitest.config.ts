import { defineConfig } from 'vitest/config';
import { getViteConfig } from 'astro/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  test: {
    projects: [
      // Plain TS unit tests run through Astro's Vite config (content collections, env, etc.).
      await getViteConfig({
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.test.ts', 'server/**/*.test.mjs'],
        },
      }),
      // React component tests run in jsdom with the plain React plugin — avoids Astro's
      // SSR renderer virtual modules, which otherwise load a second `react`/`react-dom`
      // instance and break @testing-library/react's hook dispatch.
      defineConfig({
        plugins: [react()],
        test: {
          name: 'components',
          environment: 'jsdom',
          include: ['src/**/*.test.tsx'],
          setupFiles: ['./src/test-setup.ts'],
        },
      }),
    ],
  },
});
