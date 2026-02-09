import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { Supplier } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const suppliers = await query<Supplier>(
      `SELECT * FROM Suppliers WHERE SupplierID = @id`,
      { id: parseInt(params.id) }
    );

    if (suppliers.length === 0) {
      return NextResponse.json(
        { success: false, error: "Supplier not found" },
        { status: 404 }
      );
    }

    const performance = await query(
      `SELECT * FROM vw_SupplierPerformance WHERE SupplierID = @id`,
      { id: parseInt(params.id) }
    );

    return NextResponse.json({
      success: true,
      data: { ...suppliers[0], performance: performance[0] },
    });
  } catch (error) {
    console.error("Supplier GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch supplier" },
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
      SupplierName,
      ContactPerson,
      Email,
      Phone,
      Address,
      City,
      Country,
      Rating,
      IsActive,
    } = body;

    const result = await execute(
      `
      UPDATE Suppliers SET
        SupplierName = @SupplierName,
        ContactPerson = @ContactPerson,
        Email = @Email,
        Phone = @Phone,
        Address = @Address,
        City = @City,
        Country = @Country,
        Rating = @Rating,
        IsActive = @IsActive
      OUTPUT INSERTED.*
      WHERE SupplierID = @id
    `,
      {
        id: parseInt(params.id),
        SupplierName,
        ContactPerson,
        Email,
        Phone,
        Address,
        City,
        Country,
        Rating,
        IsActive,
      }
    );

    return NextResponse.json({
      success: true,
      data: result.recordset[0],
      message: "Supplier updated successfully",
    });
  } catch (error) {
    console.error("Supplier PUT error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update supplier" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await execute(`UPDATE Suppliers SET IsActive = 0 WHERE SupplierID = @id`, {
      id: parseInt(params.id),
    });

    return NextResponse.json({
      success: true,
      message: "Supplier deactivated successfully",
    });
  } catch (error) {
    console.error("Supplier DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete supplier" },
      { status: 500 }
    );
  }
}
