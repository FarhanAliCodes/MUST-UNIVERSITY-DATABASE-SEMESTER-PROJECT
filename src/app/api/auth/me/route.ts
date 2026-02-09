import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("auth_session");

    if (!sessionCookie) {
      return NextResponse.json({ success: false, user: null });
    }

    try {
      const user = JSON.parse(sessionCookie.value);
      return NextResponse.json({ success: true, user });
    } catch {
      return NextResponse.json({ success: false, user: null });
    }
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json({ success: false, user: null });
  }
}
