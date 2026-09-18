import { build } from 'esbuild'
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const dist = resolve(root, 'dist')
const assets = resolve(dist, 'assets')

await rm(dist, { recursive: true, force: true })
await mkdir(assets, { recursive: true })

await build({
  entryPoints: [resolve(root, 'src/main.js')],
  outfile: resolve(assets, 'main.js'),
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: ['es2022'],
  minify: true,
  legalComments: 'none',
  sourcemap: false,
  logLevel: 'warning',
})

let html = await readFile(resolve(root, 'index.html'), 'utf8')
html = html
  .replace('./src/styles.css?v=7', './assets/styles.css')
  .replace('./src/main.js?v=7', './assets/main.js')

await writeFile(resolve(dist, 'index.html'), html)
await cp(resolve(root, 'src/styles.css'), resolve(assets, 'styles.css'))
await cp(resolve(root, 'MutualFrame-logo-512.png'), resolve(dist, 'MutualFrame-logo-512.png'))
await cp(resolve(root, 'vercel.json'), resolve(dist, 'vercel.json'))

console.log(`MutualFrame v1.4 production bundle created at ${dist}`)
