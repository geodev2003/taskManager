const { v4: uuidv4 } = require('uuid');

module.exports = (req, res, next) => {
    req.requestId = uuidv4();
    res.setHeader('X-Request-Id', req.requestId);
    
    // Log request ("Middleware tạo requestId cho mỗi request + log")
    console.log(`[${req.requestId}] ${req.method} ${req.url}`);
    
    next();
};

