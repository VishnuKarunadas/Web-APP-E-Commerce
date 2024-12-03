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
const userWalletController = require("../controllers/user/userWalletController");
const userAccountController = require("../controllers/user/userAccountController");



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

//about
router.get("/about" ,userController.about);

//google auth
router.get('/auth/google',passport.authenticate('google',{scope:['profile','email']}));
// router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/signup'}),(req,res)=>{
//     res.redirect('/')
// });
router.get('/auth/google/callback', passport.authenticate('google', {failureRedirect: '/signup'}), (req, res) => {
    req.session.user = { 
        _id: req.user._id, 
        name: req.user.name, 
        email: req.user.email 
    };
res.redirect('/');
})
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
router.post("/send-currentPassword", userProfileController.conformCurrentPassword);
router.post("/verify-otp", userProfileController.verifyOtp);
router.post("/update-password", userProfileController.updatePassword);

// user account management
router.get("/user/account",userAuth,cartCount,setBreadcrumbs,userAccountController.userAccount);
router.post("/user/account/edit-user/:id", userAuth,cartCount,userAccountController.editUser);


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
router.post("/add-cart",userCartController.addToCart)
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
router.post("/user/my-order/order-details/re-checkout/:orderId", userAuth,userOrderController.confirmRePayment);
router.post("/user/my-order/order-details", userAuth,cartCount,setBreadcrumbs,userOrderController.orderDetails);
router.get("/user/my-order/:orderId/download-invoice/:itemId", userAuth, userOrderController.downloadInvoice);

//ratings
router.get("/user/my-order/order-details/rate-product/:productId", userAuth,cartCount,setBreadcrumbs,userRatingController.getRateProduct);
router.post("/user/my-order/order-details/rate-product/", userAuth,cartCount,setBreadcrumbs,userRatingController.submitRating);


// wishlist management

router.get("/wishlist",userAuth,cartCount,setBreadcrumbs,userWishlistController.loadWishlist);
router.post("/add-wishlist",userWishlistController.addToWishlist);
router.post("/wishlist/remove-from-wishlist",userWishlistController.removeFromWishlist);
router.delete('/wishlist/remove-deleted-item',userAuth,userWishlistController.removeDeletedItem);


// coupon management

router.get("/user/my-coupons",userAuth,cartCount,userCouponController.myCoupons);

// wallet management

router.get("/user/my-wallet",userAuth,cartCount,setBreadcrumbs,userWalletController.wallet);
router.post('/user/check-wallet-balance', userAuth,userWalletController.checkWalletBalance);
router.post('/user/add-to-wallet', userAuth,userWalletController.addToWallet);
// router.post("/user/wallet/razorpay-checkout",userAuth,userWalletController.razorpayCheckoutForWallet);
// router.post('/user/wallet/verify-razorpay-payment',userAuth,userWalletController.verifyRazorpayPaymentForWallet);




module.exports =router;