export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createClient } from '@libsql/client'

function getClient() {
  return createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })
}

async function initEstoque(client: ReturnType<typeof getClient>) {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS estoque (
      produto_id TEXT PRIMARY KEY,
      quantidade INTEGER NOT NULL DEFAULT 0,
      atualizado_em TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `)
}

export async function GET() {
  try {
    const client = getClient()
    await initEstoque(client)
    const result = await client.execute('SELECT * FROM estoque')
    return NextResponse.json(result.rows)
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const { produto_id, quantidade } = await req.json()
    const client = getClient()
    await initEstoque(client)
    await client.execute({
      sql: `INSERT INTO estoque (produto_id, quantidade) VALUES (?, ?)
            ON CONFLICT(produto_id) DO UPDATE SET quantidade = ?, atualizado_em = datetime('now', 'localtime')`,
      args: [produto_id, quantidade, quantidade]
    })
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
