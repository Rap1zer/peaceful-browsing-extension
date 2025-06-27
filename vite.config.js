import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        background: resolve(__dirname, 'src/typescript/background.ts'),
        content: resolve(__dirname, 'src/typescript/content.ts'),
        blockKeywords: resolve(__dirname, 'src/typescript/blockKeywords.ts'),
        main: resolve(__dirname, 'src/typescript/main.ts'),
        pause: resolve(__dirname, 'src/typescript/pause.ts'),

        // HTML pages
        mainHtml: resolve(__dirname, 'src/main.html'),
        blockKeywordsHtml: resolve(__dirname, 'src/block-keywords.html'),
      },
      output: {
        entryFileNames: '[name].js',
        assetFileNames: '[name][extname]'
      },
    },
    minify: 'false'
  },
});
