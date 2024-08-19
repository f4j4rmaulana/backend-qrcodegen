//import express
const express = require('express');

const path = require('path');

//import CORS
const cors = require('cors');

//import daysjs
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

//import bodyParser
const bodyParser = require('body-parser');

//import router
const router = require('./routes');

dayjs.extend(utc);
dayjs.extend(timezone);

//init app
const app = express();

//define port
const port = 3001;

// CORS configuration
app.use(cors())

//use body parser
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

//define routes
app.use('/api', router);

// Serve static files from the "public" directory
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Middleware untuk mengatur zona waktu global
app.use((req, res, next) => {
    // Atur zona waktu Asia/Jakarta
    dayjs.tz.setDefault('Asia/Jakarta');
    next();
});

//route
app.get('/', (req, res) => {
    const ip = req.ip;
    // Ambil waktu sekarang dalam zona Asia/Jakarta
    const currentTime = dayjs().format('YYYY-MM-DD HH:mm:ss');
    console.log(ip);
    res.send('Hello! Your IP address is: ' + ip + `<br/> Waktu sekarang di Asia/Jakarta: ${currentTime}`);
});

//start server
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});
// app.listen(port, '0.0.0.0', () => {
//     console.log(`Server berjalan di http://localhost:${port}`);
// });
