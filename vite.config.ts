import { defineConfig, Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';
import { createStreamProxyMiddleware } from './server/streamProxy';

function streamProxyPlugin(): Plugin {
  return {
    name: 'stream-proxy-plugin',
    configureServer(server) {
      server.middlewares.use(createStreamProxyMiddleware());
    },
    configurePreviewServer(server) {
      server.middlewares.use(createStreamProxyMiddleware());
    }
  };
}

export default defineConfig({
  plugins: [vue(), streamProxyPlugin()],
  server: {
    port: 3000,
    host: true
  },
  preview: {
    port: 3000,
    host: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          hlsjs: ['hls.js']
        }
      }
    }
  },
  css: {
    postcss: './postcss.config.js'
  }
});
