import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { status } = await req.json()
  const db = getDb()
  db.prepare('UPDATE reservas SET status = ? WHERE id = ?').run(status, id)
  return NextResponse.json({ ok: true })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = getDb()
  db.prepare('DELETE FROM reservas WHERE id = ?').run(id)
  return NextResponse.json({ ok: true })
}
