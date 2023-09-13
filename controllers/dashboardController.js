const axios = require('axios');

// Function to render the dashboard page
async function renderDashboard(req, res) {
    try {
        const user_id = req.decoded.user.id;
        const blogsResponse = await axios.get(`http://localhost:3000/blogs?user_id=${user_id}`);
        const blogCount = blogsResponse.data.length;
        res.render('app/dashboard', { user: req.decoded.user, blogCount });
    } catch (error) {
        console.error(error);
        res.render('500', { message: 'Failed to fetch blog data', layout: false });
    }
}

// Export the function as a module
module.exports = {
    renderDashboard,
};
