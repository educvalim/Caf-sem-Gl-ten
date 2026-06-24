import { NextResponse } from 'next/server'
import { createClient } from '@libsql/client'

function getClient() {
  return createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { status } = await req.json()
  const client = getClient()
  await client.execute({ sql: 'UPDATE reservas SET status = ? WHERE id = ?', args: [status, id] })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const client = getClient()
  await client.execute({ sql: 'DELETE FROM reservas WHERE id = ?', args: [id] })
  return NextResponse.json({ ok: true })
}
