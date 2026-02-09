import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { Product } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const products = await query<Product>(
      `
      SELECT 
        p.*,
        c.CategoryName,
        s.SupplierName
      FROM Products p
      LEFT JOIN Categories c ON p.CategoryID = c.CategoryID
      LEFT JOIN Suppliers s ON p.SupplierID = s.SupplierID
      WHERE p.ProductID = @id
    `,
      { id: parseInt(params.id) }
    );

    if (products.length === 0) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: products[0] });
  } catch (error) {
    console.error("Product GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      IsActive,
    } = body;

    const result = await execute(
      `
      UPDATE Products SET
        SKU = @SKU,
        ProductName = @ProductName,
        Description = @Description,
        CategoryID = @CategoryID,
        SupplierID = @SupplierID,
        UnitPrice = @UnitPrice,
        CostPrice = @CostPrice,
        ReorderLevel = @ReorderLevel,
        ReorderQuantity = @ReorderQuantity,
        LeadTimeDays = @LeadTimeDays,
        IsActive = @IsActive
      OUTPUT INSERTED.*
      WHERE ProductID = @id
    `,
      {
        id: parseInt(params.id),
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
        IsActive,
      }
    );

    return NextResponse.json({
      success: true,
      data: result.recordset[0],
      message: "Product updated successfully",
    });
  } catch (error) {
    console.error("Product PUT error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await execute(
      `UPDATE Products SET IsActive = 0 WHERE ProductID = @id`,
      { id: parseInt(params.id) }
    );

    return NextResponse.json({
      success: true,
      message: "Product deactivated successfully",
    });
  } catch (error) {
    console.error("Product DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
