import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: '0.0.0.0', // Ensure the server is accessible externally
    allowedHosts: [
      '5173-i176oyzli1pbrqn36rz86-d554b93c.manus.computer' // Add the public proxied domain
    ],
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
})

