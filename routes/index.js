// Import express
const express = require('express');

// Init express router
const router = express.Router();

// Import controllers
const registerController = require('../controllers/RegisterController.js');
const loginController = require('../controllers/LoginController');
const uploadController = require('../controllers/UploadController');
const documentController = require('../controllers/DocumentController');
const userController = require('../controllers/UserController');
const dashboardController = require('../controllers/DashboardController');

// Import validators
const { validateRegister, validateLogin } = require('../utils/validators/auth');
const { validateUpload } = require('../utils/validators/document');
const { validateUser } = require('../utils/validators/user');

// Import middlewares
const verifyToken = require('../middlewares/auth');
const authorizeRoles = require('../middlewares/authorize');
const restrictToOwnUnit = require('../middlewares/access');
const upload = require('../middlewares/dynamicStorage');

// Define routes

// Route for register
//router.post('/register', validateRegister, registerController.register);

// Route for login
router.post('/login', validateLogin, loginController.login);

// Route for logout
router.post('/logout', verifyToken, loginController.logout); // Added verifyToken for secure logout

// Route for dashboard
router.get('/admin/dashboard', verifyToken, dashboardController.getDashboardStats);

// Route for upload with token verification
router.post('/admin/upload', verifyToken, authorizeRoles(['Superuser', 'Administrator', 'TU', 'Operator']), upload.single('pdf'), validateUpload, uploadController.upload);

// Route for get all documents
router.get('/admin/documents', verifyToken, authorizeRoles(['Superuser', 'Administrator', 'TU', 'Operator']), restrictToOwnUnit, documentController.findDocuments);

// Route for delete document
router.delete('/admin/documents/:id', verifyToken, authorizeRoles(['Superuser', 'Administrator', 'TU']), restrictToOwnUnit, documentController.deleteDocument);

// Route for get all users
router.get('/admin/users', verifyToken, authorizeRoles(['Superuser', 'Administrator', 'TU', 'Operator']), userController.findUsers);

// Route for create user
router.post('/admin/users', verifyToken, authorizeRoles(['Superuser', 'Administrator', 'TU']), validateUser, userController.createUser);

// Route for get user by id
router.get('/admin/users/:id', verifyToken, authorizeRoles(['Superuser', 'Administrator', 'TU']), userController.findUserById);

// Route for user update
router.put('/admin/users/:id', verifyToken, authorizeRoles(['Superuser', 'Administrator', 'TU']), validateUser, userController.updateUser);

// Route for delete user
router.delete('/admin/users/:id', verifyToken, authorizeRoles(['Superuser', 'Administrator', 'TU']), userController.deleteUser);

// Route for unit kerja
router.get('/admin/unit-kerja', verifyToken, userController.fetchUnitKerja);

// Route for roles
router.get('/admin/roles', verifyToken, userController.fetchRoles);

// Route for change password
router.post('/admin/change-password', verifyToken, loginController.changePassword);

// Export router
module.exports = router;
