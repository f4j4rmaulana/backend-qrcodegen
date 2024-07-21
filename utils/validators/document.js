//import express validator
const { body } = require('express-validator');

// Validasi file upload
const validateUpload = [
    body('pdf').custom((value, { req }) => {
        if (!req.file) {
            throw new Error('No file uploaded.');
        }
        const filetypes = /pdf/;
        const mimetype = filetypes.test(req.file.mimetype);
        const extname = filetypes.test(require('path').extname(req.file.originalname).toLowerCase());
        if (!mimetype || !extname) {
            throw new Error('Only PDF files are allowed.');
        }
        return true;
    }),
];

module.exports = { validateUpload };
