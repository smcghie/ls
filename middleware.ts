import { NextRequest, NextResponse } from 'next/server';
import { isTokenExpired } from '@/utilities/isTokenExpired';

export function middleware(req: NextRequest) {
    const tokenObject = req.cookies.get('token');
    

    if (!tokenObject) {
        console.log("Token is not available or not a string");
        return NextResponse.redirect(new URL('/signin', req.url));
    }

    if (isTokenExpired(tokenObject.value)) {
        console.log("Token expired");
        return NextResponse.redirect(new URL('/signin', req.url));
    }

    const tokenStr = tokenObject.value;

    
    try {
        console.log("TOKEN: ", tokenStr)

        return NextResponse.next();
    } catch (err) {
        console.log("ERROR: ", err)
        return NextResponse.redirect(new URL('/signin', req.url));
    }
}

export const config = {
    matcher: [
        '/',
        '/create-moment/:path*',
        '/profile/:path*',
        '/settings/:path*'
      ],
};