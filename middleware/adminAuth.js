const isLogin = async (req, res, next) => {
    try {
        if (req.session.user_id) {
            return next();
        } else {
            return res.redirect('/admin');  
        }
    } catch (error) {
        console.log("Error in isLogin middleware:", error.message);
        return res.redirect('/admin'); 
    }
};

const isLogout = async (req, res, next) => {
    try {
        if (req.session.user_id) {
            return res.redirect('/admin/home');
        }
        return next();
    } catch (error) {
        console.log("Error in isLogout middleware:", error.message);
        return res.redirect('/admin'); 
    }
};

module.exports = {
    isLogin,
    isLogout
};
