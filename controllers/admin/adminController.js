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
       
    }
}
const loadDashboard = async (req, res) => {
    if (req.session.admin) {
        try {
           
            console.log('admin  dashboard rendering...');
            res.render("dashboard"
          
          
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