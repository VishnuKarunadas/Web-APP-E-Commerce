const express = require("express");
const app = express();
const path = require("path");
const env = require("dotenv").config();
const db = require("./config/db");
const userRouter = require("./routes/userRouter");

// Connect to the database
db();

// Set up the port (use the value from the .env file if available)
const PORT = process.env.PORT || 7777;

// Middleware
app.use(express.json()); // For parsing JSON data
app.use(express.urlencoded({ extended: true })); // For parsing URL-encoded data (form submissions)

// View engine setup
app.set("view engine", "ejs");
app.set("views", [
  path.join(__dirname, "views/user"),   // User-related views
  path.join(__dirname, "views/admin")   // Admin-related views
]);

// Serving static files from the "public" folder
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use('/', userRouter);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
