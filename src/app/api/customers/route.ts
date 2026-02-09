import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { Customer } from "@/types";

export async function GET() {
  try {
    const customers = await query<Customer>(
      `SELECT * FROM Customers WHERE IsActive = 1 ORDER BY CustomerName`
    );
    return NextResponse.json({ success: true, data: customers });
  } catch (error) {
    console.error("Customers GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      CustomerName,
      Email,
      Phone,
      Address,
      City,
      Country,
      CustomerType,
      CreditLimit,
    } = body;

    const result = await execute(
      `
      INSERT INTO Customers (CustomerName, Email, Phone, Address, City, Country, CustomerType, CreditLimit)
      OUTPUT INSERTED.*
      VALUES (@CustomerName, @Email, @Phone, @Address, @City, @Country, @CustomerType, @CreditLimit)
    `,
      {
        CustomerName,
        Email,
        Phone,
        Address,
        City,
        Country,
        CustomerType: CustomerType || "Retail",
        CreditLimit: CreditLimit || 0,
      }
    );

    return NextResponse.json({
      success: true,
      data: result.recordset[0],
      message: "Customer created successfully",
    });
  } catch (error) {
    console.error("Customers POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create customer" },
      { status: 500 }
    );
  }
}
