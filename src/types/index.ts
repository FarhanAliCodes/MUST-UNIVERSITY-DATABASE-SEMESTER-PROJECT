export interface Category {
  CategoryID: number;
  CategoryName: string;
  Description: string | null;
  CreatedAt: Date;
}

export interface Supplier {
  SupplierID: number;
  SupplierName: string;
  ContactPerson: string | null;
  Email: string | null;
  Phone: string | null;
  Address: string | null;
  City: string | null;
  Country: string | null;
  Rating: number | null;
  IsActive: boolean;
  CreatedAt: Date;
}

export interface Product {
  ProductID: number;
  SKU: string;
  ProductName: string;
  Description: string | null;
  CategoryID: number | null;
  CategoryName?: string;
  SupplierID: number | null;
  SupplierName?: string;
  UnitPrice: number;
  CostPrice: number;
  ReorderLevel: number;
  ReorderQuantity: number;
  LeadTimeDays: number;
  IsActive: boolean;
  CreatedAt: Date;
}

export interface Warehouse {
  WarehouseID: number;
  WarehouseName: string;
  Location: string | null;
  City: string | null;
  Capacity: number | null;
  ManagerName: string | null;
  Phone: string | null;
  IsActive: boolean;
  CreatedAt: Date;
}

export interface Inventory {
  InventoryID: number;
  ProductID: number;
  ProductName?: string;
  SKU?: string;
  WarehouseID: number;
  WarehouseName?: string;
  QuantityOnHand: number;
  QuantityReserved: number;
  AvailableQuantity?: number;
  LastRestockDate: Date | null;
  UpdatedAt: Date;
}

export interface Customer {
  CustomerID: number;
  CustomerName: string;
  Email: string | null;
  Phone: string | null;
  Address: string | null;
  City: string | null;
  Country: string | null;
  CustomerType: "Retail" | "Wholesale";
  CreditLimit: number;
  IsActive: boolean;
  CreatedAt: Date;
}

export interface PurchaseOrder {
  PurchaseOrderID: number;
  PONumber: string;
  SupplierID: number;
  SupplierName?: string;
  WarehouseID: number;
  WarehouseName?: string;
  OrderDate: Date;
  ExpectedDate: Date | null;
  Status: "Pending" | "Approved" | "Received" | "Cancelled";
  TotalAmount: number | null;
  Notes: string | null;
  CreatedBy: string | null;
  CreatedAt: Date;
}

export interface PurchaseOrderItem {
  POItemID: number;
  PurchaseOrderID: number;
  ProductID: number;
  ProductName?: string;
  SKU?: string;
  Quantity: number;
  UnitCost: number;
  ReceivedQuantity: number;
}

export interface SalesOrder {
  SalesOrderID: number;
  SONumber: string;
  CustomerID: number;
  CustomerName?: string;
  WarehouseID: number;
  WarehouseName?: string;
  OrderDate: Date;
  RequiredDate: Date | null;
  Status: "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
  TotalAmount: number | null;
  ShippingAddress: string | null;
  Notes: string | null;
  CreatedAt: Date;
}

export interface SalesOrderItem {
  SOItemID: number;
  SalesOrderID: number;
  ProductID: number;
  ProductName?: string;
  SKU?: string;
  Quantity: number;
  UnitPrice: number;
  Discount: number;
}

export interface Shipment {
  ShipmentID: number;
  SalesOrderID: number;
  SONumber?: string;
  ShipmentDate: Date;
  Carrier: string | null;
  TrackingNumber: string | null;
  Status: "Preparing" | "Shipped" | "InTransit" | "Delivered";
  DeliveryDate: Date | null;
  Notes: string | null;
}

export interface StockMovement {
  MovementID: number;
  ProductID: number;
  ProductName?: string;
  WarehouseID: number;
  WarehouseName?: string;
  MovementType: "IN" | "OUT" | "TRANSFER" | "ADJUSTMENT";
  Quantity: number;
  ReferenceType: "PO" | "SO" | "MANUAL" | "TRANSFER" | null;
  ReferenceID: number | null;
  Notes: string | null;
  CreatedBy: string | null;
  CreatedAt: Date;
}

export interface DashboardKPIs {
  TotalInventoryValue: number;
  PendingPurchaseOrders: number;
  PendingSalesOrders: number;
  LowStockProducts: number;
  MonthlyRevenue: number;
  TotalProducts: number;
  TotalSuppliers: number;
  TotalCustomers: number;
}

export interface Alert {
  AlertID: number;
  AlertType: string;
  ProductID: number | null;
  ProductName?: string;
  WarehouseID: number | null;
  WarehouseName?: string;
  Message: string;
  IsRead: boolean;
  CreatedAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface User {
  UserID: number;
  Username: string;
  FullName: string;
  Email: string;
  Role: "Admin" | "Manager" | "Staff";
  IsActive: boolean;
  LastLogin: Date | null;
  CreatedAt: Date;
}

export interface AuthUser {
  UserID: number;
  Username: string;
  FullName: string;
  Email: string;
  Role: "Admin" | "Manager" | "Staff";
}
