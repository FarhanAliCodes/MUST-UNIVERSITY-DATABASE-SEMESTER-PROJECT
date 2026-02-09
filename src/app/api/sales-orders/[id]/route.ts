import { NextRequest, NextResponse } from "next/server";
import { query, execute, executeProc } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orders = await query(
      `
      SELECT 
        so.*,
        c.CustomerName,
        c.Email AS CustomerEmail,
        c.Phone AS CustomerPhone,
        w.WarehouseName
      FROM SalesOrders so
      INNER JOIN Customers c ON so.CustomerID = c.CustomerID
      INNER JOIN Warehouses w ON so.WarehouseID = w.WarehouseID
      WHERE so.SalesOrderID = @id
    `,
      { id: parseInt(params.id) }
    );

    if (orders.length === 0) {
      return NextResponse.json(
        { success: false, error: "Sales order not found" },
        { status: 404 }
      );
    }

    const items = await query(
      `
      SELECT 
        soi.*,
        p.ProductName,
        p.SKU
      FROM SalesOrderItems soi
      INNER JOIN Products p ON soi.ProductID = p.ProductID
      WHERE soi.SalesOrderID = @id
    `,
      { id: parseInt(params.id) }
    );

    const shipments = await query(
      `SELECT * FROM Shipments WHERE SalesOrderID = @id ORDER BY ShipmentDate DESC`,
      { id: parseInt(params.id) }
    );

    const order = orders[0] as Record<string, unknown>;
    return NextResponse.json({
      success: true,
      data: { ...order, Items: items, Shipments: shipments },
    });
  } catch (error) {
    console.error("SalesOrder GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch sales order" },
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
    const { action } = body;

    if (action === "process") {
      const { Carrier, TrackingNumber, ProcessedBy } = body;
      const result = await executeProc("sp_ProcessSalesOrder", {
        SalesOrderID: parseInt(params.id),
        Carrier,
        TrackingNumber,
        ProcessedBy,
      });
      return NextResponse.json({
        success: true,
        data: result.recordset[0],
        message: "Sales order processed successfully",
      });
    }

    if (action === "deliver") {
      await execute(
        `
        UPDATE SalesOrders SET Status = 'Delivered' WHERE SalesOrderID = @id;
        UPDATE Shipments SET Status = 'Delivered', DeliveryDate = GETDATE() 
        WHERE SalesOrderID = @id AND Status != 'Delivered';
      `,
        { id: parseInt(params.id) }
      );
      return NextResponse.json({
        success: true,
        message: "Order marked as delivered",
      });
    }

    if (action === "cancel") {
      await execute(
        `UPDATE SalesOrders SET Status = 'Cancelled' WHERE SalesOrderID = @id`,
        { id: parseInt(params.id) }
      );
      return NextResponse.json({
        success: true,
        message: "Sales order cancelled successfully",
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("SalesOrder PUT error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update sales order" },
      { status: 500 }
    );
  }
}
