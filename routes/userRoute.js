// Importing packages 
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const user_route = express();

// custom importing
const userController = require('../controller/userController');
const config = require('../config/config');

// Middlewares
user_route.use(bodyParser.json());
user_route.use(bodyParser.urlencoded({extended: true}));
user_route.use(session({secret: config.sessionSecret}));

// custom middlewares
const auth = require('../middleware/auth');

// view engine
user_route.set('view engine', 'ejs');
user_route.set('views', './views/users');

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
user_route.get('/register', auth.isLogout, userController.loadRegister);
user_route.post('/register', upload.single('image'), userController.insertUser);
user_route.get('/verify', userController.verifyMail);
user_route.get('/', auth.isLogout, userController.loginLoad);
user_route.get('/login', auth.isLogout, userController.loginLoad);
user_route.post('/login', userController.verifyLogin);
user_route.post('/', userController.verifyLogin);
user_route.get('/verification', userController.verificationLoad);
user_route.post('/verification', userController.sentVerification);
user_route.get('/home', auth.isLogin, userController.homeLoad);
user_route.get('/userProfile', auth.isLogin, userController.userprofile);
user_route.get('/logout', auth.isLogin, userController.userLogout);
user_route.get('/forget', auth.isLogout, userController.forgetPassword);
user_route.post('/forget', userController.forgetVerify);
user_route.get('/reset-password', auth.isLogout, userController.resetPasswordLoad);
user_route.post('/reset-password', userController.resetPassword);
user_route.get('/edit', auth.isLogin, userController.editLoad);
user_route.post('/edit', upload.single('image'), userController.updateProfile);


module.exports = user_route;