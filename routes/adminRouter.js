const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin/adminController');
const customerController = require('../controllers/admin/customerController');
const categoryController = require("../controllers/admin/categoryController");
const productController = require("../controllers/admin/productController")
const {userAuth,adminAuth} = require("../middlewares/auth");
const multer = require("multer");
const storage = require("../helpers/multer");
const upload = multer({storage:storage});



router.get('/pageerror',adminController.pageerror);
router.get('/login',adminController.loadLogin);
router.post('/login',adminController.login);
router.get('/dashboard',adminAuth,adminController.loadDashboard);
router.get('/logout',adminController.logout);

//customer management

router.get("/users",adminAuth,customerController.customerInfo)
router.get("/blockCustomer",adminAuth,customerController.customerBlocked);
router.get("/unblockCustomer",adminAuth,customerController.customerUnBlocked);


//category management

router.get("/category",adminAuth,categoryController.categoryInfo);
router.post("/addCategory",adminAuth,categoryController.addCategory);
router.get("/getCategories", adminAuth, categoryController.getCategories);
router.post("/addCategoryOffer",adminAuth,categoryController.addCategoryOffer);
router.post("/removeCategoryOffer", adminAuth, categoryController.removeCategoryOffer);
router.get("/listCategory",adminAuth,categoryController.getListCategory);
router.get("/unlistCategory",adminAuth,categoryController.getUnListCategory);
router.get("/editCategory",adminAuth,categoryController.getEditCategory);
router.get("/editCategory/:id",adminAuth,categoryController.getEditCategory);
router.post("/editCategory/:id", adminAuth, categoryController.editCategory);
router.delete('/deleteCategory', adminAuth, categoryController.deleteCategory);



// product managements
router.get("/addProducts",adminAuth,productController.getProductAddPage);
router.post("/addProducts", adminAuth, upload.fields([
  { name: 'images1', maxCount: 1 },
  { name: 'images2', maxCount: 1 },
  { name: 'images3', maxCount: 1 }
]), productController.addProducts);
router.get("/products",adminAuth,productController.getAllProducts);
router.get("/blockProduct",adminAuth,productController.blockProduct);
router.get("/unblockProduct",adminAuth,productController.unblockProduct);
router.get("/editProduct",adminAuth,productController.getEditProduct);
router.post("/editProduct/:id", adminAuth, upload.fields([
  { name: 'images1', maxCount: 1 },
  { name: 'images2', maxCount: 1 },
  { name: 'images3', maxCount: 1 }
]), productController.editProduct);

router.post("/deleteImage",adminAuth,productController.deleteSingleImage);
router.delete('/deleteProduct', adminAuth, productController.deleteProduct);





 module.exports= router;