const express = require('express');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma/client');

// Fungsi untuk mendapatkan daftar pengguna
const findUsers = async (req, res) => {
    try {
        // Mendapatkan parameter halaman (page) dan batas data per halaman (limit) dari query, dengan nilai default
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Mendapatkan query pencarian (search) dari parameter query, dengan nilai default kosong
        let searchQuery = req.query.search || '';
        searchQuery = searchQuery.toLowerCase(); // Mengubah query pencarian menjadi huruf kecil

        // Membangun filter pencarian berdasarkan nama atau email yang mengandung query pencarian
        const searchFilter = searchQuery
            ? {
                  OR: [
                      { name: { contains: searchQuery, mode: 'insensitive' } },
                      { email: { contains: searchQuery, mode: 'insensitive' } },
                  ],
              }
            : {};

        // Mengambil data pengguna dari database dengan pagination, mengabaikan pengguna yang soft-deleted, dan menerapkan filter pencarian
        const users = await prisma.user.findMany({
            where: {
                email: { not: 'admin@admin.com' }, // Mengabaikan pengguna dengan email admin
                isDeleted: false, // Mengambil hanya pengguna yang tidak dihapus (isDeleted: false)
                ...searchFilter, // Menggabungkan dengan filter pencarian
            },
            select: {
                id: true,
                name: true,
                email: true,
            },
            orderBy: {
                id: 'desc', // Mengurutkan hasil berdasarkan ID secara menurun
            },
            skip: offset,
            take: limit,
        });

        // Menghitung total pengguna yang memenuhi filter pencarian, mengabaikan pengguna yang sudah dihapus
        const totalUsers = await prisma.user.count({
            where: {
                email: { not: 'admin@admin.com' },
                isDeleted: false,
                ...searchFilter,
            },
        });

        // Menghitung total halaman berdasarkan jumlah pengguna dan limit per halaman
        const totalPages = Math.ceil(totalUsers / limit);

        // Mengirimkan respon dengan data pengguna, halaman saat ini, dan total halaman
        res.status(200).send({
            success: true,
            message: 'Get all users successfully', // Pesan tetap seperti semula
            data: users,
            currentPage: page,
            totalPages: totalPages,
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        // Mengirimkan respon error jika terjadi kesalahan saat mengambil data pengguna
        res.status(500).send({
            success: false,
            message: 'Internal server error', // Pesan tetap seperti semula
        });
    }
};

// Fungsi untuk membuat pengguna baru
const createUser = async (req, res) => {
    // Periksa hasil validasi
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        // Jika ada error, kembalikan error ke pengguna
        return res.status(422).json({
            success: false,
            message: 'Validation error', // Pesan tetap seperti semula
            errors: errors.array(),
        });
    }

    // Enkripsi password
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    try {
        // Insert data pengguna baru ke dalam database
        const user = await prisma.user.create({
            data: {
                name: req.body.name,
                email: req.body.email,
                password: hashedPassword,
            },
        });

        // Kirim respon berhasil
        res.status(201).send({
            success: true,
            message: 'User created successfully', // Pesan tetap seperti semula
            data: user,
        });
    } catch (error) {
        console.error('Error creating user:', error);
        // Mengirimkan respon error jika terjadi kesalahan saat membuat pengguna
        res.status(500).send({
            success: false,
            message: 'Internal server error', // Pesan tetap seperti semula
        });
    }
};

// Fungsi untuk mendapatkan pengguna berdasarkan ID
const findUserById = async (req, res) => {
    // Mendapatkan ID dari parameter URL
    const { id } = req.params;

    try {
        // Mendapatkan data pengguna dari database berdasarkan ID
        const user = await prisma.user.findUnique({
            where: {
                id: String(id),
            },
            select: {
                id: true,
                name: true,
                email: true,
            },
        });

        // Kirim respon berhasil
        res.status(200).send({
            success: true,
            message: `Get user by ID: ${id}`, // Pesan tetap seperti semula
            data: user,
        });
    } catch (error) {
        console.error('Error fetching user by ID:', error);
        // Mengirimkan respon error jika terjadi kesalahan saat mengambil data pengguna
        res.status(500).send({
            success: false,
            message: 'Internal server error', // Pesan tetap seperti semula
        });
    }
};

// Fungsi untuk memperbarui pengguna
const updateUser = async (req, res) => {
    // Mendapatkan ID dari parameter URL
    const { id } = req.params;

    // Periksa hasil validasi
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        // Jika ada error, kembalikan error ke pengguna
        return res.status(422).json({
            success: false,
            message: 'Validation error', // Pesan tetap seperti semula
            errors: errors.array(),
        });
    }

    // Enkripsi password
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    try {
        // Update data pengguna di database
        const user = await prisma.user.update({
            where: {
                id: String(id),
            },
            data: {
                name: req.body.name,
                email: req.body.email,
                password: hashedPassword,
            },
        });

        // Kirim respon berhasil
        res.status(200).send({
            success: true,
            message: 'User updated successfully', // Pesan tetap seperti semula
            data: user,
        });
    } catch (error) {
        console.error('Error updating user:', error);
        // Mengirimkan respon error jika terjadi kesalahan saat memperbarui data pengguna
        res.status(500).send({
            success: false,
            message: 'Internal server error', // Pesan tetap seperti semula
        });
    }
};

// Fungsi untuk soft delete pengguna
const deleteUser = async (req, res) => {
    // Mendapatkan ID dari parameter URL
    const { id } = req.params;

    try {
        // Memeriksa apakah pengguna yang melakukan request adalah admin
        const loggedInUser = await prisma.user.findUnique({
            where: {
                id: String(req.userId),
            },
        });

        // Jika pengguna yang melakukan request bukan admin, kirim respon error
        if (loggedInUser.email !== 'admin@admin.com') {
            return res.status(403).send({
                success: false,
                message: 'You do not have permission to delete users.', // Pesan tetap seperti semula
            });
        }

        // Mencari pengguna berdasarkan ID yang akan dihapus
        const user = await prisma.user.findUnique({
            where: {
                id: String(id),
            },
        });

        // Jika pengguna tidak ditemukan, kirim respon error
        if (!user) {
            return res.status(404).send({
                success: false,
                message: 'User not found', // Pesan tetap seperti semula
            });
        }

        // Mencegah penghapusan jika pengguna adalah admin
        if (user.email === 'admin@admin.com') {
            return res.status(403).send({
                success: false,
                message: 'Admin user cannot be deleted', // Pesan tetap seperti semula
            });
        }

        // Soft delete pengguna dengan mengubah nilai isDeleted menjadi true
        await prisma.user.update({
            where: { id: String(id) },
            data: { isDeleted: true },
        });

        // Mengirimkan respon berhasil setelah soft delete
        res.status(200).send({
            success: true,
            message: 'User deleted successfully', // Pesan tetap seperti semula
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        // Mengirimkan respon error jika terjadi kesalahan saat menghapus pengguna
        res.status(500).send({
            success: false,
            message: 'Internal server error', // Pesan tetap seperti semula
        });
    }
};

module.exports = { findUsers, createUser, findUserById, updateUser, deleteUser };
