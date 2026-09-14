import http from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const port = Number(process.env.PORT || 4173)
const host = process.env.HOST || '127.0.0.1'

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
}

function safePath(urlPath) {
  const pathname = decodeURIComponent((urlPath || '/').split('?')[0])
  const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '')
  const full = resolve(root, relative)
  const rootPrefix = root.endsWith(sep) ? root : root + sep
  if (full !== resolve(root, 'index.html') && !full.startsWith(rootPrefix)) return null
  return full
}

const server = http.createServer(async (req, res) => {
  try {
    let file = safePath(req.url)
    if (!file) {
      res.writeHead(403).end('Forbidden')
      return
    }

    let info
    try {
      info = await stat(file)
    } catch {
      res.writeHead(404).end('Not found')
      return
    }
    if (info.isDirectory()) file = resolve(file, 'index.html')

    const body = await readFile(file)
    res.writeHead(200, {
      'Content-Type': types[extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    })
    res.end(body)
  } catch (error) {
    res.writeHead(500).end('Server error')
    console.error(error)
  }
})

server.listen(port, host, () => {
  console.log(`MutualFrame local server: http://localhost:${port}`)
  console.log('Press Ctrl+C to stop.')
})
