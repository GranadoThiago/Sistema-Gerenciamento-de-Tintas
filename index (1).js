const { sql } = require('../_lib/db');
const { requireAuth } = require('../_lib/auth');

module.exports = async (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    const { q } = req.query;
    let result;
    if (q) {
      const termo = `%${String(q).toLowerCase()}%`;
      result = await sql`
        SELECT * FROM manipulacoes
        WHERE LOWER(cliente) LIKE ${termo}
           OR LOWER(nome_cor) LIKE ${termo}
           OR LOWER(grupo) LIKE ${termo}
           OR LOWER(produto_cliente) LIKE ${termo}
           OR data_manipulacao::text LIKE ${termo}
        ORDER BY data_cadastro DESC
      `;
    } else {
      result = await sql`SELECT * FROM manipulacoes ORDER BY data_cadastro DESC`;
    }
    return res.status(200).json(result.rows);
  }

  if (req.method === 'POST') {
    const d = req.body || {};
    try {
      const result = await sql`
        INSERT INTO manipulacoes
          (cliente, produto_cliente, endereco, data_manipulacao, grupo, nome_cor,
           produto_manip, embalagem, base_usada, quantidade, observacao, usuario_id)
        VALUES
          (${d.cliente}, ${d.produtoCliente}, ${d.endereco}, ${d.dataManipulacao || null}, ${d.grupo},
           ${d.nomeCor}, ${d.produtoManip}, ${d.embalagem}, ${d.baseUsada}, ${d.quantidade}, ${d.observacao}, ${user.id})
        RETURNING *
      `;
      return res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ erro: 'Erro ao salvar manipulação', detalhe: err.message });
    }
  }

  res.status(405).json({ erro: 'Método não permitido' });
};
