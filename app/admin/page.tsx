'use client'
import { useEffect, useState, useCallback } from 'react'
import { buildWaLink, buildMensagem } from '@/lib/whatsapp-utils'

const C = {
  escuro: '#763F21',
  medio: '#D2A27A',
  claro: '#D8C2A7',
  creme: '#F8E1CF',
  dourado: '#A8650A',
}

interface Reserva {
  id: number
  nome: string
  telefone: string
  email: string
  quantidade: number
  modalidade: 'retirada' | 'entrega'
  rua?: string
  numero?: string
  complemento?: string
  bairro?: string
  status: 'pendente' | 'confirmada' | 'entregue' | 'cancelada'
  criado_em: string
}

const STATUS_LABEL: Record<string, string> = {
  pendente: 'Pendente',
  confirmada: 'Confirmada',
  entregue: 'Entregue',
  cancelada: 'Cancelada',
}

const STATUS_CLASS: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-700',
  confirmada: 'bg-blue-100 text-blue-700',
  entregue: 'bg-green-100 text-green-700',
  cancelada: 'bg-red-100 text-red-700',
}

const SENHA = process.env.NEXT_PUBLIC_ADMIN_SENHA || 'admin123'

export default function AdminPage() {
  const [auth, setAuth] = useState(false)
  const [senha, setSenha] = useState('')
  const [senhaErro, setSenhaErro] = useState(false)
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [filtro, setFiltro] = useState<string>('todos')
  const [busca, setBusca] = useState('')
  const [estoque, setEstoque] = useState<Record<string, number>>({})
  const [estoqueInput, setEstoqueInput] = useState<Record<string, string>>({})
  const [salvando, setSalvando] = useState<string | null>(null)
  const [abaAdmin, setAbaAdmin] = useState<'reservas' | 'estoque'>('reservas')

  const PRODUTOS = [
    { id: 'paozinho-sem-gluten', nome: 'Pãozinho sem Glúten' },
    { id: 'paozinho-doce', nome: 'Pãozinho Doce' },
    { id: 'docinho-de-natal', nome: 'Docinho de Natal' },
  ]

  const fetchReservas = useCallback(async () => {
    const res = await fetch('/api/reservas')
    const data = await res.json()
    setReservas(data)
  }, [])

  const fetchEstoque = useCallback(async () => {
    const res = await fetch('/api/estoque')
    const rows = await res.json()
    const map: Record<string, number> = {}
    const inputMap: Record<string, string> = {}
    rows.forEach((r: { produto_id: string; quantidade: number }) => {
      map[r.produto_id] = r.quantidade
      inputMap[r.produto_id] = String(r.quantidade)
    })
    setEstoque(map)
    setEstoqueInput(inputMap)
  }, [])

  useEffect(() => {
    if (auth) { fetchReservas(); fetchEstoque() }
  }, [auth, fetchReservas, fetchEstoque])

  async function salvarEstoque(produto_id: string) {
    setSalvando(produto_id)
    const quantidade = parseInt(estoqueInput[produto_id] ?? '0') || 0
    await fetch('/api/estoque', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ produto_id, quantidade }),
    })
    await fetchEstoque()
    setSalvando(null)
  }

  function login() {
    if (senha === SENHA) { setAuth(true); setSenhaErro(false) }
    else setSenhaErro(true)
  }

  async function updateStatus(id: number, status: string) {
    await fetch(`/api/reservas/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    fetchReservas()
  }

  async function excluir(id: number) {
    if (!confirm('Excluir esta reserva?')) return
    await fetch(`/api/reservas/${id}`, { method: 'DELETE' })
    fetchReservas()
  }

  function whatsappLink(r: Reserva) {
    const endereco = r.modalidade === 'entrega'
      ? `${r.rua}, ${r.numero}${r.complemento ? ' — ' + r.complemento : ''}, ${r.bairro}, Joinville — SC`
      : undefined
    const msg = buildMensagem({ nome: r.nome, telefone: r.telefone, quantidade: r.quantidade, modalidade: r.modalidade, endereco })
    return buildWaLink(r.telefone, msg)
  }

  if (!auth) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4" style={{ background: C.creme }}>
        <div className="rounded-2xl shadow-sm p-8 w-full max-w-sm" style={{ background: 'white', border: `1px solid ${C.claro}` }}>
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🔐</div>
            <h1 className="text-xl font-medium" style={{ color: C.escuro }}>Painel do Dono</h1>
            <p className="text-sm" style={{ color: C.medio }}>Café sem Glúten — Reservas</p>
          </div>
          <div className="space-y-3">
            <input type="password" placeholder="Senha de acesso" value={senha}
              onChange={e => setSenha(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && login()}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2"
              style={{ border: `1px solid ${senhaErro ? '#fca5a5' : C.claro}`, color: C.escuro }} />
            {senhaErro && <p className="text-xs text-red-500">Senha incorreta.</p>}
            <button onClick={login}
              className="w-full font-medium rounded-lg py-2.5 text-sm transition-opacity hover:opacity-90"
              style={{ background: C.escuro, color: C.creme }}>
              Entrar
            </button>
          </div>
        </div>
      </main>
    )
  }

  const filtradas = reservas.filter(r => {
    const matchFiltro = filtro === 'todos' || r.status === filtro
    const matchBusca = busca === '' ||
      r.nome.toLowerCase().includes(busca.toLowerCase()) ||
      r.telefone.includes(busca)
    return matchFiltro && matchBusca
  })

  const contadores = {
    pendente: reservas.filter(r => r.status === 'pendente').length,
    confirmada: reservas.filter(r => r.status === 'confirmada').length,
    entregue: reservas.filter(r => r.status === 'entregue').length,
    cancelada: reservas.filter(r => r.status === 'cancelada').length,
  }

  const totalPaes = filtradas.reduce((s, r) => s + r.quantidade, 0)

  return (
    <main className="min-h-screen" style={{ background: C.creme }}>
      <header className="px-6 py-4 flex items-center justify-between" style={{ background: C.escuro }}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">🍞</span>
          <div>
            <h1 className="text-base font-medium" style={{ color: C.creme }}>Painel de Reservas</h1>
            <p className="text-xs" style={{ color: C.claro }}>Café sem Glúten — Joinville SC</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <button onClick={() => setAbaAdmin('reservas')} className="text-xs rounded-lg px-3 py-1.5 hover:opacity-80"
              style={{ background: abaAdmin === 'reservas' ? C.claro : 'transparent', color: C.creme, border: `1px solid ${C.claro}` }}>📋 Reservas</button>
            <button onClick={() => setAbaAdmin('estoque')} className="text-xs rounded-lg px-3 py-1.5 hover:opacity-80"
              style={{ background: abaAdmin === 'estoque' ? C.claro : 'transparent', color: C.creme, border: `1px solid ${C.claro}` }}>📦 Estoque</button>
          </div>
          <button onClick={fetchReservas} className="text-xs rounded-lg px-3 py-1.5 hover:opacity-80"
            style={{ border: `1px solid ${C.claro}`, color: C.creme }}>↻ Atualizar</button>
          <button onClick={() => setAuth(false)} className="text-xs rounded-lg px-3 py-1.5 hover:opacity-80"
            style={{ border: `1px solid ${C.claro}`, color: C.creme }}>Sair</button>
        </div>
      </header>

      {abaAdmin === 'estoque' && (
        <div className="max-w-lg mx-auto p-6">
          <div className="rounded-2xl p-6 shadow-sm" style={{ background: 'white', border: `1px solid ${C.claro}` }}>
            <h2 className="text-base font-medium mb-4" style={{ color: C.escuro }}>📦 Controle de Estoque</h2>
            <p className="text-xs mb-5" style={{ color: C.medio }}>Informe quantas unidades foram produzidas hoje. O estoque será descontado conforme os pedidos.</p>
            <div className="space-y-4">
              {PRODUTOS.map(p => (
                <div key={p.id} className="flex items-center justify-between gap-4 p-3 rounded-xl" style={{ background: C.creme }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: C.escuro }}>{p.nome}</p>
                    <p className="text-xs" style={{ color: C.medio }}>Disponível: <strong>{estoque[p.id] ?? 0}</strong></p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number" min="0"
                      value={estoqueInput[p.id] ?? '0'}
                      onChange={e => setEstoqueInput(prev => ({ ...prev, [p.id]: e.target.value }))}
                      className="w-20 text-center rounded-lg border px-2 py-1.5 text-sm"
                      style={{ borderColor: C.claro, color: C.escuro }}
                    />
                    <button
                      onClick={() => salvarEstoque(p.id)}
                      disabled={salvando === p.id}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium hover:opacity-80 disabled:opacity-50"
                      style={{ background: C.escuro, color: C.creme }}>
                      {salvando === p.id ? '...' : 'Salvar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {abaAdmin === 'reservas' && (
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {[
            { key: 'pendente', label: 'Pendentes', icon: '⏳', bg: '#FFF3E0', text: C.dourado },
            { key: 'confirmada', label: 'Confirmadas', icon: '✅', bg: C.claro, text: C.escuro },
            { key: 'entregue', label: 'Entregues', icon: '📦', bg: C.medio, text: 'white' },
            { key: 'cancelada', label: 'Canceladas', icon: '❌', bg: '#FDECEA', text: '#B71C1C' },
          ].map(c => (
            <div key={c.key} className="rounded-xl p-4" style={{ background: c.bg, border: `1px solid ${C.claro}` }}>
              <div className="text-xl mb-1">{c.icon}</div>
              <div className="text-2xl font-medium" style={{ color: c.text }}>{contadores[c.key as keyof typeof contadores]}</div>
              <div className="text-xs mt-0.5" style={{ color: c.text, opacity: 0.8 }}>{c.label}</div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl shadow-sm overflow-hidden" style={{ background: 'white', border: `1px solid ${C.claro}` }}>
          <div className="flex items-center gap-4 p-4 flex-wrap" style={{ borderBottom: `1px solid ${C.claro}` }}>
            <input type="text" placeholder="Buscar por nome ou telefone..." value={busca}
              onChange={e => setBusca(e.target.value)}
              className="flex-1 min-w-[180px] rounded-lg px-3 py-2 text-sm outline-none"
              style={{ border: `1px solid ${C.claro}`, color: C.escuro }} />
            <div className="flex gap-1 flex-wrap">
              {['todos', 'pendente', 'confirmada', 'entregue', 'cancelada'].map(f => (
                <button key={f} onClick={() => setFiltro(f)}
                  className="text-xs px-3 py-1.5 rounded-lg capitalize transition-colors"
                  style={{ background: filtro === f ? C.escuro : C.creme, color: filtro === f ? C.creme : C.escuro }}>
                  {f === 'todos' ? 'Todos' : STATUS_LABEL[f]}
                </button>
              ))}
            </div>
          </div>

          {filtradas.length === 0 ? (
            <div className="text-center py-12" style={{ color: C.medio }}>
              <div className="text-4xl mb-2">📭</div>
              <p className="text-sm">Nenhuma reserva encontrada.</p>
            </div>
          ) : (
            <>
              <div className="px-4 py-2 flex justify-between items-center" style={{ background: C.creme, borderBottom: `1px solid ${C.claro}` }}>
                <span className="text-xs" style={{ color: C.medio }}>{filtradas.length} reserva{filtradas.length !== 1 ? 's' : ''}</span>
                <span className="text-xs" style={{ color: C.medio }}>Total: <strong style={{ color: C.escuro }}>{totalPaes} un.</strong></span>
              </div>
              <div>
                {filtradas.map(r => (
                  <div key={r.id} className="p-4 transition-colors hover:opacity-95" style={{ borderBottom: `1px solid ${C.creme}` }}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-medium text-sm" style={{ color: C.escuro }}>{r.nome}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLASS[r.status]}`}>
                            {STATUS_LABEL[r.status]}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: r.modalidade === 'entrega' ? C.claro : C.creme, color: C.escuro }}>
                            {r.modalidade === 'entrega' ? '🛵 Entrega' : '🏪 Retirada'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs mb-2 flex-wrap" style={{ color: C.medio }}>
                          <span>📱 {r.telefone}</span>
                          <span>✉️ {r.email}</span>
                          <span>🍞 {r.quantidade} un.</span>
                          <span>🕐 {new Date(r.criado_em).toLocaleString('pt-BR')}</span>
                        </div>
                        {r.modalidade === 'entrega' && r.rua && (
                          <p className="text-xs" style={{ color: C.medio }}>
                            📍 {r.rua}, {r.numero}{r.complemento ? ` — ${r.complemento}` : ''}, {r.bairro}, Joinville — SC
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <a href={whatsappLink(r)} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1 text-white text-xs px-3 py-1.5 rounded-lg hover:opacity-90"
                          style={{ background: '#25D366' }}>
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                          WhatsApp
                        </a>
                        <select value={r.status} onChange={e => updateStatus(r.id, e.target.value)}
                          className="text-xs rounded-lg px-2 py-1.5 outline-none"
                          style={{ border: `1px solid ${C.claro}`, color: C.escuro, background: 'white' }}>
                          <option value="pendente">Pendente</option>
                          <option value="confirmada">Confirmada</option>
                          <option value="entregue">Entregue</option>
                          <option value="cancelada">Cancelada</option>
                        </select>
                        <button onClick={() => excluir(r.id)}
                          className="text-xs px-2 py-1.5 rounded-lg transition-colors"
                          style={{ color: '#B71C1C', border: '1px solid #FDECEA' }}>
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      )}
    </main>
  )
}
