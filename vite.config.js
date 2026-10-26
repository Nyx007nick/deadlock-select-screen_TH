import { defineConfig, loadEnv } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  if (env.ELEVENLABS_API_KEY) {
    process.env.ELEVENLABS_API_KEY ??= env.ELEVENLABS_API_KEY
  }

  return {
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] })
    ],
    base: "/deadlock-select-screen_TH/"
  }
})
