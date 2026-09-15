// Get the user's IP address from the request headers
const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

// Check if userIp has exceeded limit in Redis...
// If yes -> return res.status(429).json({ error: "You've reached your free hourly limit!" });
