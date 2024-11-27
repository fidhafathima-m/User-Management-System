// requiring
const User = require('../models/userModel');
const config = require('../config/config');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const randomstring = require('randomstring');

// password securing
const securePass = async (password) => {
    try {
        
        const hashPass = await bcrypt.hash(password, 10);
        return hashPass;

    } catch (error) {
        console.log(error.message);
    }
}

// Email verification setup
const sendVerifyMail = async (name, email, user_id) => {
    try {
        
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: config.mailUser,
                pass: config.mailPass
            }
        });

        const mailOptions = {
            from: config.mailUser,
            to: email,
            subject: 'Verification mail',
            html: '<p> Hi ' + name + ', please click here to <a href="http://localhost:3000/verify?id=' + user_id + '"> Verify</a> your mail.</p>'
        }

        transporter.sendMail(mailOptions, (error, info) => {
            if(error) {
                console.log(error);
            } else {
                console.log('Email has sent: ', info.response);
            }
        })

    } catch (error) {
        console.log(error.message);
    }
}

// User register load
const loadRegister = async (req, res) => {
    try {
        
        res.render('registration');

    } catch (error) {
        console.log(error.message);
    }
}

// Inserting user to Database
const insertUser = async (req, res) => {
    try {
        const spass = await securePass(req.body.password);
        const user = new User({
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            image: req.file.filename,
            password: spass,
            is_admin: 0
        });

        const userData = await user.save();

        if(userData) {
            sendVerifyMail(req.body.name, req.body.email, userData._id);
            res.render('registration', {message: "You are successfully registered. Please verify your mail."})
        } else {
            res.render('registration', {message: "Oops! Your registration failed."})
        }

    } catch (error) {
        console.log(error.message);
    }
}

// user email verification
const verifyMail = async (req, res) => {
    try {
        const updateItem = await User.updateOne({ _id: req.query.id }, { $set: { is_verified: 1 } });
        if (updateItem.modifiedCount === 0) {
            return res.status(400).send('Verification failed');
        }
        res.render('email-verified');
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server Error');
    }
};


// user login
const loginLoad = async (req, res) => {
    try {
        res.render('login')
    } catch (error) {
        console.log(error.message);
    }
}

// user login verification
const verifyLogin = async (req, res) => {
    const { email, password } = req.body;
    const userCred = await User.findOne({ email });

    if (!userCred) {
        return res.render('login', { message: 'Credentials Incorrect!' });
    }

    const passMatch = await bcrypt.compare(password, userCred.password);
    if (!passMatch) {
        return res.render('login', { message: 'Credentials Incorrect!' });
    }

    if (userCred.is_verified === 0) {
        return res.render('login', { message: 'Please verify your mail' });
    }

    // Set the session after successful login
    req.session.user_id = userCred._id;
    return res.redirect('/home');
};

// user homepage load
const homeLoad = async (req, res) => {
    try {
        res.setHeader('Cache-Control', 'no-store'); 
        res.render('home');
    } catch (error) {
        console.log(error.message);
    }
};

//user profile
const userprofile = async (req, res) => {
    try {
        const userData = await User.findById({_id: req.session.user_id});
        res.render('userProfile', {user: userData})
    } catch (error) {
        console.log(error.message);
    }
}

// user logout
const userLogout = async (req, res) => {
    try {
        req.session.destroy();
        res.redirect('/');
    } catch (error) {
        console.log(error.message);
    }
}

// forget password
const forgetPassword = async (req, res) => {
    try {
        res.render('forget');
    } catch (error) {
        console.log(error.message);
    }
}

//Reset password send email
const sendResetPasswordMail = async (name, email, token) => {
    try {
        
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: config.mailUser,
                pass: config.mailPass
            }
        });

        const mailOptions = {
            from: config.mailUser,
            to: email,
            subject: 'Reset Password',
            html: '<p> Hi ' + name + ', please click here to <a href="http://localhost:3000/reset-password?token=' + token + '"> Reset</a> your password.</p>'
        }

        transporter.sendMail(mailOptions, (error, info) => {
            if(error) {
                console.log(error);
            } else {
                console.log('Email has sent: ', info.response);
            }
        })

    } catch (error) {
        console.log(error.message);
    }
}

// forget password verification
const forgetVerify = async (req, res) => {
    try {
        
        const email = req.body.email;
        const userData = await User.findOne({email: email});
        if(userData) {
            if(email.is_verified === 0) {
                res.render('forget', {message: 'Please verify your Mail.'});
            } else {
                const random = randomstring.generate();
                const updateData = await User.updateOne({email: email}, {$set: {token: random}});
                sendResetPasswordMail(userData.name, userData.email, random);
                res.render('forget', {message: 'Please check your mail to reset the password.'});
            }
        } else {
            res.render('forget', {message: 'Email doesn\'t exists. Please enter valid Email.'});
        }

    } catch (error) {
        console.log(error.message);
    }
}

// Loading reset password
const resetPasswordLoad = async (req, res) => {
    try {
        
        const token = req.query.token;
        const tokenData = await User.findOne({token: token});
        if(tokenData) {
            res.render('reset-password', {user_id: tokenData._id});
        } else {
            res.render('404', {message: 'Invalid Token.'});
        }

    } catch (error) {
        console.log(error.message);
    }
}

// Reset Password
const resetPassword = async (req, res) => {
    try {
        
        const password = req.body.password;
        const user_id = req.body.user_id;

        if (!password || !user_id) {
            return res.status(400).render('reset-error', { message: 'Password or user ID is missing.' });
        }

        const securePassword = await securePass(password);

        const updateData = await User.findByIdAndUpdate({_id: user_id}, {$set: {password: securePassword, token: ''}});

        if (!updateData) {
            return res.render('reset-error', { message: 'User not found or invalid request.' });
        }

        res.render('resetted-password');

    } catch (error) {
        console.log(error.message);
        res.render('reset-error', { message: 'An error occurred. Please try again later.' });
    }
};

//user verification mail
const verificationLoad = async (req, res) => {
    try {
        res.render('verification');
    } catch (error) {
        console.log(error.message);
    }
};

// sent verification
const sentVerification = async(req, res) => {
    try {
        const email = req.body.email;
        const userData = await User.findOne({email: email});

        if(userData) {
            sendVerifyMail(userData.name, userData.email, userData._id);
            res.render('verification', {message: 'Verification mail sent to '+ email + '. Kindly check.'})
        } else {
            res.render('verification', {message: 'Mail doesn\'t exist. Please register.'})
        }

    } catch (error) {
        console.log(error.message);
    }
}

// user edit Load
const editLoad = async (req, res) => {
    try {
        const id = req.query.id;
        const userData = await User.findById({_id: id});

        if(userData) {
            res.render('editProfile', {user: userData});
        } else {
            res.redirect('/userProfile')
        }

    } catch (error) {
        console.log(error.message);
    }
}

//updating Profile
const updateProfile = async (req, res) => {
    try {
        if(req.file) {
            const userData = await User.findByIdAndUpdate(
                {
                    _id: req.body.user_id
                },
                {
                    name: req.body.name,
                    email: req.body.email,
                    phone: req.body.phone,
                    image: req.file.filename
                }
            );
        } else {
            const userData = await User.findByIdAndUpdate(
                {
                    _id: req.body.user_id
                },
                {
                    name: req.body.name,
                    email: req.body.email,
                    phone: req.body.phone
                }
            );
        }
        res.redirect('/userProfile')
    } catch (error) {
        console.log(error.message);
    }
};


module.exports = {
    loadRegister,
    insertUser,
    verifyMail,
    loginLoad, 
    verifyLogin,
    homeLoad,
    verificationLoad,
    sentVerification,
    userprofile,
    editLoad,
    updateProfile,
    userLogout,
    forgetPassword,
    forgetVerify,
    resetPasswordLoad,
    resetPassword,
}