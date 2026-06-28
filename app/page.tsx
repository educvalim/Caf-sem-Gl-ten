'use client'
import { useState, useEffect, useRef } from 'react'
import { gerarPixCopiaCola } from '@/lib/pix'

const PIX_CHAVE = 'grasivalim14@gmail.com'
const PIX_NOME = 'Cafe sem Gluten'
const PIX_CIDADE = 'Joinville'

const ITENS = [
  { id: 'paozinho-sem-gluten', nome: 'Pãozinho sem Glúten', desc: 'Artesanal, sem glúten', foto: '/iconepao.jpg', preco: 20 },
  { id: 'paozinho-doce', nome: 'Pãozinho Doce', desc: 'Artesanal, doce', foto: '/iconedoce.jpg', preco: 25 },
  { id: 'docinho-de-natal', nome: 'Docinho de Natal', desc: 'Edição especial de natal', foto: '/iconenatal.jpg', preco: 15 },
]

const C = {
  escuro: '#763F21',
  medio: '#D2A27A',
  claro: '#D8C2A7',
  creme: '#F8E1CF',
  dourado: '#A8650A',
}

export default function Home() {
  const [step, setStep] = useState<'form' | 'success'>('form')
  const [modo, setModo] = useState<'retirada' | 'entrega'>('retirada')
  const [qtds, setQtds] = useState<Record<string, number>>({ 'paozinho-sem-gluten': 0, 'paozinho-doce': 0, 'docinho-de-natal': 0 })
  const [estoque, setEstoque] = useState<Record<string, number>>({})
  const [waLink, setWaLink] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [resumo, setResumo] = useState<Record<string, string>>({})
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [totalPago, setTotalPago] = useState(0)
  const [pixCopiaMsg, setPixCopiaMsg] = useState('')
  const [copiado, setCopiado] = useState(false)
  const qrRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    fetch('/api/estoque').then(r => r.json()).then((rows: {produto_id: string, quantidade: number}[]) => {
      const map: Record<string, number> = {}
      rows.forEach(r => { map[r.produto_id] = r.quantidade })
      setEstoque(map)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (step === 'success' && totalPago > 0 && qrRef.current) {
      const pixStr = gerarPixCopiaCola(PIX_CHAVE, totalPago, PIX_NOME, PIX_CIDADE)
      setPixCopiaMsg(pixStr)
      import('qrcode').then(QRCode => {
        QRCode.toCanvas(qrRef.current!, pixStr, { width: 200, margin: 1 }, () => {})
      })
    }
  }, [step, totalPago])

  function changeQty(id: string, d: number) {
    const max = estoque[id] ?? 99
    setQtds(q => ({ ...q, [id]: Math.max(0, Math.min(max, (q[id] ?? 0) + d)) }))
  }

  const totalItens = Object.values(qtds).reduce((s, v) => s + v, 0)

  function validate(data: Record<string, string>) {
    const errs: Record<string, string> = {}
    if (!data.nome.trim()) errs.nome = 'Informe seu nome.'
    if (!/^\d{10,11}$/.test(data.telefone.replace(/\D/g, ''))) errs.telefone = 'Informe um telefone válido.'
if (totalItens === 0) errs.itens = 'Selecione ao menos 1 item.'
    if (modo === 'entrega') {
      if (!data.rua.trim()) errs.rua = 'Informe a rua.'
      if (!data.numero.trim()) errs.numero = 'Informe o número.'
      if (!data.bairro.trim()) errs.bairro = 'Informe o bairro.'
    }
    return errs
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const data: Record<string, string> = {
      nome: fd.get('nome') as string,
      telefone: fd.get('telefone') as string,
      email: fd.get('email') as string,
      rua: fd.get('rua') as string ?? '',
      numero: fd.get('numero') as string ?? '',
      complemento: fd.get('complemento') as string ?? '',
      bairro: fd.get('bairro') as string ?? '',
    }
    const errs = validate(data)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    const itensPedido = ITENS.filter(i => qtds[i.id] > 0).map(i => `${i.nome} x${qtds[i.id]} (R$ ${(i.preco * qtds[i.id]).toFixed(2).replace('.', ',')})`).join(', ')
    const totalValor = ITENS.reduce((s, i) => s + qtds[i.id] * i.preco, 0)

    setLoading(true)
    try {
      const res = await fetch('/api/reservas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, quantidade: totalItens, itens: itensPedido, total: totalValor, modalidade: modo, qtds }),
      })
      let json: Record<string, unknown> = {}
      try { json = await res.json() } catch { alert('Erro de comunicação com o servidor.'); return }
      if (!res.ok) { alert(json.error ?? 'Erro desconhecido.'); return }
      if (json.whatsappLink) setWaLink(json.whatsappLink as string)
      setTotalPago(totalValor)
      setResumo({
        nome: data.nome,
        itens: itensPedido,
        modalidade: modo,
        endereco: modo === 'entrega'
          ? `${data.rua}, ${data.numero}${data.complemento ? ' — ' + data.complemento : ''}, ${data.bairro}, Joinville — SC`
          : '',
      })
      setStep('success')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'success') {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 relative" style={{ background: C.creme }}>
        <video autoPlay muted loop playsInline className="fixed inset-0 w-full h-full" style={{ objectFit: 'cover', zIndex: 0 }}>
          <source src="/videos/hero.mp4" type="video/mp4" />
        </video>
        <div className="rounded-2xl shadow-sm p-8 w-full max-w-md text-center relative" style={{ background: 'white', border: `1px solid ${C.claro}`, zIndex: 2 }}>
          <div className="text-6xl mb-4">🍞</div>
          <h2 className="text-2xl mb-1" style={{ fontFamily: 'Godger, sans-serif', color: C.escuro }}>Reserva confirmada!</h2>
          <p className="text-sm mb-6" style={{ color: C.medio }}>Entraremos em contato para confirmar.</p>

          <div className="rounded-xl p-4 text-left text-sm mb-6 space-y-2" style={{ background: C.creme }}>
            <div className="flex justify-between">
              <span style={{ color: C.medio }}>Nome</span>
              <span className="font-medium" style={{ color: C.escuro }}>{resumo.nome}</span>
            </div>
            <div className="pt-2" style={{ borderTop: `1px solid ${C.claro}` }}>
              <p className="mb-1" style={{ color: C.medio }}>Itens</p>
              <p className="font-medium" style={{ color: C.escuro }}>{resumo.itens}</p>
            </div>
            <div className="flex justify-between pt-2" style={{ borderTop: `1px solid ${C.claro}` }}>
              <span style={{ color: C.medio }}>Modalidade</span>
              <span className="font-medium capitalize" style={{ color: C.escuro }}>{resumo.modalidade}</span>
            </div>
            {resumo.endereco && (
              <div className="pt-2" style={{ borderTop: `1px solid ${C.claro}` }}>
                <p className="mb-1" style={{ color: C.medio }}>Endereço</p>
                <p className="font-medium" style={{ color: C.escuro }}>{resumo.endereco}</p>
              </div>
            )}
          </div>

          {/* Bloco PIX */}
          <div className="rounded-xl p-4 mb-4 text-center" style={{ background: C.creme, border: `1px solid ${C.claro}` }}>
            <p className="text-sm font-medium mb-1" style={{ color: C.escuro }}>💰 Pague via PIX</p>
            <p className="text-xs mb-3" style={{ color: C.medio }}>Escaneie o QR code ou copie a chave</p>
            <div className="flex justify-center mb-3">
              <canvas ref={qrRef} style={{ borderRadius: 8, border: `1px solid ${C.claro}` }} />
            </div>
            <p className="text-lg font-medium mb-3" style={{ color: C.dourado }}>
              Total: R$ {totalPago.toFixed(2).replace('.', ',')}
            </p>
            <button
              onClick={() => { navigator.clipboard.writeText(pixCopiaMsg); setCopiado(true); setTimeout(() => setCopiado(false), 3000) }}
              className="w-full py-2.5 rounded-xl text-sm font-medium transition-colors"
              style={{ background: copiado ? '#22c55e' : C.escuro, color: C.creme }}>
              {copiado ? '✓ Chave PIX copiada!' : '📋 Copiar chave PIX (copia e cola)'}
            </button>
            <p className="text-xs mt-2" style={{ color: C.medio }}>
              Após pagar, envie o comprovante pelo WhatsApp abaixo
            </p>
          </div>

          {waLink && (
            <a href={waLink} target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl py-3 px-6 text-sm font-medium mb-3 transition-opacity hover:opacity-90"
              style={{ background: '#25D366', color: 'white' }}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Confirmar pelo WhatsApp
            </a>
          )}

          <button
            onClick={() => { setStep('form'); setQtds({ 'paozinho-sem-gluten': 0, 'paozinho-doce': 0, 'docinho-de-natal': 0 }); setModo('retirada'); setErrors({}); setWaLink(null) }}
            className="text-sm underline" style={{ color: C.medio }}>
            Fazer nova reserva
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen relative">


      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 50, background: 'rgba(0,0,0,0.85)' }} onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="Foto do produto" className="max-w-full max-h-full rounded-2xl shadow-2xl" style={{ maxHeight: '85vh', maxWidth: '90vw' }} />
          <button className="absolute top-4 right-4 text-white text-3xl leading-none" style={{ textShadow: '0 0 8px #000' }} onClick={() => setLightbox(null)}>✕</button>
        </div>
      )}

      {/* Hero cobrindo toda a página */}
      <div className="fixed inset-0" style={{ zIndex: 0 }}>
        <img src="/farinhafeliz.jpg" alt="Pães sem glúten"
          className="w-full h-full"
          style={{ objectFit: 'cover', objectPosition: 'center top' }} />
        <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.30)' }} />
      </div>

      {/* Título fixo no topo */}
      <div className="relative text-center pt-10 pb-6 px-4" style={{ zIndex: 2 }}>
        <h1 className="text-6xl drop-shadow-lg" style={{ fontFamily: 'var(--font-rye), serif', color: '#FDF6EC', letterSpacing: '0.03em' }}>Café sem Glúten</h1>
        <p className="text-lg mt-3" style={{ color: '#E8D5B0', letterSpacing: '0.08em' }}>Reserve seu pão fresquinho</p>
        <p className="text-xs italic mt-1" style={{ color: '#E8D5B0' }}>Por Grasi de Moura Valim</p>
      </div>

      <div className="relative flex justify-center p-4" style={{ zIndex: 2 }}>
        <div className="w-full max-w-md space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* Seus dados */}
            <div className="rounded-2xl p-5 shadow-sm" style={{ background: 'white', border: `1px solid ${C.claro}` }}>
              <p className="text-xs font-medium uppercase tracking-wider mb-4" style={{ color: '#000' }}>👤 Seus dados</p>
              <div className="space-y-3">
                <Field label="Nome completo" error={errors.nome}>
                  <input name="nome" type="text" placeholder="Ex: Maria Silva" className={inp(!!errors.nome)} />
                </Field>
                <Field label="Telefone / WhatsApp" error={errors.telefone}>
                  <input name="telefone" type="tel" placeholder="(47) 99999-9999" className={inp(!!errors.telefone)} />
                </Field>
              </div>
            </div>

            {/* Pedido */}
            <div className="rounded-2xl p-5 shadow-sm" style={{ background: 'white', border: `1px solid ${C.claro}` }}>
              <p className="text-xs font-medium uppercase tracking-wider mb-4" style={{ color: '#000' }}>🍞 Seu pedido</p>
              <div className="space-y-3">
                {ITENS.map((item, i) => {
                  const disp = estoque[item.id] ?? null
                  const esgotado = disp !== null && disp === 0
                  return (
                  <div key={item.id} style={{ opacity: esgotado ? 0.5 : 1 }}>
                    {i > 0 && <div className="mb-3" style={{ borderTop: `1px solid ${C.creme}` }} />}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={item.foto} alt={item.nome}
                          onClick={() => setLightbox(item.foto)}
                          className="rounded-xl cursor-pointer hover:opacity-80 transition-opacity"
                          style={{ width: 52, height: 52, objectFit: 'cover', border: `2px solid ${C.claro}` }} />
                        <div>
                          <p className="text-sm font-medium" style={{ color: C.escuro }}>{item.nome}</p>
                          <p className="text-xs" style={{ color: C.medio }}>{item.desc}</p>
                          <p className="text-sm font-medium mt-0.5" style={{ color: C.dourado }}>R$ {item.preco.toFixed(2).replace('.', ',')}</p>
                          {disp !== null && (
                            <p className="text-xs mt-0.5" style={{ color: esgotado ? '#ef4444' : '#16a34a' }}>
                              {esgotado ? 'Esgotado' : `${disp} disponível${disp !== 1 ? 'eis' : ''}`}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center rounded-xl overflow-hidden" style={{ border: `1px solid ${C.claro}`, opacity: esgotado ? 0.4 : 1 }}>
                        <button type="button" onClick={() => changeQty(item.id, -1)} disabled={esgotado}
                          className="w-9 h-9 flex items-center justify-center text-xl font-light transition-colors hover:opacity-80"
                          style={{ background: C.creme, color: C.escuro }}>−</button>
                        <span className="w-10 text-center text-base font-medium" style={{ color: C.escuro }}>{qtds[item.id]}</span>
                        <button type="button" onClick={() => changeQty(item.id, 1)} disabled={esgotado}
                          className="w-9 h-9 flex items-center justify-center text-xl font-light transition-colors hover:opacity-80"
                          style={{ background: C.creme, color: C.escuro }}>+</button>
                      </div>
                    </div>
                  </div>
                  )
                })}
              </div>
              {totalItens > 0 && (
                <div className="flex justify-between items-center pt-3 mt-1" style={{ borderTop: `1px solid ${C.claro}` }}>
                  <span className="text-sm font-medium" style={{ color: C.escuro }}>Total</span>
                  <span className="text-base font-medium" style={{ color: C.dourado }}>
                    R$ {ITENS.reduce((s, i) => s + (qtds[i.id] * i.preco), 0).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              )}
              {errors.itens && <p className="text-xs text-red-500 mt-3">{errors.itens}</p>}
            </div>

            {/* Como receber */}
            <div className="rounded-2xl p-5 shadow-sm" style={{ background: 'white', border: `1px solid ${C.claro}` }}>
              <p className="text-xs font-medium uppercase tracking-wider mb-4" style={{ color: '#000' }}>📍 Como receber</p>
              <div className="grid grid-cols-2 gap-3">
                {(['retirada', 'entrega'] as const).map(m => (
                  <button key={m} type="button" onClick={() => setModo(m)}
                    className="rounded-xl p-3 text-left transition-all"
                    style={{
                      border: modo === m ? `2px solid ${C.escuro}` : `1px solid ${C.claro}`,
                      background: modo === m ? C.creme : 'white',
                    }}>
                    <span className="text-xl">{m === 'retirada' ? '🏪' : '🛵'}</span>
                    <p className="text-sm font-medium mt-1 capitalize" style={{ color: C.escuro }}>{m}</p>
                    <p className="text-xs" style={{ color: C.medio }}>{m === 'retirada' ? 'Buscar no local' : 'Só em Joinville SC'}</p>
                  </button>
                ))}
              </div>

              {modo === 'entrega' && (
                <div className="mt-4 pt-4 space-y-3" style={{ borderTop: `1px solid ${C.claro}` }}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: C.medio }}>Área de entrega</span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: C.claro, color: C.escuro }}>📍 Joinville — SC</span>
                  </div>
                  <Field label="Rua / Avenida" error={errors.rua}>
                    <input name="rua" type="text" placeholder="Ex: Rua das Flores" className={inp(!!errors.rua)} />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Número" error={errors.numero}>
                      <input name="numero" type="text" placeholder="123" className={inp(!!errors.numero)} />
                    </Field>
                    <Field label="Complemento">
                      <input name="complemento" type="text" placeholder="Apto, bloco..." className={inp(false)} />
                    </Field>
                  </div>
                  <Field label="Bairro" error={errors.bairro}>
                    <input name="bairro" type="text" placeholder="Ex: Centro" className={inp(!!errors.bairro)} />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Cidade">
                      <input value="Joinville" readOnly className="w-full rounded-lg border px-3 py-2 text-sm cursor-not-allowed"
                        style={{ border: `1px solid ${C.claro}`, background: C.creme, color: C.medio }} />
                    </Field>
                    <Field label="Estado">
                      <input value="SC" readOnly className="w-full rounded-lg border px-3 py-2 text-sm cursor-not-allowed"
                        style={{ border: `1px solid ${C.claro}`, background: C.creme, color: C.medio }} />
                    </Field>
                  </div>
                </div>
              )}
            </div>

            <button type="submit" disabled={loading}
              className="w-full font-medium rounded-2xl py-3.5 text-sm transition-opacity disabled:opacity-60 hover:opacity-90"
              style={{ background: C.escuro, color: C.creme }}>
              {loading ? 'Enviando...' : '✓ Confirmar reserva'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}

function inp(err: boolean) {
  return `w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors focus:ring-2 placeholder-gray-400 ${err ? 'focus:ring-red-200' : ''}`
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs mb-1" style={{ color: '#000' }}>{label}</label>
      <div style={{ border: `1px solid ${error ? '#fca5a5' : '#D8C2A7'}`, borderRadius: '8px', overflow: 'hidden' }}>
        {children}
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
