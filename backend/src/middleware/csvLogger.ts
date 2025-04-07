// CSV processing logger middleware
const csvLogger = (req, res, next) => {
  const username = req.user && req.user.username ? req.user.username : 'anonymous';

  if (req.file) {
    console.log(`[${new Date().toISOString()}] User ${username} uploaded: ${req.file.originalname} (${req.file.size} bytes)`);
  }
  next();
};

export default csvLogger;
