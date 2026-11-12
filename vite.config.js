import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

/* --- TÍTULOS BONITOS: CONFIGURAÇÃO DINÂMICA E ALTA PERFORMANCE --- */

export default defineConfig(({ command }) => {
  const isCodespaces = process.env.CODESPACES === 'true'

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
      watch: {
        usePolling: isCodespaces,
      },
      strictPort: true,
      hmr: isCodespaces
        ? {
            clientPort: 443, // Força o HMR a usar a porta segura apenas no Codespaces
          }
        : undefined,
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