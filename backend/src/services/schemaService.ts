import { QueryTypes } from 'sequelize'
import { sequelize } from '../lib/sequelize'

let schemaChecked = false

export async function ensureSchema(): Promise<void> {
  if (schemaChecked) return

  const expected = ['users', 'editors', 'share_snapshots']
  const rows = await sequelize.query<{ table_name?: string; TABLE_NAME?: string }>(
    `SELECT table_name AS table_name
     FROM information_schema.tables
     WHERE table_schema = DATABASE()
       AND table_name IN (:tableNames)`,
    {
      replacements: { tableNames: expected },
      type: QueryTypes.SELECT,
    },
  )
  const found = new Set(
    rows
      .map(row => row.table_name ?? row.TABLE_NAME)
      .filter((name): name is string => typeof name === 'string' && name.length > 0),
  )
  const missing = expected.filter(name => !found.has(name))
  if (missing.length > 0) {
    throw new Error(
      `Database schema is missing tables: ${missing.join(', ')}. Run backend migration command before starting.`,
    )
  }

  schemaChecked = true
}
