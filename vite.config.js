import { fileURLToPath, URL } from 'node:url'
const path = require('path');

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

import federation from '@originjs/vite-plugin-federation'
import { polyfillNode } from "esbuild-plugin-polyfill-node";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 8081,
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'public', 'index.html'),
      },
    },
  },
  plugins: [
    vue(
      {
        template: {transformAssetUrls}
      }
    ),
    // https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vite-plugin
    vuetify({
      autoImport: true,
    //   styles: {
    //     configFile: 'src/styles/settings.scss',
    //   },
    }),
    federation({
      name: "livestream",
      filename: "livestreamApp.js",
      exposes: {
        "./VideoChat": "./src/components/VideoChat.vue",
      },
      shared: ["vue"],
    }),
    polyfillNode({ buffer: true })
  ],
  define: { 'process.env': {}},
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
    extensions: [
      '.js',
      '.json',
      '.jsx',
      '.mjs',
      '.ts',
      '.tsx',
      '.vue',
    ],
  }
})