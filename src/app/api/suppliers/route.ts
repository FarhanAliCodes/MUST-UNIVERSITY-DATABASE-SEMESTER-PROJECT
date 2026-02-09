import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { Supplier } from "@/types";

export async function GET() {
  try {
    const suppliers = await query<Supplier>(
      `SELECT * FROM Suppliers WHERE IsActive = 1 ORDER BY SupplierName`
    );
    return NextResponse.json({ success: true, data: suppliers });
  } catch (error) {
    console.error("Suppliers GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch suppliers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    } = body;

    const result = await execute(
      `
      INSERT INTO Suppliers (SupplierName, ContactPerson, Email, Phone, Address, City, Country, Rating)
      OUTPUT INSERTED.*
      VALUES (@SupplierName, @ContactPerson, @Email, @Phone, @Address, @City, @Country, @Rating)
    `,
      { SupplierName, ContactPerson, Email, Phone, Address, City, Country, Rating }
    );

    return NextResponse.json({
      success: true,
      data: result.recordset[0],
      message: "Supplier created successfully",
    });
  } catch (error) {
    console.error("Suppliers POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create supplier" },
      { status: 500 }
    );
  }
}
