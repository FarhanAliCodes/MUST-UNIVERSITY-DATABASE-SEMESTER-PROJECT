import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { Category } from "@/types";

export async function GET() {
  try {
    const categories = await query<Category>(
      `SELECT * FROM Categories ORDER BY CategoryName`
    );
    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error("Categories GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { CategoryName, Description } = body;

    const result = await execute(
      `
      INSERT INTO Categories (CategoryName, Description)
      OUTPUT INSERTED.*
      VALUES (@CategoryName, @Description)
    `,
      { CategoryName, Description }
    );

    return NextResponse.json({
      success: true,
      data: result.recordset[0],
      message: "Category created successfully",
    });
  } catch (error) {
    console.error("Categories POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create category" },
      { status: 500 }
    );
  }
}
