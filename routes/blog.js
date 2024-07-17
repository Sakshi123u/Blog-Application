const { Router } = require("express");
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Blog = require('../models/Blog');
const Comment = require('../models/comments');
const router = Router();

// Ensure the uploads directory exists
const uploadsDir = path.resolve('./public/uploads/');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log(`Created directory: ${uploadsDir}`);
} else {
    console.log(`Directory already exists: ${uploadsDir}`);
}

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const fileName = `${Date.now()}-${file.originalname}`;
        cb(null, fileName);
    },
});

const upload = multer({ storage: storage });

// Route to display the add blog form
router.get('/add-new', (req, res) => {
    return res.render("addBlog", {
        user: req.user,
    });
});
router.get('/:id',async(req,res)=>{
    const blog=await Blog.findById(req.params.id).populate("createdBy");
    const comments=await Comment.find({blogId:req.params.id}).populate("createdBy");
    return res.render('blog',{
        user:req.user,
        blog,
        comments,
    });
})
router.post('/comment/:blogId',async(req,res)=>{
    await Comment.create({
        content: req.body.content,
        blogId:req.params.blogId,
        createdBy:req.user._id,
    });
    return res.redirect(`/blog/${req.params.blogId}`);
});
// Handle form submission for adding a new blog
router.post('/', upload.single('coverImage'), async (req, res) => {
    console.log("Received POST request for /blog");
    try {
        const { title, body } = req.body;
        console.log("Request body:", req.body);

        if (!req.file) {
            throw new Error('Cover image is required');
        }

        console.log("File uploaded:", req.file);

        const blog = await Blog.create({
            body,
            title,
            createdBy: req.user._id,
            coverImageURL: `uploads/${req.file.filename}`
        });

        console.log("Blog created:", blog);

        const redirectUrl = `/blog/${blog._id}`;
        console.log("Redirecting to:", redirectUrl);

        return res.redirect(redirectUrl);
    } catch (error) {
        console.error('Error creating blog:', error);
        if (error.code === 'ENOENT') {
            return res.status(500).send("Server error: Uploads directory does not exist");
        }
        return res.status(500).send("Error creating blog: " + error.message);
    }
});
// Route to display the blog for editing or viewing
router.get('/:id', async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id).populate('createdBy');
        if (!blog) {
            console.log("Blog not found:", req.params.id);
            return res.status(404).send("Blog not found");
        }
        console.log("Blog found:", blog);
        // Use addBlog.ejs or another appropriate view for editing
        return res.render('addBlog', { blog });
    } catch (error) {
        console.error('Error fetching blog:', error);
        return res.status(500).send("Error fetching blog: " + error.message);
    }
});

module.exports = router;
