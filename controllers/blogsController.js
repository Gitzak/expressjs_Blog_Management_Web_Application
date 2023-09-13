const axios = require('axios');
const moment = require('moment');
const upload = require('../middlewares/multerMiddleware');
const urlBlogs = 'http://localhost:3000/blogs'
const { validationResult } = require('express-validator');
const slugify = require('slugify');

// Function to render the dashboard page
async function renderBlogs(req, res) {
    try {
        // pagination
        const page = req.query.page || 1;
        const pageSize = 5;
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;

        const user_id = req.decoded.user.id;
        const blogsResponse = await axios.get(`http://localhost:3000/blogs?user_id=${user_id}&_start=${startIndex}&_end=${endIndex}&_sort=createdAt=DESC`);
        const blogs = blogsResponse.data;

        // Count the total number of blogs
        const totalBlogsResponse = await axios.get(`http://localhost:3000/blogs?user_id=${user_id}`);
        const totalBlogs = totalBlogsResponse.data.length;

        // Calculate the total number of pages
        const totalPages = Math.ceil(totalBlogs / pageSize);

        res.render('app/blogs/blogs', {
            user: req.decoded.user,
            blogs,
            currentPage: page,
            totalPages,
            totalBlogs,
            moment: moment
        });
    } catch (error) {
        console.error(error);
        res.render('errors/500', { message: 'Failed to fetch blog data', layout: false });
    }
}

async function renderCreateBlog(req, res) {
    res.render('app/blogs/create', {
        user: req.decoded.user,
        errors: [],
    });
}

async function addBlog(req, res) {
    const locals = {
        title: "Add a Blog",
    };

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        console.log(errors.array());
        return res.render('app/blogs/create', { errors: errors.array(), message: '', locals, user: req.decoded.user });
    }

    const { title, content, is_public } = req.body;

    const image = req.file;

    const newBlog = {
        user_id: req.decoded.user.id,
        title,
        slug: slugify(title),
        content,
        image: image ? image.filename : null,
        is_public: is_public !== undefined ? true : false,
        createdAt: new Date().toISOString(),
        updatedAt: null,
    };

    const response = await axios.post(urlBlogs, newBlog);

    const createdBlogId = response.data.id;

    req.flash('success', 'Blog Created Successfully');
    res.redirect(`/blogs/edit/${createdBlogId}`);

}

async function renderEditBlog(req, res) {
    const blog_id = req.params.id;
    const user_id = req.decoded.user.id;
    const blogResponse = await axios.get(`http://localhost:3000/blogs?id=${blog_id}&user_id=${user_id}`);
    const blog = blogResponse.data[0];

    if (!blog) {
        res.status(404).render('errors/error', { type: 404, message: 'Page not found.', text: 'The page you\'re looking for doesn\'t exist.', layout: false });
    }

    const m = req.flash('success');

    res.render('app/blogs/edit', {
        user: req.decoded.user,
        blog: blog,
        message: { success: m.length > 0 ? m : null },
        errors: [],
    });
}

async function editBlog(req, res, next) {
    const locals = {
        title: "Edit a Blog",
    };

    const blog_id = req.params.id;
    const user_id = req.decoded.user.id;
    const blogResponse = await axios.get(`http://localhost:3000/blogs?id=${blog_id}&user_id=${user_id}`);
    const blog = blogResponse.data[0];

    if (!blog) {
        res.status(404).render('errors/404');
    }

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.render('app/blogs/edit', { errors: errors.array(), message: '', locals, user: req.decoded.user, blog: blog });
    }

    const updatedData = req.body;
    updatedData.createdAt = new Date().toISOString();
    const updateResponse = await axios.patch(`http://localhost:3000/blogs/${blog_id}`, updatedData);

    if (updateResponse.status === 200) {
        req.flash('success', 'Blog Updated Successfully');
        res.redirect(`/blogs/edit/${blog_id}`);
    } else {
        res.render('app/blogs/edit', { errors: [], message: 'Failed to update blog', locals, user: req.decoded.user, blog: blog });
    }
}

// Export the function as a module
module.exports = {
    renderBlogs,
    renderCreateBlog,
    addBlog,
    renderEditBlog,
    editBlog
};
