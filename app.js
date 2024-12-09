const express = require("express");
const app = express();
const path = require("path");
const session = require("express-session");
const nocache = require("nocache");
const env = require("dotenv").config();
const db = require("./config/db");
const userRouter = require("./routes/userRouter");
const passport = require("./config/passport")
const adminRouter = require("./routes/adminRouter")


// Set up the port (use the value from the .env file if available)
const PORT = process.env.PORT || 7777;

// Middleware
app.use(express.json()); // For parsing JSON data
app.use(express.urlencoded({ extended: true })); // For parsing URL-encoded data (form submissions)


app.use(session({
  secret:process.env.SESSION_SECRET,
  resave:false,
  saveUninitialized:true,
  cookie:{
      secure:false,
      httpOnly:true,
      maxAge:72*60*60*1000
  }
}))

app.use(nocache())
app.use(passport.initialize());
app.use(passport.session());


// View engine setup
app.set("view engine", "ejs");
app.set("views", [
  path.join(__dirname, "views/user"),   // User-related views
  path.join(__dirname, "views/admin")   // Admin-related views
]);

// Serving static files from the "public" folder
// app.use(express.static(path.join(__dirname, "public")));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use(express.static(path.join(__dirname, 'public')));





// Routes
app.use('/', userRouter);
app.use('/admin',adminRouter)

app.get('*', (req, res) => {
  // const userId = req.session.user || req.user;
  // if (userId) {
  //   res.render("/")
  // } else {
      res.redirect('/login'); 
  // }
});


// Start the server
// Connect to the database
db().then(()=>{
  // Server listener
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });

}).catch((err)=>{
  console.log(err);
  
})
