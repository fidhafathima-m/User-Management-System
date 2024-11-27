// Requiring necessary modules
const User = require('../models/userModel');
const config = require('../config/config');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const randomstring = require('randomstring');

// Email verification setup
const userVerifyMail = async (name, email,password, user_id) => {
    try {
        if (!user_id) {
            console.log('User ID is missing.');
            return;
        }
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
            subject: 'Admin added you, Verify mail',
            html: '<p> Hi ' + name + ', please click here to <a href="http://localhost:3000/verify?id=' + user_id + '"> Verify</a> your mail.</p><br><br><b>Email: </b>' + email + '<br><b>Password: </b>'+ password
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

//password securing
const securePass = async (password) => {
    try {
        
        const hashPass = await bcrypt.hash(password, 10);
        return hashPass;

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
            html: '<p> Hi ' + name + ', please click here to <a href="http://localhost:3000/admin/reset-password?token=' + token + '"> Reset</a> your password.</p>'
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

// Admin login page render
const loginLoad = async (req, res) => {
    try {
        res.render('login');  
    } catch (error) {
        console.log("Error in loginLoad:", error.message);
    }
};

// Admin login verification
const verifyLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const userCred = await User.findOne({ email });

        if (userCred) {
            // Check if password matches
            const passwordMatch = await bcrypt.compare(password, userCred.password);

            if (passwordMatch) {
                if (userCred.is_admin === 0) {
                    return res.render('login', { message: 'Invalid credentials' });  // Not an admin
                } else {
                    // Set session after successful login
                    req.session.user_id = userCred._id;
                    return res.redirect('/admin/home');  
                }
            } else {
                return res.render('login', { message: 'Invalid credentials' });
            }
        } else {
            return res.render('login', { message: 'Invalid credentials' });
        }

    } catch (error) {
        console.log("Error in verifyLogin:", error.message);
        return res.render('login', { message: 'An error occurred. Please try again later.' });
    }
};

// Admin homepage render
const loadDash = async (req, res) => {
    try {
        res.setHeader('Cache-Control', 'no-store');
        const adminData = await User.findById({_id: req.session.user_id});
        const userData = await User.find({is_admin: 0});
        if (req.session.user_id) {
            res.render('home', {admin: adminData, user: userData});
        } else {
            res.redirect('/admin'); 
        }
    } catch (error) {
        console.log("Error in loadDash:", error.message);
        res.redirect('/admin');
    }
};

// Admin logout
const adminLogout = async (req, res) => {
    try {
        // Destroy session and clear the session cookie
        req.session.destroy((err) => {
            if (err) {
                console.log("Error destroying session:", err);
                return res.redirect('/admin');  
            }
            res.clearCookie('connect.sid');  // Clear the session cookie explicitly
            res.redirect('/admin');
        });
    } catch (error) {
        console.log("Error in adminLogout:", error.message);
        res.redirect('/admin'); 
    }
};

// forget password load
const forgetLoad = async (req, res) => {
    try {
        res.render('forget');
    } catch (error) {
        console.log(error.message);
    }
}

//reset password
const forgetVerify = async (req, res) => {
    try {
        const email = req.body.email;
        const userData = await User.findOne({email: email});

        if(userData) {
            if(userData.is_admin === 0) {
                res.render('forget', {message: "Invalid email"});
            } else {
                const random = randomstring.generate();
                const updateData = await User.updateOne({email: email}, {$set: {token: random}});

                sendResetPasswordMail(userData.name, userData.email, random);
                res.render('forget', {message: "Please check your mail to reset the password."});

            }

        }else {
            res.render('forget', {message: "Invalid email"});
        }

    } catch (error) {
        console.log(error.message);
    }
};

//reset password load
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

//admin profile
const adminProfile = async (req, res) => {
    try {
        const adminData = await User.findById({_id: req.session.user_id});
        res.render('profile', {admin: adminData});
    } catch (error) {
        console.log(error.message);
    }
}

//manage users
const usersManage = async (req, res) => {
    try {
        
        let search = '';
        if (req.query.search) {
            search = req.query.search;
        };

        //pagination
        let page = 1;
        if (req.query.page) {
            page = req.query.page;
        };

        const limit = 2

        const userData = await User.find(
            {
                is_admin: 0,
                $or: [
                    {name: {$regex: '.*' + search + '.*', $options: 'i'}},
                    {email: {$regex: '.*' + search + '.*', $options: 'i'}},
                    {phone: {$regex: '.*' + search + '.*', $options: 'i'}},
                ]
            }
        )
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

        const count = await User.find(
            {
                is_admin: 0,
                $or: [
                    {name: {$regex: '.*' + search + '.*', $options: 'i'}},
                    {email: {$regex: '.*' + search + '.*', $options: 'i'}},
                    {phone: {$regex: '.*' + search + '.*', $options: 'i'}},
                ]
            }
        ).countDocuments();

        res.render('usersManage', {
            user: userData,
            totalPages: Math.ceil(count/limit),
            currentPage: page
        });
    } catch (error) {
        console.log(error.message);
    }
};

//new user load
const newUserLoad = async (req, res) => {
    try {
        res.render('addUser')
    } catch (error) {
        console.log(error.message);
    }
};

//add new user
const addUser = async (req, res) => {
    try {
        const name = req.body.name;
        const email = req.body.email;
        const phone = req.body.phone;
        const image = req.file?.filename;  // Safely get filename (check for undefined)
        if (!name || !email || !phone || !image) {
            return res.render('addUser', { message: 'All fields are required.' });
        }

        const password = randomstring.generate();
        const securePassword = await securePass(password);

        const user = new User({
            name: name,
            email: email,
            phone: phone,
            image: image,
            password: securePassword,
            is_admin: 0
        });

        // Save the user and wait for the result
        const userData = await user.save();

        console.log('User Data:', userData);

        if (userData) {
            // Wait for email to be sent before redirecting
            await userVerifyMail(name, email, password, userData._id);
            res.redirect('/admin/usersManage');
        } else {
            res.render('addUser', { message: 'Something went wrong.' });
        }

    } catch (error) {
        console.log(error.message);
        res.render('addUser', { message: 'An error occurred. Please try again.' });
    }
};

//edit user load
const editUserLoad = async (req, res) => {
    try {
        const id = req.query.id;
        const userData = await User.findById({_id: id});
        
        if(userData) {
            res.render('edit-user', {user: userData});
        } else {
            res.redirect('/admin/home')
        }

    } catch (error) {
        console.log(error.message);
    }
}

//edit user
const editUser = async (req, res) => {
    try {
        const updateData = await User.findByIdAndUpdate(
            {
                _id: req.body.user_id
            }, 
            {
                $set: {
                    name: req.body.name, 
                    email: req.body.email, 
                    phone: req.body.phone, 
                    is_verified: req.body.is_verified === 'true' ? 1 : 0
                }
            }
        );
        res.redirect('/admin/usersManage');

    } catch (error) {
        console.log(error.message);
    }
};

//delete user
const deleteUser = async (req, res) => {
    try {
        const id = req.query.id;  
        await User.deleteOne({ _id: id });
        res.redirect('/admin/usersManage');
    } catch (error) {
        console.log(error.message);
    }
}


module.exports = {
    loginLoad,
    loadDash,
    verifyLogin,
    adminLogout,
    forgetLoad,
    forgetVerify,
    resetPasswordLoad,
    resetPassword,
    adminProfile,
    usersManage,
    newUserLoad,
    addUser,
    editUserLoad,
    editUser,
    deleteUser
};
