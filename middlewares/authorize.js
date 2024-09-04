// middlewares/authorize.js

// Middleware untuk mengotorisasi pengguna berdasarkan role mereka
const authorizeRoles = (roles = []) => {
  // Ubah parameter roles menjadi array jika berupa string tunggal
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!req.user) {
      // Jika pengguna tidak terautentikasi, kembalikan respons 401
      return res.status(401).json({ message: 'Unauthenticated: User information is missing.' });
    }

    if (!roles.includes(req.user.role)) {
      // Jika role pengguna tidak diotorisasi, kembalikan respons 403
      return res.status(403).json({ message: 'Forbidden: You do not have permission to access this resource.' });
    }

    // Pengguna diotorisasi, lanjut ke middleware berikutnya
    next();
  };
};

module.exports = authorizeRoles;
