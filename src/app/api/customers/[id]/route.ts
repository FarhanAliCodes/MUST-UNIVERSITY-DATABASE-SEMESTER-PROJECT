import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { Customer } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customers = await query<Customer>(
      `SELECT * FROM Customers WHERE CustomerID = @id`,
      { id: parseInt(params.id) }
    );

    if (customers.length === 0) {
      return NextResponse.json(
        { success: false, error: "Customer not found" },
        { status: 404 }
      );
    }

    const orderHistory = await query(
      `SELECT * FROM vw_CustomerOrderHistory WHERE CustomerID = @id`,
      { id: parseInt(params.id) }
    );

    return NextResponse.json({
      success: true,
      data: { ...customers[0], orderHistory: orderHistory[0] },
    });
  } catch (error) {
    console.error("Customer GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch customer" },
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
      UPDATE Customers SET
        CustomerName = @CustomerName,
        Email = @Email,
        Phone = @Phone,
        Address = @Address,
        City = @City,
        Country = @Country,
        CustomerType = @CustomerType,
        CreditLimit = @CreditLimit
      OUTPUT INSERTED.*
      WHERE CustomerID = @id
    `,
      {
        id: parseInt(params.id),
        CustomerName,
        Email,
        Phone,
        Address,
        City,
        Country,
        CustomerType,
        CreditLimit,
      }
    );

    return NextResponse.json({
      success: true,
      data: result.recordset[0],
      message: "Customer updated successfully",
    });
  } catch (error) {
    console.error("Customer PUT error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update customer" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await execute(`UPDATE Customers SET IsActive = 0 WHERE CustomerID = @id`, {
      id: parseInt(params.id),
    });

    return NextResponse.json({
      success: true,
      message: "Customer deactivated successfully",
    });
  } catch (error) {
    console.error("Customer DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete customer" },
      { status: 500 }
    );
  }
}
