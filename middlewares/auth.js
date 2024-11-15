const User = require("../models/userSchema");



const userAuth = async (req, res, next) => {
    try {
        
        const userId = req.session.user || req.user;

        if (userId) {
        
            const user = await User.findById(userId);

            if (user) {
                
                if (!user.isBlocked) {
                
                    res.locals.user = user; 
                    next();  
                } else {
                    console.log("User is blocked:", userId);
                    res.render("login");  
                }
            } else {
                console.log("User not found in database:", userId);
                res.redirect("/login");  
            }
        } else {
            res.redirect("/login");  
        }
    } catch (error) {
        console.error("Error in user auth middleware:", error);
        next(error);
    }
};





const adminAuth = (req, res, next) => {

    if(req.session.admin){
    User.findOne({ role: "admin" })
    
        .then(data => {
            if (data) {
                next();
            } else {
                res.redirect("/admin/login");
            }
        })
        .catch(error => {
            console.log("Error in adminAuth middleware", error);
            res.status(500).send("Internal Server Error");
        });
} else {
    res.redirect("/admin/login");
}
}

module.exports = {
    userAuth,
    adminAuth
}
