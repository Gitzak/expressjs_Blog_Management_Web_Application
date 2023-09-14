const axios = require('axios');

// Function to render the dashboard page
async function renderDashboard(req, res) {
    const locals = {
        titlePage : "Dashboard",
    };
    try {
        const user_id = req.decoded.user.id;
        const blogsResponse = await axios.get(`http://localhost:3000/blogs?user_id=${user_id}`);
        const allBlogs = blogsResponse.data;
        const notDeletedBlogs = allBlogs.filter((blog) => !blog.deletedAt);
        const blogCount = notDeletedBlogs.length;
        res.render('app/dashboard', { user: req.decoded.user, blogCount, locals });
    } catch (error) {
        res.status(500).render('errors/error', {
            type: 500,
            message: 'Internal Server Error',
            text: 'An internal server error occurred.',
            layout: false
        });
    }
}

// Export the function as a module
module.exports = {
    renderDashboard,
};
