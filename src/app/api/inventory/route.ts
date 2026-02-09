import { NextRequest, NextResponse } from "next/server";
import { query, executeProc } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const warehouseId = searchParams.get("warehouseId");
    const lowStockOnly = searchParams.get("lowStockOnly") === "true";

    let sqlQuery = `
      SELECT 
        i.*,
        p.SKU,
        p.ProductName,
        p.ReorderLevel,
        p.CostPrice,
        p.UnitPrice,
        c.CategoryName,
        w.WarehouseName,
        (i.QuantityOnHand - i.QuantityReserved) AS AvailableQuantity,
        (i.QuantityOnHand * p.CostPrice) AS StockValue,
        CASE WHEN i.QuantityOnHand <= p.ReorderLevel THEN 1 ELSE 0 END AS IsLowStock
      FROM Inventory i
      INNER JOIN Products p ON i.ProductID = p.ProductID
      INNER JOIN Warehouses w ON i.WarehouseID = w.WarehouseID
      LEFT JOIN Categories c ON p.CategoryID = c.CategoryID
      WHERE p.IsActive = 1
    `;

    const params: Record<string, unknown> = {};

    if (warehouseId) {
      sqlQuery += ` AND i.WarehouseID = @warehouseId`;
      params.warehouseId = parseInt(warehouseId);
    }
    if (lowStockOnly) {
      sqlQuery += ` AND i.QuantityOnHand <= p.ReorderLevel`;
    }

    sqlQuery += ` ORDER BY w.WarehouseName, p.ProductName`;

    const inventory = await query(sqlQuery, params);

    return NextResponse.json({ success: true, data: inventory });
  } catch (error) {
    console.error("Inventory GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch inventory" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "adjust") {
      const { ProductID, WarehouseID, AdjustmentQty, Reason, AdjustedBy } = body;
      const result = await executeProc("sp_AdjustInventory", {
        ProductID,
        WarehouseID,
        AdjustmentQty,
        Reason,
        AdjustedBy,
      });
      return NextResponse.json({
        success: true,
        data: result.recordset[0],
        message: "Inventory adjusted successfully",
      });
    }

    if (action === "transfer") {
      const { ProductID, FromWarehouseID, ToWarehouseID, Quantity, TransferredBy } = body;
      const result = await executeProc("sp_TransferStock", {
        ProductID,
        FromWarehouseID,
        ToWarehouseID,
        Quantity,
        TransferredBy,
      });
      return NextResponse.json({
        success: true,
        data: result.recordset[0],
        message: "Stock transferred successfully",
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Inventory POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process inventory action" },
      { status: 500 }
    );
  }
}
