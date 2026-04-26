import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
const persistDir = '.wrangler/state'
const distDir = join(rootDir, 'dist')
const publicDir = join(rootDir, 'src/public')
const isWindows = process.platform === 'win32'
const npxCommand = isWindows ? 'npx.cmd' : 'npx'

const buildResult = spawnSync(npxCommand, ['vite', 'build'], {
  cwd: rootDir,
  stdio: 'inherit',
  env: process.env,
})

if (buildResult.status !== 0) {
  process.exit(buildResult.status ?? 1)
}

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

const wranglerResult = spawnSync(
  npxCommand,
  ['wrangler', 'dev', '--port', '8787', '--persist-to', persistDir],
  {
    cwd: rootDir,
    stdio: 'inherit',
    env: process.env,
  }
)

process.exit(wranglerResult.status ?? 0)
