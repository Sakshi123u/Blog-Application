const express = require('express');
// const mongoose = require("mongoose");
const path = require('path');
const cookieParser = require('cookie-parser');
const Blog=require('./models/Blog');
const userRoute = require('./routes/user');
const blogRoute = require('./routes/blog');
const { connectMongoDB } = require('./connect');
const { checkForAuthenticationCookie } = require('./middlewares/authentication');
const app = express();
const PORT = 8000;

// Connect to MongoDB
connectMongoDB("mongodb://127.0.0.1:27017/blogify")
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB', err));
// mongoose.connect('mongodb://localhost:27017/blogify')
//     .then(() => console.log("MongoDB Connected"))
//     .catch(err => console.error("MongoDB connection error:", err));
    
// Set the views directory
app.set('views', path.join(__dirname, 'views'));
// Set view engine and views directory
app.set('view engine', 'ejs');
app.set("views", path.resolve("./views"));

// Middleware for parsing form data
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(checkForAuthenticationCookie("token"));
app.use(express.static(path.resolve('./public')));

// Middleware to log request body for debugging
app.use((req, res, next) => {
    console.log("Request Body:", req.body);
    next();
});

// Routes
app.get('/', async(req, res) => {
   const allBlogs=await Blog.find({});
    res.render("home",{
      user:req.user,
      blogs:allBlogs,
    });
});

app.use("/user", userRoute);
app.use("/blog", blogRoute);
// Error handling middleware
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).send("Internal Server Error");
});

app.listen(PORT, () => console.log(`Server Started at PORT: ${PORT}`));
