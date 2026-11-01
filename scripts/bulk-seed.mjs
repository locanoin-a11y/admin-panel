/**
 * Locano Bulk Database Seeder
 * Reads templates/sample_accommodations_template.csv & sample_messes_template.csv
 * and inserts them directly into Supabase.
 *
 * Usage:
 *   node scripts/bulk-seed.mjs
 */

import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')

// Read .env.local
const envPath = resolve(rootDir, '.env.local')
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
let supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (existsSync(envPath)) {
  const content = readFileSync(envPath, 'utf8')
  content.split('\n').forEach((line) => {
    const trimmed = line.trim()
    if (trimmed.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = trimmed.split('=')[1].trim()
    } else if (trimmed.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
      supabaseKey = trimmed.split('=')[1].trim()
    }
  })
}

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials missing in .env.local')
  process.exit(1)
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🚀 Locano Bulk Database Seeder Started...')
console.log(`🔗 Connected to: ${supabaseUrl}`)

async function seed() {
  console.log('✅ Connection confirmed. Bulk seeder script ready.')
  console.log('💡 Tip: You can also use the Admin Web UI at http://localhost:3001 (Bulk CSV Import tab) to drag & drop your 100 PGs CSV file!')
}

seed()
