import { buildMensagem, buildWaLink, ReservaPayload } from './whatsapp-utils'

export { buildMensagem, buildWaLink }
export type { ReservaPayload }

export async function notificarWhatsApp(payload: ReservaPayload): Promise<{ ok: boolean; link?: string }> {
  const mensagem = buildMensagem(payload)

  const apiUrl = process.env.EVOLUTION_API_URL
  const apiKey = process.env.EVOLUTION_API_KEY
  const instance = process.env.EVOLUTION_INSTANCE
  const donoTel = process.env.DONO_WHATSAPP

  if (apiUrl && apiKey && instance && donoTel) {
    try {
      const numero = donoTel.replace(/\D/g, '')
      const res = await fetch(`${apiUrl}/message/sendText/${instance}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: apiKey },
        body: JSON.stringify({ number: numero, text: mensagem }),
      })
      if (res.ok) return { ok: true }
    } catch {
      // fallback to wa.me
    }
  }

  const link = donoTel ? buildWaLink(donoTel, mensagem) : undefined
  return { ok: false, link }
}
