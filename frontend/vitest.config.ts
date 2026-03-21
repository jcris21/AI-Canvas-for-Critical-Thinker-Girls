import path from 'path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        branches: 80,
        // Functions threshold is 70% because several module-level callbacks
        // (renderDeleteIcon, delete Control mouseUpHandler, FileReader.onload,
        // SpeechRecognition.onresult) are private closures that only execute
        // inside browser APIs not supported by jsdom. All exported public
        // APIs and component behaviours are covered at 93%+ for statements/lines.
        functions: 70,
        lines: 80,
        statements: 80,
      },
      exclude: [
        'node_modules/**',
        'tests/**',
        '__mocks__/**',
        '*.config.*',
        'index.tsx',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  define: {
    // Provide default value for import.meta.env.VITE_API_URL in tests
    'import.meta.env.VITE_API_URL': JSON.stringify('http://localhost:8000/api/v1'),
  },
});
