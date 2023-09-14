const moment = require('moment');
const axios = require('axios');
const urlBlogs = 'http://localhost:3000/blogs';
const urlUsers = 'http://localhost:3000/users';

// Function to render the dashboard page
async function renderArticles(req, res) {
    const locals = {
        titlePage: "Articles",
        title: "Articles",
        description: "User-Crafted Articles: A Diverse Collection of Insights and Perspectives."
    };

    try {
        // Pagination
        const page = parseInt(req.query.page) || 1;
        const pageSize = 10;
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;

        const blogsResponse = await axios.get(urlBlogs);
        const allBlogs = blogsResponse.data;

        // Filter out the deleted blogs and sort by createdAt
        const sortedBlogs = allBlogs
            .filter(blog => !blog.deletedAt)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Slice the sorted data based on pagination
        const paginatedBlogs = sortedBlogs.slice(startIndex, endIndex);

        // Extract user IDs from the paginated blogs
        const userIds = paginatedBlogs.map(blog => blog.userId);

        // Fetch user data based on user IDs
        const usersResponse = await axios.get(urlUsers, { params: { userIds } });
        const usersData = usersResponse.data;

        // Create a mapping of user IDs to usernames
        const userIdToUsername = {};
        usersData.forEach(user => {
            userIdToUsername[user.id] = user.username;
        });

        // Replace user IDs with usernames in the paginated blogs data
        const blogsWithUsernames = paginatedBlogs.map(blog => ({
            ...blog,
            username: userIdToUsername[blog.user_id]
        }));

        // Calculate total pages
        const totalBlogs = sortedBlogs.length;
        const totalPages = Math.ceil(totalBlogs / pageSize);

        res.render('app/front/articles', {
            blogs: blogsWithUsernames,
            currentPage: page,
            totalPages,
            totalBlogs,
            moment: moment,
            layout: 'layouts/main_front',
            locals
        });
    } catch (error) {
        console.log(error);
        res.status(500).render('errors/error', {
            type: 500,
            message: 'Internal Server Error',
            text: 'An internal server error occurred.',
            layout: false
        });
    }
}

async function renderSingleArticle(req, res) {
    const locals = {
        titlePage: "Articles",
        title: "Articles",
        description: "User-Crafted Articles: A Diverse Collection of Insights and Perspectives."
    };

    const blog_slug = req.params.slug;
    const blogResponse = await axios.get(`http://localhost:3000/blogs?slug=${blog_slug}`);
    const blog = blogResponse.data[0];

    if (!blog) {
        res.status(404).render('errors/error', { type: 404, message: 'Page not found.', text: 'The page you\'re looking for doesn\'t exist.', layout: false });
    }

    res.render('app/front/article', {
        blog: blog,
        moment: moment,
        layout: 'layouts/main_front',
        errors: [],
        locals
    });
}
// Export the function as a module
module.exports = {
    renderArticles,
    renderSingleArticle
};