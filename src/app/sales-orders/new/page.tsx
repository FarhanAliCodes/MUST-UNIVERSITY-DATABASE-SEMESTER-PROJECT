"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { PageLoading } from "@/components/ui/Loading";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Customer, Warehouse, Product } from "@/types";

interface OrderItem {
  ProductID: number;
  ProductName: string;
  Quantity: number;
  UnitPrice: number;
  Discount: number;
}

export default function NewSalesOrderPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    CustomerID: "",
    WarehouseID: "",
    RequiredDate: "",
    ShippingAddress: "",
    Notes: "",
  });

  const [items, setItems] = useState<OrderItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [discount, setDiscount] = useState("0");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [customersRes, warehousesRes, productsRes] = await Promise.all([
        fetch("/api/customers"),
        fetch("/api/warehouses"),
        fetch("/api/products"),
      ]);

      const customersData = await customersRes.json();
      const warehousesData = await warehousesRes.json();
      const productsData = await productsRes.json();

      if (customersData.success) setCustomers(customersData.data);
      if (warehousesData.success) setWarehouses(warehousesData.data);
      if (productsData.success) setProducts(productsData.data);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerChange = (customerId: string) => {
    setFormData({ ...formData, CustomerID: customerId });
    const customer = customers.find((c) => c.CustomerID === parseInt(customerId));
    if (customer && customer.Address) {
      setFormData((prev) => ({
        ...prev,
        CustomerID: customerId,
        ShippingAddress: `${customer.Address}, ${customer.City || ""}`,
      }));
    }
  };

  const addItem = () => {
    const product = products.find((p) => p.ProductID === parseInt(selectedProduct));
    if (!product) return;

    const existingIndex = items.findIndex((i) => i.ProductID === product.ProductID);
    if (existingIndex >= 0) {
      const newItems = [...items];
      newItems[existingIndex].Quantity += parseInt(quantity);
      setItems(newItems);
    } else {
      setItems([
        ...items,
        {
          ProductID: product.ProductID,
          ProductName: product.ProductName,
          Quantity: parseInt(quantity),
          UnitPrice: product.UnitPrice,
          Discount: parseFloat(discount),
        },
      ]);
    }

    setSelectedProduct("");
    setQuantity("1");
    setDiscount("0");
  };

  const removeItem = (productId: number) => {
    setItems(items.filter((i) => i.ProductID !== productId));
  };

  const totalAmount = items.reduce(
    (sum, item) => sum + item.Quantity * item.UnitPrice * (1 - item.Discount / 100),
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert("Please add at least one item");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/sales-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          CustomerID: parseInt(formData.CustomerID),
          WarehouseID: parseInt(formData.WarehouseID),
          RequiredDate: formData.RequiredDate || null,
          ShippingAddress: formData.ShippingAddress,
          Notes: formData.Notes,
          Items: items.map((item) => ({
            ProductID: item.ProductID,
            Quantity: item.Quantity,
            UnitPrice: item.UnitPrice,
            Discount: item.Discount,
          })),
        }),
      });

      if (response.ok) {
        router.push("/sales-orders");
      }
    } catch (error) {
      console.error("Failed to create order:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageLoading />;

  return (
    <div>
      <Header title="New Sales Order" />

      <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" /> Back to List
        </Button>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Order Details</CardTitle>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Customer"
                    options={customers.map((c) => ({ value: c.CustomerID, label: c.CustomerName }))}
                    value={formData.CustomerID}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                    required
                  />
                  <Select
                    label="Warehouse"
                    options={warehouses.map((w) => ({ value: w.WarehouseID, label: w.WarehouseName }))}
                    value={formData.WarehouseID}
                    onChange={(e) => setFormData({ ...formData, WarehouseID: e.target.value })}
                    required
                  />
                </div>
                <Input
                  label="Required Delivery Date"
                  type="date"
                  value={formData.RequiredDate}
                  onChange={(e) => setFormData({ ...formData, RequiredDate: e.target.value })}
                />
                <Input
                  label="Shipping Address"
                  value={formData.ShippingAddress}
                  onChange={(e) => setFormData({ ...formData, ShippingAddress: e.target.value })}
                />
                <Input
                  label="Notes"
                  value={formData.Notes}
                  onChange={(e) => setFormData({ ...formData, Notes: e.target.value })}
                />
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Items:</span>
                    <span className="font-medium">{items.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Quantity:</span>
                    <span className="font-medium">{items.reduce((sum, i) => sum + i.Quantity, 0)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-gray-500">Total Amount:</span>
                    <span className="text-xl font-bold">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
                <Button type="submit" className="w-full mt-4" disabled={submitting || items.length === 0}>
                  {submitting ? "Creating..." : "Create Sales Order"}
                </Button>
              </CardBody>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="flex gap-4 mb-6">
                <Select
                  options={products.map((p) => ({ value: p.ProductID, label: `${p.SKU} - ${p.ProductName}` }))}
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-24"
                  title="Quantity"
                />
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="w-24"
                  title="Discount %"
                />
                <Button type="button" onClick={addItem} disabled={!selectedProduct}>
                  <Plus className="w-4 h-4" /> Add
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Discount</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => {
                    const total = item.Quantity * item.UnitPrice * (1 - item.Discount / 100);
                    return (
                      <TableRow key={item.ProductID}>
                        <TableCell className="font-medium">{item.ProductName}</TableCell>
                        <TableCell className="text-right">{item.Quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.UnitPrice)}</TableCell>
                        <TableCell className="text-right">{item.Discount}%</TableCell>
                        <TableCell className="text-right">{formatCurrency(total)}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" onClick={() => removeItem(item.ProductID)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                        No items added yet. Select a product and click Add.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        </form>
      </div>
    </div>
  );
}
