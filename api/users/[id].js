const { sql } = require('../_lib/db');
const { requireAdmin, hashPassword } = require('../_lib/auth');

module.exports = async (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  const { id } = req.query;

  if (req.method === 'PUT') {
    const { nome, role, senha } = req.body || {};
    try {
      if (senha) {
        const hash = hashPassword(senha);
        await sql`
          UPDATE usuarios
          SET nome = COALESCE(${nome}, nome),
              role = COALESCE(${role}, role),
              senha_hash = ${hash}
          WHERE id = ${id}
        `;
      } else {
        await sql`
          UPDATE usuarios
          SET nome = COALESCE(${nome}, nome),
              role = COALESCE(${role}, role)
          WHERE id = ${id}
        `;
      }
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ erro: 'Erro ao atualizar usuário' });
    }
  }

  if (req.method === 'DELETE') {
    if (String(admin.id) === String(id)) {
      return res.status(400).json({ erro: 'Você não pode excluir sua própria conta' });
    }
    await sql`DELETE FROM usuarios WHERE id = ${id}`;
    return res.status(200).json({ ok: true });
  }

  res.status(405).json({ erro: 'Método não permitido' });
};
