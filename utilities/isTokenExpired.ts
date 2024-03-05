import jwtDecode from 'jsonwebtoken';

interface DecodedToken {
    exp: number;
}

export function isTokenExpired(token: string): boolean {
    try {
        const decoded = jwtDecode.decode(token) as DecodedToken | null;
        if (!decoded || !decoded.exp) {
            return true;
        }
        return decoded.exp < Date.now() / 1000;
    } catch (error) {
        return true; 
    }
}
