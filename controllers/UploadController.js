const { PDFDocument, rgb, degrees } = require('pdf-lib');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const prisma = require('../prisma/client');
require('dotenv').config(); // Memuat variabel lingkungan dari file .env

// Fungsi untuk menghasilkan hash unik untuk nama file
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

        // Mendapatkan userId dari permintaan (user yang sedang login)
        const userId = String(req.user.id);
        if (!userId) return res.status(401).json({ message: 'User not authenticated' });

        console.log('User ID:', userId);

        // Mendapatkan tanggal saat ini
        const date = new Date();
        const year = String(date.getFullYear());
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        // Menghasilkan hash untuk nama file agar unik
        const originalFileName = file.originalname.replace(/\s+/g, '_');
        const hash = generateHash();
        const barcodeFileName = `${hash}_${originalFileName}`;

        // Menentukan lokasi untuk menyimpan file
        const uploadsPath = path.join(__dirname, '..', 'public', 'uploads', 'original', year, month, day, String(userId));
        const uploadsPathBarcode = path.join(__dirname, '..', 'public', 'uploads', 'digital_signature', year, month, day, userId);

        console.log(uploadsPath);
        console.log(uploadsPathBarcode);

        // Membuat direktori jika belum ada
        createDirectories(uploadsPath);
        createDirectories(uploadsPathBarcode);

        // Menentukan path untuk file PDF yang diunggah
        const pdfPath = path.join(uploadsPath, file.filename);
        const barcodeFilePath = path.join(uploadsPathBarcode, barcodeFileName);

        console.log(pdfPath);
        console.log(barcodeFilePath);

        // Memeriksa apakah file PDF ada di lokasi tersebut
        if (!fs.existsSync(pdfPath)) {
            return res.status(404).json({ message: 'PDF file not found' });
        }

        // Membuat URL untuk QR Code
        const qrCodeText = `${process.env.BASE_URL}/uploads/digital_signature/${year}/${month}/${day}/${userId}/${barcodeFileName}`;
        const qrCodeImage = await QRCode.toDataURL(qrCodeText);

        // Memuat dokumen PDF dan mempersiapkan halaman untuk ditambahkan QR Code dan teks
        const pdfDoc = await PDFDocument.load(fs.readFileSync(pdfPath));
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];

        // Memeriksa apakah halaman PDF diputar
        const rotationAngle = firstPage.getRotation().angle || 0;

        // Menyematkan gambar QR code ke dalam PDF
        const pngImage = await pdfDoc.embedPng(qrCodeImage);

        // Mengatur ukuran QR Code dan kotak teks
        const qrCodeSize = 56.7; // Ukuran QR Code dalam points (2 cm)
        const margin = 1; // Margin umum antar elemen dalam points
        const textBoxWidth = 4 * 28.35; // Lebar kotak teks dalam points (4 cm)
        const textBoxHeight = 1.8 * 28.35; // Tinggi kotak teks dalam points (1.8 cm)

        const { width, height } = firstPage.getSize(); // Mendapatkan ukuran halaman PDF

        let textBoxX, textBoxY, qrCodeX, qrCodeY;

        if (rotationAngle === 180) {
            // Koordinat untuk rotasi 180 derajat
            textBoxX = margin;
            textBoxY = height - textBoxHeight - margin - 15;

            qrCodeX = textBoxX + textBoxWidth + margin; // QR Code diletakkan di sebelah kotak teks
            qrCodeY = height - qrCodeSize - margin;
        } else {
            // Koordinat normal tanpa rotasi
            textBoxX = width - textBoxWidth - margin;
            textBoxY = margin;

            qrCodeX = textBoxX - qrCodeSize - margin;
            qrCodeY = margin;
        }

        // Log posisi dan ukuran untuk debugging
        // console.log('Text Box Coordinates:', { textBoxX, textBoxY, textBoxWidth, textBoxHeight });
        // console.log('QR Code Coordinates:', { qrCodeX, qrCodeY, qrCodeSize });

        // Memutar kotak teks dan QR code jika halaman diputar
        if (rotationAngle === 180) {
            // Memutar teks dengan 180 derajat
            firstPage.drawText('Dokumen ini telah ditandatangani secara digital, silahkan lakukan verifikasi dokumen ini yang dapat diunduh dengan melakukan scan QR Code', {
                x: textBoxX + textBoxWidth / 2 + 55, // Mengatur posisi horizontal
                y: textBoxY + textBoxHeight / 2, // Mengatur posisi vertikal
                size: 6,
                color: rgb(0, 0, 0),
                maxWidth: textBoxWidth - 4,
                rotate: degrees(180), // Memutar teks 180 derajat
                lineHeight: 8,
            });
        } else {
            // Gambar kotak teks secara normal tanpa rotasi
            firstPage.drawRectangle({
                x: textBoxX,
                y: textBoxY,
                width: textBoxWidth,
                height: textBoxHeight,
                color: rgb(1, 1, 1, 0), // Transparan
                borderColor: rgb(0, 0, 0, 0), // Tanpa border
                borderWidth: 0,
            });

            // Menambahkan teks di dalam kotak
            firstPage.drawText('Dokumen ini telah ditandatangani secara digital, silahkan lakukan verifikasi dokumen ini yang dapat diunduh dengan melakukan scan QR Code', {
                x: textBoxX + 2,
                y: textBoxY + textBoxHeight - 6 - 2,
                size: 6,
                color: rgb(0, 0, 0),
                maxWidth: textBoxWidth - 4,
                lineHeight: 8,
            });
        }

        // Menambahkan QR Code pada posisinya
        firstPage.drawImage(pngImage, {
            x: qrCodeX,
            y: qrCodeY,
            width: qrCodeSize,
            height: qrCodeSize,
        });

        // Menyimpan perubahan pada file PDF
        const modifiedPdfBytes = await pdfDoc.save();
        fs.writeFileSync(barcodeFilePath, modifiedPdfBytes);

        // Menyimpan informasi dokumen ke database menggunakan Prisma
        const pdfData = await prisma.document.create({
            data: {
                originalFileName: file.originalname,
                barcodeFileName,
                originalFilePath: `uploads/original/${year}/${month}/${day}/${userId}/${file.filename}`,
                path: `uploads/digital_signature/${year}/${month}/${day}/${userId}/${barcodeFileName}`,
                userId: userId,
            },
        });

        // Mengirim respons sukses dengan data PDF yang baru disimpan
        res.status(200).json(pdfData);
    } catch (error) {
        console.error('Error during file upload:', error);
        res.status(500).send('Error uploading file.');
    }
};

module.exports = { upload };
