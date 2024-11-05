




const pageNotFound = async (req,res)=>{
    try {
        res.render("page-404")
    } catch (error) {
        res.redirect('/pageNotFound')
    }
}


const loadHomepage = async (req,res) => {
    try {
        console.log("Rendering the homepage...");
        return res.render("home");
        // res.send("hii")

    } catch (error) {
        console.log("Home page not fount");
        res.status(500).send("Server error :- Home page not found");

        
    }
}

module.exports = {
    loadHomepage,
    pageNotFound,
}