import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ 
                error: 'Authentication required',
                message: 'No token provided' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                error: 'Token expired',
                message: 'Please login again' 
            });
        }
        return res.status(401).json({ 
            error: 'Invalid token',
            message: 'Authentication failed' 
        });
    }
};

export const optionalAuth = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
        }
        next();
    } catch (error) {
        // Continue without auth
        next();
    }
};
