// Simple authentication middleware
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: 'Authorization header is required' });
    }

    // In a real app, you would verify the token here
    req.user = { username: 'wilmer2000' }; // Mock user data
    next();
};

module.exports = authenticate;