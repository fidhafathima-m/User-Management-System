const isLogin = async (req, res, next) => {
    try {
        if (!req.session.user_id) {
            return res.redirect('/'); // Redirect to login if not logged in
        }
        next();  // Proceed to the next middleware/route
    } catch (error) {
        console.log(error.message);
    }
};


const isLogout = async (req, res, next) => {
    try {
        if (req.session.user_id) {
            return res.redirect('/home');  // Redirect to home if logged in
        }
        next();  // Proceed to the next middleware/route (login page)
    } catch (error) {
        console.log(error.message);
    }
};


module.exports = {
    isLogin,
    isLogout
}