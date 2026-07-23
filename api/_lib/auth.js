const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookie = require('cookie');

const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = 'tintas_session';

function hashPassword(senha) {
  return bcrypt.hashSync(senha, 10);
}

function verifyPassword(senha, hash) {
  return bcrypt.compareSync(senha, hash);
}

function signToken(usuario) {
  return jwt.sign(
    { id: usuario.id, email: usuario.email, nome: usuario.nome, role: usuario.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function setSessionCookie(res, token) {
  res.setHeader('Set-Cookie', cookie.serialize(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 7 // 7 dias
  }));
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', cookie.serialize(COOKIE_NAME, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 0
  }));
}

function getUserFromRequest(req) {
  const cookies = cookie.parse(req.headers.cookie || '');
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
}

// Retorna o usuário autenticado, ou já envia 401 e retorna null.
function requireAuth(req, res) {
  const user = getUserFromRequest(req);
  if (!user) {
    res.status(401).json({ erro: 'Não autenticado' });
    return null;
  }
  return user;
}

// Igual acima, mas exige role === 'admin'.
function requireAdmin(req, res) {
  const user = requireAuth(req, res);
  if (!user) return null;
  if (user.role !== 'admin') {
    res.status(403).json({ erro: 'Acesso restrito a administradores' });
    return null;
  }
  return user;
}

module.exports = {
  hashPassword,
  verifyPassword,
  signToken,
  setSessionCookie,
  clearSessionCookie,
  getUserFromRequest,
  requireAuth,
  requireAdmin
};
