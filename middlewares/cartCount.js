const User = require("../models/userSchema");


const cartCount = async (req, res, next) => {

    try {
        const userId = req.session.user || req.user;

        if (userId) {
            
            const user = await User.findById(userId).populate('cart').exec();

            if (user) {
                if (!user.isBlocked) {
                    
                    res.locals.user = user;

                
                    if (!user.cart) {
                        user.cart = { items: [] }; 
                    } else if (!user.cart.items) {
                        user.cart.items = []; 
                    }

                    return next();  
                } else {
                    console.log("User is blocked:", userId);
                    return res.render("login");  
                }
            } else {
                console.log("User not found in database:", userId);
                return res.redirect("/login");  
            }
        } else {
            return res.redirect("/login");  
        }
    } catch (error) {
        console.error("Error in cart population middleware:", error);
        return next(error);
    }
};


module.exports = {
    cartCount
}