import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['./index.ts'],
  outDir: 'dist',
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: true,
  target: 'esnext',
  shims: false,
  skipNodeModulesBundle: true,
  watch: process.env.NODE_ENV === 'development',
  external: [],
});
