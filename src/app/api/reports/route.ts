import { NextRequest, NextResponse } from "next/server";
import { query, executeProc } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const reportType = searchParams.get("type");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const groupBy = searchParams.get("groupBy") || "Monthly";

    if (reportType === "sales") {
      const result = await executeProc("sp_GetSalesAnalytics", {
        StartDate: startDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        EndDate: endDate || new Date(),
        GroupBy: groupBy,
      });
      return NextResponse.json({ success: true, data: result.recordset });
    }

    if (reportType === "inventory") {
      const data = await query(`
        SELECT 
          w.WarehouseName,
          c.CategoryName,
          COUNT(DISTINCT p.ProductID) AS ProductCount,
          SUM(i.QuantityOnHand) AS TotalQuantity,
          SUM(i.QuantityOnHand * p.CostPrice) AS TotalValue,
          SUM(CASE WHEN i.QuantityOnHand <= p.ReorderLevel THEN 1 ELSE 0 END) AS LowStockCount
        FROM Inventory i
        INNER JOIN Products p ON i.ProductID = p.ProductID
        INNER JOIN Warehouses w ON i.WarehouseID = w.WarehouseID
        LEFT JOIN Categories c ON p.CategoryID = c.CategoryID
        GROUP BY w.WarehouseID, w.WarehouseName, c.CategoryID, c.CategoryName
        ORDER BY w.WarehouseName, c.CategoryName
      `);
      return NextResponse.json({ success: true, data });
    }

    if (reportType === "suppliers") {
      const data = await query(`SELECT * FROM vw_SupplierPerformance ORDER BY TotalOrderValue DESC`);
      return NextResponse.json({ success: true, data });
    }

    if (reportType === "customers") {
      const data = await query(`SELECT * FROM vw_CustomerOrderHistory ORDER BY LifetimeValue DESC`);
      return NextResponse.json({ success: true, data });
    }

    if (reportType === "products") {
      const data = await query(`SELECT * FROM vw_SalesByProduct ORDER BY TotalRevenue DESC`);
      return NextResponse.json({ success: true, data });
    }

    if (reportType === "movements") {
      const data = await query(`
        SELECT 
          sm.*,
          p.ProductName,
          p.SKU,
          w.WarehouseName
        FROM StockMovements sm
        INNER JOIN Products p ON sm.ProductID = p.ProductID
        INNER JOIN Warehouses w ON sm.WarehouseID = w.WarehouseID
        WHERE (@startDate IS NULL OR sm.CreatedAt >= @startDate)
          AND (@endDate IS NULL OR sm.CreatedAt <= @endDate)
        ORDER BY sm.CreatedAt DESC
      `, { startDate, endDate });
      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json(
      { success: false, error: "Invalid report type" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Reports GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
