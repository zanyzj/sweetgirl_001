import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function middleware(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  const protectedPaths = ["/characters", "/chat/", "/onboarding"];
  const isProtected = protectedPaths.some(path => 
    pathname === path || (path.endsWith("/") && pathname.startsWith(path))
  );
  
  const isLoginPage = pathname === "/login";
  
  if (isProtected && (!session || !session.user)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  
  if (isLoginPage && session?.user) {
    return NextResponse.redirect(new URL("/characters", request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
