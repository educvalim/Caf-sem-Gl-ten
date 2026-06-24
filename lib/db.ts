import { createClient } from '@libsql/client'

function getClient() {
  return createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })
}

async function initDb() {
  const client = getClient()
  await client.execute(`
    CREATE TABLE IF NOT EXISTS reservas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      telefone TEXT NOT NULL,
      email TEXT,
      quantidade INTEGER NOT NULL,
      modalidade TEXT NOT NULL,
      rua TEXT,
      numero TEXT,
      complemento TEXT,
      bairro TEXT,
      status TEXT NOT NULL DEFAULT 'pendente',
      criado_em TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `)
  return client
}

export async function getReservas() {
  const client = await initDb()
  const result = await client.execute('SELECT * FROM reservas ORDER BY criado_em DESC')
  return result.rows
}

export async function insertReserva(
  nome: string, telefone: string, quantidade: number,
  modalidade: string, rua: string | null, numero: string | null,
  complemento: string | null, bairro: string | null
) {
  const client = await initDb()
  const result = await client.execute({
    sql: `INSERT INTO reservas (nome, telefone, email, quantidade, modalidade, rua, numero, complemento, bairro)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [nome, telefone, null, quantidade, modalidade, rua, numero, complemento, bairro]
  })
  return result.lastInsertRowid
}
