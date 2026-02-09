import { NextRequest, NextResponse } from "next/server";
import { query, executeProc } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const customerId = searchParams.get("customerId");

    let sqlQuery = `
      SELECT 
        so.*,
        c.CustomerName,
        w.WarehouseName
      FROM SalesOrders so
      INNER JOIN Customers c ON so.CustomerID = c.CustomerID
      INNER JOIN Warehouses w ON so.WarehouseID = w.WarehouseID
      WHERE 1=1
    `;

    const params: Record<string, unknown> = {};

    if (status) {
      sqlQuery += ` AND so.Status = @status`;
      params.status = status;
    }
    if (customerId) {
      sqlQuery += ` AND so.CustomerID = @customerId`;
      params.customerId = parseInt(customerId);
    }

    sqlQuery += ` ORDER BY so.OrderDate DESC`;

    const orders = await query(sqlQuery, params);
    return NextResponse.json({ success: true, data: orders });
  } catch (error) {
    console.error("SalesOrders GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch sales orders" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      CustomerID,
      WarehouseID,
      RequiredDate,
      ShippingAddress,
      Notes,
      Items,
    } = body;

    const result = await executeProc("sp_CreateSalesOrder", {
      CustomerID,
      WarehouseID,
      RequiredDate,
      ShippingAddress,
      Notes,
      Items: JSON.stringify(Items),
    });

    return NextResponse.json({
      success: true,
      data: result.recordset[0],
      message: "Sales order created successfully",
    });
  } catch (error) {
    console.error("SalesOrders POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create sales order" },
      { status: 500 }
    );
  }
}
