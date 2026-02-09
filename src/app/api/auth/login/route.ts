import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { cookies } from "next/headers";

interface UserRecord {
  UserID: number;
  Username: string;
  PasswordHash: string;
  FullName: string;
  Email: string;
  Role: string;
  IsActive: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Username and password are required" },
        { status: 400 }
      );
    }

    const users = await query<UserRecord>(
      `SELECT UserID, Username, PasswordHash, FullName, Email, Role, IsActive 
       FROM Users 
       WHERE Username = @username AND IsActive = 1`,
      { username }
    );

    if (users.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid username or password" },
        { status: 401 }
      );
    }

    const user = users[0];

    // For demo purposes, we're using simple password comparison
    // In production, use bcrypt to hash and compare passwords
    if (user.PasswordHash !== password) {
      return NextResponse.json(
        { success: false, error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Update last login
    await query(
      `UPDATE Users SET LastLogin = GETDATE() WHERE UserID = @userId`,
      { userId: user.UserID }
    );

    // Create session token (simplified - in production use JWT or proper session management)
    const sessionData = {
      UserID: user.UserID,
      Username: user.Username,
      FullName: user.FullName,
      Email: user.Email,
      Role: user.Role,
    };

    const cookieStore = await cookies();
    cookieStore.set("auth_session", JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return NextResponse.json({
      success: true,
      user: sessionData,
      message: "Login successful",
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Login failed" },
      { status: 500 }
    );
  }
}
