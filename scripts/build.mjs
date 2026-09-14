import { access, cp, mkdir, rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const dist = resolve(root, 'dist')

await rm(dist, { recursive: true, force: true })
await mkdir(dist, { recursive: true })

for (const item of ['index.html', 'vercel.json']) {
  await cp(resolve(root, item), resolve(dist, item))
}

await cp(resolve(root, 'src'), resolve(dist, 'src'), { recursive: true })

const publicDir = resolve(root, 'public')
try {
  await access(publicDir)
  await cp(publicDir, resolve(dist, 'public'), { recursive: true })
} catch {
  // public/ is optional; this project currently has no standalone public assets.
}

console.log(`MutualFrame production bundle created at ${dist}`)
