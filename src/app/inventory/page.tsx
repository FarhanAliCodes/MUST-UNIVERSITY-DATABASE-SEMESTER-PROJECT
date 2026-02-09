"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { PageLoading } from "@/components/ui/Loading";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { ArrowLeftRight, Package, AlertTriangle } from "lucide-react";
import { Warehouse, Product } from "@/types";

interface InventoryItem {
  InventoryID: number;
  ProductID: number;
  SKU: string;
  ProductName: string;
  CategoryName: string;
  WarehouseID: number;
  WarehouseName: string;
  QuantityOnHand: number;
  QuantityReserved: number;
  AvailableQuantity: number;
  StockValue: number;
  ReorderLevel: number;
  IsLowStock: number;
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);

  const [transferData, setTransferData] = useState({
    ProductID: "",
    FromWarehouseID: "",
    ToWarehouseID: "",
    Quantity: "",
  });

  const [adjustData, setAdjustData] = useState({
    ProductID: "",
    WarehouseID: "",
    AdjustmentQty: "",
    Reason: "",
  });

  useEffect(() => {
    fetchData();
  }, [selectedWarehouse, lowStockOnly]);

  const fetchData = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedWarehouse) params.set("warehouseId", selectedWarehouse);
      if (lowStockOnly) params.set("lowStockOnly", "true");

      const [inventoryRes, warehousesRes, productsRes] = await Promise.all([
        fetch(`/api/inventory?${params}`),
        fetch("/api/warehouses"),
        fetch("/api/products"),
      ]);

      const inventoryData = await inventoryRes.json();
      const warehousesData = await warehousesRes.json();
      const productsData = await productsRes.json();

      if (inventoryData.success) setInventory(inventoryData.data);
      if (warehousesData.success) setWarehouses(warehousesData.data);
      if (productsData.success) setProducts(productsData.data);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "transfer",
          ProductID: parseInt(transferData.ProductID),
          FromWarehouseID: parseInt(transferData.FromWarehouseID),
          ToWarehouseID: parseInt(transferData.ToWarehouseID),
          Quantity: parseInt(transferData.Quantity),
          TransferredBy: "Admin",
        }),
      });

      if (response.ok) {
        setIsTransferModalOpen(false);
        setTransferData({ ProductID: "", FromWarehouseID: "", ToWarehouseID: "", Quantity: "" });
        fetchData();
      }
    } catch (error) {
      console.error("Failed to transfer stock:", error);
    }
  };

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "adjust",
          ProductID: parseInt(adjustData.ProductID),
          WarehouseID: parseInt(adjustData.WarehouseID),
          AdjustmentQty: parseInt(adjustData.AdjustmentQty),
          Reason: adjustData.Reason,
          AdjustedBy: "Admin",
        }),
      });

      if (response.ok) {
        setIsAdjustModalOpen(false);
        setAdjustData({ ProductID: "", WarehouseID: "", AdjustmentQty: "", Reason: "" });
        fetchData();
      }
    } catch (error) {
      console.error("Failed to adjust inventory:", error);
    }
  };

  const totalValue = inventory.reduce((sum, item) => sum + item.StockValue, 0);
  const lowStockCount = inventory.filter((item) => item.IsLowStock).length;

  if (loading) return <PageLoading />;

  return (
    <div>
      <Header title="Inventory" />

      <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardBody className="flex items-center gap-4">
              <div className="bg-blue-500 p-3 rounded-lg">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Stock Value</p>
                <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex items-center gap-4">
              <div className="bg-purple-500 p-3 rounded-lg">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Items</p>
                <p className="text-2xl font-bold">{formatNumber(inventory.length)}</p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex items-center gap-4">
              <div className="bg-red-500 p-3 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Low Stock Items</p>
                <p className="text-2xl font-bold">{lowStockCount}</p>
              </div>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Inventory List</CardTitle>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setIsAdjustModalOpen(true)}>
                Adjust Stock
              </Button>
              <Button onClick={() => setIsTransferModalOpen(true)}>
                <ArrowLeftRight className="w-4 h-4" /> Transfer Stock
              </Button>
            </div>
          </CardHeader>

          <CardBody>
            <div className="flex gap-4 mb-6">
              <Select
                options={warehouses.map((w) => ({ value: w.WarehouseID, label: w.WarehouseName }))}
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                className="w-48"
              />
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={lowStockOnly}
                  onChange={(e) => setLowStockOnly(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-600">Low stock only</span>
              </label>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead className="text-right">On Hand</TableHead>
                  <TableHead className="text-right">Reserved</TableHead>
                  <TableHead className="text-right">Available</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.map((item) => (
                  <TableRow key={item.InventoryID}>
                    <TableCell className="font-mono text-sm">{item.SKU}</TableCell>
                    <TableCell className="font-medium">{item.ProductName}</TableCell>
                    <TableCell>{item.CategoryName}</TableCell>
                    <TableCell>{item.WarehouseName}</TableCell>
                    <TableCell className="text-right">{formatNumber(item.QuantityOnHand)}</TableCell>
                    <TableCell className="text-right">{formatNumber(item.QuantityReserved)}</TableCell>
                    <TableCell className="text-right font-medium">{formatNumber(item.AvailableQuantity)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.StockValue)}</TableCell>
                    <TableCell>
                      {item.IsLowStock ? (
                        <Badge variant="danger">Low Stock</Badge>
                      ) : (
                        <Badge variant="success">OK</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      </div>

      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="Transfer Stock"
      >
        <form onSubmit={handleTransfer} className="space-y-4">
          <Select
            label="Product"
            options={products.map((p) => ({ value: p.ProductID, label: `${p.SKU} - ${p.ProductName}` }))}
            value={transferData.ProductID}
            onChange={(e) => setTransferData({ ...transferData, ProductID: e.target.value })}
            required
          />
          <Select
            label="From Warehouse"
            options={warehouses.map((w) => ({ value: w.WarehouseID, label: w.WarehouseName }))}
            value={transferData.FromWarehouseID}
            onChange={(e) => setTransferData({ ...transferData, FromWarehouseID: e.target.value })}
            required
          />
          <Select
            label="To Warehouse"
            options={warehouses.map((w) => ({ value: w.WarehouseID, label: w.WarehouseName }))}
            value={transferData.ToWarehouseID}
            onChange={(e) => setTransferData({ ...transferData, ToWarehouseID: e.target.value })}
            required
          />
          <Input
            label="Quantity"
            type="number"
            value={transferData.Quantity}
            onChange={(e) => setTransferData({ ...transferData, Quantity: e.target.value })}
            required
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsTransferModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Transfer</Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title="Adjust Inventory"
      >
        <form onSubmit={handleAdjust} className="space-y-4">
          <Select
            label="Product"
            options={products.map((p) => ({ value: p.ProductID, label: `${p.SKU} - ${p.ProductName}` }))}
            value={adjustData.ProductID}
            onChange={(e) => setAdjustData({ ...adjustData, ProductID: e.target.value })}
            required
          />
          <Select
            label="Warehouse"
            options={warehouses.map((w) => ({ value: w.WarehouseID, label: w.WarehouseName }))}
            value={adjustData.WarehouseID}
            onChange={(e) => setAdjustData({ ...adjustData, WarehouseID: e.target.value })}
            required
          />
          <Input
            label="Adjustment Quantity (positive to add, negative to subtract)"
            type="number"
            value={adjustData.AdjustmentQty}
            onChange={(e) => setAdjustData({ ...adjustData, AdjustmentQty: e.target.value })}
            required
          />
          <Input
            label="Reason"
            value={adjustData.Reason}
            onChange={(e) => setAdjustData({ ...adjustData, Reason: e.target.value })}
            required
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsAdjustModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Adjust</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
