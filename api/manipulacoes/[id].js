const { sql } = require('../_lib/db');
const { requireAuth } = require('../_lib/auth');

module.exports = async (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;

  const { id } = req.query;

  if (req.method === 'GET') {
    const result = await sql`SELECT * FROM manipulacoes WHERE id = ${id}`;
    if (result.rows.length === 0) return res.status(404).json({ erro: 'Não encontrado' });
    return res.status(200).json(result.rows[0]);
  }

  if (req.method === 'PUT') {
    const d = req.body || {};
    try {
      await sql`
        UPDATE manipulacoes SET
          cliente = ${d.cliente},
          produto_cliente = ${d.produtoCliente},
          endereco = ${d.endereco},
          data_manipulacao = ${d.dataManipulacao || null},
          grupo = ${d.grupo},
          nome_cor = ${d.nomeCor},
          produto_manip = ${d.produtoManip},
          embalagem = ${d.embalagem},
          base_usada = ${d.baseUsada},
          quantidade = ${d.quantidade},
          observacao = ${d.observacao}
        WHERE id = ${id}
      `;
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ erro: 'Erro ao atualizar manipulação' });
    }
  }

  if (req.method === 'DELETE') {
    await sql`DELETE FROM manipulacoes WHERE id = ${id}`;
    return res.status(200).json({ ok: true });
  }

  res.status(405).json({ erro: 'Método não permitido' });
};
