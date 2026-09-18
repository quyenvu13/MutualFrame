import http from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = fileURLToPath(new URL('..', import.meta.url))
const root = resolve(projectRoot, 'dist')
const port = Number(process.env.PORT || 4173)
const host = process.env.HOST || '127.0.0.1'
const upstream = 'https://studio.genlayer.com/api'

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
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

async function proxyRpc(req, res) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const body = Buffer.concat(chunks)
  const response = await fetch(upstream, {
    method: req.method || 'POST',
    headers: {
      'content-type': req.headers['content-type'] || 'application/json',
      'accept': 'application/json',
      'user-agent': req.headers['user-agent'] || 'Mozilla/5.0 MutualFrame/1.4',
    },
    body: body.length ? body : undefined,
  })
  const payload = Buffer.from(await response.arrayBuffer())
  res.writeHead(response.status, {
    'content-type': response.headers.get('content-type') || 'application/json',
    'cache-control': 'no-store',
  })
  res.end(payload)
}

const server = http.createServer(async (req, res) => {
  try {
    if ((req.url || '').split('?')[0] === '/api/rpc') {
      await proxyRpc(req, res)
      return
    }

    let file = safePath(req.url)
    if (!file) return res.writeHead(403).end('Forbidden')

    let info
    try {
      info = await stat(file)
    } catch {
      return res.writeHead(404).end('Not found')
    }
    if (info.isDirectory()) file = resolve(file, 'index.html')

    const body = await readFile(file)
    res.writeHead(200, {
      'Content-Type': types[extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    })
    res.end(body)
  } catch (error) {
    res.writeHead(502).end('Proxy or server error')
    console.error(error)
  }
})

server.listen(port, host, () => {
  console.log(`MutualFrame local server: http://${host}:${port}`)
  console.log('Production bundle + same-origin StudioNet RPC proxy are active.')
})
