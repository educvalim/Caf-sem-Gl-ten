export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getReservas, insertReserva } from '@/lib/db'
import { notificarWhatsApp } from '@/lib/whatsapp'

export async function GET() {
  try {
    const reservas = await getReservas()
    return NextResponse.json(reservas)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { nome, telefone, quantidade, itens, total, modalidade, rua, numero, complemento, bairro } = body

    if (!nome || !telefone || !quantidade || !modalidade) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando.' }, { status: 400 })
    }
    if (modalidade === 'entrega' && (!rua || !numero || !bairro)) {
      return NextResponse.json({ error: 'Endereço incompleto.' }, { status: 400 })
    }

    const id = await insertReserva(nome, telefone, quantidade, modalidade, rua || null, numero || null, complemento || null, bairro || null)

    const endereco = modalidade === 'entrega'
      ? `${rua}, ${numero}${complemento ? ' — ' + complemento : ''}, ${bairro}, Joinville — SC`
      : undefined

    const { ok, link } = await notificarWhatsApp({ nome, telefone, quantidade, itens, total, modalidade, endereco })

    return NextResponse.json({ id: id?.toString(), whatsappOk: ok, whatsappLink: link }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
