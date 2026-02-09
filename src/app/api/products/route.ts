import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { Product } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get("categoryId");
    const supplierId = searchParams.get("supplierId");
    const search = searchParams.get("search");

    let sqlQuery = `
      SELECT 
        p.*,
        c.CategoryName,
        s.SupplierName
      FROM Products p
      LEFT JOIN Categories c ON p.CategoryID = c.CategoryID
      LEFT JOIN Suppliers s ON p.SupplierID = s.SupplierID
      WHERE 1=1
    `;

    const params: Record<string, unknown> = {};

    if (categoryId) {
      sqlQuery += ` AND p.CategoryID = @categoryId`;
      params.categoryId = parseInt(categoryId);
    }
    if (supplierId) {
      sqlQuery += ` AND p.SupplierID = @supplierId`;
      params.supplierId = parseInt(supplierId);
    }
    if (search) {
      sqlQuery += ` AND (p.ProductName LIKE @search OR p.SKU LIKE @search)`;
      params.search = `%${search}%`;
    }

    sqlQuery += ` ORDER BY p.ProductName`;

    const products = await query<Product>(sqlQuery, params);

    return NextResponse.json({ success: true, data: products });
  } catch (error) {
    console.error("Products GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      SKU,
      ProductName,
      Description,
      CategoryID,
      SupplierID,
      UnitPrice,
      CostPrice,
      ReorderLevel,
      ReorderQuantity,
      LeadTimeDays,
    } = body;

    const result = await execute(
      `
      INSERT INTO Products (SKU, ProductName, Description, CategoryID, SupplierID, UnitPrice, CostPrice, ReorderLevel, ReorderQuantity, LeadTimeDays)
      OUTPUT INSERTED.*
      VALUES (@SKU, @ProductName, @Description, @CategoryID, @SupplierID, @UnitPrice, @CostPrice, @ReorderLevel, @ReorderQuantity, @LeadTimeDays)
    `,
      {
        SKU,
        ProductName,
        Description,
        CategoryID,
        SupplierID,
        UnitPrice,
        CostPrice,
        ReorderLevel: ReorderLevel || 10,
        ReorderQuantity: ReorderQuantity || 50,
        LeadTimeDays: LeadTimeDays || 7,
      }
    );

    return NextResponse.json({
      success: true,
      data: result.recordset[0],
      message: "Product created successfully",
    });
  } catch (error) {
    console.error("Products POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create product" },
      { status: 500 }
    );
  }
}
