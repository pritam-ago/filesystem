import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
      };
    }
  }
}

export const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.query.token as string || req.headers['authorization']?.split(' ')[1];

  if (!token) {
    res.status(403).json({ message: 'Token is missing' });
    return;
  }

  jwt.verify(token, process.env.JWT_SECRET!, (err, decoded) => {
    if (err) {
      res.status(401).json({ message: 'Invalid or expired token' });
      return;
    }

    console.log('Decoded Token:', decoded);
    req.user = { id: (decoded as JwtPayload).userId };
    next();
  });
}; 