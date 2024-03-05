import jwt from 'jsonwebtoken';

interface TokenPayload {
    id: string;
    type: string; 
  }
  
  export const verifyToken = (token: string): TokenPayload | null => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
      //console.log("DECODED: ", decoded)
      return decoded;
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  };