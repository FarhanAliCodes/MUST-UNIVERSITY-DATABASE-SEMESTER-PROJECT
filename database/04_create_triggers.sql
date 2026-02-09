-- Inventory & Supply Chain Analytics System
-- Triggers Creation Script
-- Microsoft SQL Server

USE InventoryDB;
GO

-- Trigger 1: Update Inventory on Purchase Order Receive
-- When ReceivedQuantity changes in PurchaseOrderItems, update Inventory and log StockMovement
CREATE OR ALTER TRIGGER trg_UpdateInventoryOnPOReceive
ON PurchaseOrderItems
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    IF UPDATE(ReceivedQuantity)
    BEGIN
        DECLARE @PurchaseOrderID INT, @WarehouseID INT;
        
        SELECT @PurchaseOrderID = i.PurchaseOrderID
        FROM inserted i;
        
        SELECT @WarehouseID = WarehouseID 
        FROM PurchaseOrders 
        WHERE PurchaseOrderID = @PurchaseOrderID;

        DECLARE @ProductID INT, @QtyDiff INT;
        
        DECLARE update_cursor CURSOR FOR
            SELECT i.ProductID, (i.ReceivedQuantity - d.ReceivedQuantity) AS QtyDiff
            FROM inserted i
            INNER JOIN deleted d ON i.POItemID = d.POItemID
            WHERE i.ReceivedQuantity > d.ReceivedQuantity;
        
        OPEN update_cursor;
        FETCH NEXT FROM update_cursor INTO @ProductID, @QtyDiff;
        
        WHILE @@FETCH_STATUS = 0
        BEGIN
            IF EXISTS (SELECT 1 FROM Inventory WHERE ProductID = @ProductID AND WarehouseID = @WarehouseID)
            BEGIN
                UPDATE Inventory 
                SET QuantityOnHand = QuantityOnHand + @QtyDiff,
                    LastRestockDate = GETDATE(),
                    UpdatedAt = GETDATE()
                WHERE ProductID = @ProductID AND WarehouseID = @WarehouseID;
            END
            ELSE
            BEGIN
                INSERT INTO Inventory (ProductID, WarehouseID, QuantityOnHand, LastRestockDate)
                VALUES (@ProductID, @WarehouseID, @QtyDiff, GETDATE());
            END

            INSERT INTO StockMovements (ProductID, WarehouseID, MovementType, Quantity, ReferenceType, ReferenceID, Notes)
            VALUES (@ProductID, @WarehouseID, 'IN', @QtyDiff, 'PO', @PurchaseOrderID, 'Auto-logged by trigger on PO receive');

            FETCH NEXT FROM update_cursor INTO @ProductID, @QtyDiff;
        END
        
        CLOSE update_cursor;
        DEALLOCATE update_cursor;
    END
END;
GO

-- Trigger 2: Reserve Stock on Sales Order Create
-- When items are added to a sales order, reserve the stock
CREATE OR ALTER TRIGGER trg_ReserveStockOnSOCreate
ON SalesOrderItems
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @SalesOrderID INT, @WarehouseID INT;
    
    SELECT TOP 1 @SalesOrderID = SalesOrderID FROM inserted;
    SELECT @WarehouseID = WarehouseID FROM SalesOrders WHERE SalesOrderID = @SalesOrderID;
    
    UPDATE i
    SET i.QuantityReserved = i.QuantityReserved + ins.Quantity,
        i.UpdatedAt = GETDATE()
    FROM Inventory i
    INNER JOIN inserted ins ON i.ProductID = ins.ProductID
    WHERE i.WarehouseID = @WarehouseID;
END;
GO

-- Trigger 3: Deduct Stock on Shipment
-- When a shipment is created, deduct stock and log movement
CREATE OR ALTER TRIGGER trg_DeductStockOnShipment
ON Shipments
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @SalesOrderID INT, @WarehouseID INT, @ShipmentID INT;
    
    SELECT @SalesOrderID = SalesOrderID, @ShipmentID = ShipmentID FROM inserted;
    SELECT @WarehouseID = WarehouseID FROM SalesOrders WHERE SalesOrderID = @SalesOrderID;
    
    UPDATE i
    SET i.QuantityOnHand = i.QuantityOnHand - soi.Quantity,
        i.QuantityReserved = i.QuantityReserved - soi.Quantity,
        i.UpdatedAt = GETDATE()
    FROM Inventory i
    INNER JOIN SalesOrderItems soi ON i.ProductID = soi.ProductID
    WHERE soi.SalesOrderID = @SalesOrderID AND i.WarehouseID = @WarehouseID;

    INSERT INTO StockMovements (ProductID, WarehouseID, MovementType, Quantity, ReferenceType, ReferenceID, Notes)
    SELECT soi.ProductID, @WarehouseID, 'OUT', soi.Quantity, 'SO', @SalesOrderID, 
           'Auto-logged by trigger on shipment creation'
    FROM SalesOrderItems soi
    WHERE soi.SalesOrderID = @SalesOrderID;
END;
GO

-- Trigger 4: Low Stock Alert
-- When inventory falls below reorder level, create an alert
CREATE OR ALTER TRIGGER trg_LowStockAlert
ON Inventory
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    IF UPDATE(QuantityOnHand)
    BEGIN
        INSERT INTO Alerts (AlertType, ProductID, WarehouseID, Message)
        SELECT 
            'LowStock',
            i.ProductID,
            i.WarehouseID,
            'Low stock alert: ' + p.ProductName + ' (SKU: ' + p.SKU + ') has fallen to ' + 
            CAST(i.QuantityOnHand AS NVARCHAR) + ' units in warehouse. Reorder level is ' + 
            CAST(p.ReorderLevel AS NVARCHAR) + ' units.'
        FROM inserted i
        INNER JOIN deleted d ON i.InventoryID = d.InventoryID
        INNER JOIN Products p ON i.ProductID = p.ProductID
        WHERE i.QuantityOnHand <= p.ReorderLevel 
          AND d.QuantityOnHand > p.ReorderLevel
          AND NOT EXISTS (
              SELECT 1 FROM Alerts a 
              WHERE a.ProductID = i.ProductID 
                AND a.WarehouseID = i.WarehouseID 
                AND a.AlertType = 'LowStock'
                AND a.IsRead = 0
          );
    END
END;
GO

-- Trigger 5: Audit Price Changes
-- Log price changes to PriceHistory table when product prices are modified
CREATE OR ALTER TRIGGER trg_AuditPriceChanges
ON Products
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    IF UPDATE(UnitPrice) OR UPDATE(CostPrice)
    BEGIN
        INSERT INTO PriceHistory (ProductID, OldUnitPrice, NewUnitPrice, OldCostPrice, NewCostPrice, ChangedBy)
        SELECT 
            i.ProductID,
            d.UnitPrice,
            i.UnitPrice,
            d.CostPrice,
            i.CostPrice,
            SYSTEM_USER
        FROM inserted i
        INNER JOIN deleted d ON i.ProductID = d.ProductID
        WHERE i.UnitPrice <> d.UnitPrice OR i.CostPrice <> d.CostPrice;
    END
END;
GO

-- Additional Trigger: Update PO Total on Item Changes
CREATE OR ALTER TRIGGER trg_UpdatePOTotal
ON PurchaseOrderItems
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @POIDs TABLE (PurchaseOrderID INT);
    
    INSERT INTO @POIDs
    SELECT DISTINCT PurchaseOrderID FROM inserted
    UNION
    SELECT DISTINCT PurchaseOrderID FROM deleted;
    
    UPDATE po
    SET po.TotalAmount = ISNULL((
        SELECT SUM(Quantity * UnitCost) 
        FROM PurchaseOrderItems 
        WHERE PurchaseOrderID = po.PurchaseOrderID
    ), 0)
    FROM PurchaseOrders po
    INNER JOIN @POIDs p ON po.PurchaseOrderID = p.PurchaseOrderID;
END;
GO

-- Additional Trigger: Update SO Total on Item Changes
CREATE OR ALTER TRIGGER trg_UpdateSOTotal
ON SalesOrderItems
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @SOIDs TABLE (SalesOrderID INT);
    
    INSERT INTO @SOIDs
    SELECT DISTINCT SalesOrderID FROM inserted
    UNION
    SELECT DISTINCT SalesOrderID FROM deleted;
    
    UPDATE so
    SET so.TotalAmount = ISNULL((
        SELECT SUM(Quantity * UnitPrice * (1 - Discount/100)) 
        FROM SalesOrderItems 
        WHERE SalesOrderID = so.SalesOrderID
    ), 0)
    FROM SalesOrders so
    INNER JOIN @SOIDs s ON so.SalesOrderID = s.SalesOrderID;
END;
GO

PRINT 'All triggers created successfully!';
GO
