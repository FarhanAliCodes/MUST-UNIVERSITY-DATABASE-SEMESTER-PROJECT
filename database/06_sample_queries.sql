-- Inventory & Supply Chain Analytics System
-- Sample Queries Demonstrating Advanced SQL Features
-- Microsoft SQL Server

USE InventoryDB;
GO

-- ============================================
-- 1. WINDOW FUNCTIONS - Sales Trend Analysis
-- ============================================

-- Monthly sales with previous month comparison and running total
SELECT 
    p.ProductID,
    p.ProductName,
    FORMAT(so.OrderDate, 'yyyy-MM') AS MonthYear,
    SUM(soi.Quantity * soi.UnitPrice * (1 - soi.Discount/100)) AS MonthlySales,
    LAG(SUM(soi.Quantity * soi.UnitPrice * (1 - soi.Discount/100))) OVER (
        PARTITION BY p.ProductID 
        ORDER BY FORMAT(so.OrderDate, 'yyyy-MM')
    ) AS PreviousMonthSales,
    SUM(SUM(soi.Quantity * soi.UnitPrice * (1 - soi.Discount/100))) OVER (
        PARTITION BY p.ProductID 
        ORDER BY FORMAT(so.OrderDate, 'yyyy-MM')
    ) AS RunningTotal,
    RANK() OVER (
        PARTITION BY FORMAT(so.OrderDate, 'yyyy-MM') 
        ORDER BY SUM(soi.Quantity * soi.UnitPrice * (1 - soi.Discount/100)) DESC
    ) AS MonthlyRank
FROM Products p
INNER JOIN SalesOrderItems soi ON p.ProductID = soi.ProductID
INNER JOIN SalesOrders so ON soi.SalesOrderID = so.SalesOrderID
WHERE so.Status NOT IN ('Cancelled')
GROUP BY p.ProductID, p.ProductName, FORMAT(so.OrderDate, 'yyyy-MM')
ORDER BY p.ProductName, MonthYear;
GO

-- ============================================
-- 2. COMMON TABLE EXPRESSIONS (CTE) - Inventory Valuation
-- ============================================

-- Inventory value by warehouse and category with percentages
WITH InventoryValue AS (
    SELECT 
        w.WarehouseID,
        w.WarehouseName,
        c.CategoryID,
        c.CategoryName,
        SUM(i.QuantityOnHand) AS TotalQuantity,
        SUM(i.QuantityOnHand * p.CostPrice) AS TotalValue
    FROM Inventory i
    INNER JOIN Products p ON i.ProductID = p.ProductID
    INNER JOIN Warehouses w ON i.WarehouseID = w.WarehouseID
    LEFT JOIN Categories c ON p.CategoryID = c.CategoryID
    GROUP BY w.WarehouseID, w.WarehouseName, c.CategoryID, c.CategoryName
),
WarehouseTotals AS (
    SELECT 
        WarehouseID,
        SUM(TotalValue) AS WarehouseTotal
    FROM InventoryValue
    GROUP BY WarehouseID
)
SELECT 
    iv.WarehouseName,
    iv.CategoryName,
    iv.TotalQuantity,
    iv.TotalValue,
    wt.WarehouseTotal,
    CAST((iv.TotalValue / wt.WarehouseTotal) * 100 AS DECIMAL(5,2)) AS PercentOfWarehouse,
    SUM(iv.TotalValue) OVER () AS GrandTotal,
    CAST((iv.TotalValue / SUM(iv.TotalValue) OVER ()) * 100 AS DECIMAL(5,2)) AS PercentOfTotal
FROM InventoryValue iv
INNER JOIN WarehouseTotals wt ON iv.WarehouseID = wt.WarehouseID
ORDER BY iv.WarehouseName, iv.TotalValue DESC;
GO

-- ============================================
-- 3. ABC ANALYSIS (Pareto Principle)
-- ============================================

-- Classify products by revenue contribution (80/15/5 rule)
WITH ProductRevenue AS (
    SELECT 
        p.ProductID,
        p.SKU,
        p.ProductName,
        c.CategoryName,
        SUM(soi.Quantity) AS TotalQuantitySold,
        SUM(soi.Quantity * soi.UnitPrice * (1 - soi.Discount/100)) AS Revenue
    FROM Products p
    LEFT JOIN SalesOrderItems soi ON p.ProductID = soi.ProductID
    LEFT JOIN SalesOrders so ON soi.SalesOrderID = so.SalesOrderID AND so.Status NOT IN ('Cancelled')
    LEFT JOIN Categories c ON p.CategoryID = c.CategoryID
    WHERE p.IsActive = 1
    GROUP BY p.ProductID, p.SKU, p.ProductName, c.CategoryName
),
RankedProducts AS (
    SELECT 
        *,
        SUM(Revenue) OVER (ORDER BY Revenue DESC ROWS UNBOUNDED PRECEDING) AS CumulativeRevenue,
        SUM(Revenue) OVER () AS TotalRevenue
    FROM ProductRevenue
)
SELECT 
    ProductID,
    SKU,
    ProductName,
    CategoryName,
    TotalQuantitySold,
    Revenue,
    CumulativeRevenue,
    TotalRevenue,
    CAST((CumulativeRevenue / NULLIF(TotalRevenue, 0)) * 100 AS DECIMAL(5,2)) AS CumulativePercent,
    CASE 
        WHEN (CumulativeRevenue / NULLIF(TotalRevenue, 0)) <= 0.80 THEN 'A - High Value'
        WHEN (CumulativeRevenue / NULLIF(TotalRevenue, 0)) <= 0.95 THEN 'B - Medium Value'
        ELSE 'C - Low Value'
    END AS ABCCategory
FROM RankedProducts
ORDER BY Revenue DESC;
GO

-- ============================================
-- 4. SUBQUERIES - Reorder Analysis
-- ============================================

-- Products needing reorder with days until stockout estimate
SELECT 
    p.ProductID,
    p.SKU,
    p.ProductName,
    s.SupplierName,
    w.WarehouseName,
    i.QuantityOnHand,
    i.QuantityReserved,
    (i.QuantityOnHand - i.QuantityReserved) AS AvailableStock,
    p.ReorderLevel,
    p.LeadTimeDays,
    (
        SELECT ISNULL(AVG(DailySales), 0)
        FROM (
            SELECT 
                CAST(so.OrderDate AS DATE) AS SaleDate,
                SUM(soi.Quantity) AS DailySales
            FROM SalesOrderItems soi
            INNER JOIN SalesOrders so ON soi.SalesOrderID = so.SalesOrderID
            WHERE soi.ProductID = p.ProductID
                AND so.WarehouseID = i.WarehouseID
                AND so.OrderDate >= DATEADD(DAY, -30, GETDATE())
            GROUP BY CAST(so.OrderDate AS DATE)
        ) AS DailySalesData
    ) AS AvgDailySales,
    CASE 
        WHEN (
            SELECT ISNULL(AVG(DailySales), 0)
            FROM (
                SELECT SUM(soi.Quantity) AS DailySales
                FROM SalesOrderItems soi
                INNER JOIN SalesOrders so ON soi.SalesOrderID = so.SalesOrderID
                WHERE soi.ProductID = p.ProductID
                    AND so.WarehouseID = i.WarehouseID
                    AND so.OrderDate >= DATEADD(DAY, -30, GETDATE())
                GROUP BY CAST(so.OrderDate AS DATE)
            ) AS DailySalesData
        ) > 0 
        THEN CAST((i.QuantityOnHand - i.QuantityReserved) / (
            SELECT AVG(DailySales)
            FROM (
                SELECT SUM(soi.Quantity) AS DailySales
                FROM SalesOrderItems soi
                INNER JOIN SalesOrders so ON soi.SalesOrderID = so.SalesOrderID
                WHERE soi.ProductID = p.ProductID
                    AND so.WarehouseID = i.WarehouseID
                    AND so.OrderDate >= DATEADD(DAY, -30, GETDATE())
                GROUP BY CAST(so.OrderDate AS DATE)
            ) AS DailySalesData
        ) AS INT)
        ELSE 999
    END AS EstimatedDaysUntilStockout
FROM Inventory i
INNER JOIN Products p ON i.ProductID = p.ProductID
INNER JOIN Warehouses w ON i.WarehouseID = w.WarehouseID
LEFT JOIN Suppliers s ON p.SupplierID = s.SupplierID
WHERE i.QuantityOnHand <= p.ReorderLevel * 1.5
ORDER BY (i.QuantityOnHand - i.QuantityReserved) ASC;
GO

-- ============================================
-- 5. ROLLUP - Inventory Summary with Subtotals
-- ============================================

-- Inventory totals with warehouse and category rollups
SELECT 
    COALESCE(w.WarehouseName, 'ALL WAREHOUSES') AS Warehouse,
    COALESCE(c.CategoryName, 'ALL CATEGORIES') AS Category,
    SUM(i.QuantityOnHand) AS TotalQuantity,
    SUM(i.QuantityOnHand * p.CostPrice) AS TotalValue,
    COUNT(DISTINCT p.ProductID) AS ProductCount
FROM Inventory i
INNER JOIN Products p ON i.ProductID = p.ProductID
INNER JOIN Warehouses w ON i.WarehouseID = w.WarehouseID
LEFT JOIN Categories c ON p.CategoryID = c.CategoryID
GROUP BY ROLLUP(w.WarehouseName, c.CategoryName)
ORDER BY 
    CASE WHEN w.WarehouseName IS NULL THEN 1 ELSE 0 END,
    w.WarehouseName,
    CASE WHEN c.CategoryName IS NULL THEN 1 ELSE 0 END,
    c.CategoryName;
GO

-- ============================================
-- 6. PIVOT - Monthly Sales by Category
-- ============================================

-- Sales by category pivoted by month
SELECT CategoryName, [1] AS Jan, [2] AS Feb, [3] AS Mar, [4] AS Apr, [5] AS May, [6] AS Jun,
       [7] AS Jul, [8] AS Aug, [9] AS Sep, [10] AS Oct, [11] AS Nov, [12] AS Dec
FROM (
    SELECT 
        c.CategoryName,
        MONTH(so.OrderDate) AS SaleMonth,
        SUM(soi.Quantity * soi.UnitPrice * (1 - soi.Discount/100)) AS Revenue
    FROM SalesOrders so
    INNER JOIN SalesOrderItems soi ON so.SalesOrderID = soi.SalesOrderID
    INNER JOIN Products p ON soi.ProductID = p.ProductID
    INNER JOIN Categories c ON p.CategoryID = c.CategoryID
    WHERE YEAR(so.OrderDate) = YEAR(GETDATE())
        AND so.Status NOT IN ('Cancelled')
    GROUP BY c.CategoryName, MONTH(so.OrderDate)
) AS SourceTable
PIVOT (
    SUM(Revenue)
    FOR SaleMonth IN ([1], [2], [3], [4], [5], [6], [7], [8], [9], [10], [11], [12])
) AS PivotTable
ORDER BY CategoryName;
GO

-- ============================================
-- 7. ROW_NUMBER - Top N Products per Category
-- ============================================

-- Top 3 selling products in each category
WITH RankedProducts AS (
    SELECT 
        c.CategoryName,
        p.ProductID,
        p.ProductName,
        SUM(soi.Quantity) AS TotalQuantitySold,
        SUM(soi.Quantity * soi.UnitPrice * (1 - soi.Discount/100)) AS Revenue,
        ROW_NUMBER() OVER (
            PARTITION BY c.CategoryID 
            ORDER BY SUM(soi.Quantity * soi.UnitPrice * (1 - soi.Discount/100)) DESC
        ) AS CategoryRank
    FROM Categories c
    INNER JOIN Products p ON c.CategoryID = p.CategoryID
    INNER JOIN SalesOrderItems soi ON p.ProductID = soi.ProductID
    INNER JOIN SalesOrders so ON soi.SalesOrderID = so.SalesOrderID
    WHERE so.Status NOT IN ('Cancelled')
    GROUP BY c.CategoryID, c.CategoryName, p.ProductID, p.ProductName
)
SELECT 
    CategoryName,
    ProductName,
    TotalQuantitySold,
    Revenue,
    CategoryRank
FROM RankedProducts
WHERE CategoryRank <= 3
ORDER BY CategoryName, CategoryRank;
GO

-- ============================================
-- 8. EXISTS/NOT EXISTS - Customer Analysis
-- ============================================

-- Customers who have ordered but not in the last 30 days
SELECT 
    c.CustomerID,
    c.CustomerName,
    c.Email,
    c.CustomerType,
    (
        SELECT MAX(so.OrderDate)
        FROM SalesOrders so
        WHERE so.CustomerID = c.CustomerID
    ) AS LastOrderDate,
    (
        SELECT COUNT(*)
        FROM SalesOrders so
        WHERE so.CustomerID = c.CustomerID
    ) AS TotalOrders,
    (
        SELECT SUM(so.TotalAmount)
        FROM SalesOrders so
        WHERE so.CustomerID = c.CustomerID AND so.Status NOT IN ('Cancelled')
    ) AS LifetimeValue
FROM Customers c
WHERE EXISTS (
    SELECT 1 FROM SalesOrders so WHERE so.CustomerID = c.CustomerID
)
AND NOT EXISTS (
    SELECT 1 FROM SalesOrders so 
    WHERE so.CustomerID = c.CustomerID 
    AND so.OrderDate >= DATEADD(DAY, -30, GETDATE())
)
ORDER BY LifetimeValue DESC;
GO

-- ============================================
-- 9. CASE STATEMENTS - Order Status Analysis
-- ============================================

-- Comprehensive order status dashboard
SELECT 
    FORMAT(so.OrderDate, 'yyyy-MM') AS OrderMonth,
    COUNT(*) AS TotalOrders,
    SUM(CASE WHEN so.Status = 'Delivered' THEN 1 ELSE 0 END) AS Delivered,
    SUM(CASE WHEN so.Status = 'Shipped' THEN 1 ELSE 0 END) AS Shipped,
    SUM(CASE WHEN so.Status = 'Processing' THEN 1 ELSE 0 END) AS Processing,
    SUM(CASE WHEN so.Status = 'Pending' THEN 1 ELSE 0 END) AS Pending,
    SUM(CASE WHEN so.Status = 'Cancelled' THEN 1 ELSE 0 END) AS Cancelled,
    CAST(SUM(CASE WHEN so.Status = 'Delivered' THEN 1.0 ELSE 0 END) / COUNT(*) * 100 AS DECIMAL(5,2)) AS DeliveryRate,
    SUM(so.TotalAmount) AS TotalRevenue,
    AVG(so.TotalAmount) AS AvgOrderValue,
    SUM(CASE WHEN so.Status NOT IN ('Cancelled') THEN so.TotalAmount ELSE 0 END) AS ValidRevenue
FROM SalesOrders so
GROUP BY FORMAT(so.OrderDate, 'yyyy-MM')
ORDER BY OrderMonth DESC;
GO

-- ============================================
-- 10. RECURSIVE CTE - (Bonus) Category Hierarchy Example
-- ============================================

-- Example of recursive query structure (if categories had parent-child relationship)
-- This demonstrates the concept even though our schema uses flat categories

;WITH NumberSequence AS (
    SELECT 1 AS Num
    UNION ALL
    SELECT Num + 1 FROM NumberSequence WHERE Num < 12
),
MonthlyData AS (
    SELECT 
        n.Num AS MonthNum,
        DATENAME(MONTH, DATEFROMPARTS(YEAR(GETDATE()), n.Num, 1)) AS MonthName,
        ISNULL((
            SELECT SUM(TotalAmount)
            FROM SalesOrders
            WHERE MONTH(OrderDate) = n.Num
            AND YEAR(OrderDate) = YEAR(GETDATE())
            AND Status NOT IN ('Cancelled')
        ), 0) AS Revenue
    FROM NumberSequence n
)
SELECT 
    MonthNum,
    MonthName,
    Revenue,
    SUM(Revenue) OVER (ORDER BY MonthNum) AS YTDRevenue
FROM MonthlyData
ORDER BY MonthNum;
GO

PRINT 'Sample queries executed successfully!';
GO
