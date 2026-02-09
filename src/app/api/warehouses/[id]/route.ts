import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { Warehouse } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const warehouses = await query<Warehouse>(
      `SELECT * FROM Warehouses WHERE WarehouseID = @id`,
      { id: parseInt(params.id) }
    );

    if (warehouses.length === 0) {
      return NextResponse.json(
        { success: false, error: "Warehouse not found" },
        { status: 404 }
      );
    }

    const inventory = await query(
      `
      SELECT 
        COUNT(DISTINCT i.ProductID) AS ProductCount,
        SUM(i.QuantityOnHand) AS TotalQuantity,
        SUM(i.QuantityOnHand * p.CostPrice) AS TotalValue
      FROM Inventory i
      INNER JOIN Products p ON i.ProductID = p.ProductID
      WHERE i.WarehouseID = @id
    `,
      { id: parseInt(params.id) }
    );

    return NextResponse.json({
      success: true,
      data: { ...warehouses[0], inventoryStats: inventory[0] },
    });
  } catch (error) {
    console.error("Warehouse GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch warehouse" },
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
    const { WarehouseName, Location, City, Capacity, ManagerName, Phone } = body;

    const result = await execute(
      `
      UPDATE Warehouses SET
        WarehouseName = @WarehouseName,
        Location = @Location,
        City = @City,
        Capacity = @Capacity,
        ManagerName = @ManagerName,
        Phone = @Phone
      OUTPUT INSERTED.*
      WHERE WarehouseID = @id
    `,
      {
        id: parseInt(params.id),
        WarehouseName,
        Location,
        City,
        Capacity,
        ManagerName,
        Phone,
      }
    );

    return NextResponse.json({
      success: true,
      data: result.recordset[0],
      message: "Warehouse updated successfully",
    });
  } catch (error) {
    console.error("Warehouse PUT error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update warehouse" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await execute(`UPDATE Warehouses SET IsActive = 0 WHERE WarehouseID = @id`, {
      id: parseInt(params.id),
    });

    return NextResponse.json({
      success: true,
      message: "Warehouse deactivated successfully",
    });
  } catch (error) {
    console.error("Warehouse DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete warehouse" },
      { status: 500 }
    );
  }
}
