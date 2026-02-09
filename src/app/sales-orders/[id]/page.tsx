"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge, getStatusBadgeVariant } from "@/components/ui/Badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { PageLoading } from "@/components/ui/Loading";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowLeft, Truck, CheckCircle, XCircle, ShieldAlert } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface SalesOrderDetail {
  SalesOrderID: number;
  SONumber: string;
  CustomerName: string;
  CustomerEmail: string;
  CustomerPhone: string;
  WarehouseName: string;
  OrderDate: string;
  RequiredDate: string;
  Status: string;
  TotalAmount: number;
  ShippingAddress: string;
  Notes: string;
  Items: {
    ProductID: number;
    SKU: string;
    ProductName: string;
    Quantity: number;
    UnitPrice: number;
    Discount: number;
  }[];
  Shipments: {
    ShipmentID: number;
    ShipmentDate: string;
    Carrier: string;
    TrackingNumber: string;
    Status: string;
    DeliveryDate: string;
  }[];
}

export default function SalesOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, hasPermission } = useAuth();
  const [order, setOrder] = useState<SalesOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isShipModalOpen, setIsShipModalOpen] = useState(false);
  const [shipmentData, setShipmentData] = useState({
    Carrier: "",
    TrackingNumber: "",
  });

  const permission = hasPermission("salesOrders");

  useEffect(() => {
    fetchOrder();
  }, [params.id]);

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/sales-orders/${params.id}`);
      const data = await response.json();
      if (data.success) setOrder(data.data);
    } catch (error) {
      console.error("Failed to fetch order:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string) => {
    try {
      await fetch(`/api/sales-orders/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      fetchOrder();
    } catch (error) {
      console.error("Failed to update order:", error);
    }
  };

  const handleShip = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`/api/sales-orders/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "process",
          Carrier: shipmentData.Carrier,
          TrackingNumber: shipmentData.TrackingNumber,
          ProcessedBy: user?.FullName || "System",
        }),
      });
      setIsShipModalOpen(false);
      setShipmentData({ Carrier: "", TrackingNumber: "" });
      fetchOrder();
    } catch (error) {
      console.error("Failed to ship order:", error);
    }
  };

  if (loading) return <PageLoading />;
  if (!order) return <div className="p-4 lg:p-6">Order not found</div>;

  return (
    <div>
      <Header title={`Sales Order: ${order.SONumber}`} />

      <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" /> Back to List
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Order Details</CardTitle>
              <Badge variant={getStatusBadgeVariant(order.Status)} className="text-base px-3 py-1">
                {order.Status}
              </Badge>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">SO Number</p>
                  <p className="font-medium">{order.SONumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-medium">{order.CustomerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Warehouse</p>
                  <p className="font-medium">{order.WarehouseName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Contact</p>
                  <p className="font-medium">{order.CustomerPhone || order.CustomerEmail || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Order Date</p>
                  <p className="font-medium">{formatDate(order.OrderDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Required Date</p>
                  <p className="font-medium">{order.RequiredDate ? formatDate(order.RequiredDate) : "-"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Shipping Address</p>
                  <p className="font-medium">{order.ShippingAddress || "-"}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3">
              {!permission.canApprove && !permission.canEdit && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-700 rounded-lg text-sm">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  <span>You don&apos;t have permission to modify this order</span>
                </div>
              )}
              {(order.Status === "Pending" || order.Status === "Processing") && permission.canApprove && (
                <>
                  <Button className="w-full" onClick={() => setIsShipModalOpen(true)}>
                    <Truck className="w-4 h-4" /> Ship Order
                  </Button>
                  <Button variant="danger" className="w-full" onClick={() => handleAction("cancel")}>
                    <XCircle className="w-4 h-4" /> Cancel Order
                  </Button>
                </>
              )}
              {order.Status === "Shipped" && permission.canEdit && (
                <Button className="w-full" onClick={() => handleAction("deliver")}>
                  <CheckCircle className="w-4 h-4" /> Mark as Delivered
                </Button>
              )}
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="text-2xl font-bold">{formatCurrency(order.TotalAmount || 0)}</p>
              </div>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Discount</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.Items.map((item) => {
                  const total = item.Quantity * item.UnitPrice * (1 - item.Discount / 100);
                  return (
                    <TableRow key={item.ProductID}>
                      <TableCell className="font-mono text-sm">{item.SKU}</TableCell>
                      <TableCell className="font-medium">{item.ProductName}</TableCell>
                      <TableCell className="text-right">{item.Quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.UnitPrice)}</TableCell>
                      <TableCell className="text-right">{item.Discount}%</TableCell>
                      <TableCell className="text-right">{formatCurrency(total)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardBody>
        </Card>

        {order.Shipments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Shipments</CardTitle>
            </CardHeader>
            <CardBody className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ship Date</TableHead>
                    <TableHead>Carrier</TableHead>
                    <TableHead>Tracking Number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Delivery Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.Shipments.map((shipment) => (
                    <TableRow key={shipment.ShipmentID}>
                      <TableCell>{formatDate(shipment.ShipmentDate)}</TableCell>
                      <TableCell>{shipment.Carrier}</TableCell>
                      <TableCell className="font-mono">{shipment.TrackingNumber}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(shipment.Status)}>
                          {shipment.Status}
                        </Badge>
                      </TableCell>
                      <TableCell>{shipment.DeliveryDate ? formatDate(shipment.DeliveryDate) : "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        )}
      </div>

      <Modal isOpen={isShipModalOpen} onClose={() => setIsShipModalOpen(false)} title="Ship Order">
        <form onSubmit={handleShip} className="space-y-4">
          <Input
            label="Carrier"
            value={shipmentData.Carrier}
            onChange={(e) => setShipmentData({ ...shipmentData, Carrier: e.target.value })}
            required
          />
          <Input
            label="Tracking Number"
            value={shipmentData.TrackingNumber}
            onChange={(e) => setShipmentData({ ...shipmentData, TrackingNumber: e.target.value })}
            required
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsShipModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              <Truck className="w-4 h-4" /> Ship Order
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
