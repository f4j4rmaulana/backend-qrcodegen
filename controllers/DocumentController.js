const express = require('express');
const fs = require('fs');
const prisma = require('../prisma/client');

// Helper function to delete a file from the filesystem
const deleteFile = (filePath) => {
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
};

const findDocuments = async (req, res) => {
    try {
        // Get page, limit, and search query from query params, with default values
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const searchQuery = req.query.search || '';

        // Calculate offset
        const offset = (page - 1) * limit;

        // Build search filter
        const searchFilter = searchQuery
            ? {
                  OR: [
                      { originalFileName: { contains: searchQuery, mode: 'insensitive' } },
                      { barcodeFileName: { contains: searchQuery, mode: 'insensitive' } },
                      { user: { name: { contains: searchQuery, mode: 'insensitive' } } },
                  ],
              }
            : {};

        // Get all documents that are not soft deleted from the database with pagination and search
        const documents = await prisma.document.findMany({
            where: {
                isDeleted: false,
                ...searchFilter,
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
            orderBy: { id: 'desc' },
            skip: offset,
            take: limit,
        });

        // Get total number of documents that match the search filter
        const totalDocuments = await prisma.document.count({
            where: {
                isDeleted: false,
                ...searchFilter,
            },
        });

        // Calculate total pages
        const totalPages = Math.ceil(totalDocuments / limit);

        // Map documents to include userName directly in the response
        const documentsWithUserName = documents.map((doc) => ({
            ...doc,
            userName: doc.user ? doc.user.name : 'Unknown User',
        }));

        // Send response
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

// Function to soft delete a document
const deleteDocument = async (req, res) => {
    // Get ID from params
    const { id } = req.params;

    try {
        // Find the document to get file paths
        const document = await prisma.document.findUnique({
            where: { id: Number(id) },
        });

        if (!document) {
            return res.status(404).send({
                success: false,
                message: 'Document not found',
            });
        }

        // Soft delete the document by setting isDeleted to true
        await prisma.document.update({
            where: { id: Number(id) },
            data: { isDeleted: true },
        });

        // Delete the files from the filesystem
        deleteFile(document.path);
        deleteFile(document.originalFilePath);

        // Send response
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
