//import express
const express = require('express');

//init express router
const router = express.Router();

//import register controller
const registerController = require('../controllers/RegisterController.js');

//import login controller
const loginController = require('../controllers/LoginController');

//import upload controller
const uploadController = require('../controllers/UploadController');

//import document controller
const documentController = require('../controllers/DocumentController');

//import validate register and login
const { validateRegister, validateLogin } = require('../utils/validators/auth');

//import validate upload
const { validateUpload } = require('../utils/validators/document');

//import verify token middleware
const verifyToken = require('../middlewares/auth');

//import multer configuration
const upload = require('../middlewares/dynamicStorage');

//define route for register
router.post('/register', validateRegister, registerController.register);

//define route for login
router.post('/login', validateLogin, loginController.login);

//define route for upload with token verification
router.post('/admin/upload', verifyToken, upload.single('pdf'), validateUpload, uploadController.upload);

//define route for get all document
router.get('/admin/documents', verifyToken, documentController.findDocuments);

//define route for delete document
router.delete('/admin/documents/:id', verifyToken, documentController.deleteDocument);

//export router
module.exports = router;
