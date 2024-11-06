const User = require ('../../models/userSchema');
const bcrypt = require('bcrypt');
const mongoose = require("mongoose");

const pageerror =  (req,res)=>{
    res.render("admin-error")
}

const loadLogin =(req,res)=>{
    if(req.session.admin){
        return res.redirect("/admin/dashboard")
    }
    console.log('admin login rendering ...');
    res.render("admin-login",{message:null})
}
const login = async (req, res)=>{
    try {
        const {email, password} = req.body;
        const admin = await User.findOne({email, role:"admin"});
        // if (!admin) {
        //     return res.redirect("/login");
        // }

        if(admin){
            const passwordMatch = await bcrypt.compare(password, admin.password);
            if(passwordMatch) {
                req.session.admin = true;
                return res.redirect('/admin/dashboard');
            }else {
                return res.redirect("/admin/login")
            }
        }else {
            return res.redirect("/admin/login")
        }
    } catch (error) {

        console.log("login error", error);
        return res.redirect('/pageerror')
        // next(error)
    }
}
const loadDashboard = async (req, res) => {
    if (req.session.admin) {
        try {
            // const filter = req.query.filter || 'yearly';
            // const customStartDate = req.query.startDate;
            // const customEndDate = req.query.endDate;

            // let startDate, endDate;
            // const now = new Date();

            // switch (filter) {
            //     case 'yearly':
            //         startDate = new Date(now.getFullYear(), 0, 1);
            //         endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
            //         break;
            //     case 'monthly':
            //         startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            //         endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
            //         break;
            //     case 'weekly':
            //         startDate = new Date(now.setDate(now.getDate() - now.getDay()));
            //         endDate = new Date(now.setDate(now.getDate() - now.getDay() + 6));
            //         endDate.setHours(23, 59, 59);
            //         break;
            //     case 'daily':
            //         startDate = new Date(now.setHours(0, 0, 0, 0));
            //         endDate = new Date(now.setHours(23, 59, 59, 999));
            //         break;
            //     case 'custom':
            //         startDate = new Date(customStartDate);
            //         endDate = new Date(customEndDate);
            //         endDate.setHours(23, 59, 59, 999);
            //         break;
            //     default:
            //         startDate = new Date(now.getFullYear(), 0, 1);
            //         endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
            // }

            // const formatDate = (date) => {
            //     return date.toISOString().split('T')[0];
            // };

            // const categorySalesData = await getCategorySalesData(startDate, endDate);
            // const paymentMethodsData = await getPaymentMethodsData(startDate, endDate);

            // const topProducts = await getTopSellingItems('product', 10, startDate, endDate);
            // const topCategories = await getTopSellingItems('category', 10, startDate, endDate);
            // const topBrands = await getTopSellingItems('brand', 10, startDate, endDate);

            // const chartData = {
            //     categorySalesData: categorySalesData.length ? categorySalesData : [{ category: 'No Data', totalSales: 0 }],
            //     paymentMethodsData: paymentMethodsData.length ? paymentMethodsData : [{ _id: 'No Data', count: 0 }],
            // };
            console.log('admin  dashboard rendering...');
            res.render("dashboard"
            //     , {
            //     ...chartData,
            //     topProducts,
            //     topCategories,
            //     topBrands,
            //     filter,
            //     customStartDate: formatDate(startDate),
            //     customEndDate: formatDate(endDate)
            // }
        );
        } catch (error) {
            console.log("Unexpected error during loading dashboard", error);
            res.status(500).send("An error occurred while loading the dashboard");
        }
    } else {
        res.redirect('/admin/login');
    }
};

const logout = async (req,res)=>{
    try {
        
        req.session.destroy(err =>{
            if(err){
                console.log("error destroying session",err);
                return res.redirect("/admin/pageerror");
            }
            console.log("admin logout");
            res.redirect("/admin/login");
        })

    } catch (error) {
        console.log("unexpected error during logout",error);
        res.redirect("/admin/pageerror");
    }
}





module.exports ={
    loadLogin,
    login,
    loadDashboard,
    pageerror,
    logout,
}