// Importing packages
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const admin_route = express();

// Custom imports
const adminController = require('../controller/adminController');
const config = require('../config/config');

// Custom middlewares
const auth = require('../middleware/adminAuth');

// Set up body parser middleware
admin_route.use(bodyParser.json());
admin_route.use(bodyParser.urlencoded({ extended: true }));

// Set up session middleware
admin_route.use(session({
    secret: config.sessionSecret,
    resave: false,                // Don't save session if not modified
    saveUninitialized: false,     // Don't create session until something is stored
    cookie: { secure: false } 
}));

// View engine setup
admin_route.set('view engine', 'ejs');
admin_route.set('views', './views/admin');

// storing images
const fStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.resolve(__dirname, '../public/user_images');
        console.log('Uploading to directory:', uploadDir);

        // Check if the directory exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
            console.log('Directory created successfully');
        }

        cb(null, uploadDir); 
    },
    filename: (req, file, cb) => {
        const name = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
        cb(null, name);
    }
});


const upload = multer({storage: fStorage});

// Routes
admin_route.get('/admin', auth.isLogout, adminController.loginLoad);
admin_route.post('/admin', adminController.verifyLogin);
admin_route.get('/admin/home', auth.isLogin, adminController.loadDash);
admin_route.get('/admin/logout', auth.isLogin, adminController.adminLogout);
admin_route.get('/admin/forget', auth.isLogout, adminController.forgetLoad);
admin_route.post('/admin/forget', adminController.forgetVerify);
admin_route.get('/admin/reset-password',auth.isLogout, adminController.resetPasswordLoad);
admin_route.post('/admin/reset-password', adminController.resetPassword);
admin_route.get('/admin/profile', auth.isLogin, adminController.adminProfile);
admin_route.get('/admin/usersManage', auth.isLogin, adminController.usersManage);
admin_route.get('/admin/add-user', auth.isLogin, adminController.newUserLoad);
admin_route.post('/admin/add-user', upload.single('image'), adminController.addUser);
admin_route.get('/admin/edit-user',auth.isLogin, adminController.editUserLoad);
admin_route.post('/admin/edit-user', adminController.editUser);
admin_route.get('/admin/delete-user', adminController.deleteUser);


module.exports = admin_route;
