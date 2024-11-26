const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");

const User = require("../../models/userSchema")
const Order = require("../../models/orderSchema")
const Offer = require("../../models/offerSchema")

const fs = require("fs");
const path = require("path");
const multer = require("multer");
const sharp = require("sharp")

const { updateProductOfferPrice } = require("./offerController");


const getProductAddPage = async (req,res) => {
    try {
        const category = await Category.find({isListed: true });

        res.render("product-add", {
            cat:category,
    
        });


    } catch (error) {

        res.redirect("/admin/pageerror")
        
    }
};

// const addProducts = async (req, res) => {
//     try {
//         const products = req.body;

//         // Check if product with the same name exists
//         const productExists = await Product.findOne({ productName: products.productName });
//         if (productExists) {
//             return res.status(400).json("Product already exists, please try with another name");
//         }

//         let images = [];

//         // Image processing
//         if (req.files) {
//             for (let field of ['images1', 'images2', 'images3']) {
//                 if (req.files[field] && req.files[field].length > 0) {
//                     const originalImagePath = req.files[field][0].path;

//                     // Extract the original file name without extension
//                     const originalFileName = path.basename(req.files[field][0].filename, path.extname(req.files[field][0].filename));

//                     // Generate a new image name based on the original file name
//                     const resizedImageName = `resized_${originalFileName}.png`; // or use the extension of the original file
//                     const resizedImagePath = path.join('public', 'uploads', 'product-images', resizedImageName);

//                     // Create output directory if it doesn't exist
//                     const directory = path.dirname(resizedImagePath);
//                     if (!fs.existsSync(directory)) {
//                         fs.mkdirSync(directory, { recursive: true });
//                     }

//                     // Resize and save the image
//                     await sharp(originalImagePath)
//                         .resize({ width: 440, height: 440 })
//                         .toFile(resizedImagePath);

//                     // Save filename for DB entry
//                     images.push(resizedImageName);

//                     // Delete the original file after processing
//                     try {
//                         fs.unlinkSync(originalImagePath);
//                     } catch (unlinkError) {
//                         console.error('Error deleting original file:', unlinkError);
//                     }
//                 }
//             }
//         }

//         // Validate and retrieve category ID
//         const categoryId = await Category.findOne({ name: products.category });
//         if (!categoryId) {
//             return res.status(400).json("Invalid category name");
//         }

//         let productStatus = products.quantity > 0 ? "Available" : "out of stock";  // Ensure this matches the schema enum


//         // Offer Price Calculation
//         const offer = await Offer.findOne({ product: categoryId._id });
//         let offerPrice = products.salePrice;

//         if (offer) {
//             const offerValue = offer.discountType === 'percentage'
//                 ? products.salePrice * (offer.discountValue / 100)
//                 : offer.discountValue;
                
//             offerPrice = Math.max(products.salePrice - offerValue, 0);
//         }

//         // Create and save new product
//         const newProduct = new Product({
//             productName: products.productName,
//             description: products.description,
//             SKUNumber: products.SKUNumber,
//             category: categoryId._id,
//             regularPrice: products.regularPrice,
//             salePrice: products.salePrice,
//             offerPrice: offerPrice,
//             createdOn: new Date(),
//             quantity: products.quantity,
//             size: products.size,
//             color: products.color,
//             productImage: images,  // Store the resized image names without timestamp
//             status: productStatus,
//         });

//         await newProduct.save();

//         // Update product offer prices if needed
//         await updateProductOfferPrice();

//         return res.redirect("/admin/addProducts");
//     } catch (error) {
//         console.error("Error Saving product:", error);
//         return res.redirect("/admin/pageerror");
//     }
// };
// const addProducts = async (req, res) => {
//     try {
//         const products = req.body;

//         // Check if product with the same name exists
//         const productExists = await Product.findOne({ productName: products.productName });
//         if (productExists) {
//             return res.status(400).json("Product already exists, please try with another name");
//         }

//         let images = [];

//         // Image processing
//         if (req.files) {
//             for (let field of ['images1', 'images2', 'images3']) {
//                 if (req.files[field] && req.files[field].length > 0) {
//                     const originalImagePath = req.files[field][0].path;

//                     // Extract the original file name without extension
//                     const originalFileName = path.basename(req.files[field][0].filename, path.extname(req.files[field][0].filename));

//                     // Generate a new image name based on the original file name
//                     const resizedImageName = `resized_${originalFileName}.png`; // or use the extension of the original file
//                     const resizedImagePath = path.join('public', 'uploads', 'product-images', resizedImageName);

//                     // Create output directory if it doesn't exist
//                     const directory = path.dirname(resizedImagePath);
//                     if (!fs.existsSync(directory)) {
//                         fs.mkdirSync(directory, { recursive: true });
//                     }

//                     // Resize and save the image
//                     await sharp(originalImagePath)
//                         .resize({ width: 440, height: 440 })
//                         .toFile(resizedImagePath);

//                     // Save filename for DB entry
//                     images.push(resizedImageName);

//                     // Delete the original file after processing
//                     try {
//                         fs.unlinkSync(originalImagePath);
//                     } catch (unlinkError) {
//                         console.error('Error deleting original file:', unlinkError);
//                     }
//                 }
//             }
//         }

//         // Validate and retrieve category ID
//         const categoryId = await Category.findOne({ name: products.category });
//         if (!categoryId) {
//             return res.status(400).json("Invalid category name");
//         }

//         // Set product status based on quantity
//         let productStatus = products.quantity > 0 ? "Available" : "Out of stock";  // Matches schema's status enum

//         // Offer Price Calculation
//         const offer = await Offer.findOne({ product: categoryId._id });
//         let offerPrice = products.salePrice;

//         if (offer) {
//             const offerValue = offer.discountType === 'percentage'
//                 ? products.salePrice * (offer.discountValue / 100)
//                 : offer.discountValue;
                
//             offerPrice = Math.max(products.salePrice - offerValue, 0);
//         }

//         // Create and save new product
//         const newProduct = new Product({
//             productName: products.productName,
//             description: products.description,
//             SKUNumber: products.SKUNumber, // Ensuring SKU is passed
//             category: categoryId._id,
//             regularPrice: products.regularPrice,
//             salePrice: products.salePrice,
//             offerPrice: offerPrice,
//             createdAt: new Date(), // Use 'createdAt' as per your schema
//             quantity: products.quantity,
//             color: products.color,
//             productImage: images,  // Store the resized image names
//             status: productStatus,
//         });

//         // Save the new product to the database
//         await newProduct.save();

//         // Optionally update product offer prices after adding a product
//         await updateProductOfferPrice();

//         // Redirect after saving
//         return res.redirect("/admin/addProducts");
//     } catch (error) {
//         console.error("Error Saving product:", error);
//         return res.redirect("/admin/pageerror");
//     }
// };
const addProducts = async (req, res) => {
    try {
        const products = req.body;

        // Check if product with the same name exists
        const productExists = await Product.findOne({ productName: products.productName });
        if (productExists) {
            return res.status(400).json("Product already exists, please try with another name");
        }

        let images = [];

        // Image processing
        if (req.files) {
            for (let field of ['images1', 'images2', 'images3']) {
                if (req.files[field] && req.files[field].length > 0) {
                    const originalImagePath = req.files[field][0].path;

                    // Extract the original file name without extension
                    const originalFileName = path.basename(req.files[field][0].filename, path.extname(req.files[field][0].filename));

                    // Generate a new image name based on the original file name
                    const resizedImageName = `resized_${originalFileName}.png`; // or use the extension of the original file
                    const resizedImagePath = path.join('public', 'uploads', 'product-images', resizedImageName);

                    // Create output directory if it doesn't exist
                    const directory = path.dirname(resizedImagePath);
                    if (!fs.existsSync(directory)) {
                        fs.mkdirSync(directory, { recursive: true });
                    }

                    // Resize and save the image
                    await sharp(originalImagePath)
                        .resize({ width: 440, height: 440 })
                        .toFile(resizedImagePath);

                    // Save filename for DB entry
                    images.push(resizedImageName);

                    // Delete the original file after processing
                    try {
                        fs.unlinkSync(originalImagePath);
                    } catch (unlinkError) {
                        console.error('Error deleting original file:', unlinkError);
                    }
                }
            }
        }

        // Validate and retrieve category ID
        const categoryId = await Category.findOne({ name: products.category });
        if (!categoryId) {
            return res.status(400).json("Invalid category name");
        }
        console.log(categoryId)

        // Prepare size and quantity data
        const sizes = [];
        const quantity = {};
        console.log("addproduct page");
        
        console.log(products.quantityS,products.quantityM,products.quantityL)
        // Capture size and quantity for S, M, L (or others based on the form data)
        console.log(products.category)
        if(products.category === "Shoes"){
            if ( products.quantityS) {
                sizes.push('7');
                quantity['7'] = parseInt(products.quantityS, 10);
            }
            if ( products.quantityM) {
                sizes.push('8');
                quantity['8'] = parseInt(products.quantityM, 10);
            }
            if ( products.quantityL) {
                sizes.push('9');
                quantity['9'] = parseInt(products.quantityL, 10);
            }
        }else if (products.category === "Clothing"){

        if ( products.quantityS) {
            sizes.push('S');
            quantity['S'] = parseInt(products.quantityS, 10);
        }
        if ( products.quantityM) {
            sizes.push('M');
            quantity['M'] = parseInt(products.quantityM, 10);
        }
        if ( products.quantityL) {
            sizes.push('L');
            quantity['L'] = parseInt(products.quantityL, 10);
        }
    }
        // Set product status based on quantity (if quantity is zero for all sizes, it's out of stock)
        const productStatus = Object.values(quantity).some(q => q > 0) ? "Available" : "Out of stock";

        // Offer Price Calculation
        const offer = await Offer.findOne({ product: categoryId._id });
        let offerPrice = products.salePrice;

        if (offer) {
            const offerValue = offer.discountType === 'percentage'
                ? products.salePrice * (offer.discountValue / 100)
                : offer.discountValue;

            offerPrice = Math.max(products.salePrice - offerValue, 0);
        }

        // Create and save new product
        const newProduct = new Product({
            productName: products.productName,
            description: products.description,
            SKUNumber: products.SKUNumber, // Ensuring SKU is passed
            category: categoryId._id,
            regularPrice: products.regularPrice,
            salePrice: products.salePrice,
            offerPrice: offerPrice,
            createdAt: new Date(),
            quantity: quantity,  // Store quantity object for each size
            color: products.color,
            size: sizes,  // Store size array
            productImage: images,  // Store the resized image names
            status: productStatus,  // Set product status
        });

        // Save the new product to the database
        await newProduct.save();

        // Optionally update product offer prices after adding a product
        await updateProductOfferPrice();

        // Redirect after saving
        return res.redirect("/admin/addProducts");
    } catch (error) {
        console.error("Error Saving product:", error);
        return res.redirect("/admin/pageerror");
    }
};
//new code down

// const addProducts = async (req, res) => {
//     try {
//         const products = req.body;

//         // Check if product with the same name exists
//         const productExists = await Product.findOne({ productName: products.productName });
//         if (productExists) {
//             return res.status(400).json("Product already exists, please try with another name");
//         }

//         let images = [];

//         // Image processing
//         if (req.files) {
//             for (let field of ['images1', 'images2', 'images3']) {
//                 if (req.files[field] && req.files[field].length > 0) {
//                     const originalImagePath = req.files[field][0].path;

//                     // Extract the original file name without extension
//                     const originalFileName = path.basename(req.files[field][0].filename, path.extname(req.files[field][0].filename));

//                     // Generate a new image name based on the original file name
//                     const resizedImageName = `resized_${originalFileName}.png`; // or use the extension of the original file
//                     const resizedImagePath = path.join('public', 'uploads', 'product-images', resizedImageName);

//                     // Create output directory if it doesn't exist
//                     const directory = path.dirname(resizedImagePath);
//                     if (!fs.existsSync(directory)) {
//                         fs.mkdirSync(directory, { recursive: true });
//                     }

//                     // Resize and save the image
//                     await sharp(originalImagePath)
//                         .resize({ width: 440, height: 440 })
//                         .toFile(resizedImagePath);

//                     // Save filename for DB entry
//                     images.push(resizedImageName);

//                     // Delete the original file after processing
//                     try {
//                         fs.unlinkSync(originalImagePath);
//                     } catch (unlinkError) {
//                         console.error('Error deleting original file:', unlinkError);
//                     }
//                 }
//             }
//         }

//         // Validate and retrieve category ID
//         const categoryId = await Category.findOne({ name: products.category });
//         if (!categoryId) {
//             return res.status(400).json("Invalid category name");
//         }

//         // Initialize size array and quantity object
//         const sizes = [];
//         const quantity = {};

//         console.log("addproduct page");
//         console.log(products.quantityS, products.quantityM, products.quantityL, products.size7, products.size8, products.size9);

//         // Handle product size based on product type
//         if (products.productType === 'Shoe') {
//             // If product is a shoe, handle sizes as numbers (e.g., '7', '8', '9')
//             if (products.size7) {
//                 sizes.push('7');
//                 quantity['7'] = parseInt(products.size7, 10);
//             }
//             if (products.size8) {
//                 sizes.push('8');
//                 quantity['8'] = parseInt(products.size8, 10);
//             }
//             if (products.size9) {
//                 sizes.push('9');
//                 quantity['9'] = parseInt(products.size9, 10);
//             }
//         } else if (products.productType === 'Dress') {
//             // If product is a dress, handle sizes as strings (e.g., 'S', 'M', 'L')
//             if (products.quantityS) {
//                 sizes.push('S');
//                 quantity['S'] = parseInt(products.quantityS, 10);
//             }
//             if (products.quantityM) {
//                 sizes.push('M');
//                 quantity['M'] = parseInt(products.quantityM, 10);
//             }
//             if (products.quantityL) {
//                 sizes.push('L');
//                 quantity['L'] = parseInt(products.quantityL, 10);
//             }
//         }

//         // Set product status based on quantity (if quantity is zero for all sizes, it's out of stock)
//         const productStatus = Object.values(quantity).some(q => q > 0) ? "Available" : "Out of stock";

//         // Offer Price Calculation
//         const offer = await Offer.findOne({ product: categoryId._id });
//         let offerPrice = products.salePrice;

//         if (offer) {
//             const offerValue = offer.discountType === 'percentage'
//                 ? products.salePrice * (offer.discountValue / 100)
//                 : offer.discountValue;

//             offerPrice = Math.max(products.salePrice - offerValue, 0);
//         }

//         // Create and save new product
//         const newProduct = new Product({
//             productName: products.productName,
//             description: products.description,
//             SKUNumber: products.SKUNumber, // Ensuring SKU is passed
//             category: categoryId._id,
//             regularPrice: products.regularPrice,
//             salePrice: products.salePrice,
//             offerPrice: offerPrice,
//             createdAt: new Date(),
//             quantity: quantity,  // Store quantity object for each size
//             color: products.color,
//             size: sizes,  // Store size array
//             productImage: images,  // Store the resized image names
//             status: productStatus,  // Set product status
//             productType: products.productType  // Store product type (e.g., 'Shoe' or 'Dress')
//         });

//         // Save the new product to the database
//         await newProduct.save();

//         // Optionally update product offer prices after adding a product
//         await updateProductOfferPrice();

//         // Redirect after saving
//         return res.redirect("/admin/addProducts");
//     } catch (error) {
//         console.error("Error Saving product:", error);
//         return res.redirect("/admin/pageerror");
//     }
// };


// const getAllProducts = async (req, res) => {
//     try {
//         const search = req.query.search || "";
//         const page = parseInt(req.query.page) || 1;  
//         const limit = 10;

        
//         const productData = await Product.find({
//             $or: [
//                 { productName: { $regex: new RegExp(".*" + search + ".*", "i") } },
//             ],
//         })
//             .limit(limit)
//             .skip((page - 1) * limit)
//             .populate("category")    
//             .exec();

        
//         const count = await Product.find({
//             $or: [
//                 { productName: { $regex: new RegExp(".*" + search + ".*", "i") } },
//             ],
//         }).countDocuments();

//         const category = await Category.find({ isListed: true });

        
//         if (category ) {
//             res.render("products", {
//                 data: productData,
//                 currentPage: page,
//                 totalPages: Math.ceil(count / limit), 
//                 cat: category,

//             });
//         } else {
//             res.render("page-404");  
//         }
//     } catch (error) {
//         console.error("Error fetching products:", error);
//         res.redirect("/admin/pageerror");  
//     }
// };


const getAllProducts = async (req, res) => {
    try {
        const search = req.query.search || "";
        const page = parseInt(req.query.page) || 1;  
        const limit = 10;

        // Fetch products with the search query
        const productData = await Product.find({
            $or: [
                { productName: { $regex: new RegExp(".*" + search + ".*", "i") } },
            ],
        })
            .limit(limit)
            .skip((page - 1) * limit)
            .populate("category")    
            .exec();

        // Count the total number of matching products
        const count = await Product.find({
            $or: [
                { productName: { $regex: new RegExp(".*" + search + ".*", "i") } },
            ],
        }).countDocuments();

        // Fetch categories that are listed
        const category = await Category.find({ isListed: true });

        console.log("Product data from- getAllProduct",productData);

        if (category) {
            res.render("products", {
                data: productData,
                currentPage: page,
                totalPages: Math.ceil(count / limit),
                cat: category,
            });
        } else {
            res.render("page-404");
        }
    } catch (error) {
        console.error("Error fetching products:", error);
        res.redirect("/admin/pageerror");
    }
};

const blockProduct = async (req,res) => {
    try {
        
        let id = req.query.id;
        await Product.updateOne({_id:id},{$set:{isBlocked:true}});
        res.redirect("/admin/products")

    } catch (error) {
        res.redirect("/admin/pageerror")
    }
};

const unblockProduct = async (req, res) => {
    try {
        let id = req.query.id;
        
       
        const product = await Product.findById(id);
        
        if (!product) {
            return res.status(404).send("Product not found");
        }
        
       
        product.isBlocked = false;
        
       
        if (product.quantity > 0) {
            product.status = "Available";
        } else {
            product.status = "Out of stock";
        }
        
        await product.save();
        
        res.redirect("/admin/products");
    } catch (error) {
        console.error("Error in unblockProduct:", error);
        res.redirect("/pageerror");
    }
};

// const getEditProduct = async (req, res)=>{
//     try {
//         const id = req.query.id;
//         const product = await Product.findOne({_id:id});
//         const category = await Category.find({});

//         res.render("edit-product",{
//             product:product,
//             cat:category,

//         })
//     } catch (error) {

//         res.redirect("/admin/pageerror")
        
//     }
// };
// const getEditProduct = async (req, res) => {
//     try {
//         const id = req.query.id || req.params.id; // Check both query and params for id
//         if (!id) {
//             return res.redirect("/admin/products"); // Redirect to products page if no ID is provided
//         }

//         // Fetch product by ID
//         const product = await Product.findById(id);
        
//         // If product doesn't exist, handle the error
//         if (!product) {
//             return res.status(404).redirect("/admin/products"); // Or you can show a custom error page
//         }

//         // Fetch all categories
//         const categories = await Category.find({});

//         // Render the product editing page with the product and categories data
//         res.render("edit-product", {
//             product: product,
//             cat: categories
//         });
//     } catch (error) {
//         console.error("Error fetching product details:", error);
//         res.redirect("/admin/pageerror"); // Redirect to a general error page
//     }
// };

const getEditProduct = async (req, res) => {
    try {
        const id = req.query.id;
        const product = await Product.findById(id);  // Fetch the product by ID
        console.log(product);  // Log the product data to verify the structure
        const category = await Category.find({});

        res.render("edit-product", {
            product: product,
            cat: category,
        });
    } catch (error) {
        res.redirect("/admin/pageerror");
    }
};


// const editProduct = async (req, res) => {
//     try {
//         const id = req.params.id;
//         const data = req.body;

//         const existingProduct = await Product.findOne({
//             productName: data.productName,
//             _id: { $ne: id }
//         });

//         if (existingProduct) {
//             return res.status(400).json({ error: "Product with this name already exists. Please try another name." });
//         }

//         const images =[];

//         if(req.files  && req.files.length>0){
//             for(let i=0;i<req.files.length;i++){
//                 images.push(req.files[i].filename);
//             }
//         }

//         const category = await Category.findOne({ name: data.category });
//         if (!category) {
//             return res.status(400).json({ error: "Invalid category name" });
//         }



//         const updateFields = {
//             productName: data.productName,
//             description: data.description,
//             category: category._id, 

//             regularPrice: data.regularPrice,
//             salePrice: data.salePrice,
//             quantity: data.quantity,
//             color: data.color
//         };


//         if (req.files.length>0){
//             updateFields.$push = {productImages:{$each:images}}
//         }
//         await Product.findByIdAndUpdate(id, updateFields, { new: true });
      





//         const updatedProduct = await Product.findByIdAndUpdate(id, updateFields, { new: true });

//         if (updatedProduct.quantity == 0) {
//             updatedProduct.status = "Out of stock";
//         } else {
//             updatedProduct.status = "Available";
//         }

//         await updatedProduct.save();

  

//         res.redirect("/admin/products");

//     } catch (error) {
//         console.error(error);
//         res.redirect("/admin/pageerror");
//     }
// };

// const editProduct = async (req, res) => {
//     try {
//         const id = req.params.id;
//         const data = req.body;

//         // Check if the product with the same name already exists (excluding the current product)
//         const existingProduct = await Product.findOne({
//             productName: data.productName,
//             _id: { $ne: id } // Ensure we are not checking the current product itself
//         });

//         if (existingProduct) {
//             return res.status(400).json({ error: "Product with this name already exists. Please try another name." });
//         }

//         let images = [];

//         // Image processing if new images are uploaded
//         if (req.files && req.files.length > 0) {
//             for (let i = 0; i < req.files.length; i++) {
//                 images.push(req.files[i].filename); // Save the image file names to the images array
//             }
//         }

//         // Validate category
//         const category = await Category.findOne({ name: data.category });
//         if (!category) {
//             return res.status(400).json({ error: "Invalid category name" });
//         }

//         // Determine product status based on quantity
//         let productStatus = data.quantity > 0 ? "Available" : "Out of stock"; // Based on the quantity, set the status

//         // Offer Price Calculation (if applicable)
//         const offer = await Offer.findOne({ product: category._id });  // Assuming the offer is related to the category
//         let offerPrice = data.salePrice;

//         if (offer) {
//             const offerValue = offer.discountType === 'percentage'
//                 ? data.salePrice * (offer.discountValue / 100)
//                 : offer.discountValue;
                
//             offerPrice = Math.max(data.salePrice - offerValue, 0);
//         }

//         // Update fields for the product
//         const updateFields = {
//             productName: data.productName,
//             description: data.description,
//             category: category._id, // Use category _id for product category reference
//             regularPrice: data.regularPrice,
//             salePrice: data.salePrice,
//             offerPrice: offerPrice, // Include offerPrice if any offers apply
//             quantity: data.quantity,
//             color: data.color,
//             size: data.size, // Ensure that sizes are updated correctly
//             status: productStatus, // Update the status based on quantity
//         };

//         // If new images are uploaded, add them to the productImages array
//         if (images.length > 0) {
//             updateFields.$push = { productImage: { $each: images } }; // Use $push with $each to add multiple images
//         }

//         // Update the product
//         const updatedProduct = await Product.findByIdAndUpdate(id, updateFields, { new: true });

//         // After update, check and set the product status again in case quantity has changed
//         if (updatedProduct.quantity == 0) {
//             updatedProduct.status = "Out of stock";
//         } else {
//             updatedProduct.status = "Available";
//         }

//         // Save the updated product to ensure status is persisted
//         await updatedProduct.save();

//         // Redirect to the products page after successful update
//         res.redirect("/admin/products");

//     } catch (error) {
//         console.error("Error editing product:", error);
//         res.redirect("/admin/pageerror");
//     }
// };

// const editProduct = async (req, res) => {
//     try {
//         const id = req.params.id;
//         const data = req.body;

//         // Check if the product with the same name already exists (excluding the current product)
//         const existingProduct = await Product.findOne({
//             productName: data.productName,
//             _id: { $ne: id } // Ensure we are not checking the current product itself
//         });

//         if (existingProduct) {
//             return res.status(400).json({ error: "Product with this name already exists. Please try another name." });
//         }

//         let images = [];

//         // Image processing if new images are uploaded
//         if (req.files) {
//             for (let field of ['images1', 'images2', 'images3']) {
//                 if (req.files[field] && req.files[field].length > 0) {
//                     const originalImagePath = req.files[field][0].path;

//                     // Extract the original file name without extension
//                     const originalFileName = path.basename(req.files[field][0].filename, path.extname(req.files[field][0].filename));

//                     // Generate a new image name
//                     const resizedImageName = `resized_${originalFileName}.png`;
//                     const resizedImagePath = path.join('public', 'uploads', 'product-images', resizedImageName);

//                     // Create output directory if it doesn't exist
//                     const directory = path.dirname(resizedImagePath);
//                     if (!fs.existsSync(directory)) {
//                         fs.mkdirSync(directory, { recursive: true });
//                     }

//                     // Resize and save the image
//                     await sharp(originalImagePath)
//                         .resize({ width: 440, height: 440 })
//                         .toFile(resizedImagePath);

//                     // Save filename for DB entry
//                     images.push(resizedImageName);

//                     // Delete the original file after processing
//                     try {
//                         fs.unlinkSync(originalImagePath);
//                     } catch (unlinkError) {
//                         console.error('Error deleting original file:', unlinkError);
//                     }
//                 }
//             }
//         }

//         // Validate category
//         const category = await Category.findOne({ name: data.category });
//         if (!category) {
//             return res.status(400).json({ error: "Invalid category name" });
//         }

//         // Prepare size and quantity data
//         const sizes = [];
//         const quantity = {};
//         console.log("--------------------------------------")
//         console.log(data.quantityS,data.quantityM,data.quantityL)
//         if(data.category === "Shoes"){

//             if ( data.quantityS) {
//                 sizes.push('7');
//                 quantity['7'] = parseInt(data.quantityS, 10);
//             }
//             if ( data.quantityM) {
//                 sizes.push('8');
//                 quantity['8'] = parseInt(data.quantityM, 10);
//             }
//             if ( data.quantityL) {
//                 sizes.push('9');
//                 quantity['9'] = parseInt(data.quantityL, 10);
//             }
//         }else if (data.category === "Clothing"){

//             if (data.quantityS) {
//                 sizes.push('S');
//                 quantity['S'] = parseInt(data.quantityS, 10);
//             }
//             if (data.quantityM) {
//                 sizes.push('M');
//                 quantity['M'] = parseInt(data.quantityM, 10);
//             }
//             if (data.quantityL) {
//                 sizes.push('L');
//                 quantity['L'] = parseInt(data.quantityL, 10);
//             }
//     }
       

//         // Set product status based on quantity (if quantity is zero for all sizes, it's out of stock)
//         const productStatus = Object.values(quantity).some(q => q > 0) ? "Available" : "Out of stock";

//         // Offer Price Calculation
//         const offer = await Offer.findOne({ product: category._id });
//         let offerPrice = data.salePrice;

//         if (offer) {
//             const offerValue = offer.discountType === 'percentage'
//                 ? data.salePrice * (offer.discountValue / 100)
//                 : offer.discountValue;

//             offerPrice = Math.max(data.salePrice - offerValue, 0);
//         }

//         // Prepare updated fields
//         const updateFields = {
//             productName: data.productName,
//             description: data.description,
//             category: category._id,
//             regularPrice: data.regularPrice,
//             salePrice: data.salePrice,
//             offerPrice: offerPrice,
//             quantity: quantity,  // This will store the quantity of sizes (S, M, L)
//             color: data.color,
//             size: sizes,  // This will store the available sizes for the product
//             status: productStatus,
//         };

//         // If new images are uploaded, add them to the productImages array
//         if (images.length > 0) {
//             updateFields.$push = { productImage: { $each: images } };
//         }

//         // Update the product
//         const updatedProduct = await Product.findByIdAndUpdate(id, updateFields, { new: true });

//         // Save the updated product to persist any changes
//         await updatedProduct.save();

//         // Redirect to the products page after successful update
//         res.redirect("/admin/products");

//     } catch (error) {
//         console.error("Error editing product:", error);
//         res.redirect("/admin/pageerror");
//     }
// };

const editProduct = async (req, res) => {
    try {
        const id = req.params.id;
        const data = req.body;

        // Validate product name uniqueness
        const existingProduct = await Product.findOne({
            productName: data.productName,
            _id: { $ne: id }, // Exclude current product
        });

        if (existingProduct) {
            return res.status(400).json({ error: "Product with this name already exists. Please try another name." });
        }

        let images = [];

        // Process uploaded images
        if (req.files) {
            for (let field of ['images1', 'images2', 'images3']) {
                if (req.files[field] && req.files[field].length > 0) {
                    const originalImagePath = req.files[field][0].path;

                    // Extract the original file name
                    const originalFileName = path.basename(req.files[field][0].filename, path.extname(req.files[field][0].filename));

                    // Define resized image path
                    const resizedImageName = `resized_${originalFileName}.png`;
                    const resizedImagePath = path.join('public', 'uploads', 'product-images', resizedImageName);

                    // Ensure output directory exists
                    const directory = path.dirname(resizedImagePath);
                    if (!fs.existsSync(directory)) {
                        fs.mkdirSync(directory, { recursive: true });
                    }

                    // Resize and save the image
                    await sharp(originalImagePath)
                        .resize({ width: 440, height: 440 })
                        .toFile(resizedImagePath);

                    images.push(resizedImageName);

                    // Delete the original image file
                    try {
                        await fs.promises.unlink(originalImagePath);
                    } catch (unlinkError) {
                        console.error('Error deleting original file:', unlinkError);
                    }
                }
            }
        }

        // Validate category
        const category = await Category.findOne({ name: data.category });
        if (!category) {
            return res.status(400).json({ error: "Invalid category name" });
        }

        // Prepare size and quantity
        const sizes = [];
        const quantity = {
            S: parseInt(data.quantityS || 0, 10),
            M: parseInt(data.quantityM || 0, 10),
            L: parseInt(data.quantityL || 0, 10),
        };

        if (data.category === "Shoes") {
            if (quantity.S > 0) sizes.push("7");
            if (quantity.M > 0) sizes.push("8");
            if (quantity.L > 0) sizes.push("9");
        } else if (data.category === "Clothing") {
            if (quantity.S > 0) sizes.push("S");
            if (quantity.M > 0) sizes.push("M");
            if (quantity.L > 0) sizes.push("L");
        }

        // Set product status based on quantity (if quantity is zero for all sizes, it's out of stock)
        const productStatus = Object.values(quantity).some(q => q > 0) ? "Available" : "Out of stock";
        console.log(productStatus)
        // Offer Price Calculation
        const offer = await Offer.findOne({ product: category._id });
        let offerPrice = data.salePrice;

        if (offer) {
            const offerValue = offer.discountType === 'percentage'
                ? data.salePrice * (offer.discountValue / 100)
                : offer.discountValue;

            offerPrice = Math.max(data.salePrice - offerValue, 0);
        }

        // Prepare updated fields
        const updateFields = {
            productName: data.productName,
            description: data.description,
            category: category._id,
            regularPrice: data.regularPrice,
            salePrice: data.salePrice,
            offerPrice: offerPrice,
            quantity: quantity,  // This will store the quantity of sizes (S, M, L)
            color: data.color,
            size: sizes,  // This will store the available sizes for the product
            status: productStatus,
        };

        // If new images are uploaded, add them to the productImages array
        if (images.length > 0) {
            updateFields.$push = { productImage: { $each: images } };
        }

        // Update the product
        const updatedProduct = await Product.findByIdAndUpdate(id, updateFields, { new: true });

        // Save the updated product to persist any changes
        await updatedProduct.save();

        // Redirect to the products page after successful update
        res.redirect("/admin/products");
    } catch (error) {
        console.error("Error editing product:", error);
        res.redirect("/admin/pageerror");
    }
};

  

const deleteSingleImage = async (req, res) => {
    try {
        const { imageNameToServer, productIdToServer } = req.body;
        const product = await Product.findByIdAndUpdate(productIdToServer, { $pull: { productImage: imageNameToServer } });

        
        const imagePath = path.join("public", "uploads", "product-images", imageNameToServer);
        if (fs.existsSync(imagePath)) {
            await fs.unlinkSync(imagePath);
            console.log(`Image ${imageNameToServer} deleted successfully`);
        } else {
            console.log(`Image ${imageNameToServer} not found`);
        }

        
        res.send({ status: true });

    } catch (error) {
        console.error(error);
        res.redirect("/admin/pageerror");
    }
};

const deleteProduct = async (req, res) => {
    try {
      const id = req.query.id;
      const deletedProduct= await Product.findByIdAndDelete(id);
  
      if (deletedProduct) {
        res.json({ status: true, message: 'Product successfully deleted' });
      } else {
        res.status(404).json({ status: false, message: 'Product not found' });
      }
    } catch (error) {
      res.status(500).json({ status: false, message: 'Internal server error' });
    }
};

module.exports = {
    getProductAddPage,
    addProducts,
    getAllProducts,
    blockProduct,
    unblockProduct,
    getEditProduct,
    editProduct,
    deleteSingleImage,
    deleteProduct
}

