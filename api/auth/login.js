const { sql } = require('../_lib/db');
const { verifyPassword, signToken, setSessionCookie } = require('../_lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido' });
  }

  const { email, senha } = req.body || {};
  if (!email || !senha) {
    return res.status(400).json({ erro: 'Email e senha são obrigatórios' });
  }

  try {
    const result = await sql`SELECT * FROM usuarios WHERE email = ${email}`;
    const usuario = result.rows[0];

    if (!usuario || !verifyPassword(senha, usuario.senha_hash)) {
      return res.status(401).json({ erro: 'Email ou senha inválidos' });
    }

    const token = signToken(usuario);
    setSessionCookie(res, token);

    res.status(200).json({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao autenticar', detalhe: err.message });
  }
};
