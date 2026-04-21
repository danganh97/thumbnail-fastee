import { Request, Response } from 'express'
import path from 'path'
import fs from 'fs'

const TEMPLATES_DIR = path.join(__dirname, '../data/templates')

function loadAllTemplates(): unknown[] {
  const results: unknown[] = []

  const walk = (dir: string): void => {
    if (!fs.existsSync(dir)) return
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        try {
          const raw = fs.readFileSync(fullPath, 'utf-8')
          results.push(JSON.parse(raw))
        } catch {
          // skip malformed files
        }
      }
    }
  }

  walk(TEMPLATES_DIR)
  return results
}

export const getTemplates = (_req: Request, res: Response): void => {
  const templates = loadAllTemplates()
  res.json(templates)
}
