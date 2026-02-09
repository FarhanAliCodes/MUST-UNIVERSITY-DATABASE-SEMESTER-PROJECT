import { NextRequest, NextResponse } from "next/server";
import { query, execute, executeProc } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const supplierId = searchParams.get("supplierId");

    let sqlQuery = `
      SELECT 
        po.*,
        s.SupplierName,
        w.WarehouseName
      FROM PurchaseOrders po
      INNER JOIN Suppliers s ON po.SupplierID = s.SupplierID
      INNER JOIN Warehouses w ON po.WarehouseID = w.WarehouseID
      WHERE 1=1
    `;

    const params: Record<string, unknown> = {};

    if (status) {
      sqlQuery += ` AND po.Status = @status`;
      params.status = status;
    }
    if (supplierId) {
      sqlQuery += ` AND po.SupplierID = @supplierId`;
      params.supplierId = parseInt(supplierId);
    }

    sqlQuery += ` ORDER BY po.OrderDate DESC`;

    const orders = await query(sqlQuery, params);
    return NextResponse.json({ success: true, data: orders });
  } catch (error) {
    console.error("PurchaseOrders GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch purchase orders" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { SupplierID, WarehouseID, ExpectedDate, Notes, CreatedBy, Items } = body;

    const result = await executeProc("sp_CreatePurchaseOrder", {
      SupplierID,
      WarehouseID,
      ExpectedDate,
      Notes,
      CreatedBy,
      Items: JSON.stringify(Items),
    });

    return NextResponse.json({
      success: true,
      data: result.recordset[0],
      message: "Purchase order created successfully",
    });
  } catch (error) {
    console.error("PurchaseOrders POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create purchase order" },
      { status: 500 }
    );
  }
}
