-- Inventory & Supply Chain Analytics System
-- Database Tables Creation Script
-- Microsoft SQL Server

USE master;
GO

IF EXISTS (SELECT name FROM sys.databases WHERE name = 'InventoryDB')
BEGIN
    ALTER DATABASE InventoryDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE InventoryDB;
END
GO

CREATE DATABASE InventoryDB;
GO

USE InventoryDB;
GO

-- 1. Categories Table
CREATE TABLE Categories (
    CategoryID INT IDENTITY(1,1) PRIMARY KEY,
    CategoryName NVARCHAR(100) NOT NULL UNIQUE,
    Description NVARCHAR(500) NULL,
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

-- 2. Suppliers Table
CREATE TABLE Suppliers (
    SupplierID INT IDENTITY(1,1) PRIMARY KEY,
    SupplierName NVARCHAR(200) NOT NULL,
    ContactPerson NVARCHAR(100) NULL,
    Email NVARCHAR(100) NULL,
    Phone NVARCHAR(20) NULL,
    Address NVARCHAR(500) NULL,
    City NVARCHAR(100) NULL,
    Country NVARCHAR(100) NULL,
    Rating DECIMAL(2,1) NULL CHECK (Rating >= 1 AND Rating <= 5),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

-- 3. Products Table
CREATE TABLE Products (
    ProductID INT IDENTITY(1,1) PRIMARY KEY,
    SKU NVARCHAR(50) NOT NULL UNIQUE,
    ProductName NVARCHAR(200) NOT NULL,
    Description NVARCHAR(1000) NULL,
    CategoryID INT NULL,
    SupplierID INT NULL,
    UnitPrice DECIMAL(10,2) NOT NULL,
    CostPrice DECIMAL(10,2) NOT NULL,
    ReorderLevel INT DEFAULT 10,
    ReorderQuantity INT DEFAULT 50,
    LeadTimeDays INT DEFAULT 7,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Products_Categories FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID),
    CONSTRAINT FK_Products_Suppliers FOREIGN KEY (SupplierID) REFERENCES Suppliers(SupplierID)
);
GO

-- 4. Warehouses Table
CREATE TABLE Warehouses (
    WarehouseID INT IDENTITY(1,1) PRIMARY KEY,
    WarehouseName NVARCHAR(100) NOT NULL,
    Location NVARCHAR(200) NULL,
    City NVARCHAR(100) NULL,
    Capacity INT NULL,
    ManagerName NVARCHAR(100) NULL,
    Phone NVARCHAR(20) NULL,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

-- 5. Inventory Table
CREATE TABLE Inventory (
    InventoryID INT IDENTITY(1,1) PRIMARY KEY,
    ProductID INT NOT NULL,
    WarehouseID INT NOT NULL,
    QuantityOnHand INT DEFAULT 0,
    QuantityReserved INT DEFAULT 0,
    LastRestockDate DATETIME NULL,
    UpdatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Inventory_Products FOREIGN KEY (ProductID) REFERENCES Products(ProductID),
    CONSTRAINT FK_Inventory_Warehouses FOREIGN KEY (WarehouseID) REFERENCES Warehouses(WarehouseID),
    CONSTRAINT UQ_Inventory_Product_Warehouse UNIQUE (ProductID, WarehouseID)
);
GO

-- 6. Customers Table
CREATE TABLE Customers (
    CustomerID INT IDENTITY(1,1) PRIMARY KEY,
    CustomerName NVARCHAR(200) NOT NULL,
    Email NVARCHAR(100) NULL,
    Phone NVARCHAR(20) NULL,
    Address NVARCHAR(500) NULL,
    City NVARCHAR(100) NULL,
    Country NVARCHAR(100) NULL,
    CustomerType NVARCHAR(20) DEFAULT 'Retail' CHECK (CustomerType IN ('Retail', 'Wholesale')),
    CreditLimit DECIMAL(12,2) DEFAULT 0,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

-- 7. PurchaseOrders Table
CREATE TABLE PurchaseOrders (
    PurchaseOrderID INT IDENTITY(1,1) PRIMARY KEY,
    PONumber NVARCHAR(50) NOT NULL UNIQUE,
    SupplierID INT NOT NULL,
    WarehouseID INT NOT NULL,
    OrderDate DATETIME DEFAULT GETDATE(),
    ExpectedDate DATETIME NULL,
    Status NVARCHAR(20) DEFAULT 'Pending' CHECK (Status IN ('Pending', 'Approved', 'Received', 'Cancelled')),
    TotalAmount DECIMAL(12,2) NULL,
    Notes NVARCHAR(1000) NULL,
    CreatedBy NVARCHAR(100) NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_PurchaseOrders_Suppliers FOREIGN KEY (SupplierID) REFERENCES Suppliers(SupplierID),
    CONSTRAINT FK_PurchaseOrders_Warehouses FOREIGN KEY (WarehouseID) REFERENCES Warehouses(WarehouseID)
);
GO

-- 8. PurchaseOrderItems Table
CREATE TABLE PurchaseOrderItems (
    POItemID INT IDENTITY(1,1) PRIMARY KEY,
    PurchaseOrderID INT NOT NULL,
    ProductID INT NOT NULL,
    Quantity INT NOT NULL,
    UnitCost DECIMAL(10,2) NOT NULL,
    ReceivedQuantity INT DEFAULT 0,
    CONSTRAINT FK_POItems_PurchaseOrders FOREIGN KEY (PurchaseOrderID) REFERENCES PurchaseOrders(PurchaseOrderID) ON DELETE CASCADE,
    CONSTRAINT FK_POItems_Products FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
);
GO

-- 9. SalesOrders Table
CREATE TABLE SalesOrders (
    SalesOrderID INT IDENTITY(1,1) PRIMARY KEY,
    SONumber NVARCHAR(50) NOT NULL UNIQUE,
    CustomerID INT NOT NULL,
    WarehouseID INT NOT NULL,
    OrderDate DATETIME DEFAULT GETDATE(),
    RequiredDate DATETIME NULL,
    Status NVARCHAR(20) DEFAULT 'Pending' CHECK (Status IN ('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled')),
    TotalAmount DECIMAL(12,2) NULL,
    ShippingAddress NVARCHAR(500) NULL,
    Notes NVARCHAR(1000) NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_SalesOrders_Customers FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID),
    CONSTRAINT FK_SalesOrders_Warehouses FOREIGN KEY (WarehouseID) REFERENCES Warehouses(WarehouseID)
);
GO

-- 10. SalesOrderItems Table
CREATE TABLE SalesOrderItems (
    SOItemID INT IDENTITY(1,1) PRIMARY KEY,
    SalesOrderID INT NOT NULL,
    ProductID INT NOT NULL,
    Quantity INT NOT NULL,
    UnitPrice DECIMAL(10,2) NOT NULL,
    Discount DECIMAL(5,2) DEFAULT 0,
    CONSTRAINT FK_SOItems_SalesOrders FOREIGN KEY (SalesOrderID) REFERENCES SalesOrders(SalesOrderID) ON DELETE CASCADE,
    CONSTRAINT FK_SOItems_Products FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
);
GO

-- 11. Shipments Table
CREATE TABLE Shipments (
    ShipmentID INT IDENTITY(1,1) PRIMARY KEY,
    SalesOrderID INT NOT NULL,
    ShipmentDate DATETIME DEFAULT GETDATE(),
    Carrier NVARCHAR(100) NULL,
    TrackingNumber NVARCHAR(100) NULL,
    Status NVARCHAR(20) DEFAULT 'Preparing' CHECK (Status IN ('Preparing', 'Shipped', 'InTransit', 'Delivered')),
    DeliveryDate DATETIME NULL,
    Notes NVARCHAR(500) NULL,
    CONSTRAINT FK_Shipments_SalesOrders FOREIGN KEY (SalesOrderID) REFERENCES SalesOrders(SalesOrderID)
);
GO

-- 12. StockMovements Table (Audit Trail)
CREATE TABLE StockMovements (
    MovementID INT IDENTITY(1,1) PRIMARY KEY,
    ProductID INT NOT NULL,
    WarehouseID INT NOT NULL,
    MovementType NVARCHAR(20) NOT NULL CHECK (MovementType IN ('IN', 'OUT', 'TRANSFER', 'ADJUSTMENT')),
    Quantity INT NOT NULL,
    ReferenceType NVARCHAR(20) NULL CHECK (ReferenceType IN ('PO', 'SO', 'MANUAL', 'TRANSFER')),
    ReferenceID INT NULL,
    Notes NVARCHAR(500) NULL,
    CreatedBy NVARCHAR(100) NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_StockMovements_Products FOREIGN KEY (ProductID) REFERENCES Products(ProductID),
    CONSTRAINT FK_StockMovements_Warehouses FOREIGN KEY (WarehouseID) REFERENCES Warehouses(WarehouseID)
);
GO

-- 13. Users Table
CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    Username NVARCHAR(50) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(256) NOT NULL,
    FullName NVARCHAR(100) NULL,
    Email NVARCHAR(100) NULL,
    Role NVARCHAR(20) DEFAULT 'Staff' CHECK (Role IN ('Admin', 'Manager', 'Staff')),
    IsActive BIT DEFAULT 1,
    LastLogin DATETIME NULL,
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

-- Additional Table: Price History (for trigger audit)
CREATE TABLE PriceHistory (
    PriceHistoryID INT IDENTITY(1,1) PRIMARY KEY,
    ProductID INT NOT NULL,
    OldUnitPrice DECIMAL(10,2) NULL,
    NewUnitPrice DECIMAL(10,2) NULL,
    OldCostPrice DECIMAL(10,2) NULL,
    NewCostPrice DECIMAL(10,2) NULL,
    ChangedBy NVARCHAR(100) NULL,
    ChangedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_PriceHistory_Products FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
);
GO

-- Additional Table: Alerts (for low stock trigger)
CREATE TABLE Alerts (
    AlertID INT IDENTITY(1,1) PRIMARY KEY,
    AlertType NVARCHAR(50) NOT NULL,
    ProductID INT NULL,
    WarehouseID INT NULL,
    Message NVARCHAR(500) NOT NULL,
    IsRead BIT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Alerts_Products FOREIGN KEY (ProductID) REFERENCES Products(ProductID),
    CONSTRAINT FK_Alerts_Warehouses FOREIGN KEY (WarehouseID) REFERENCES Warehouses(WarehouseID)
);
GO

-- Create Indexes for Performance
CREATE INDEX IX_Products_CategoryID ON Products(CategoryID);
CREATE INDEX IX_Products_SupplierID ON Products(SupplierID);
CREATE INDEX IX_Inventory_ProductID ON Inventory(ProductID);
CREATE INDEX IX_Inventory_WarehouseID ON Inventory(WarehouseID);
CREATE INDEX IX_PurchaseOrders_SupplierID ON PurchaseOrders(SupplierID);
CREATE INDEX IX_PurchaseOrders_Status ON PurchaseOrders(Status);
CREATE INDEX IX_SalesOrders_CustomerID ON SalesOrders(CustomerID);
CREATE INDEX IX_SalesOrders_Status ON SalesOrders(Status);
CREATE INDEX IX_StockMovements_ProductID ON StockMovements(ProductID);
CREATE INDEX IX_StockMovements_CreatedAt ON StockMovements(CreatedAt);
GO

PRINT 'All tables created successfully!';
GO
