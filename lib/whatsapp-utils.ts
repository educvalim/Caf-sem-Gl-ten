export interface ReservaPayload {
  nome: string
  telefone: string
  quantidade: number
  modalidade: string
  itens?: string
  total?: number
  endereco?: string
}

export function buildMensagem(r: ReservaPayload): string {
  const linhas = [
    `🍞 *Nova Reserva — Café sem Glúten*`,
    ``,
    `👤 *Nome:* ${r.nome}`,
    `📱 *Telefone:* ${r.telefone}`,
    ``,
    `🛒 *Itens do pedido:*`,
  ]

  if (r.itens) {
    r.itens.split(', ').forEach(item => linhas.push(`   • ${item}`))
  } else {
    linhas.push(`   • ${r.quantidade} unidade${r.quantidade > 1 ? 's' : ''}`)
  }

  if (r.total !== undefined) {
    linhas.push(``)
    linhas.push(`💰 *Total: R$ ${r.total.toFixed(2).replace('.', ',')}*`)
  }

  linhas.push(``)
  linhas.push(`📦 *Modalidade:* ${r.modalidade === 'entrega' ? 'Entrega' : 'Retirada'}`)

  if (r.endereco) linhas.push(`📍 *Endereço:* ${r.endereco}`)

  linhas.push(``)
  linhas.push(`_Responda para confirmar a reserva._`)

  return linhas.join('\n')
}

export function buildWaLink(telefone: string, mensagem: string): string {
  const numero = telefone.replace(/\D/g, '')
  const numeroCompleto = numero.startsWith('55') ? numero : `55${numero}`
  return `https://wa.me/${numeroCompleto}?text=${encodeURIComponent(mensagem)}`
}
