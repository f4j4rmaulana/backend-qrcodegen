const express = require('express');
const fs = require('fs');
const prisma = require('../prisma/client');

// Fungsi bantu untuk menghapus file dari sistem file
const deleteFile = (filePath) => {
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath); // Menghapus file jika ada
    }
};

// Fungsi untuk mendapatkan dokumen dengan filter, pencarian, dan pagination
const findDocuments = async (req, res) => {
    try {
        // Mendapatkan parameter page, limit, dan search dari query params, dengan nilai default
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        let searchQuery = req.query.search || '';

        // Mengubah query pencarian menjadi huruf kecil
        searchQuery = searchQuery.toLowerCase();

        // Menghitung offset untuk pagination
        const offset = (page - 1) * limit;

        // Membangun filter pencarian
        const searchFilter = searchQuery
            ? {
                OR: [
                    { originalFileName: { contains: searchQuery, mode: 'insensitive' } },
                    { barcodeFileName: { contains: searchQuery, mode: 'insensitive' } },
                    { user: { name: { contains: searchQuery, mode: 'insensitive' } } },
                ],
            }
            : {};

        // Menggunakan filter unitKerja jika peran pengguna adalah 'TU' atau 'Operator'
        const unitKerjaFilter = (req.user.role === 'TU' || req.user.role === 'Operator') && req.user.unitKerjaId
            ? { user: { unitKerjaId: req.user.unitKerjaId } } // Filter dokumen berdasarkan unitKerja pengguna
            : {};

        // Mendapatkan semua dokumen yang tidak dihapus secara soft delete dari database dengan pagination dan pencarian
        const documents = await prisma.document.findMany({
            where: {
                isDeleted: false,
                ...searchFilter,
                ...unitKerjaFilter, // Menerapkan filter unitKerja jika ada
            },
            select: {
                id: true,
                originalFileName: true,
                barcodeFileName: true,
                path: true,
                originalFilePath: true,
                createdAt: true,
                user: {
                    select: { name: true },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip: offset,
            take: limit,
        });

        // Mendapatkan jumlah total dokumen yang sesuai dengan filter pencarian
        const totalDocuments = await prisma.document.count({
            where: {
                isDeleted: false,
                ...searchFilter,
                ...unitKerjaFilter, // Menerapkan filter unitKerja jika ada
            },
        });

        // Menghitung total halaman
        const totalPages = Math.ceil(totalDocuments / limit);

        // Memetakan dokumen untuk langsung menyertakan userName dalam respons
        const documentsWithUserName = documents.map((doc) => ({
            ...doc,
            userName: doc.user ? doc.user.name : 'Unknown User', // Menyertakan nama pengguna atau 'Unknown User' jika tidak ada
        }));

        // Mengirim respons
        res.status(200).send({
            success: true,
            message: 'Get all documents successfully',
            data: documentsWithUserName,
            currentPage: page,
            totalPages: totalPages,
        });
    } catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).send({
            success: false,
            message: 'Internal server error',
        });
    }
};

// Fungsi untuk menghapus dokumen secara soft delete
const deleteDocument = async (req, res) => {
    const { id } = req.params; // Mendapatkan ID dokumen dari parameter URL

    try {
        // Mencari dokumen untuk mendapatkan path file
        const document = await prisma.document.findUnique({
            where: { id: String(id) },
            include: { user: true }, // Menyertakan relasi user untuk mengecek unitKerja
        });

        if (!document) {
            return res.status(404).send({
                success: false,
                message: 'Document not found', // Jika dokumen tidak ditemukan
            });
        }

        // Memeriksa apakah pengguna memiliki izin untuk menghapus dokumen berdasarkan peran dan unitKerja mereka
        if ((req.user.role === 'TU' || req.user.role === 'Operator') && document.user.unitKerjaId !== req.user.unitKerjaId) {
            return res.status(403).send({
                success: false,
                message: 'Forbidden: You do not have permission to delete documents outside your work unit.', // Pesan jika pengguna tidak memiliki izin
            });
        }

        // Menghapus dokumen secara soft delete dengan mengatur isDeleted menjadi true
        await prisma.document.update({
            where: { id: String(id) },
            data: { isDeleted: true },
        });

        // Menghapus file dari sistem file
        deleteFile(document.path);
        deleteFile(document.originalFilePath);

        // Mengirim respons
        res.status(200).send({
            success: true,
            message: 'Document deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).send({
            success: false,
            message: 'Internal server error',
        });
    }
};

module.exports = { findDocuments, deleteDocument };
