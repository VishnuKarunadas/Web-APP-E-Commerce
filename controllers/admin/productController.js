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
        //     const sizes = [];
        //     const quantity = {};
        //     console.log("addproduct page");
            
        //     console.log(products.quantityS,products.quantityM,products.quantityL)
        //     // Capture size and quantity for S, M, L (or others based on the form data)
        //     console.log(products.category)
        //     if(products.category === "Shoes"){
        //         if ( products.quantityS) {
        //             sizes.push('7');
        //             quantity['7'] = parseInt(products.quantityS, 10);
        //         }
        //         if ( products.quantityM) {
        //             sizes.push('8');
        //             quantity['8'] = parseInt(products.quantityM, 10);
        //         }
        //         if ( products.quantityL) {
        //             sizes.push('9');
        //             quantity['9'] = parseInt(products.quantityL, 10);
        //         }
        //     }else if (products.category === "Clothing"){

        //     if ( products.quantityS) {
        //         sizes.push('S');
        //         quantity['S'] = parseInt(products.quantityS, 10);
        //     }
        //     if ( products.quantityM) {
        //         sizes.push('M');
        //         quantity['M'] = parseInt(products.quantityM, 10);
        //     }
        //     if ( products.quantityL) {
        //         sizes.push('L');
        //         quantity['L'] = parseInt(products.quantityL, 10);
        //     }
        // }
        //     // Set product status based on quantity (if quantity is zero for all sizes, it's out of stock)
        //     const productStatus = Object.values(quantity).some(q => q > 0) ? "Available" : "Out of stock";

                // Prepare size and quantity
                const quantity = {};
            

                if (products.category === "Shoes") {
                    if (parseInt(products.quantityS || 0, 10) > 0) quantity["7"] = parseInt(products.quantityS, 10);
                    if (parseInt(products.quantityM || 0, 10) > 0) quantity["8"] = parseInt(products.quantityM, 10);
                    if (parseInt(products.quantityL || 0, 10) > 0) quantity["9"] = parseInt(products.quantityL, 10);
                } else if (products.category === "Clothing") {
                    if (parseInt(products.quantityS || 0, 10) > 0) quantity["S"] = parseInt(products.quantityS, 10);
                    if (parseInt(products.quantityM || 0, 10) > 0) quantity["M"] = parseInt(products.quantityM, 10);
                    if (parseInt(products.quantityL || 0, 10) > 0) quantity["L"] = parseInt(products.quantityL, 10);
                }
                
                // Extract sizes for frontend or other processing
                const sizes = Object.keys(quantity);
                
                // Set product status based on quantity (if quantity is zero for all sizes, it's out of stock)
                const productStatus = Object.values(quantity).some(q => q > 0) ? "Available" : "Out of stock";
                
                console.log("Sizes:", sizes);
                console.log("Quantity:", quantity);
                console.log("Product Status:", productStatus);
                
                

            // Offer Price Calculation
            const offer = await Offer.findOne({ product: categoryId._id });
            let offerPrice = products.salePrice;
            console.log(offerPrice)

            if (offer) {
                const offerValue = offer.discountType === 'percentage'
                    ? products.salePrice * (offer.discountValue / 100)
                    : offer.discountValue;

                // Ensure offerPrice is rounded to two decimal places
                offerPrice = Math.max(parseFloat((products.salePrice - offerValue).toFixed(2)), 0);
            }
            console.log(offerPrice)

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
         
       
        const size_1 =product.size[0];
        const size_2 =product.size[1];
        const size_3 =product.size[2];

       
        if  (product.quantity[size_1] > 0 || product.quantity[size_2] > 0 || product.quantity[size_3] > 0) {
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


const getEditProduct = async (req, res) => {
    try {
        const id = req.query.id;
        const product = await Product.findById(id);  // Fetch the product by ID
        console.log("-----------------------------------")
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
        const quantity = {};

        if (data.category === "Shoes") {
            if (parseInt(data.quantityS || 0, 10) > 0) quantity["7"] = parseInt(data.quantityS, 10);
            if (parseInt(data.quantityM || 0, 10) > 0) quantity["8"] = parseInt(data.quantityM, 10);
            if (parseInt(data.quantityL || 0, 10) > 0) quantity["9"] = parseInt(data.quantityL, 10);
        } else if (data.category === "Clothing") {
            if (parseInt(data.quantityS || 0, 10) > 0) quantity["S"] = parseInt(data.quantityS, 10);
            if (parseInt(data.quantityM || 0, 10) > 0) quantity["M"] = parseInt(data.quantityM, 10);
            if (parseInt(data.quantityL || 0, 10) > 0) quantity["L"] = parseInt(data.quantityL, 10);
        }
        
        // Extract sizes for frontend or other processing
        const sizes = Object.keys(quantity);
        
        // Set product status based on quantity (if quantity is zero for all sizes, it's out of stock)
        const productStatus = Object.values(quantity).some(q => q > 0) ? "Available" : "Out of stock";
        
        console.log("Sizes:", sizes);
        console.log("Quantity:", quantity);
        console.log("Product Status:", productStatus);
        
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

