import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { DashboardKPIs } from "@/types";

export async function GET() {
  try {
    const kpis = await query<DashboardKPIs>(`SELECT * FROM vw_DashboardKPIs`);

    const salesTrend = await query(`
      SELECT 
        FORMAT(so.OrderDate, 'yyyy-MM') AS Month,
        SUM(so.TotalAmount) AS Revenue
      FROM SalesOrders so
      WHERE so.Status NOT IN ('Cancelled')
        AND so.OrderDate >= DATEADD(MONTH, -12, GETDATE())
      GROUP BY FORMAT(so.OrderDate, 'yyyy-MM')
      ORDER BY Month
    `);

    const topProducts = await query(`
      SELECT TOP 10
        p.ProductName,
        SUM(soi.Quantity * soi.UnitPrice * (1 - soi.Discount/100)) AS Revenue
      FROM Products p
      INNER JOIN SalesOrderItems soi ON p.ProductID = soi.ProductID
      INNER JOIN SalesOrders so ON soi.SalesOrderID = so.SalesOrderID
      WHERE so.Status NOT IN ('Cancelled')
      GROUP BY p.ProductID, p.ProductName
      ORDER BY Revenue DESC
    `);

    const inventoryByCategory = await query(`
      SELECT 
        c.CategoryName,
        SUM(i.QuantityOnHand * p.CostPrice) AS Value
      FROM Inventory i
      INNER JOIN Products p ON i.ProductID = p.ProductID
      INNER JOIN Categories c ON p.CategoryID = c.CategoryID
      GROUP BY c.CategoryID, c.CategoryName
      ORDER BY Value DESC
    `);

    const lowStockAlerts = await query(`
      SELECT TOP 10 * FROM vw_LowStockProducts ORDER BY Deficit DESC
    `);

    const recentOrders = await query(`
      SELECT TOP 10 * FROM vw_PendingOrders ORDER BY OrderDate DESC
    `);

    return NextResponse.json({
      success: true,
      data: {
        kpis: kpis[0],
        salesTrend,
        topProducts,
        inventoryByCategory,
        lowStockAlerts,
        recentOrders,
      },
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
