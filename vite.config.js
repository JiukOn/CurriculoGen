import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

/* --- TÍTULOS BONITOS: CONFIGURAÇÃO DINÂMICA E ALTA PERFORMANCE --- */

export default defineConfig(({ command }) => {
  return {
    // TÍTULOS BONITOS: TRATAMENTO DE CAMINHO BASE
    // Se for 'build', usa o subdiretório do GitHub Pages. Se for desenvolvimento, usa a raiz.
    base: command === 'build' ? '/CurriculoGen/' : '/',

    plugins: [react()],

    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },

    server: {
      port: 5173,
      open: true,
      // Habilita polling para garantir que mudanças no Iframe reflitam no Codespaces
      watch: {
        usePolling: true,
      },
      // Necessário para o redirecionamento de portas do GitHub Dev
      strictPort: true,
      hmr: {
        clientPort: 443, // Força o HMR a usar a porta segura do Codespaces
      },
    },

    /* --- TÍTULOS BONITOS: OTIMIZAÇÃO DE BUILD --- */
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
      rollupOptions: {
        output: {
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        },
      },
      chunkSizeWarningLimit: 1200,
    },

    publicDir: 'public',
  }
})