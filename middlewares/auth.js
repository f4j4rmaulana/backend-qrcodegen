// middlewares/auth.js

// Import modul yang diperlukan
const jwt = require('jsonwebtoken');
const prisma = require('../prisma/client'); // Import Prisma client untuk berinteraksi dengan database

// Middleware untuk memverifikasi token JWT
const verifyToken = async (req, res, next) => {

    // Ekstrak token dari format "Bearer <token>"
    const token = req.headers['authorization'];
    if (!token) {
        // Jika token tidak ada, kembalikan respons 401
        return res.status(401).json({ message: 'Unauthenticated: Token not provided.' });
    }

    try {
        // Verifikasi token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Ambil data pengguna dari database termasuk detail role dan unit kerja
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            include: {
                role: true,  // Sertakan data role
                unitKerja: true, // Sertakan data unit kerja
            },
        });

        if (!user) {
            // Jika pengguna tidak ditemukan di database, kembalikan respons 404
            return res.status(404).json({ message: 'User not found.' });
        }

        // Tambahkan informasi pengguna ke objek request
        req.user = {
            id: user.id,
            role: user.role.name, // Tambahkan nama role ke req.user
            unitKerjaId: user.unitKerjaId, // Tambahkan unitKerjaId ke req.user jika diperlukan
            unitKerjaName: user.unitKerja ? user.unitKerja.nama : null, // Tambahkan nama unitKerja jika tersedia
        };

        // Lanjut ke middleware berikutnya
        next();
    } catch (err) {
        console.error('Error verifying token or fetching user:', err); // Log error untuk debugging
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

module.exports = verifyToken;
