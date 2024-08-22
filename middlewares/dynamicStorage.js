const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Create directories if they don't exist
const createDirectories = (dirs) => {
    if (!fs.existsSync(dirs)) {
        fs.mkdirSync(dirs, { recursive: true });
    }
};

// Multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const year = new Date().getFullYear();
        const userId = req.userId.toString(); // Assuming `req.userId` is available from the auth middleware

        const uploadPath = path.join(__dirname, '..', 'public', 'uploads', 'digital_signature', year.toString(), userId);

        createDirectories(uploadPath);

        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Generate SHA-256 hash
        const hash = crypto.createHash('sha256')
            .update(file.originalname + Date.now().toString())
            .digest('hex')
            .slice(0, 32); // Truncate to 32 characters

        const originalFileName = file.originalname.replace(/\s+/g, '_');
        const barcodeFileName = `${hash}_${originalFileName}`;

        cb(null, barcodeFileName);
    },
});

const upload = multer({ storage: storage });

module.exports = upload;
