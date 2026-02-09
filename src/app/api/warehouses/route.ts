import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { Warehouse } from "@/types";

export async function GET() {
  try {
    const warehouses = await query<Warehouse>(
      `SELECT * FROM Warehouses WHERE IsActive = 1 ORDER BY WarehouseName`
    );
    return NextResponse.json({ success: true, data: warehouses });
  } catch (error) {
    console.error("Warehouses GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch warehouses" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { WarehouseName, Location, City, Capacity, ManagerName, Phone } = body;

    const result = await execute(
      `
      INSERT INTO Warehouses (WarehouseName, Location, City, Capacity, ManagerName, Phone)
      OUTPUT INSERTED.*
      VALUES (@WarehouseName, @Location, @City, @Capacity, @ManagerName, @Phone)
    `,
      { WarehouseName, Location, City, Capacity, ManagerName, Phone }
    );

    return NextResponse.json({
      success: true,
      data: result.recordset[0],
      message: "Warehouse created successfully",
    });
  } catch (error) {
    console.error("Warehouses POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create warehouse" },
      { status: 500 }
    );
  }
}
