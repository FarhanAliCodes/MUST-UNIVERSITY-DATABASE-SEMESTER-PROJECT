-- Inventory & Supply Chain Analytics System
-- Database Views Creation Script
-- Microsoft SQL Server

USE InventoryDB;
GO

-- View 1: Inventory Summary
-- Consolidated view of inventory across all warehouses with calculated available quantity and stock value
CREATE OR ALTER VIEW vw_InventorySummary AS
SELECT 
    p.ProductID,
    p.SKU,
    p.ProductName,
    c.CategoryName,
    w.WarehouseID,
    w.WarehouseName,
    i.QuantityOnHand,
    i.QuantityReserved,
    (i.QuantityOnHand - i.QuantityReserved) AS AvailableQuantity,
    (i.QuantityOnHand * p.CostPrice) AS StockValue,
    p.ReorderLevel,
    CASE 
        WHEN i.QuantityOnHand <= p.ReorderLevel THEN 1 
        ELSE 0 
    END AS ReorderNeeded,
    i.LastRestockDate,
    i.UpdatedAt
FROM Inventory i
INNER JOIN Products p ON i.ProductID = p.ProductID
INNER JOIN Warehouses w ON i.WarehouseID = w.WarehouseID
LEFT JOIN Categories c ON p.CategoryID = c.CategoryID
WHERE p.IsActive = 1 AND w.IsActive = 1;
GO

-- View 2: Pending Orders
-- Lists all pending purchase and sales orders with aging information
CREATE OR ALTER VIEW vw_PendingOrders AS
SELECT 
    'Purchase Order' AS OrderType,
    po.PONumber AS OrderNumber,
    s.SupplierName AS PartyName,
    w.WarehouseName,
    po.OrderDate,
    po.ExpectedDate AS TargetDate,
    po.Status,
    po.TotalAmount,
    DATEDIFF(DAY, po.OrderDate, GETDATE()) AS DaysOld
FROM PurchaseOrders po
INNER JOIN Suppliers s ON po.SupplierID = s.SupplierID
INNER JOIN Warehouses w ON po.WarehouseID = w.WarehouseID
WHERE po.Status IN ('Pending', 'Approved')

UNION ALL

SELECT 
    'Sales Order' AS OrderType,
    so.SONumber AS OrderNumber,
    c.CustomerName AS PartyName,
    w.WarehouseName,
    so.OrderDate,
    so.RequiredDate AS TargetDate,
    so.Status,
    so.TotalAmount,
    DATEDIFF(DAY, so.OrderDate, GETDATE()) AS DaysOld
FROM SalesOrders so
INNER JOIN Customers c ON so.CustomerID = c.CustomerID
INNER JOIN Warehouses w ON so.WarehouseID = w.WarehouseID
WHERE so.Status IN ('Pending', 'Processing');
GO

-- View 3: Low Stock Products
-- Products below reorder level with suggested order quantities based on lead time
CREATE OR ALTER VIEW vw_LowStockProducts AS
SELECT 
    p.ProductID,
    p.SKU,
    p.ProductName,
    c.CategoryName,
    s.SupplierName,
    w.WarehouseID,
    w.WarehouseName,
    i.QuantityOnHand AS CurrentStock,
    p.ReorderLevel,
    (p.ReorderLevel - i.QuantityOnHand) AS Deficit,
    p.ReorderQuantity AS SuggestedOrderQty,
    p.LeadTimeDays,
    p.CostPrice,
    (p.ReorderQuantity * p.CostPrice) AS EstimatedOrderValue
FROM Inventory i
INNER JOIN Products p ON i.ProductID = p.ProductID
INNER JOIN Warehouses w ON i.WarehouseID = w.WarehouseID
LEFT JOIN Categories c ON p.CategoryID = c.CategoryID
LEFT JOIN Suppliers s ON p.SupplierID = s.SupplierID
WHERE i.QuantityOnHand <= p.ReorderLevel
    AND p.IsActive = 1 
    AND w.IsActive = 1;
GO

-- View 4: Sales By Product
-- Aggregated sales metrics per product including revenue, quantity sold, and profit margin
CREATE OR ALTER VIEW vw_SalesByProduct AS
SELECT 
    p.ProductID,
    p.SKU,
    p.ProductName,
    c.CategoryName,
    COUNT(DISTINCT so.SalesOrderID) AS TotalOrders,
    SUM(soi.Quantity) AS TotalQuantitySold,
    SUM(soi.Quantity * soi.UnitPrice * (1 - soi.Discount/100)) AS TotalRevenue,
    SUM(soi.Quantity * p.CostPrice) AS TotalCost,
    SUM(soi.Quantity * soi.UnitPrice * (1 - soi.Discount/100)) - SUM(soi.Quantity * p.CostPrice) AS TotalProfit,
    CASE 
        WHEN SUM(soi.Quantity * soi.UnitPrice * (1 - soi.Discount/100)) > 0 
        THEN ((SUM(soi.Quantity * soi.UnitPrice * (1 - soi.Discount/100)) - SUM(soi.Quantity * p.CostPrice)) / 
              SUM(soi.Quantity * soi.UnitPrice * (1 - soi.Discount/100))) * 100
        ELSE 0 
    END AS ProfitMarginPercent
FROM Products p
LEFT JOIN SalesOrderItems soi ON p.ProductID = soi.ProductID
LEFT JOIN SalesOrders so ON soi.SalesOrderID = so.SalesOrderID AND so.Status NOT IN ('Cancelled')
LEFT JOIN Categories c ON p.CategoryID = c.CategoryID
WHERE p.IsActive = 1
GROUP BY p.ProductID, p.SKU, p.ProductName, c.CategoryName;
GO

-- View 5: Supplier Performance
-- Supplier metrics including order count, on-time delivery rate, and average lead time
CREATE OR ALTER VIEW vw_SupplierPerformance AS
SELECT 
    s.SupplierID,
    s.SupplierName,
    s.ContactPerson,
    s.Email,
    s.Rating,
    COUNT(po.PurchaseOrderID) AS TotalOrders,
    SUM(CASE WHEN po.Status = 'Received' THEN 1 ELSE 0 END) AS CompletedOrders,
    SUM(CASE WHEN po.Status = 'Received' AND po.OrderDate <= po.ExpectedDate THEN 1 ELSE 0 END) AS OnTimeDeliveries,
    CASE 
        WHEN SUM(CASE WHEN po.Status = 'Received' THEN 1 ELSE 0 END) > 0
        THEN (CAST(SUM(CASE WHEN po.Status = 'Received' AND po.OrderDate <= po.ExpectedDate THEN 1 ELSE 0 END) AS DECIMAL) / 
              SUM(CASE WHEN po.Status = 'Received' THEN 1 ELSE 0 END)) * 100
        ELSE 0 
    END AS OnTimeDeliveryPercent,
    AVG(CASE WHEN po.Status = 'Received' THEN DATEDIFF(DAY, po.OrderDate, po.CreatedAt) ELSE NULL END) AS AvgLeadTimeDays,
    SUM(po.TotalAmount) AS TotalOrderValue
FROM Suppliers s
LEFT JOIN PurchaseOrders po ON s.SupplierID = po.SupplierID
WHERE s.IsActive = 1
GROUP BY s.SupplierID, s.SupplierName, s.ContactPerson, s.Email, s.Rating;
GO

-- View 6: Customer Order History
-- Customer purchase patterns with total orders, lifetime value, and last order date
CREATE OR ALTER VIEW vw_CustomerOrderHistory AS
SELECT 
    c.CustomerID,
    c.CustomerName,
    c.Email,
    c.Phone,
    c.CustomerType,
    c.City,
    c.Country,
    COUNT(so.SalesOrderID) AS TotalOrders,
    SUM(CASE WHEN so.Status NOT IN ('Cancelled') THEN so.TotalAmount ELSE 0 END) AS LifetimeValue,
    AVG(CASE WHEN so.Status NOT IN ('Cancelled') THEN so.TotalAmount ELSE NULL END) AS AvgOrderValue,
    MAX(so.OrderDate) AS LastOrderDate,
    DATEDIFF(DAY, MAX(so.OrderDate), GETDATE()) AS DaysSinceLastOrder
FROM Customers c
LEFT JOIN SalesOrders so ON c.CustomerID = so.CustomerID
WHERE c.IsActive = 1
GROUP BY c.CustomerID, c.CustomerName, c.Email, c.Phone, c.CustomerType, c.City, c.Country;
GO

-- Bonus View: Dashboard KPIs
CREATE OR ALTER VIEW vw_DashboardKPIs AS
SELECT 
    (SELECT ISNULL(SUM(i.QuantityOnHand * p.CostPrice), 0) 
     FROM Inventory i JOIN Products p ON i.ProductID = p.ProductID) AS TotalInventoryValue,
    
    (SELECT COUNT(*) FROM PurchaseOrders WHERE Status IN ('Pending', 'Approved')) AS PendingPurchaseOrders,
    
    (SELECT COUNT(*) FROM SalesOrders WHERE Status IN ('Pending', 'Processing')) AS PendingSalesOrders,
    
    (SELECT COUNT(DISTINCT i.ProductID) 
     FROM Inventory i 
     JOIN Products p ON i.ProductID = p.ProductID 
     WHERE i.QuantityOnHand <= p.ReorderLevel) AS LowStockProducts,
    
    (SELECT ISNULL(SUM(TotalAmount), 0) 
     FROM SalesOrders 
     WHERE Status NOT IN ('Cancelled') 
     AND MONTH(OrderDate) = MONTH(GETDATE()) 
     AND YEAR(OrderDate) = YEAR(GETDATE())) AS MonthlyRevenue,
    
    (SELECT COUNT(*) FROM Products WHERE IsActive = 1) AS TotalProducts,
    
    (SELECT COUNT(*) FROM Suppliers WHERE IsActive = 1) AS TotalSuppliers,
    
    (SELECT COUNT(*) FROM Customers WHERE IsActive = 1) AS TotalCustomers;
GO

PRINT 'All views created successfully!';
GO
