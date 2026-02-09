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
        po.*,
        s.SupplierName,
        w.WarehouseName
      FROM PurchaseOrders po
      INNER JOIN Suppliers s ON po.SupplierID = s.SupplierID
      INNER JOIN Warehouses w ON po.WarehouseID = w.WarehouseID
      WHERE po.PurchaseOrderID = @id
    `,
      { id: parseInt(params.id) }
    );

    if (orders.length === 0) {
      return NextResponse.json(
        { success: false, error: "Purchase order not found" },
        { status: 404 }
      );
    }

    const items = await query(
      `
      SELECT 
        poi.POItemID,
        poi.PurchaseOrderID,
        poi.ProductID,
        poi.Quantity,
        poi.UnitCost,
        poi.ReceivedQuantity,
        p.ProductName,
        p.SKU
      FROM PurchaseOrderItems poi
      INNER JOIN Products p ON poi.ProductID = p.ProductID
      WHERE poi.PurchaseOrderID = @id
    `,
      { id: parseInt(params.id) }
    );

    const order = orders[0] as Record<string, unknown>;
    return NextResponse.json({
      success: true,
      data: { ...order, Items: items },
    });
  } catch (error) {
    console.error("PurchaseOrder GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch purchase order" },
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

    if (action === "receive") {
      const { ReceivedItems, ReceivedBy } = body;
      const result = await executeProc("sp_ReceivePurchaseOrder", {
        PurchaseOrderID: parseInt(params.id),
        ReceivedItems: JSON.stringify(ReceivedItems),
        ReceivedBy,
      });
      return NextResponse.json({
        success: true,
        data: result.recordset[0],
        message: "Purchase order received successfully",
      });
    }

    if (action === "approve") {
      await execute(
        `UPDATE PurchaseOrders SET Status = 'Approved' WHERE PurchaseOrderID = @id`,
        { id: parseInt(params.id) }
      );
      return NextResponse.json({
        success: true,
        message: "Purchase order approved successfully",
      });
    }

    if (action === "cancel") {
      await execute(
        `UPDATE PurchaseOrders SET Status = 'Cancelled' WHERE PurchaseOrderID = @id`,
        { id: parseInt(params.id) }
      );
      return NextResponse.json({
        success: true,
        message: "Purchase order cancelled successfully",
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("PurchaseOrder PUT error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update purchase order" },
      { status: 500 }
    );
  }
}
