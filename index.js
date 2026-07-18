const { sql } = require('../_lib/db');
const { requireAdmin, hashPassword } = require('../_lib/auth');

module.exports = async (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  if (req.method === 'GET') {
    const result = await sql`
      SELECT id, nome, email, role, criado_em
      FROM usuarios
      ORDER BY nome
    `;
    return res.status(200).json(result.rows);
  }

  if (req.method === 'POST') {
    const { nome, email, senha, role } = req.body || {};
    if (!nome || !email || !senha) {
      return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios' });
    }
    try {
      const hash = hashPassword(senha);
      const result = await sql`
        INSERT INTO usuarios (nome, email, senha_hash, role)
        VALUES (${nome}, ${email}, ${hash}, ${role === 'admin' ? 'admin' : 'comum'})
        RETURNING id, nome, email, role
      `;
      return res.status(201).json(result.rows[0]);
    } catch (err) {
      if (String(err.message).toLowerCase().includes('duplicate')) {
        return res.status(409).json({ erro: 'Este email já está cadastrado' });
      }
      console.error(err);
      return res.status(500).json({ erro: 'Erro ao criar usuário' });
    }
  }

  res.status(405).json({ erro: 'Método não permitido' });
};
