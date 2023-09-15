const axios = require('axios');
const moment = require('moment');
const upload = require('../middlewares/multerMiddleware');
const urlBlogs = 'http://localhost:3000/blogs'
const { validationResult } = require('express-validator');
const slugify = require('slugify');
const fs = require('fs');
const path = require('path');

// Function to render the dashboard page
async function renderBlogs(req, res) {
    const locals = {
        titlePage: "List of Blogs",
    };
    try {
        // pagination
        const page = parseInt(req.query.page) || 1;
        const pageSize = 5;
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;

        const user_id = req.decoded.user.id;
        const blogsResponse = await axios.get(`http://localhost:3000/blogs?user_id=${user_id}&_sort=createdAt:DESC`);
        const allBlogs = blogsResponse.data;

        // Filter out the deleted blogs and sort by createdAt
        const sortedBlogs = allBlogs
            .filter(blog => !blog.deletedAt)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Slice the sorted data based on pagination
        const paginatedBlogs = sortedBlogs.slice(startIndex, endIndex);

        // Calculate total pages
        const totalBlogs = sortedBlogs.length;
        const totalPages = Math.ceil(totalBlogs / pageSize);

        res.render('app/blogs/blogs', {
            user: req.decoded.user,
            blogs: paginatedBlogs,
            currentPage: page,
            totalPages,
            totalBlogs,
            moment: moment,
            locals
        });
    } catch (error) {
        res.status(500).render('errors/error', {
            type: 500,
            message: 'Internal Server Error',
            text: 'An internal server error occurred.',
            layout: false
        });
    }
}

async function renderCreateBlog(req, res) {
    const locals = {
        titlePage: "Create blog",
    };
    res.render('app/blogs/create', {
        user: req.decoded.user,
        errors: [],
        locals
    });
}

async function addBlog(req, res) {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.render('app/blogs/create', { errors: errors.array(), message: '', locals, user: req.decoded.user });
        }

        // console.log(req.decoded.user);

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
            deletedAt: null,
        };

        const response = await axios.post(urlBlogs, newBlog);

        if (response.status === 201) {
            const createdBlogId = response.data.id;
            req.flash('success', 'Blog Created Successfully');
            res.redirect(`/blogs/edit/${createdBlogId}`);
        } else {
            res.status(500).render('errors/error', {
                type: 500,
                message: 'Internal Server Error',
                text: 'An internal server error occurred while creating the blog.',
                layout: false
            });
        }
    } catch (error) {
        if (error.response && error.response.status === 400) {
            res.status(400).render('errors/error', {
                type: 400,
                message: 'Bad Request',
                text: 'Invalid data.',
                layout: false
            });
        } else {
            res.status(500).render('errors/error', {
                type: 500,
                message: 'Internal Server Error',
                text: 'An internal server error occurred.',
                layout: false
            });
        }
    }
}

async function renderEditBlog(req, res) {
    const locals = {
        titlePage: "Edit blog",
    };

    const blog_id = req.params.id;
    const user_id = req.decoded.user.id;
    const blogResponse = await axios.get(`http://localhost:3000/blogs?id=${blog_id}&user_id=${user_id}`);
    
    if(blogResponse.data[0] == undefined){
        return res.status(404).render('errors/error', { type: 404, message: 'Page not found.', text: 'The page you\'re looking for doesn\'t exist.', layout: false });
    }
    
    const blog = blogResponse.data[0];

    const m = req.flash('success');

    res.render('app/blogs/edit', {
        user: req.decoded.user,
        blog: blog,
        message: { success: m.length > 0 ? m : null },
        errors: [],
        locals
    });
}

async function editBlog(req, res, next) {

    try {
        const blog_id = req.params.id;
        const user_id = req.decoded.user.id;
        const blogResponse = await axios.get(`http://localhost:3000/blogs?id=${blog_id}&user_id=${user_id}`);
        const blog = blogResponse.data[0];

        if (!blog) {
            return res.status(404).render('errors/404');
        }

        const image = req.file;

        if (image !== undefined) {
            fs.access(path.join(__dirname, './../public/img/blogs/') + blog.image, fs.constants.F_OK, (err) => {
                if (!err) {
                    fs.unlink(path.join(__dirname, './../public/img/blogs/') + blog.image, (unlinkErr) => {
                        if (unlinkErr) {
                            req.flash('danger', 'An error has occurred please try again later');
                            return res.redirect(`/blogs/edit/${blog_id}`);
                        }
                    });
                }
            });
        }

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.render('app/blogs/edit', { errors: errors.array(), message: '', locals, user: req.decoded.user, blog: blog });
        }

        const updatedData = req.body;
        updatedData.is_public = req.body.is_public !== undefined ? true : false;
        updatedData.updatedAt = new Date().toISOString();
        updatedData.image = image ? image.filename : blog.image;

        const updateResponse = await axios.patch(`http://localhost:3000/blogs/${blog_id}`, updatedData);

        if (updateResponse.status === 200) {
            req.flash('success', 'Blog Updated Successfully');
            return res.redirect(`/blogs/edit/${blog_id}`);
        } else {
            return res.render('app/blogs/edit', { errors: [], message: 'Failed to update blog', locals, user: req.decoded.user, blog: blog });
        }
    } catch (error) {
        if (error.response && error.response.status === 404) {
            return res.status(404).render('errors/error', { type: 404, message: 'Page not found.', text: 'The page you\'re looking for doesn\'t exist.', layout: false });
        } else {
            return res.status(500).render('errors/error', {
                type: 500,
                message: 'Internal Server Error',
                text: 'An internal server error occurred.',
                layout: false
            });
        }
    }
}

async function deleteBlog(req, res, next) {
    try {
        const blog_id = req.params.id;
        const user_id = req.decoded.user.id;

        // Use a try-catch block to handle potential errors with the Axios request
        try {
            const blogResponse = await axios.get(`http://localhost:3000/blogs?id=${blog_id}&user_id=${user_id}`);
            const blog = blogResponse.data[0];

            if (!blog) {
                return res.status(404).send('Blog not found');
            }

            // Mark the blog as deleted by setting the deletedAt field
            blog.deletedAt = new Date().toISOString();

            // Use a try-catch block for the update request
            try {
                const updateResponse = await axios.patch(`http://localhost:3000/blogs/${blog_id}`, blog);

                if (updateResponse.status === 200) {
                    return res.sendStatus(200);
                } else {
                    return res.sendStatus(500);
                }
            } catch (updateError) {
                console.error('Error updating the blog:', updateError);
                return res.sendStatus(500);
            }
        } catch (blogError) {
            console.error('Error fetching the blog:', blogError);
            return res.sendStatus(500);
        }
    } catch (error) {
        console.error('Error in deleteBlog function:', error);
        return res.sendStatus(500);
    }
}

// Export the function as a module
module.exports = {
    renderBlogs,
    renderCreateBlog,
    addBlog,
    renderEditBlog,
    editBlog,
    deleteBlog
};
