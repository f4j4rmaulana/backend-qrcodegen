const { PDFDocument, rgb } = require('pdf-lib');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const prisma = require('../prisma/client');

// Generate a hash for file name
const generateHash = (length = 10) => {
    return crypto.createHash('sha256').update(crypto.randomBytes(length)).digest('hex').slice(0, length);
};

// Create directories if they don't exist
const createDirectories = (dirs) => {
    if (!fs.existsSync(dirs)) {
        fs.mkdirSync(dirs, { recursive: true });
    }
};

const upload = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const file = req.file;
        console.log('Received file:', file);

        // Get userId from request
        const userId = req.userId;
        if (!userId) return res.status(401).json({ message: 'User not authenticated' });

        const year = new Date().getFullYear();

        // Generate hash for file name
        const hash = generateHash();
        const originalFileName = file.originalname;
        const barcodeFileName = `${hash}_${originalFileName}`;
        console.log('Barcode file name:', barcodeFileName);

        // Set paths for saving
        const uploadsPath = path.join(__dirname, '..', 'public', 'uploads', 'digital_signature', year.toString(), userId.toString());
        createDirectories(uploadsPath);

        // Corrected path for file reading and saving
        const pdfPath = path.join(uploadsPath, file.filename);
        const barcodeFilePath = path.join(uploadsPath, barcodeFileName);

        console.log('PDF path:', pdfPath);
        console.log('Barcode file path:', barcodeFilePath);

        if (!fs.existsSync(pdfPath)) {
            return res.status(404).json({ message: 'PDF file not found' });
        }

        // Generate URL for QR code
        const qrCodeText = `http://localhost:3001/uploads/digital_signature/${year}/${userId}/${barcodeFileName}`;
        console.log('QR Code text:', qrCodeText);

        const qrCodeImage = await QRCode.toDataURL(qrCodeText);

        const pdfDoc = await PDFDocument.load(fs.readFileSync(pdfPath));
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];

        const pngImage = await pdfDoc.embedPng(qrCodeImage);

        const qrCodeSize = 56.7; // Ukuran QR Code dalam points (2 cm)
        const margin = 1; // Margin umum antar elemen dalam points
        const textBoxWidth = 4 * 28.35; // Lebar textbox dalam points (3 cm)
        const textBoxHeight = 1.8 * 28.35; // Tinggi textbox dalam points (1.8 cm)

        const { width, height } = firstPage.getSize(); // Mendapatkan ukuran halaman

        // Hitung posisi textbox
        const textBoxX = width - textBoxWidth - margin; // Posisi X untuk textbox
        const textBoxY = margin; // Posisi Y untuk textbox

        // Output posisi dan ukuran textbox
        console.log(`Posisi dan Ukuran Textbox:
                X: ${textBoxX} points
                Y: ${textBoxY} points
                Lebar: ${textBoxWidth} points
                Tinggi: ${textBoxHeight} points`);

        // Gambar textbox dengan border putih
        firstPage.drawRectangle({
            x: textBoxX,
            y: textBoxY,
            width: textBoxWidth,
            height: textBoxHeight,
            color: rgb(1, 1, 1, 0), // Transparan (RGBA: 1, 1, 1, 0)
            borderColor: rgb(0, 0, 0, 0), // Border color transparan (RGBA: 0, 0, 0, 0)
            borderWidth: 0, // Tidak ada border
        });

        const fontSize = 6; // Ukuran font teks
        const text = 'Dokumen ini telah ditandatangani secara digital, silahkan lakukan verifikasi dokumen ini yang dapat diunduh dengan melakukan scan QR Code'; // Teks yang akan ditampilkan dalam textbox

        const textOptions = {
            x: textBoxX + 2, // Posisi X untuk teks dalam textbox
            y: textBoxY + textBoxHeight - fontSize - 2, // Posisi Y untuk teks dalam textbox
            size: fontSize, // Ukuran font teks
            color: rgb(0, 0, 0), // Warna font hitam
            maxWidth: textBoxWidth - 4, // Lebar maksimum teks dalam textbox
            lineHeight: fontSize + 2, // Tinggi baris teks
        };

        // Output teks yang akan ditampilkan
        console.log(`Teks yang akan ditampilkan dalam Textbox:
                "${text}"`);

        // Gambar teks dalam textbox
        firstPage.drawText(text, textOptions);

        // Hitung posisi QR Code
        const qrCodeX = textBoxX - qrCodeSize - margin; // Posisi X untuk QR Code
        const qrCodeY = margin; // Posisi Y untuk QR Code

        // Output posisi dan ukuran QR Code
        console.log(`Posisi dan Ukuran QR Code:
                X: ${qrCodeX} points
                Y: ${qrCodeY} points
                Ukuran: ${qrCodeSize} points`);

        // Gambar QR Code
        firstPage.drawImage(pngImage, {
            x: qrCodeX,
            y: qrCodeY,
            width: qrCodeSize,
            height: qrCodeSize,
        });

        const modifiedPdfBytes = await pdfDoc.save();
        fs.writeFileSync(barcodeFilePath, modifiedPdfBytes);

        const pdfData = await prisma.document.create({
            data: {
                originalFileName: file.originalname,
                barcodeFileName,
                originalFilePath: `uploads/digital_signature/${year}/${userId}/${file.filename}`,
                path: `uploads/digital_signature/${year}/${userId}/${barcodeFileName}`,
                userId: parseInt(userId),
            },
        });

        res.status(200).json(pdfData);
    } catch (error) {
        console.error('Error during file upload:', error);
        res.status(500).send('Error uploading file.');
    }
};

module.exports = { upload };
