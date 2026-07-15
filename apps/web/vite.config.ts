import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

const here = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
	plugins: [tailwindcss()],
	resolve: {
		alias: {
			'@': path.resolve(here, './src'),
		},
	},
	server: {
		proxy: {
			'/api': {
				target: 'http://localhost:3001',
				changeOrigin: true,
			},
		},
	},
	build: {
		outDir: 'dist',
		emptyOutDir: true,
	},
})
