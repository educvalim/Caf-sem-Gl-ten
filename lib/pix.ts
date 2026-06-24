function crc16(str: string): string {
  let crc = 0xffff
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1
    }
  }
  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, '0')
}

function field(id: string, value: string): string {
  return `${id}${value.length.toString().padStart(2, '0')}${value}`
}

export function gerarPixCopiaCola(chave: string, valor: number, nome: string, cidade: string): string {
  const valorStr = valor.toFixed(2)
  const nomeFormatado = nome.normalize('NFD').replace(/[̀-ͯ]/g, '').substring(0, 25).toUpperCase()
  const cidadeFormatada = cidade.normalize('NFD').replace(/[̀-ͯ]/g, '').substring(0, 15).toUpperCase()

  const merchantAccount = field('00', 'BR.GOV.BCB.PIX') + field('01', chave)
  const additionalData = field('05', '***')

  const payload =
    field('00', '01') +
    field('26', merchantAccount) +
    field('52', '0000') +
    field('53', '986') +
    field('54', valorStr) +
    field('58', 'BR') +
    field('59', nomeFormatado) +
    field('60', cidadeFormatada) +
    field('62', additionalData) +
    '6304'

  return payload + crc16(payload)
}
