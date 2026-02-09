-- Inventory & Supply Chain Analytics System
-- Seed Data Script
-- Microsoft SQL Server

USE InventoryDB;
GO

-- Disable triggers temporarily for clean seed
DISABLE TRIGGER trg_ReserveStockOnSOCreate ON SalesOrderItems;
DISABLE TRIGGER trg_DeductStockOnShipment ON Shipments;
DISABLE TRIGGER trg_LowStockAlert ON Inventory;
GO

-- Insert Categories
INSERT INTO Categories (CategoryName, Description) VALUES
('Electronics', 'Electronic devices and components'),
('Furniture', 'Office and home furniture'),
('Office Supplies', 'General office supplies and stationery'),
('Computer Hardware', 'Computer parts and peripherals'),
('Networking', 'Network equipment and cables'),
('Software', 'Software licenses and subscriptions'),
('Mobile Devices', 'Smartphones, tablets, and accessories'),
('Audio Visual', 'Audio and video equipment');
GO

-- Insert Suppliers
INSERT INTO Suppliers (SupplierName, ContactPerson, Email, Phone, Address, City, Country, Rating) VALUES
('TechSource Global', 'Ahmad Khan', 'ahmad@techsource.com', '+92-51-1234567', '123 Tech Park', 'Islamabad', 'Pakistan', 4.5),
('Office World Ltd', 'Sarah Johnson', 'sarah@officeworld.com', '+92-42-9876543', '456 Business Center', 'Lahore', 'Pakistan', 4.2),
('Digital Supplies Co', 'Michael Chen', 'michael@digitalsupplies.com', '+92-21-5551234', '789 Trade Avenue', 'Karachi', 'Pakistan', 4.8),
('Furniture Plus', 'Ali Hassan', 'ali@furnitureplus.com', '+92-51-7778899', '321 Furniture Lane', 'Rawalpindi', 'Pakistan', 3.9),
('Network Solutions', 'Fatima Malik', 'fatima@netsolutions.com', '+92-42-3334455', '654 IT Hub', 'Lahore', 'Pakistan', 4.6),
('Smart Electronics', 'Zain Ahmed', 'zain@smartelec.com', '+92-21-6667788', '987 Electronics Market', 'Karachi', 'Pakistan', 4.3);
GO

-- Insert Warehouses
INSERT INTO Warehouses (WarehouseName, Location, City, Capacity, ManagerName, Phone) VALUES
('Main Warehouse', 'Industrial Area Block A', 'Islamabad', 10000, 'Usman Ali', '+92-51-1112222'),
('North Distribution Center', 'GT Road', 'Rawalpindi', 7500, 'Hassan Raza', '+92-51-3334444'),
('South Hub', 'SITE Area', 'Karachi', 12000, 'Bilal Khan', '+92-21-5556666'),
('Central Store', 'Johar Town', 'Lahore', 8000, 'Imran Shah', '+92-42-7778888');
GO

-- Insert Products
INSERT INTO Products (SKU, ProductName, Description, CategoryID, SupplierID, UnitPrice, CostPrice, ReorderLevel, ReorderQuantity, LeadTimeDays) VALUES
('ELEC-001', 'Wireless Mouse', 'Ergonomic wireless mouse with USB receiver', 1, 1, 1500.00, 900.00, 50, 100, 5),
('ELEC-002', 'USB Keyboard', 'Full-size USB keyboard with numeric pad', 1, 1, 2000.00, 1200.00, 40, 80, 5),
('ELEC-003', 'Webcam HD 1080p', 'Full HD webcam with built-in microphone', 1, 3, 4500.00, 2800.00, 30, 50, 7),
('FURN-001', 'Office Chair', 'Ergonomic office chair with lumbar support', 2, 4, 15000.00, 9500.00, 10, 20, 14),
('FURN-002', 'Computer Desk', 'L-shaped computer desk with cable management', 2, 4, 25000.00, 16000.00, 5, 10, 14),
('FURN-003', 'Filing Cabinet', '3-drawer metal filing cabinet', 2, 4, 8000.00, 5000.00, 8, 15, 10),
('OFFC-001', 'A4 Paper (Ream)', 'Premium quality A4 paper, 500 sheets', 3, 2, 600.00, 400.00, 100, 200, 3),
('OFFC-002', 'Ballpoint Pens (Box)', 'Box of 50 blue ballpoint pens', 3, 2, 500.00, 300.00, 80, 150, 3),
('OFFC-003', 'Stapler Heavy Duty', 'Heavy duty stapler, 100 sheet capacity', 3, 2, 1200.00, 750.00, 25, 50, 5),
('COMP-001', 'SSD 500GB', '500GB Solid State Drive, SATA III', 4, 3, 8000.00, 5500.00, 20, 40, 7),
('COMP-002', 'RAM DDR4 16GB', '16GB DDR4 RAM, 3200MHz', 4, 3, 6500.00, 4200.00, 25, 50, 7),
('COMP-003', 'Graphics Card GTX', 'NVIDIA GTX 1660 Super 6GB', 4, 3, 45000.00, 35000.00, 5, 10, 10),
('NETW-001', 'Ethernet Cable 5m', 'Cat6 Ethernet cable, 5 meters', 5, 5, 500.00, 250.00, 100, 200, 3),
('NETW-002', 'Network Switch 8-Port', '8-Port Gigabit Network Switch', 5, 5, 5000.00, 3200.00, 15, 30, 7),
('NETW-003', 'WiFi Router AC1200', 'Dual-band WiFi router, AC1200', 5, 5, 7500.00, 4800.00, 10, 25, 7),
('MOB-001', 'Phone Case Universal', 'Universal smartphone protective case', 7, 6, 800.00, 400.00, 60, 120, 5),
('MOB-002', 'USB-C Charger 65W', '65W Fast USB-C charger', 7, 6, 2500.00, 1500.00, 40, 80, 5),
('MOB-003', 'Wireless Earbuds', 'Bluetooth 5.0 wireless earbuds with case', 7, 6, 3500.00, 2000.00, 30, 60, 7),
('AV-001', 'Monitor 24" FHD', '24-inch Full HD LED Monitor', 8, 1, 22000.00, 15000.00, 10, 20, 10),
('AV-002', 'Speakers 2.1', '2.1 Channel computer speakers with subwoofer', 8, 1, 5500.00, 3500.00, 15, 30, 7);
GO

-- Insert Customers
INSERT INTO Customers (CustomerName, Email, Phone, Address, City, Country, CustomerType, CreditLimit) VALUES
('ABC Corporation', 'procurement@abccorp.com', '+92-51-1234567', '100 Corporate Blvd', 'Islamabad', 'Pakistan', 'Wholesale', 500000.00),
('XYZ Tech Solutions', 'orders@xyztech.com', '+92-42-9876543', '200 Tech Street', 'Lahore', 'Pakistan', 'Wholesale', 350000.00),
('Quick Office Supplies', 'buy@quickoffice.com', '+92-21-5551234', '300 Business Park', 'Karachi', 'Pakistan', 'Retail', 100000.00),
('Digital Dreams', 'info@digitaldreams.com', '+92-51-7778899', '400 IT Plaza', 'Rawalpindi', 'Pakistan', 'Retail', 150000.00),
('Smart Solutions Ltd', 'purchase@smartsol.com', '+92-42-3334455', '500 Innovation Hub', 'Lahore', 'Pakistan', 'Wholesale', 250000.00),
('City Electronics', 'orders@cityelec.com', '+92-21-6667788', '600 Electronics Market', 'Karachi', 'Pakistan', 'Retail', 75000.00),
('Premier Offices', 'admin@premieroffices.com', '+92-51-8889999', '700 Office Complex', 'Islamabad', 'Pakistan', 'Wholesale', 400000.00),
('TechHub Store', 'store@techhub.com', '+92-42-1112233', '800 Tech Mall', 'Lahore', 'Pakistan', 'Retail', 120000.00);
GO

-- Insert Inventory
INSERT INTO Inventory (ProductID, WarehouseID, QuantityOnHand, QuantityReserved, LastRestockDate) VALUES
(1, 1, 150, 0, DATEADD(DAY, -10, GETDATE())),
(1, 2, 80, 0, DATEADD(DAY, -15, GETDATE())),
(1, 3, 120, 0, DATEADD(DAY, -8, GETDATE())),
(2, 1, 100, 0, DATEADD(DAY, -12, GETDATE())),
(2, 2, 60, 0, DATEADD(DAY, -20, GETDATE())),
(2, 4, 75, 0, DATEADD(DAY, -5, GETDATE())),
(3, 1, 45, 0, DATEADD(DAY, -18, GETDATE())),
(3, 3, 35, 0, DATEADD(DAY, -22, GETDATE())),
(4, 1, 25, 0, DATEADD(DAY, -30, GETDATE())),
(4, 2, 15, 0, DATEADD(DAY, -25, GETDATE())),
(4, 4, 20, 0, DATEADD(DAY, -28, GETDATE())),
(5, 1, 8, 0, DATEADD(DAY, -35, GETDATE())),
(5, 3, 6, 0, DATEADD(DAY, -40, GETDATE())),
(6, 1, 12, 0, DATEADD(DAY, -20, GETDATE())),
(6, 4, 10, 0, DATEADD(DAY, -15, GETDATE())),
(7, 1, 250, 0, DATEADD(DAY, -5, GETDATE())),
(7, 2, 180, 0, DATEADD(DAY, -7, GETDATE())),
(7, 3, 200, 0, DATEADD(DAY, -6, GETDATE())),
(7, 4, 150, 0, DATEADD(DAY, -8, GETDATE())),
(8, 1, 120, 0, DATEADD(DAY, -10, GETDATE())),
(8, 2, 90, 0, DATEADD(DAY, -12, GETDATE())),
(9, 1, 35, 0, DATEADD(DAY, -15, GETDATE())),
(9, 3, 28, 0, DATEADD(DAY, -18, GETDATE())),
(10, 1, 30, 0, DATEADD(DAY, -20, GETDATE())),
(10, 3, 25, 0, DATEADD(DAY, -22, GETDATE())),
(11, 1, 40, 0, DATEADD(DAY, -18, GETDATE())),
(11, 2, 35, 0, DATEADD(DAY, -20, GETDATE())),
(12, 1, 8, 0, DATEADD(DAY, -25, GETDATE())),
(12, 3, 5, 0, DATEADD(DAY, -30, GETDATE())),
(13, 1, 180, 0, DATEADD(DAY, -8, GETDATE())),
(13, 2, 150, 0, DATEADD(DAY, -10, GETDATE())),
(13, 3, 200, 0, DATEADD(DAY, -7, GETDATE())),
(14, 1, 25, 0, DATEADD(DAY, -15, GETDATE())),
(14, 4, 20, 0, DATEADD(DAY, -18, GETDATE())),
(15, 1, 18, 0, DATEADD(DAY, -20, GETDATE())),
(15, 2, 12, 0, DATEADD(DAY, -22, GETDATE())),
(16, 1, 90, 0, DATEADD(DAY, -12, GETDATE())),
(16, 3, 75, 0, DATEADD(DAY, -14, GETDATE())),
(17, 1, 55, 0, DATEADD(DAY, -10, GETDATE())),
(17, 2, 45, 0, DATEADD(DAY, -12, GETDATE())),
(18, 1, 40, 0, DATEADD(DAY, -15, GETDATE())),
(18, 3, 35, 0, DATEADD(DAY, -18, GETDATE())),
(19, 1, 15, 0, DATEADD(DAY, -25, GETDATE())),
(19, 2, 10, 0, DATEADD(DAY, -28, GETDATE())),
(20, 1, 22, 0, DATEADD(DAY, -20, GETDATE())),
(20, 4, 18, 0, DATEADD(DAY, -22, GETDATE()));
GO

-- Insert Users (passwords are plaintext for demo - use bcrypt in production)
INSERT INTO Users (Username, PasswordHash, FullName, Email, Role) VALUES
('admin', 'admin123', 'System Administrator', 'admin@inventory.com', 'Admin'),
('manager1', 'manager123', 'Ali Hassan', 'ali.hassan@inventory.com', 'Manager'),
('manager2', 'manager123', 'Sara Khan', 'sara.khan@inventory.com', 'Manager'),
('staff1', 'staff123', 'Ahmed Raza', 'ahmed.raza@inventory.com', 'Staff'),
('staff2', 'staff123', 'Fatima Noor', 'fatima.noor@inventory.com', 'Staff');
GO

-- Insert Purchase Orders
INSERT INTO PurchaseOrders (PONumber, SupplierID, WarehouseID, OrderDate, ExpectedDate, Status, TotalAmount, CreatedBy) VALUES
('PO-20260101-0001', 1, 1, DATEADD(DAY, -30, GETDATE()), DATEADD(DAY, -25, GETDATE()), 'Received', 125000.00, 'manager1'),
('PO-20260105-0002', 2, 1, DATEADD(DAY, -25, GETDATE()), DATEADD(DAY, -22, GETDATE()), 'Received', 85000.00, 'manager1'),
('PO-20260110-0003', 3, 3, DATEADD(DAY, -20, GETDATE()), DATEADD(DAY, -13, GETDATE()), 'Received', 210000.00, 'manager2'),
('PO-20260115-0004', 4, 1, DATEADD(DAY, -15, GETDATE()), DATEADD(DAY, -1, GETDATE()), 'Approved', 145000.00, 'manager1'),
('PO-20260120-0005', 5, 2, DATEADD(DAY, -10, GETDATE()), DATEADD(DAY, -3, GETDATE()), 'Pending', 65000.00, 'manager2'),
('PO-20260125-0006', 6, 1, DATEADD(DAY, -5, GETDATE()), DATEADD(DAY, 2, GETDATE()), 'Pending', 95000.00, 'manager1');
GO

-- Insert Purchase Order Items
INSERT INTO PurchaseOrderItems (PurchaseOrderID, ProductID, Quantity, UnitCost, ReceivedQuantity) VALUES
(1, 1, 100, 900.00, 100),
(1, 2, 50, 1200.00, 50),
(2, 7, 200, 400.00, 200),
(2, 8, 100, 300.00, 100),
(3, 10, 30, 5500.00, 30),
(3, 11, 40, 4200.00, 40),
(4, 4, 10, 9500.00, 0),
(4, 5, 5, 16000.00, 0),
(5, 13, 150, 250.00, 0),
(5, 14, 20, 3200.00, 0),
(6, 17, 50, 1500.00, 0),
(6, 18, 30, 2000.00, 0);
GO

-- Insert Sales Orders
INSERT INTO SalesOrders (SONumber, CustomerID, WarehouseID, OrderDate, RequiredDate, Status, TotalAmount, ShippingAddress) VALUES
('SO-20260101-0001', 1, 1, DATEADD(DAY, -28, GETDATE()), DATEADD(DAY, -25, GETDATE()), 'Delivered', 185000.00, '100 Corporate Blvd, Islamabad'),
('SO-20260105-0002', 2, 3, DATEADD(DAY, -25, GETDATE()), DATEADD(DAY, -22, GETDATE()), 'Delivered', 92000.00, '200 Tech Street, Lahore'),
('SO-20260110-0003', 3, 1, DATEADD(DAY, -20, GETDATE()), DATEADD(DAY, -17, GETDATE()), 'Shipped', 45000.00, '300 Business Park, Karachi'),
('SO-20260115-0004', 4, 2, DATEADD(DAY, -15, GETDATE()), DATEADD(DAY, -12, GETDATE()), 'Shipped', 68000.00, '400 IT Plaza, Rawalpindi'),
('SO-20260120-0005', 5, 1, DATEADD(DAY, -10, GETDATE()), DATEADD(DAY, -7, GETDATE()), 'Processing', 125000.00, '500 Innovation Hub, Lahore'),
('SO-20260125-0006', 6, 3, DATEADD(DAY, -5, GETDATE()), DATEADD(DAY, -2, GETDATE()), 'Pending', 35000.00, '600 Electronics Market, Karachi'),
('SO-20260128-0007', 7, 1, DATEADD(DAY, -3, GETDATE()), DATEADD(DAY, 4, GETDATE()), 'Pending', 210000.00, '700 Office Complex, Islamabad'),
('SO-20260130-0008', 8, 4, DATEADD(DAY, -1, GETDATE()), DATEADD(DAY, 6, GETDATE()), 'Pending', 78000.00, '800 Tech Mall, Lahore');
GO

-- Insert Sales Order Items
INSERT INTO SalesOrderItems (SalesOrderID, ProductID, Quantity, UnitPrice, Discount) VALUES
(1, 4, 5, 15000.00, 5),
(1, 5, 3, 25000.00, 5),
(1, 19, 2, 22000.00, 0),
(2, 10, 5, 8000.00, 0),
(2, 11, 8, 6500.00, 0),
(3, 1, 20, 1500.00, 10),
(3, 2, 10, 2000.00, 5),
(4, 3, 10, 4500.00, 0),
(4, 18, 8, 3500.00, 5),
(5, 4, 5, 15000.00, 0),
(5, 6, 5, 8000.00, 10),
(6, 1, 15, 1500.00, 5),
(6, 16, 10, 800.00, 0),
(7, 4, 10, 15000.00, 5),
(7, 5, 2, 25000.00, 5),
(7, 19, 1, 22000.00, 0),
(8, 15, 5, 7500.00, 0),
(8, 14, 6, 5000.00, 5),
(8, 17, 10, 2500.00, 0);
GO

-- Insert Shipments
INSERT INTO Shipments (SalesOrderID, ShipmentDate, Carrier, TrackingNumber, Status, DeliveryDate) VALUES
(1, DATEADD(DAY, -27, GETDATE()), 'TCS Express', 'TCS123456789', 'Delivered', DATEADD(DAY, -25, GETDATE())),
(2, DATEADD(DAY, -24, GETDATE()), 'Leopards Courier', 'LEO987654321', 'Delivered', DATEADD(DAY, -22, GETDATE())),
(3, DATEADD(DAY, -18, GETDATE()), 'TCS Express', 'TCS456789123', 'InTransit', NULL),
(4, DATEADD(DAY, -13, GETDATE()), 'M&P Courier', 'MNP789123456', 'InTransit', NULL);
GO

-- Insert Stock Movements (historical data)
INSERT INTO StockMovements (ProductID, WarehouseID, MovementType, Quantity, ReferenceType, ReferenceID, CreatedBy, CreatedAt) VALUES
(1, 1, 'IN', 100, 'PO', 1, 'manager1', DATEADD(DAY, -25, GETDATE())),
(2, 1, 'IN', 50, 'PO', 1, 'manager1', DATEADD(DAY, -25, GETDATE())),
(7, 1, 'IN', 200, 'PO', 2, 'manager1', DATEADD(DAY, -22, GETDATE())),
(8, 1, 'IN', 100, 'PO', 2, 'manager1', DATEADD(DAY, -22, GETDATE())),
(10, 3, 'IN', 30, 'PO', 3, 'manager2', DATEADD(DAY, -13, GETDATE())),
(11, 3, 'IN', 40, 'PO', 3, 'manager2', DATEADD(DAY, -13, GETDATE())),
(4, 1, 'OUT', 5, 'SO', 1, 'staff1', DATEADD(DAY, -27, GETDATE())),
(5, 1, 'OUT', 3, 'SO', 1, 'staff1', DATEADD(DAY, -27, GETDATE())),
(19, 1, 'OUT', 2, 'SO', 1, 'staff1', DATEADD(DAY, -27, GETDATE())),
(10, 3, 'OUT', 5, 'SO', 2, 'staff2', DATEADD(DAY, -24, GETDATE())),
(11, 3, 'OUT', 8, 'SO', 2, 'staff2', DATEADD(DAY, -24, GETDATE()));
GO

-- Re-enable triggers
ENABLE TRIGGER trg_ReserveStockOnSOCreate ON SalesOrderItems;
ENABLE TRIGGER trg_DeductStockOnShipment ON Shipments;
ENABLE TRIGGER trg_LowStockAlert ON Inventory;
GO

PRINT 'Seed data inserted successfully!';
GO

-- Verify data counts
SELECT 'Categories' AS TableName, COUNT(*) AS RecordCount FROM Categories
UNION ALL SELECT 'Suppliers', COUNT(*) FROM Suppliers
UNION ALL SELECT 'Products', COUNT(*) FROM Products
UNION ALL SELECT 'Warehouses', COUNT(*) FROM Warehouses
UNION ALL SELECT 'Inventory', COUNT(*) FROM Inventory
UNION ALL SELECT 'Customers', COUNT(*) FROM Customers
UNION ALL SELECT 'PurchaseOrders', COUNT(*) FROM PurchaseOrders
UNION ALL SELECT 'PurchaseOrderItems', COUNT(*) FROM PurchaseOrderItems
UNION ALL SELECT 'SalesOrders', COUNT(*) FROM SalesOrders
UNION ALL SELECT 'SalesOrderItems', COUNT(*) FROM SalesOrderItems
UNION ALL SELECT 'Shipments', COUNT(*) FROM Shipments
UNION ALL SELECT 'StockMovements', COUNT(*) FROM StockMovements
UNION ALL SELECT 'Users', COUNT(*) FROM Users;
GO
