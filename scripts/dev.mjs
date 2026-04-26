import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { spawn, spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
const persistDir = '.wrangler/state'
const distDir = join(rootDir, 'dist')
const publicDir = join(rootDir, 'src/public')
const isWindows = process.platform === 'win32'
const npxCommand = isWindows ? 'npx.cmd' : 'npx'

mkdirSync(distDir, { recursive: true })
if (existsSync(publicDir)) {
  cpSync(publicDir, distDir, { recursive: true, force: true })
}

const migrateResult = spawnSync(
  process.execPath,
  [join(rootDir, 'scripts/run-migrations.mjs'), '--local', '--persist-to', persistDir],
  {
    cwd: rootDir,
    stdio: 'inherit',
  }
)

if (migrateResult.status !== 0) {
  process.exit(migrateResult.status ?? 1)
}

const children = []
let shuttingDown = false

function start(name, command, args) {
  const child = spawn(command, args, {
    cwd: rootDir,
    stdio: 'inherit',
    env: process.env,
  })

  child.on('exit', (code, signal) => {
    if (shuttingDown) return
    shuttingDown = true

    for (const runningChild of children) {
      if (runningChild !== child && !runningChild.killed) {
        runningChild.kill('SIGTERM')
      }
    }

    if (signal) {
      console.error(`${name} exited with signal ${signal}`)
      process.exit(1)
    }

    process.exit(code ?? 0)
  })

  children.push(child)
}

function shutdown(signal) {
  if (shuttingDown) return
  shuttingDown = true

  for (const child of children) {
    if (!child.killed) {
      child.kill(signal)
    }
  }

  setTimeout(() => {
    for (const child of children) {
      if (!child.killed) {
        child.kill('SIGKILL')
      }
    }
  }, 5_000).unref()
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

start('vite', npxCommand, ['vite'])
start('wrangler', npxCommand, ['wrangler', 'dev', '--port', '8787', '--persist-to', persistDir])
