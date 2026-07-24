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

  const LIMITE_TENTATIVAS = 5;
  const BLOQUEIO_MINUTOS = 15;

  try {
    const result = await sql`SELECT * FROM usuarios WHERE email = ${email}`;
    const usuario = result.rows[0];

    // Resposta genérica tanto para email inexistente quanto para senha errada,
    // para não revelar quais emails estão cadastrados no sistema.
    if (!usuario) {
      return res.status(401).json({ erro: 'Email ou senha inválidos' });
    }

    if (usuario.bloqueado_ate && new Date(usuario.bloqueado_ate) > new Date()) {
      const minutosRestantes = Math.ceil((new Date(usuario.bloqueado_ate) - new Date()) / 60000);
      return res.status(429).json({
        erro: `Muitas tentativas de login. Tente novamente em ${minutosRestantes} minuto(s).`
      });
    }

    if (!verifyPassword(senha, usuario.senha_hash)) {
      const tentativas = (usuario.tentativas_falhas || 0) + 1;
      if (tentativas >= LIMITE_TENTATIVAS) {
        await sql`
          UPDATE usuarios
          SET tentativas_falhas = 0,
              bloqueado_ate = now() + (${BLOQUEIO_MINUTOS} || ' minutes')::interval
          WHERE id = ${usuario.id}
        `;
        return res.status(429).json({
          erro: `Muitas tentativas de login. Tente novamente em ${BLOQUEIO_MINUTOS} minuto(s).`
        });
      }
      await sql`UPDATE usuarios SET tentativas_falhas = ${tentativas} WHERE id = ${usuario.id}`;
      return res.status(401).json({ erro: 'Email ou senha inválidos' });
    }

    // Login certo: zera o contador de tentativas
    await sql`UPDATE usuarios SET tentativas_falhas = 0, bloqueado_ate = NULL WHERE id = ${usuario.id}`;

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
    res.status(500).json({ erro: 'Erro ao autenticar' });
  }
};
