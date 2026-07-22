const { getUserFromRequest } = require('../_lib/auth');

module.exports = async (req, res) => {
  const user = getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ erro: 'Não autenticado' });
  }
  res.status(200).json(user);
};
