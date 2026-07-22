const { sql } = require('./_lib/db');
const { hashPassword } = require('./_lib/auth');

// Chame este endpoint UMA VEZ depois do primeiro deploy para criar as tabelas
// e o usuário administrador inicial. Protegido pela variável SETUP_SECRET.
//
// POST /api/setup
// { "secret": "...", "nome": "Seu Nome", "email": "voce@email.com", "senha": "..." }
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido' });
  }

  const { secret, nome, email, senha } = req.body || {};

  if (!secret || secret !== process.env.SETUP_SECRET) {
    return res.status(403).json({ erro: 'Chave de configuração inválida' });
  }

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nome TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        senha_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'comum',
        criado_em TIMESTAMPTZ DEFAULT now()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS manipulacoes (
        id SERIAL PRIMARY KEY,
        cliente TEXT,
        produto_cliente TEXT,
        endereco TEXT,
        data_manipulacao DATE,
        grupo TEXT,
        nome_cor TEXT,
        produto_manip TEXT,
        embalagem TEXT,
        base_usada TEXT,
        quantidade NUMERIC,
        observacao TEXT,
        usuario_id INTEGER REFERENCES usuarios(id),
        data_cadastro TIMESTAMPTZ DEFAULT now()
      );
    `;

    let adminCriado = false;
    if (nome && email && senha) {
      const existente = await sql`SELECT id FROM usuarios WHERE email = ${email}`;
      if (existente.rows.length === 0) {
        const hash = hashPassword(senha);
        await sql`
          INSERT INTO usuarios (nome, email, senha_hash, role)
          VALUES (${nome}, ${email}, ${hash}, 'admin')
        `;
        adminCriado = true;
      }
    }

    res.status(200).json({
      ok: true,
      mensagem: 'Banco de dados configurado com sucesso.',
      adminCriado
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao configurar banco', detalhe: err.message });
  }
};
