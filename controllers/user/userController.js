const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const User =require("../../models/userSchema")
const Wallet = require("../../models/walletSchema");
const Cart = require("../../models/cartSchema")
const ReferralOffer = require("../../models/referralOfferSchema");
const Category = require("../../models/categorySchema");
const Product = require("../../models/productSchema");




const pageNotFound = async (req,res)=>{
    try {
        res.render("page-404")
    } catch (error) {
        res.redirect('/pageNotFound')
    }
}
const loadSignUp = async (req,res) => {
    try {
        console.log("Rendering the signup...");
        return res.render("signup");
 

    } catch (error) {
        console.log("loadSignUp page not found");
        res.status(500).send("Server error :- loadSignUp page not found");

        
    }
}


function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
  
  async function sendVerificationEmail(email, otp) {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
          user: process.env.NODEMAILER_EMAIL,
          pass: process.env.NODEMAILER_PASSWORD,
        },
      });
  
      const info = await transporter.sendMail({
        from: process.env.NODEMAILER_EMAIL,
        to: email,
        subject: "Verify your account",
        text: `Your OTP is ${otp}`,
        html: `<b>Your OTP: ${otp}</b>`,
      });
  
      return info.accepted.length > 0;
    } catch (error) {
      console.error("Error sending email", error);
      return false;
    }
  }
  
const SignUp = async (req, res, next) => {
    try {
      const { name, phone, email, password, cPassword, refCode } = req.body;
  
      if (password !== cPassword) {
        return res.render("signup", { message: "Passwords are not matching" });
      }
      const findUser = await User.findOne({ email });
  
      if (findUser) {
        return res.render("signup", {
          message: "User with this email already exists",
        });
      }
  
      const otp = generateOtp();
  
      const emailSent = await sendVerificationEmail(email, otp);
  
      if (!emailSent) {
        return res.json("email-error");
      }
  
      req.session.userOtp = otp;
      req.session.userData = { name, phone, email, password, refCode };
  
      res.render("verify-otp");
  
      console.log(refCode);
  
      console.log("OTP Sent", otp);
    } catch (error) {
      next(error);
    }
  };
  
  const securePassword = async (password) => {
    try {
      const passwordHash = await bcrypt.hash(password, 10);
      return passwordHash;
    } catch (error) {
      next(error);
    }
  };
  
  const verifyOtp = async (req, res) => {
    try {
      const { otp } = req.body;
  
      if (otp !== req.session.userOtp) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid OTP, Please try again" });
      }
  
      const user = req.session.userData;
      const passwordHash = await securePassword(user.password);
  
      const existingUser = await User.findOne({
        $or: [{ email: user.email }, { phone: user.phone }],
      });
  
      if (existingUser) {
        return res
          .status(409)
          .json({
            success: false,
            message: "User with this email or phone already exists",
          });
      }
  
      const saveUserData = new User({
        name: user.name,
        email: user.email,
        phone: user.phone,
        password: passwordHash,
      });
  
      await saveUserData.save();
  
      const newWallet = new Wallet({ user: saveUserData._id, balance: 0 });
      await newWallet.save();
  
      saveUserData.wallet = newWallet._id;
      await saveUserData.save();
  
      const newCart = new Cart({ userId: saveUserData._id, items: [] });
      await newCart.save();
  
      
      saveUserData.cart = newCart._id;
  
      await saveUserData.save();
  
    //   if (user.refCode) {
    //     await applyReferralOffer(saveUserData._id, user.refCode);
    //   }
  
      req.session.user = saveUserData._id;
      sessionActive = true;
  
      res.status(200).json({ success: true, redirectUrl: "/" });
    } catch (error) {
      console.error("Error Verifying OTP", error);
      res.status(500).json({ success: false, message: "An error occurred" });
    }
  };
  
  const resendOtp = async (req, res, next) => {
    try {
      const { email } = req.session.userData;
      if (!email) {
        return res
          .status(400)
          .json({ success: false, message: "Email not found in session" });
      }
  
      const otp = generateOtp();
      req.session.userOtp = otp;
  
      const emailSent = await sendVerificationEmail(email, otp);
      if (emailSent) {
        console.log("Resend OTP :", otp);
        res
          .status(200)
          .json({ success: true, message: "OTP Resend Successfully" });
      } else {
        console.log("Failed to send OTP to:", email);
        res
          .status(500)
          .json({
            success: false,
            message: "Failed to resend OTP, Please try again",
          });
      }
    } catch (error) {
      console.error("Error resending OTP", error);
      next(error);
    }
  };


  const loadHomepage = async (req, res, next) => {
    try {
    
  
     
      const currentPage = parseInt(req.query.page) || 1;
      const productsPerPage = 8; 
  
     
      const categories = await Category.find({ isListed: true });
  
      let productData = await Product.find({
        isBlocked: false,
        category: { $in: categories.map(category => category._id) },
        quantity: { $gte: 0 }
      });
  
      
      const totalProducts = productData.length;
  

      const totalPages = Math.ceil(totalProducts / productsPerPage);
  
      // Slice the product data to only include the products for the current page
      const startIndex = (currentPage - 1) * productsPerPage;
      productData = productData.slice(startIndex, startIndex + productsPerPage);
  
      // Log product image data to ensure it's correct
      console.log("Product Images:", productData.map(product => product.productImage));
      let userId = req.user || req.session.user;
    let userData = userId
      ? await User.findById(userId).populate("cart").exec()
      : null;
    if (userData && userData.cart && !userData.cart.items) {
      userData.cart.items = [];
    }

    res.locals.user = userData;
  
      // If the user is logged in, retrieve the user's cart items
     
        
        // Render homepage with user, cart items, product data
        return res.render("home", {
          user: userData,
          // cartItems,
          products: productData,
          currentPage,
          totalPages,
          sortBy: req.query.sortBy || 'name' // Example: you may want to handle sorting
        })
    } catch (error) {
      console.log("Error loading homepage:", error);
      next(error);
    }
  };
  
  
  

const loadLogin = async(req,res)=>{
    try {
        if(!req.session.user){
            console.log("Rendering the loginpage...");
            return res.render('login')
        }else{
            res.redirect('/')
        }
    } catch (error) {
        res.redirect("/pageNotFound")
    }
}

const login = async (req, res, next) => {
  try {
  
    const { email, password, googleId } = req.body;

    let findUser = await User.findOne({ email: email }).populate('cart wallet');

    if (googleId) {
      if (!findUser) {
      
        findUser = new User({
          email: email,
          googleId: googleId,
          role: "user",
          isVerified: true
        });
        await findUser.save(); 
      
      
        const newWallet = new Wallet({ user: findUser._id, balance: 0 });
        await newWallet.save();
        findUser.wallet = newWallet._id;

        const newCart = new Cart({ userId: findUser._id, items: [] });
        await newCart.save();
        findUser.cart = newCart._id;

        await findUser.save();
      } else {
        
        if (!findUser.googleId) {
        
          findUser.googleId = googleId;
        }

    
        if (!findUser.wallet) {
          const newWallet = new Wallet({ user: findUser._id, balance: 0 });
          await newWallet.save();
          findUser.wallet = newWallet._id;
        }

        if (!findUser.cart) {
          const newCart = new Cart({ userId: findUser._id, items: [] });
          await newCart.save();
          findUser.cart = newCart._id;
        }

        await findUser.save();
      }

      req.session.user = findUser.toObject(); 
      sessionActive = true;
      return res.redirect("/");
    }

    if (!findUser) {
      return res.render("login", { message: "User not found" });
    }

    if (findUser.isBlocked) {
      return res.render("login", { message: "User is blocked by admin" });
    }

    if (!findUser.password) {
      return res.render("login", { message: "Please use Google Sign-In for this account" });
    }

    const passwordMatch = await bcrypt.compare(password, findUser.password);

    if (!passwordMatch) {
      return res.render("login", { message: "Incorrect password" });
    }

    req.session.user = findUser._id;
    sessionActive = true;

    res.redirect("/");

  } catch (error) {
    console.error("Login error:", error);
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.log("Session destruction error", err.message);
        return res.redirect("/pageNotFound");
      }
      sessionActive = false;
      return res.redirect("/login");
    });
  } catch (error) {
    console.log("logout error", error);
    next(error);
  }
};

module.exports = {
    loadHomepage,
    pageNotFound,
    loadSignUp,
    SignUp,
    verifyOtp,
    resendOtp,
    loadLogin,
    login,
    logout,
}