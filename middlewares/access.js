// middlewares/access.js

// Middleware untuk membatasi akses ke unit kerja tertentu
const restrictToOwnUnit = (req, res, next) => {
  // Periksa apakah req.user terdefinisi
  if (!req.user) {
    console.error('User information is missing in request object');
    return res.status(401).json({ message: 'User not authenticated' });
  }

  
  const { role, unitKerjaId } = req.user;
  
  // Jika pengguna adalah 'TU' atau 'Operator', batasi akses ke unit kerja mereka sendiri
  if (role === 'TU' || role === 'Operator') {
    req.unitKerjaFilter = { unitKerjaId }; // Tambahkan filter unitKerja ke objek request
    //console.log(req.unitKerjaFilter);
  }

  // Lanjut ke middleware berikutnya
  next();
};

module.exports = restrictToOwnUnit;
