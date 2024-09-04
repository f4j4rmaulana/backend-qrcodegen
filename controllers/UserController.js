const express = require('express');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma/client');

// Endpoint untuk mengambil semua data Unit Kerja
const fetchUnitKerja = async (req, res) => {
    try {
        // Ambil semua unit kerja dari database
        const unitKerjaList = await prisma.unitKerja.findMany({
            select: {
                id: true,
                nama: true
            }
        });

        res.status(200).json({
            success: true,
            message: 'Fetched all unit kerja successfully',
            data: unitKerjaList
        });
    } catch (error) {
        console.error('Error fetching unit kerja:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};

// Endpoint untuk mengambil semua data Role dengan penyaringan berdasarkan peran pengguna saat ini
const fetchRoles = async (req, res) => {
    console.log(req);
    try {
        const currentUserRoleName = req.user.role; // Dapatkan peran pengguna saat ini

        // Definisikan daftar role yang tersedia berdasarkan peran pengguna saat ini
        let roleList;

        if (currentUserRoleName === 'Operator' || currentUserRoleName === 'TU' || currentUserRoleName === 'Administrator' ) {
            // Jika pengguna adalah 'Operator' atau 'TU', hanya kembalikan peran 'Operator' atau 'TU'
            roleList = await prisma.role.findMany({
                where: {
                    name: { in: ['Operator', 'TU'] }
                },
                select: {
                    id: true,
                    name: true,
                    description: true
                }
            });
        } else {
            // Jika bukan, kembalikan semua peran
            roleList = await prisma.role.findMany({
                select: {
                    id: true,
                    name: true,
                    description: true
                }
            });
        }

        res.status(200).json({
            success: true,
            message: 'Fetched roles successfully',
            data: roleList
        });
    } catch (error) {
        console.error('Error fetching roles:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};

// Fungsi untuk mendapatkan daftar pengguna
const findUsers = async (req, res) => {
    try {
        // Ambil parameter halaman dan limit dari query string, atau gunakan nilai default
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        let searchQuery = req.query.search || '';
        searchQuery = searchQuery.toLowerCase();

        // Filter pencarian berdasarkan nama atau email
        const searchFilter = searchQuery
            ? {
                  OR: [
                      { name: { contains: searchQuery, mode: 'insensitive' } },
                      { email: { contains: searchQuery, mode: 'insensitive' } },
                  ],
              }
            : {};

        // Filter tambahan untuk peran 'TU' dan 'Operator' agar tidak bisa melihat 'Superuser' dan 'Administrator'
        const roleFilter = (req.user.role === 'TU' || req.user.role === 'Operator')
            ? {
                  role: {
                      isNot: {
                          name: { in: ['Superuser', 'Administrator'] } // Menggunakan filter relasi
                      }
                  }
              }
            : (req.user.role === 'Administrator' ? {
                  role: {
                      isNot: {
                          //name: 'Superuser' // Menggunakan filter relasi
                          name: { in: ['Superuser', 'Administrator'] } 
                      }
                  }
              } : {});

        // Filter tambahan untuk unit kerja jika peran pengguna adalah 'TU' atau 'Operator'
        const unitKerjaFilter = (req.user.role === 'TU' || req.user.role === 'Operator') && req.user.unitKerjaId
            ? { unitKerjaId: req.user.unitKerjaId }
            : {};

        // Ambil daftar pengguna dari database
        const userList = await prisma.user.findMany({
            where: {
                email: { not: 'admin@admin.com' },
                isDeleted: false,
                ...searchFilter,
                ...roleFilter,
                ...unitKerjaFilter,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: {
                    select: {
                        name: true,
                    }
                },
                unitKerja: {
                    select: {
                        nama: true,
                    }
                },
            },
            orderBy: {
                id: 'desc',
            },
            skip: offset,
            take: limit,
        });

        // Hitung total pengguna untuk pagination
        const totalUsers = await prisma.user.count({
            where: {
                email: { not: 'admin@admin.com' },
                isDeleted: false,
                ...searchFilter,
                ...roleFilter,
                ...unitKerjaFilter,
            },
        });

        const totalPages = Math.ceil(totalUsers / limit);

        res.status(200).send({
            success: true,
            message: 'Get all users successfully',
            data: userList,
            currentPage: page,
            totalPages: totalPages,
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).send({
            success: false,
            message: 'Internal server error',
        });
    }
};

// Fungsi untuk membuat pengguna baru
const createUser = async (req, res) => {
    // Periksa hasil validasi input
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({
            success: false,
            message: 'Validation error',
            errors: errors.array(),
        });
    }

    // Enkripsi password pengguna
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    try {
        // Buat pengguna baru dalam database
        const newUser = await prisma.user.create({
            data: {
                name: req.body.name,
                email: req.body.email,
                password: hashedPassword,
                roleId: req.body.roleId,
                unitKerjaId: req.body.unitKerjaId,
            },
        });

        res.status(201).send({
            success: true,
            message: 'User created successfully',
            data: newUser,
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).send({
            success: false,
            message: 'Internal server error',
        });
    }
};

// Fungsi untuk mendapatkan pengguna berdasarkan ID
const findUserById = async (req, res) => {
    const { id } = req.params;

    try {
        // Ambil pengguna berdasarkan ID dari database, termasuk relasi peran dan unit kerja
        const user = await prisma.user.findUnique({
            where: {
                id: String(id),
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                unitKerja: {
                    select: {
                        id: true,
                        nama: true,
                    },
                },
            },
        });

        if (!user) {
            return res.status(404).send({
                success: false,
                message: 'User not found',
            });
        }

        res.status(200).send({
            success: true,
            message: `Get user by ID: ${id}`,
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: {
                    id: user.role?.id || null,
                    name: user.role?.name || 'Role not assigned',
                },
                unitKerja: {
                    id: user.unitKerja?.id || null,
                    name: user.unitKerja?.nama || 'Unit not assigned',
                },
            },
        });
    } catch (error) {
        console.error('Error fetching user by ID:', error);
        res.status(500).send({
            success: false,
            message: 'Internal server error',
        });
    }
};

// Fungsi untuk memperbarui data pengguna
const updateUser = async (req, res) => {
    const { id } = req.params;

    try {
        // Periksa apakah pengguna ada di database
        const existingUser = await prisma.user.findUnique({
            where: {
                id: String(id),
            },
        });

        if (!existingUser) {
            return res.status(404).send({
                success: false,
                message: 'User not found',
            });
        }

        // Jika email yang diberikan berbeda dari email saat ini
        if (req.body.email !== existingUser.email) {
            // Periksa apakah email baru sudah digunakan oleh pengguna lain
            const emailExists = await prisma.user.findUnique({
                where: {
                    email: req.body.email,
                },
            });

            if (emailExists) {
                return res.status(422).json({
                    success: false,
                    message: 'Validation error',
                    errors: [
                        {
                            type: 'field',
                            value: req.body.email,
                            msg: 'Email already exists',
                            path: 'email',
                            location: 'body'
                        }
                    ],
                });
            }
        }

        // Enkripsi password jika diberikan
        let hashedPassword;
        if (req.body.password) {
            hashedPassword = await bcrypt.hash(req.body.password, 10);
        }

        // Perbarui data pengguna dalam database
        const updatedUser = await prisma.user.update({
            where: {
                id: String(id),
            },
            data: {
                name: req.body.name,
                email: req.body.email,
                password: hashedPassword ? hashedPassword : existingUser.password,
                roleId: req.body.roleId,
                unitKerjaId: req.body.unitKerjaId,
            },
        });

        res.status(200).send({
            success: true,
            message: 'User updated successfully',
            data: updatedUser,
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).send({
            success: false,
            message: 'Internal server error',
        });
    }
};

// Fungsi untuk melakukan soft delete pada pengguna
const deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        // Memeriksa pengguna yang melakukan request
        const currentUser = await prisma.user.findUnique({
            where: {
                id: String(req.user.id),
            },
            select: {
                email: true,
                role: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        if (!currentUser) {
            return res.status(401).send({
                success: false,
                message: 'User not authenticated',
            });
        }

        // Mencari pengguna berdasarkan ID yang akan dihapus
        const targetUser = await prisma.user.findUnique({
            where: {
                id: String(id),
            },
            select: {
                email: true,
                role: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        if (!targetUser) {
            return res.status(404).send({
                success: false,
                message: 'User not found',
            });
        }

        const currentUserRoleName = currentUser.role.name;
        const targetUserRoleName = targetUser.role.name;

        // Logika perizinan penghapusan berdasarkan peran
        if (currentUserRoleName === 'Superuser') {
            // Lanjutkan proses penghapusan
        } 
        else if (currentUserRoleName === 'Administrator' && targetUserRoleName === 'Superuser') {
            return res.status(403).send({
                success: false,
                message: 'You do not have permission to delete a Superuser.',
            });
        } 
        else if ((currentUserRoleName === 'TU' || currentUserRoleName === 'Operator') && 
                (targetUserRoleName === 'Superuser' || targetUserRoleName === 'Administrator')) {
            return res.status(403).send({
                success: false,
                message: 'You do not have permission to delete this user.',
            });
        }

        if (targetUser.email === 'admin@admin.com') {
            return res.status(403).send({
                success: false,
                message: 'Admin user cannot be deleted',
            });
        }

        // Lakukan soft delete pengguna dengan mengubah isDeleted menjadi true
        await prisma.user.update({
            where: { id: String(id) },
            data: { isDeleted: true },
        });

        res.status(200).send({
            success: true,
            message: 'User deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).send({
            success: false,
            message: 'Internal server error',
        });
    }
};

// Ekspor semua fungsi untuk digunakan dalam router
module.exports = { findUsers, createUser, findUserById, updateUser, deleteUser, fetchUnitKerja, fetchRoles };
