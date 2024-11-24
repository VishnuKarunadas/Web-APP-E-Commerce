const express = require("express");
const router = express.Router();
const userController = require("../controllers/user/userController");
const passport = require('../config/passport');
const { userAuth } = require("../middlewares/auth");
const { cartCount } = require("../middlewares/cartCount");
const setBreadcrumbs = require('../middlewares/breadCrumb');
const productViewController = require('../controllers/user/productViewController');
const userProfileController = require('../controllers/user/userProfileController');
const userAddressController = require('../controllers/user/userAddressController')
const userCartController = require("../controllers/user/userCartController");
const userOrderController = require("../controllers/user/userOrderController");
const userRatingController = require("../controllers/user/userRatingController");
const userWishlistController = require("../controllers/user/userWishlistController")
const userCouponController = require("../controllers/user/userCouponController");



router.get("/pageNotFound",userController.pageNotFound);

router.get('/',userController.loadHomepage);
router.get("/shop",userController.loadShoppage);


// sign up mgnt
router.get('/signup',userController.loadSignUp);
router.post('/signup',userController.SignUp);
router.post("/verify-otp",userController.verifyOtp);
router.post("/resend-otp",userController.resendOtp);

router.get("/login",userController.loadLogin);
router.post("/login",userController.login);
router.get('/logout',userController.logout);


//google auth
router.get('/auth/google',passport.authenticate('google',{scope:['profile','email']}));
router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/signup'}),(req,res)=>{
    res.redirect('/')
});

// user product view 
router.get('/product/:productId', productViewController.loadSingleProduct);



//user profile mgnt
router.get('/login/forget-password',userProfileController.forgetPasswordPage);
router.post("/login/forget-password/forget-email-valid",userProfileController.forgetEmailValidation);
router.post("/verify-passForget-otp",userProfileController.verifyForgetPassOtp);
router.get("/reset-password",userProfileController.getResetPassPage);
router.post("/resend-forget-otp",userProfileController.resendOtp);
router.post("/reset-password",userProfileController.postNewPassword);
router.get("/userProfile",userAuth,setBreadcrumbs,userProfileController.userProfile);




// user address management

router.get("/user/address",userAuth,cartCount,setBreadcrumbs,userAddressController.userAddress)
router.get("/user/add-new-address",userAuth,cartCount,userAddressController.addNewAddress);
router.post("/user/add-new-address",userAuth,userAddressController.updateNewAddress);
router.get("/user/edit-Address",userAuth,cartCount,userAddressController.getEditAddress);
router.get("/user/edit-Address/:id",userAuth,cartCount,userAddressController.getEditAddress);
router.post("/user/edit-Address/:id",userAuth,userAddressController.editAddress);
router.delete('/user/deleteAddress', userAuth, userAddressController.deleteAddress);



// user cart management

router.get("/cart",userAuth,cartCount,userCartController.cart)
router.post("/add-cart",userAuth,userCartController.addToCart)
router.post("/cart/update-quantity",userAuth,userCartController.updateQuantity)
router.delete("/cart/remove",userAuth,userCartController.removeFromCart)
router.delete('/cart/remove-deleted-item',userAuth,userCartController.removeDeletedItem);


// order management

router.get("/cart/place-order",userAuth,cartCount,userOrderController.placeOrder);

router.post("/cart/apply-coupon",userAuth,userOrderController.addCoupon);
router.post("/cart/remove-coupon", userAuth, userOrderController.removeCoupon);

router.post("/cart/place-order/make-payment",userAuth,cartCount,userOrderController.loadPayment);
router.post("/cart/place-order/make-payment/confirm-order",userAuth,cartCount,userOrderController.confirmOrder);

//razorpay
router.get('/user/payment/razorpay-checkout', userAuth, userOrderController.razorpayCheckout);
router.post("/razorpay-callback", userAuth,userOrderController.verifyRazorpayPayment);
router.post("/verify-razorpay-payment", userAuth,userOrderController.verifyRazorpayPayment);

router.get("/user/order-confirmation", userAuth,cartCount,userOrderController.orderConfirmationPage);

router.get("/user/my-order",userAuth,cartCount,setBreadcrumbs,userOrderController.myOrder);
router.post("/user/my-order/cancel/:itemOrderId/:cancelReason", userAuth, userOrderController.cancelOrder);
router.post('/user/my-order/return-order',userAuth, userOrderController.returnOrder);

router.post('/user/my-order/return-order',userAuth, userOrderController.returnOrder);

router.post("/user/my-order/order-details", userAuth,cartCount,setBreadcrumbs,userOrderController.orderDetails);

//ratings
router.get("/user/my-order/order-details/rate-product/:productId", userAuth,cartCount,setBreadcrumbs,userRatingController.getRateProduct);
router.post("/user/my-order/order-details/rate-product/", userAuth,cartCount,setBreadcrumbs,userRatingController.submitRating);


// wishlist management

router.get("/wishlist",userAuth,cartCount,setBreadcrumbs,userWishlistController.loadWishlist);
router.post("/add-wishlist",userAuth,userWishlistController.addToWishlist);
router.post("/wishlist/remove-from-wishlist",userAuth,userWishlistController.removeFromWishlist);
router.delete('/wishlist/remove-deleted-item',userAuth,userWishlistController.removeDeletedItem);


// coupon management

router.get("/user/my-coupons",userAuth,cartCount,userCouponController.myCoupons);



module.exports =router;