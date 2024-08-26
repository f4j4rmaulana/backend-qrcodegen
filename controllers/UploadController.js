const { PDFDocument, rgb } = require('pdf-lib');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const prisma = require('../prisma/client');
require('dotenv').config(); // Memuat variabel lingkungan dari file .env

// Fungsi untuk menghasilkan hash untuk nama file
const generateHash = (length = 32) => {
    return crypto.createHash('sha256').update(crypto.randomBytes(length)).digest('hex').slice(0, length);
};

// Fungsi untuk membuat direktori jika belum ada
const createDirectories = (dirs) => {
    if (!fs.existsSync(dirs)) {
        fs.mkdirSync(dirs, { recursive: true });
    }
};

const upload = async (req, res) => {
    // Validasi permintaan
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const file = req.file;

        // Mendapatkan userId dari permintaan
        const userId = req.userId;
        if (!userId) return res.status(401).json({ message: 'User not authenticated' });

        // Mendapatkan tanggal saat ini
        const date = new Date();
        const year = String(date.getFullYear());
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Mendapatkan bulan (0-based index, +1)
        const day = String(date.getDate()).padStart(2, '0'); // Mendapatkan hari dalam sebulan

        // Menghasilkan hash untuk nama file
        const originalFileName = file.originalname.replace(/\s+/g, '_');
        const hash = generateHash();
        const barcodeFileName = `${hash}_${originalFileName}`;

        // Menentukan path untuk penyimpanan
        const uploadsPath = path.join(__dirname, '..', 'public', 'uploads', 'original', year, month, day, userId);
        const uploadsPathBarcode = path.join(__dirname, '..', 'public', 'uploads', 'digital_signature', year, month, day, userId);
        createDirectories(uploadsPath);

        // Path untuk membaca dan menyimpan file
        const pdfPath = path.join(uploadsPath, file.filename);
        // path untuk menyimpan barcode file setelah di modif
        const barcodeFilePath = path.join(uploadsPathBarcode, barcodeFileName);
        // console.log(barcodeFilePath);

        // Memeriksa apakah file PDF ada
        if (!fs.existsSync(pdfPath)) {
            return res.status(404).json({ message: 'PDF file not found' });
        }

        // Menghasilkan URL untuk QR code
        const qrCodeText = `${process.env.BASE_URL}/uploads/digital_signature/${year}/${month}/${day}/${userId}/${barcodeFileName}`;
        const qrCodeImage = await QRCode.toDataURL(qrCodeText);

        // Memuat dokumen PDF dan mempersiapkan halaman untuk pengeditan
        const pdfDoc = await PDFDocument.load(fs.readFileSync(pdfPath));
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];

        // Menyematkan gambar QR code ke dalam PDF
        const pngImage = await pdfDoc.embedPng(qrCodeImage);

        // Ukuran dan margin untuk QR code dan teks
        const qrCodeSize = 56.7; // Ukuran QR Code dalam points (2 cm)
        const margin = 1; // Margin umum antar elemen dalam points
        const textBoxWidth = 4 * 28.35; // Lebar textbox dalam points (3 cm)
        const textBoxHeight = 1.8 * 28.35; // Tinggi textbox dalam points (1.8 cm)

        const { width, height } = firstPage.getSize(); // Mendapatkan ukuran halaman

        // Menghitung posisi textbox
        const textBoxX = width - textBoxWidth - margin;
        const textBoxY = margin;

        // Menggambar textbox dengan border putih (transparan)
        firstPage.drawRectangle({
            x: textBoxX,
            y: textBoxY,
            width: textBoxWidth,
            height: textBoxHeight,
            color: rgb(1, 1, 1, 0), // Transparan
            borderColor: rgb(0, 0, 0, 0), // Border transparan
            borderWidth: 0, // Tidak ada border
        });

        // Opsi teks untuk menggambar teks di dalam textbox
        const fontSize = 6;
        const text = 'Dokumen ini telah ditandatangani secara digital, silahkan lakukan verifikasi dokumen ini yang dapat diunduh dengan melakukan scan QR Code';

        const textOptions = {
            x: textBoxX + 2,
            y: textBoxY + textBoxHeight - fontSize - 2,
            size: fontSize,
            color: rgb(0, 0, 0),
            maxWidth: textBoxWidth - 4,
            lineHeight: fontSize + 2,
        };

        // Menggambar teks dalam textbox
        firstPage.drawText(text, textOptions);

        // Menghitung posisi QR Code
        const qrCodeX = textBoxX - qrCodeSize - margin;
        const qrCodeY = margin;

        // Menggambar QR Code di halaman PDF
        firstPage.drawImage(pngImage, {
            x: qrCodeX,
            y: qrCodeY,
            width: qrCodeSize,
            height: qrCodeSize,
        });

        // Menyimpan perubahan pada dokumen PDF
        const modifiedPdfBytes = await pdfDoc.save();
        fs.writeFileSync(barcodeFilePath, modifiedPdfBytes);

        // Menyimpan informasi dokumen ke database menggunakan Prisma
        const pdfData = await prisma.document.create({
            data: {
                originalFileName: file.originalname,
                barcodeFileName,
                originalFilePath: `uploads/original/${year}/${month}/${day}/${userId}/${file.filename}`,
                path: `uploads/digital_signature/${year}/${month}/${day}/${userId}/${barcodeFileName}`,
                userId: userId, // Menggunakan UUID langsung
            },
        });

        // Mengirimkan respons sukses dengan data PDF yang baru disimpan
        res.status(200).json(pdfData);
    } catch (error) {
        console.error('Error during file upload:', error);
        res.status(500).send('Error uploading file.');
    }
};

module.exports = { upload };
