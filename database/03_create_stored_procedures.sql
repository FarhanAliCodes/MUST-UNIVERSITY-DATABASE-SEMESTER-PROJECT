-- Inventory & Supply Chain Analytics System
-- Stored Procedures Creation Script
-- Microsoft SQL Server

USE InventoryDB;
GO

-- Procedure 1: Create Purchase Order
CREATE OR ALTER PROCEDURE sp_CreatePurchaseOrder
    @SupplierID INT,
    @WarehouseID INT,
    @ExpectedDate DATETIME = NULL,
    @Notes NVARCHAR(1000) = NULL,
    @CreatedBy NVARCHAR(100) = NULL,
    @Items NVARCHAR(MAX), -- JSON array: [{"ProductID": 1, "Quantity": 10, "UnitCost": 50.00}, ...]
    @NewPurchaseOrderID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        DECLARE @PONumber NVARCHAR(50);
        SET @PONumber = 'PO-' + FORMAT(GETDATE(), 'yyyyMMdd') + '-' + 
                        RIGHT('0000' + CAST((SELECT ISNULL(MAX(PurchaseOrderID), 0) + 1 FROM PurchaseOrders) AS NVARCHAR), 4);

        INSERT INTO PurchaseOrders (PONumber, SupplierID, WarehouseID, ExpectedDate, Notes, CreatedBy, TotalAmount)
        VALUES (@PONumber, @SupplierID, @WarehouseID, @ExpectedDate, @Notes, @CreatedBy, 0);

        SET @NewPurchaseOrderID = SCOPE_IDENTITY();

        INSERT INTO PurchaseOrderItems (PurchaseOrderID, ProductID, Quantity, UnitCost)
        SELECT @NewPurchaseOrderID, ProductID, Quantity, UnitCost
        FROM OPENJSON(@Items)
        WITH (
            ProductID INT '$.ProductID',
            Quantity INT '$.Quantity',
            UnitCost DECIMAL(10,2) '$.UnitCost'
        );

        UPDATE PurchaseOrders 
        SET TotalAmount = (SELECT SUM(Quantity * UnitCost) FROM PurchaseOrderItems WHERE PurchaseOrderID = @NewPurchaseOrderID)
        WHERE PurchaseOrderID = @NewPurchaseOrderID;

        COMMIT TRANSACTION;
        SELECT @NewPurchaseOrderID AS PurchaseOrderID, @PONumber AS PONumber;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- Procedure 2: Receive Purchase Order
CREATE OR ALTER PROCEDURE sp_ReceivePurchaseOrder
    @PurchaseOrderID INT,
    @ReceivedItems NVARCHAR(MAX), -- JSON: [{"POItemID": 1, "ReceivedQuantity": 10}, ...]
    @ReceivedBy NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        DECLARE @WarehouseID INT;
        SELECT @WarehouseID = WarehouseID FROM PurchaseOrders WHERE PurchaseOrderID = @PurchaseOrderID;

        DECLARE @ItemsTable TABLE (POItemID INT, ReceivedQty INT);
        INSERT INTO @ItemsTable
        SELECT POItemID, ReceivedQuantity
        FROM OPENJSON(@ReceivedItems)
        WITH (
            POItemID INT '$.POItemID',
            ReceivedQuantity INT '$.ReceivedQuantity'
        );

        UPDATE poi
        SET poi.ReceivedQuantity = poi.ReceivedQuantity + it.ReceivedQty
        FROM PurchaseOrderItems poi
        INNER JOIN @ItemsTable it ON poi.POItemID = it.POItemID;

        DECLARE @ProductID INT, @Qty INT, @POItemID INT;
        DECLARE item_cursor CURSOR FOR 
            SELECT poi.ProductID, it.ReceivedQty, it.POItemID
            FROM PurchaseOrderItems poi
            INNER JOIN @ItemsTable it ON poi.POItemID = it.POItemID;

        OPEN item_cursor;
        FETCH NEXT FROM item_cursor INTO @ProductID, @Qty, @POItemID;

        WHILE @@FETCH_STATUS = 0
        BEGIN
            IF EXISTS (SELECT 1 FROM Inventory WHERE ProductID = @ProductID AND WarehouseID = @WarehouseID)
            BEGIN
                UPDATE Inventory 
                SET QuantityOnHand = QuantityOnHand + @Qty,
                    LastRestockDate = GETDATE(),
                    UpdatedAt = GETDATE()
                WHERE ProductID = @ProductID AND WarehouseID = @WarehouseID;
            END
            ELSE
            BEGIN
                INSERT INTO Inventory (ProductID, WarehouseID, QuantityOnHand, LastRestockDate)
                VALUES (@ProductID, @WarehouseID, @Qty, GETDATE());
            END

            INSERT INTO StockMovements (ProductID, WarehouseID, MovementType, Quantity, ReferenceType, ReferenceID, CreatedBy)
            VALUES (@ProductID, @WarehouseID, 'IN', @Qty, 'PO', @PurchaseOrderID, @ReceivedBy);

            FETCH NEXT FROM item_cursor INTO @ProductID, @Qty, @POItemID;
        END

        CLOSE item_cursor;
        DEALLOCATE item_cursor;

        IF NOT EXISTS (
            SELECT 1 FROM PurchaseOrderItems 
            WHERE PurchaseOrderID = @PurchaseOrderID AND ReceivedQuantity < Quantity
        )
        BEGIN
            UPDATE PurchaseOrders SET Status = 'Received' WHERE PurchaseOrderID = @PurchaseOrderID;
        END

        COMMIT TRANSACTION;
        SELECT 'Purchase order received successfully' AS Message;
    END TRY
    BEGIN CATCH
        IF CURSOR_STATUS('global', 'item_cursor') >= 0
        BEGIN
            CLOSE item_cursor;
            DEALLOCATE item_cursor;
        END
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- Procedure 3: Create Sales Order
CREATE OR ALTER PROCEDURE sp_CreateSalesOrder
    @CustomerID INT,
    @WarehouseID INT,
    @RequiredDate DATETIME = NULL,
    @ShippingAddress NVARCHAR(500) = NULL,
    @Notes NVARCHAR(1000) = NULL,
    @Items NVARCHAR(MAX), -- JSON: [{"ProductID": 1, "Quantity": 5, "UnitPrice": 100.00, "Discount": 0}, ...]
    @NewSalesOrderID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        DECLARE @ItemsTable TABLE (ProductID INT, Quantity INT, UnitPrice DECIMAL(10,2), Discount DECIMAL(5,2));
        INSERT INTO @ItemsTable
        SELECT ProductID, Quantity, UnitPrice, ISNULL(Discount, 0)
        FROM OPENJSON(@Items)
        WITH (
            ProductID INT '$.ProductID',
            Quantity INT '$.Quantity',
            UnitPrice DECIMAL(10,2) '$.UnitPrice',
            Discount DECIMAL(5,2) '$.Discount'
        );

        IF EXISTS (
            SELECT 1 FROM @ItemsTable it
            LEFT JOIN Inventory i ON it.ProductID = i.ProductID AND i.WarehouseID = @WarehouseID
            WHERE ISNULL(i.QuantityOnHand, 0) - ISNULL(i.QuantityReserved, 0) < it.Quantity
        )
        BEGIN
            RAISERROR('Insufficient stock for one or more items', 16, 1);
            RETURN;
        END

        DECLARE @SONumber NVARCHAR(50);
        SET @SONumber = 'SO-' + FORMAT(GETDATE(), 'yyyyMMdd') + '-' + 
                        RIGHT('0000' + CAST((SELECT ISNULL(MAX(SalesOrderID), 0) + 1 FROM SalesOrders) AS NVARCHAR), 4);

        INSERT INTO SalesOrders (SONumber, CustomerID, WarehouseID, RequiredDate, ShippingAddress, Notes, TotalAmount)
        VALUES (@SONumber, @CustomerID, @WarehouseID, @RequiredDate, @ShippingAddress, @Notes, 0);

        SET @NewSalesOrderID = SCOPE_IDENTITY();

        INSERT INTO SalesOrderItems (SalesOrderID, ProductID, Quantity, UnitPrice, Discount)
        SELECT @NewSalesOrderID, ProductID, Quantity, UnitPrice, Discount
        FROM @ItemsTable;

        UPDATE SalesOrders 
        SET TotalAmount = (
            SELECT SUM(Quantity * UnitPrice * (1 - Discount/100)) 
            FROM SalesOrderItems 
            WHERE SalesOrderID = @NewSalesOrderID
        )
        WHERE SalesOrderID = @NewSalesOrderID;

        UPDATE i
        SET i.QuantityReserved = i.QuantityReserved + it.Quantity,
            i.UpdatedAt = GETDATE()
        FROM Inventory i
        INNER JOIN @ItemsTable it ON i.ProductID = it.ProductID
        WHERE i.WarehouseID = @WarehouseID;

        COMMIT TRANSACTION;
        SELECT @NewSalesOrderID AS SalesOrderID, @SONumber AS SONumber;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- Procedure 4: Process Sales Order (Ship)
CREATE OR ALTER PROCEDURE sp_ProcessSalesOrder
    @SalesOrderID INT,
    @Carrier NVARCHAR(100) = NULL,
    @TrackingNumber NVARCHAR(100) = NULL,
    @ProcessedBy NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        DECLARE @WarehouseID INT, @Status NVARCHAR(20);
        SELECT @WarehouseID = WarehouseID, @Status = Status 
        FROM SalesOrders WHERE SalesOrderID = @SalesOrderID;

        IF @Status NOT IN ('Pending', 'Processing')
        BEGIN
            RAISERROR('Order cannot be processed. Current status: %s', 16, 1, @Status);
            RETURN;
        END

        UPDATE i
        SET i.QuantityOnHand = i.QuantityOnHand - soi.Quantity,
            i.QuantityReserved = i.QuantityReserved - soi.Quantity,
            i.UpdatedAt = GETDATE()
        FROM Inventory i
        INNER JOIN SalesOrderItems soi ON i.ProductID = soi.ProductID
        WHERE soi.SalesOrderID = @SalesOrderID AND i.WarehouseID = @WarehouseID;

        DECLARE @ProductID INT, @Qty INT;
        DECLARE item_cursor CURSOR FOR 
            SELECT ProductID, Quantity FROM SalesOrderItems WHERE SalesOrderID = @SalesOrderID;

        OPEN item_cursor;
        FETCH NEXT FROM item_cursor INTO @ProductID, @Qty;

        WHILE @@FETCH_STATUS = 0
        BEGIN
            INSERT INTO StockMovements (ProductID, WarehouseID, MovementType, Quantity, ReferenceType, ReferenceID, CreatedBy)
            VALUES (@ProductID, @WarehouseID, 'OUT', @Qty, 'SO', @SalesOrderID, @ProcessedBy);

            FETCH NEXT FROM item_cursor INTO @ProductID, @Qty;
        END

        CLOSE item_cursor;
        DEALLOCATE item_cursor;

        INSERT INTO Shipments (SalesOrderID, Carrier, TrackingNumber, Status)
        VALUES (@SalesOrderID, @Carrier, @TrackingNumber, 'Shipped');

        UPDATE SalesOrders SET Status = 'Shipped' WHERE SalesOrderID = @SalesOrderID;

        COMMIT TRANSACTION;
        SELECT 'Order processed and shipped successfully' AS Message;
    END TRY
    BEGIN CATCH
        IF CURSOR_STATUS('global', 'item_cursor') >= 0
        BEGIN
            CLOSE item_cursor;
            DEALLOCATE item_cursor;
        END
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- Procedure 5: Get Inventory Status
CREATE OR ALTER PROCEDURE sp_GetInventoryStatus
    @WarehouseID INT = NULL,
    @CategoryID INT = NULL,
    @LowStockOnly BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
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
        p.ReorderLevel,
        CASE WHEN i.QuantityOnHand <= p.ReorderLevel THEN 1 ELSE 0 END AS IsLowStock,
        (i.QuantityOnHand * p.CostPrice) AS StockValue,
        i.LastRestockDate
    FROM Inventory i
    INNER JOIN Products p ON i.ProductID = p.ProductID
    INNER JOIN Warehouses w ON i.WarehouseID = w.WarehouseID
    LEFT JOIN Categories c ON p.CategoryID = c.CategoryID
    WHERE p.IsActive = 1
        AND (@WarehouseID IS NULL OR i.WarehouseID = @WarehouseID)
        AND (@CategoryID IS NULL OR p.CategoryID = @CategoryID)
        AND (@LowStockOnly = 0 OR i.QuantityOnHand <= p.ReorderLevel)
    ORDER BY w.WarehouseName, p.ProductName;
END;
GO

-- Procedure 6: Transfer Stock
CREATE OR ALTER PROCEDURE sp_TransferStock
    @ProductID INT,
    @FromWarehouseID INT,
    @ToWarehouseID INT,
    @Quantity INT,
    @TransferredBy NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        DECLARE @AvailableQty INT;
        SELECT @AvailableQty = QuantityOnHand - QuantityReserved 
        FROM Inventory 
        WHERE ProductID = @ProductID AND WarehouseID = @FromWarehouseID;

        IF @AvailableQty IS NULL OR @AvailableQty < @Quantity
        BEGIN
            RAISERROR('Insufficient available stock for transfer', 16, 1);
            RETURN;
        END

        UPDATE Inventory 
        SET QuantityOnHand = QuantityOnHand - @Quantity, UpdatedAt = GETDATE()
        WHERE ProductID = @ProductID AND WarehouseID = @FromWarehouseID;

        IF EXISTS (SELECT 1 FROM Inventory WHERE ProductID = @ProductID AND WarehouseID = @ToWarehouseID)
        BEGIN
            UPDATE Inventory 
            SET QuantityOnHand = QuantityOnHand + @Quantity, 
                LastRestockDate = GETDATE(),
                UpdatedAt = GETDATE()
            WHERE ProductID = @ProductID AND WarehouseID = @ToWarehouseID;
        END
        ELSE
        BEGIN
            INSERT INTO Inventory (ProductID, WarehouseID, QuantityOnHand, LastRestockDate)
            VALUES (@ProductID, @ToWarehouseID, @Quantity, GETDATE());
        END

        INSERT INTO StockMovements (ProductID, WarehouseID, MovementType, Quantity, ReferenceType, Notes, CreatedBy)
        VALUES (@ProductID, @FromWarehouseID, 'TRANSFER', -@Quantity, 'TRANSFER', 
                'Transfer to Warehouse ID: ' + CAST(@ToWarehouseID AS NVARCHAR), @TransferredBy);

        INSERT INTO StockMovements (ProductID, WarehouseID, MovementType, Quantity, ReferenceType, Notes, CreatedBy)
        VALUES (@ProductID, @ToWarehouseID, 'TRANSFER', @Quantity, 'TRANSFER', 
                'Transfer from Warehouse ID: ' + CAST(@FromWarehouseID AS NVARCHAR), @TransferredBy);

        COMMIT TRANSACTION;
        SELECT 'Stock transferred successfully' AS Message;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- Procedure 7: Calculate Reorder Needs
CREATE OR ALTER PROCEDURE sp_CalculateReorderNeeds
    @WarehouseID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        p.ProductID,
        p.SKU,
        p.ProductName,
        s.SupplierID,
        s.SupplierName,
        w.WarehouseID,
        w.WarehouseName,
        i.QuantityOnHand AS CurrentStock,
        i.QuantityReserved,
        (i.QuantityOnHand - i.QuantityReserved) AS AvailableStock,
        p.ReorderLevel,
        p.ReorderQuantity AS SuggestedOrderQty,
        p.LeadTimeDays,
        p.CostPrice,
        (p.ReorderQuantity * p.CostPrice) AS EstimatedCost,
        CASE 
            WHEN i.QuantityOnHand <= 0 THEN 'Critical'
            WHEN i.QuantityOnHand <= p.ReorderLevel / 2 THEN 'Urgent'
            ELSE 'Normal'
        END AS Priority
    FROM Inventory i
    INNER JOIN Products p ON i.ProductID = p.ProductID
    INNER JOIN Warehouses w ON i.WarehouseID = w.WarehouseID
    LEFT JOIN Suppliers s ON p.SupplierID = s.SupplierID
    WHERE i.QuantityOnHand <= p.ReorderLevel
        AND p.IsActive = 1
        AND w.IsActive = 1
        AND (@WarehouseID IS NULL OR i.WarehouseID = @WarehouseID)
    ORDER BY 
        CASE 
            WHEN i.QuantityOnHand <= 0 THEN 1
            WHEN i.QuantityOnHand <= p.ReorderLevel / 2 THEN 2
            ELSE 3
        END,
        p.ProductName;
END;
GO

-- Procedure 8: Get Sales Analytics
CREATE OR ALTER PROCEDURE sp_GetSalesAnalytics
    @StartDate DATETIME,
    @EndDate DATETIME,
    @GroupBy NVARCHAR(20) = 'Monthly' -- 'Daily', 'Weekly', 'Monthly'
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @GroupBy = 'Daily'
    BEGIN
        SELECT 
            CAST(so.OrderDate AS DATE) AS Period,
            COUNT(DISTINCT so.SalesOrderID) AS TotalOrders,
            SUM(soi.Quantity) AS TotalQuantity,
            SUM(soi.Quantity * soi.UnitPrice * (1 - soi.Discount/100)) AS Revenue,
            SUM(soi.Quantity * p.CostPrice) AS Cost,
            SUM(soi.Quantity * soi.UnitPrice * (1 - soi.Discount/100)) - SUM(soi.Quantity * p.CostPrice) AS Profit
        FROM SalesOrders so
        INNER JOIN SalesOrderItems soi ON so.SalesOrderID = soi.SalesOrderID
        INNER JOIN Products p ON soi.ProductID = p.ProductID
        WHERE so.OrderDate BETWEEN @StartDate AND @EndDate
            AND so.Status NOT IN ('Cancelled')
        GROUP BY CAST(so.OrderDate AS DATE)
        ORDER BY Period;
    END
    ELSE IF @GroupBy = 'Weekly'
    BEGIN
        SELECT 
            DATEPART(YEAR, so.OrderDate) AS Year,
            DATEPART(WEEK, so.OrderDate) AS Week,
            MIN(CAST(so.OrderDate AS DATE)) AS WeekStart,
            COUNT(DISTINCT so.SalesOrderID) AS TotalOrders,
            SUM(soi.Quantity) AS TotalQuantity,
            SUM(soi.Quantity * soi.UnitPrice * (1 - soi.Discount/100)) AS Revenue,
            SUM(soi.Quantity * p.CostPrice) AS Cost,
            SUM(soi.Quantity * soi.UnitPrice * (1 - soi.Discount/100)) - SUM(soi.Quantity * p.CostPrice) AS Profit
        FROM SalesOrders so
        INNER JOIN SalesOrderItems soi ON so.SalesOrderID = soi.SalesOrderID
        INNER JOIN Products p ON soi.ProductID = p.ProductID
        WHERE so.OrderDate BETWEEN @StartDate AND @EndDate
            AND so.Status NOT IN ('Cancelled')
        GROUP BY DATEPART(YEAR, so.OrderDate), DATEPART(WEEK, so.OrderDate)
        ORDER BY Year, Week;
    END
    ELSE -- Monthly
    BEGIN
        SELECT 
            DATEPART(YEAR, so.OrderDate) AS Year,
            DATEPART(MONTH, so.OrderDate) AS Month,
            DATENAME(MONTH, so.OrderDate) AS MonthName,
            COUNT(DISTINCT so.SalesOrderID) AS TotalOrders,
            SUM(soi.Quantity) AS TotalQuantity,
            SUM(soi.Quantity * soi.UnitPrice * (1 - soi.Discount/100)) AS Revenue,
            SUM(soi.Quantity * p.CostPrice) AS Cost,
            SUM(soi.Quantity * soi.UnitPrice * (1 - soi.Discount/100)) - SUM(soi.Quantity * p.CostPrice) AS Profit
        FROM SalesOrders so
        INNER JOIN SalesOrderItems soi ON so.SalesOrderID = soi.SalesOrderID
        INNER JOIN Products p ON soi.ProductID = p.ProductID
        WHERE so.OrderDate BETWEEN @StartDate AND @EndDate
            AND so.Status NOT IN ('Cancelled')
        GROUP BY DATEPART(YEAR, so.OrderDate), DATEPART(MONTH, so.OrderDate), DATENAME(MONTH, so.OrderDate)
        ORDER BY Year, Month;
    END
END;
GO

-- Procedure 9: Get Supplier Performance
CREATE OR ALTER PROCEDURE sp_GetSupplierPerformance
    @SupplierID INT = NULL,
    @StartDate DATETIME = NULL,
    @EndDate DATETIME = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        s.SupplierID,
        s.SupplierName,
        s.ContactPerson,
        s.Email,
        s.Phone,
        s.Rating,
        COUNT(po.PurchaseOrderID) AS TotalOrders,
        SUM(CASE WHEN po.Status = 'Received' THEN 1 ELSE 0 END) AS CompletedOrders,
        SUM(CASE WHEN po.Status = 'Pending' THEN 1 ELSE 0 END) AS PendingOrders,
        SUM(po.TotalAmount) AS TotalOrderValue,
        AVG(po.TotalAmount) AS AvgOrderValue,
        AVG(DATEDIFF(DAY, po.OrderDate, 
            CASE WHEN po.Status = 'Received' THEN po.CreatedAt ELSE NULL END)) AS AvgLeadTimeDays,
        MIN(po.OrderDate) AS FirstOrderDate,
        MAX(po.OrderDate) AS LastOrderDate
    FROM Suppliers s
    LEFT JOIN PurchaseOrders po ON s.SupplierID = po.SupplierID
        AND (@StartDate IS NULL OR po.OrderDate >= @StartDate)
        AND (@EndDate IS NULL OR po.OrderDate <= @EndDate)
    WHERE s.IsActive = 1
        AND (@SupplierID IS NULL OR s.SupplierID = @SupplierID)
    GROUP BY s.SupplierID, s.SupplierName, s.ContactPerson, s.Email, s.Phone, s.Rating
    ORDER BY TotalOrderValue DESC;
END;
GO

-- Procedure 10: Adjust Inventory
CREATE OR ALTER PROCEDURE sp_AdjustInventory
    @ProductID INT,
    @WarehouseID INT,
    @AdjustmentQty INT, -- Positive to add, negative to subtract
    @Reason NVARCHAR(500),
    @AdjustedBy NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        DECLARE @CurrentQty INT;
        SELECT @CurrentQty = QuantityOnHand FROM Inventory 
        WHERE ProductID = @ProductID AND WarehouseID = @WarehouseID;

        IF @CurrentQty IS NULL
        BEGIN
            IF @AdjustmentQty < 0
            BEGIN
                RAISERROR('Cannot make negative adjustment. No inventory record exists.', 16, 1);
                RETURN;
            END
            
            INSERT INTO Inventory (ProductID, WarehouseID, QuantityOnHand)
            VALUES (@ProductID, @WarehouseID, @AdjustmentQty);
        END
        ELSE
        BEGIN
            IF (@CurrentQty + @AdjustmentQty) < 0
            BEGIN
                RAISERROR('Adjustment would result in negative inventory', 16, 1);
                RETURN;
            END

            UPDATE Inventory 
            SET QuantityOnHand = QuantityOnHand + @AdjustmentQty,
                UpdatedAt = GETDATE()
            WHERE ProductID = @ProductID AND WarehouseID = @WarehouseID;
        END

        INSERT INTO StockMovements (ProductID, WarehouseID, MovementType, Quantity, ReferenceType, Notes, CreatedBy)
        VALUES (@ProductID, @WarehouseID, 'ADJUSTMENT', @AdjustmentQty, 'MANUAL', @Reason, @AdjustedBy);

        COMMIT TRANSACTION;
        SELECT 'Inventory adjusted successfully' AS Message, 
               ISNULL(@CurrentQty, 0) AS PreviousQty,
               ISNULL(@CurrentQty, 0) + @AdjustmentQty AS NewQty;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

PRINT 'All stored procedures created successfully!';
GO
