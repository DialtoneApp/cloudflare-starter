import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
const args = process.argv.slice(2)
const isWindows = process.platform === 'win32'

function getFlagValue(flag) {
  const index = args.indexOf(flag)
  if (index === -1) return undefined
  return args[index + 1]
}

function parseTargetFlag() {
  const hasLocalFlag = args.includes('--local')
  const hasRemoteFlag = args.includes('--remote')

  if (hasLocalFlag && hasRemoteFlag) {
    console.error('Cannot specify both --local and --remote flags.')
    process.exit(1)
  }

  const envTarget = (process.env.D1_MIGRATIONS_TARGET || process.env.D1_TARGET || '').toLowerCase()

  if (hasLocalFlag || envTarget === 'local') return '--local'
  if (hasRemoteFlag || envTarget === 'remote') return '--remote'
  return null
}

const dbName =
  getFlagValue('--db') ||
  getFlagValue('--database') ||
  process.env.D1_DATABASE ||
  'main'
const migrationsDir = process.env.D1_MIGRATIONS_DIR || join(rootDir, 'migrations')
const migrationsTable = process.env.D1_MIGRATIONS_TABLE || 'schema_migrations'
const persistTo = getFlagValue('--persist-to') || process.env.D1_PERSIST_TO || null
const targetFlag = parseTargetFlag() || '--local'
const dryRun = args.includes('--dry-run')
const debugMode =
  args.includes('--debug') ||
  ['1', 'true', 'yes'].includes((process.env.D1_MIGRATIONS_DEBUG || '').toLowerCase())

if (!existsSync(migrationsDir)) {
  console.error(`No migrations directory found at ${migrationsDir}`)
  process.exit(1)
}

const configuredRunner = process.env.D1_WRANGLER_RUNNER || 'npx'
const runner = configuredRunner === 'npx' && isWindows ? 'npx.cmd' : configuredRunner
const runnerArgs = configuredRunner === 'npx' ? ['--yes', 'wrangler'] : []

function parseWranglerJson(output) {
  if (!output) return null

  try {
    const parsed = JSON.parse(output)
    if (Array.isArray(parsed)) {
      return parsed[parsed.length - 1] || null
    }
    return parsed
  } catch (err) {
    // Wrangler can print warnings before JSON. Fall back to parsing the last JSON line.
  }

  const lines = output
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)

  for (let i = lines.length - 1; i >= 0; i -= 1) {
    try {
      const parsed = JSON.parse(lines[i])
      if (Array.isArray(parsed)) {
        return parsed[parsed.length - 1] || null
      }
      return parsed
    } catch (err) {
      continue
    }
  }

  return null
}

function runWrangler(argsList, label) {
  const finalArgs = configuredRunner === 'npx' ? [...runnerArgs, ...argsList] : argsList
  const displayCommand = `${runner} ${finalArgs.join(' ')}`

  if (debugMode) {
    console.log(`[migrate] running ${displayCommand}${label ? ` (${label})` : ''}`)
  }

  const result = spawnSync(runner, finalArgs, {
    cwd: rootDir,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'inherit'],
  })

  if (result.error) {
    console.error(`Failed to run ${label || 'wrangler'} (${displayCommand}):`, result.error)
    if (result.stdout?.trim()) {
      console.error('wrangler stdout:\n', result.stdout.trim())
    }
    process.exit(1)
  }

  if (result.status !== 0) {
    console.error(`wrangler exited with status ${result.status} while running ${label || displayCommand}`)
    if (result.stdout?.trim()) {
      console.error('wrangler stdout:\n', result.stdout.trim())
    }
    console.error('Command:', displayCommand)
    process.exit(result.status ?? 1)
  }

  return parseWranglerJson(result.stdout)
}

function runD1Execute(extraArgs, label) {
  const targetArgs = targetFlag ? [targetFlag] : []
  const persistenceArgs = targetFlag === '--local' && persistTo ? [`--persist-to=${persistTo}`] : []
  return runWrangler(['d1', 'execute', dbName, ...targetArgs, ...persistenceArgs, ...extraArgs], label)
}

function stripTransactionStatements(sql) {
  const transactionKeywords = new Set(['BEGIN', 'BEGIN TRANSACTION', 'COMMIT', 'COMMIT TRANSACTION'])
  const lines = sql.split(/\r?\n/)
  const kept = lines.filter((line) => {
    const trimmed = line.trim()
    if (!trimmed) return true
    if (trimmed.startsWith('--')) return false
    const normalized = trimmed.replace(/;$/, '').toUpperCase()
    return !transactionKeywords.has(normalized)
  })
  return kept.join('\n').trim()
}

function runRemoteSqlFromTempFile(sql, label) {
  const tmpDir = mkdtempSync(join(tmpdir(), 'd1-migrations-'))
  const tmpFile = join(tmpDir, `${Date.now().toString(36)}.sql`)
  writeFileSync(tmpFile, sql, 'utf-8')

  try {
    runD1Execute([`--file=${tmpFile}`, '--json'], label)
  } finally {
    try {
      rmSync(tmpDir, { recursive: true, force: true })
    } catch (err) {
      if (debugMode) {
        console.warn('[migrate] failed cleaning up temp dir', err)
      }
    }
  }
}

function ensureMigrationsTable() {
  const sql = `CREATE TABLE IF NOT EXISTS ${migrationsTable} (\n    name TEXT PRIMARY KEY,\n    applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))\n  )`
  runD1Execute([`--command=${sql}`, '--json'], 'create migrations table')
}

function fetchAppliedMigrations() {
  const result = runD1Execute([`--command=SELECT name FROM ${migrationsTable} ORDER BY name`, '--json'])
  const rows = (result && (result.results || result.result)) || []
  return new Set(rows.map((row) => row.name))
}

function escapeSql(value) {
  return value.replace(/'/g, "''")
}

function markMigrationApplied(name) {
  const sql = `INSERT OR IGNORE INTO ${migrationsTable} (name) VALUES ('${escapeSql(name)}')`
  runD1Execute([`--command=${sql}`, '--json'], `mark ${name} applied`)
}

function applyMigration(fileName) {
  const filePath = join(migrationsDir, fileName)
  console.log(`\nApplying migration ${fileName}`)

  if (targetFlag !== '--local') {
    const fileSql = readFileSync(filePath, 'utf-8')
    const sql = stripTransactionStatements(fileSql)

    if (!sql) {
      console.warn(`[migrate] ${fileName} has no SQL statements to run after stripping transactions; skipping file`)
      markMigrationApplied(fileName)
      return
    }

    if (debugMode && sql !== fileSql) {
      console.log('[migrate] stripped BEGIN/COMMIT statements for remote execution')
    }

    runRemoteSqlFromTempFile(sql, `apply ${fileName}`)
  } else {
    runD1Execute([`--file=${filePath}`, '--json'], `apply ${fileName}`)
  }

  markMigrationApplied(fileName)
}

function main() {
  const targetDescriptor = targetFlag === '--local' ? 'local' : 'remote'
  console.log(`Running migrations against ${targetDescriptor} D1 database "${dbName}"`)
  ensureMigrationsTable()
  const applied = fetchAppliedMigrations()
  const migrations = readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort()

  const pending = migrations.filter((file) => !applied.has(file))

  if (!pending.length) {
    console.log('No migrations to apply.')
    return
  }

  if (dryRun) {
    console.log('Pending migrations:')
    pending.forEach((file) => console.log(` - ${file}`))
    return
  }

  pending.forEach(applyMigration)
  console.log('\nAll migrations applied successfully!')
}

main()
