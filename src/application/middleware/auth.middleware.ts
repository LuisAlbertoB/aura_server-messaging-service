import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
    user?: {
        user_id: string;
        username: string;
        email: string;
        id_role: number;
    };
}

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';

export const authenticateToken = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            res.status(401).json({ error: 'Access token required' });
            return;
        }

        // Verify JWT locally
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        // Optional: Validate with Auth service for extra security
        // Uncomment if Auth service has a validation endpoint
        /*
        try {
          const response = await axios.post(
            `${AUTH_SERVICE_URL}/api/auth/validate-token`,
            {},
            {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 5000
            }
          );
          
          if (!response.data.valid) {
            res.status(401).json({ error: 'Invalid token' });
            return;
          }
        } catch (error) {
          console.warn('Auth service validation failed, using local validation only');
        }
        */

        req.user = {
            user_id: decoded.user_id || decoded.id,
            username: decoded.username,
            email: decoded.email,
            id_role: decoded.id_role || decoded.role
        };

        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            res.status(403).json({ error: 'Invalid or expired token' });
            return;
        }
        console.error('Authentication error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
};

export const optionalAuth = async (
    req: AuthRequest,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const decoded = jwt.verify(token, JWT_SECRET) as any;
            req.user = {
                user_id: decoded.user_id || decoded.id,
                username: decoded.username,
                email: decoded.email,
                id_role: decoded.id_role || decoded.role
            };
        }

        next();
    } catch (error) {
        // If token is invalid, continue without user
        next();
    }
};
