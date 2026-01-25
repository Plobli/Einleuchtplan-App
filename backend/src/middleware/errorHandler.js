export const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation Error',
            details: err.details
        });
    }

    // Database errors
    if (err.code === '23505') { // Unique constraint violation
        return res.status(409).json({
            error: 'Conflict',
            message: 'Resource already exists'
        });
    }

    if (err.code === '23503') { // Foreign key violation
        return res.status(400).json({
            error: 'Bad Request',
            message: 'Referenced resource does not exist'
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid token'
        });
    }

    // Default error
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};
