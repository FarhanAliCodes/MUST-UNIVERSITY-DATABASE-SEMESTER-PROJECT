"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, getStatusBadgeVariant } from "@/components/ui/Badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { PageLoading } from "@/components/ui/Loading";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowLeft, CheckCircle, XCircle, ShieldAlert } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface PurchaseOrderDetail {
  PurchaseOrderID: number;
  PONumber: string;
  SupplierName: string;
  WarehouseName: string;
  OrderDate: string;
  ExpectedDate: string;
  Status: string;
  TotalAmount: number;
  Notes: string;
  CreatedBy: string;
  Items: {
    POItemID: number;
    ProductID: number;
    SKU: string;
    ProductName: string;
    Quantity: number;
    UnitCost: number;
    ReceivedQuantity: number;
  }[];
}

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, hasPermission } = useAuth();
  const [order, setOrder] = useState<PurchaseOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const permission = hasPermission("purchaseOrders");

  useEffect(() => {
    fetchOrder();
  }, [params.id]);

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/purchase-orders/${params.id}`);
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
      await fetch(`/api/purchase-orders/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      fetchOrder();
    } catch (error) {
      console.error("Failed to update order:", error);
    }
  };

  const handleReceiveAll = async () => {
    if (!order) return;
    const receivedItems = order.Items.filter(
      (item) => item.ReceivedQuantity < item.Quantity
    ).map((item) => ({
      POItemID: item.POItemID,
      ReceivedQuantity: item.Quantity - item.ReceivedQuantity,
    }));

    if (receivedItems.length === 0) return;

    try {
      const response = await fetch(`/api/purchase-orders/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "receive",
          ReceivedItems: receivedItems,
          ReceivedBy: user?.FullName || "System",
        }),
      });
      const data = await response.json();
      if (!data.success) {
        console.error("Failed to receive order:", data.error);
      }
      fetchOrder();
    } catch (error) {
      console.error("Failed to receive order:", error);
    }
  };

  if (loading) return <PageLoading />;
  if (!order) return <div className="p-4 lg:p-6">Order not found</div>;

  return (
    <div>
      <Header title={`Purchase Order: ${order.PONumber}`} />

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
                  <p className="text-sm text-gray-500">PO Number</p>
                  <p className="font-medium">{order.PONumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Supplier</p>
                  <p className="font-medium">{order.SupplierName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Warehouse</p>
                  <p className="font-medium">{order.WarehouseName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created By</p>
                  <p className="font-medium">{order.CreatedBy}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Order Date</p>
                  <p className="font-medium">{formatDate(order.OrderDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Expected Date</p>
                  <p className="font-medium">{order.ExpectedDate ? formatDate(order.ExpectedDate) : "-"}</p>
                </div>
              </div>
              {order.Notes && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500">Notes</p>
                  <p>{order.Notes}</p>
                </div>
              )}
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
              {order.Status === "Pending" && permission.canApprove && (
                <>
                  <Button className="w-full" onClick={() => handleAction("approve")}>
                    <CheckCircle className="w-4 h-4" /> Approve Order
                  </Button>
                  <Button variant="danger" className="w-full" onClick={() => handleAction("cancel")}>
                    <XCircle className="w-4 h-4" /> Cancel Order
                  </Button>
                </>
              )}
              {order.Status === "Approved" && permission.canEdit && (
                <Button className="w-full" onClick={handleReceiveAll}>
                  <CheckCircle className="w-4 h-4" /> Receive All Items
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
                  <TableHead className="text-right">Received</TableHead>
                  <TableHead className="text-right">Unit Cost</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.Items.map((item) => (
                  <TableRow key={item.ProductID}>
                    <TableCell className="font-mono text-sm">{item.SKU}</TableCell>
                    <TableCell className="font-medium">{item.ProductName}</TableCell>
                    <TableCell className="text-right">{item.Quantity}</TableCell>
                    <TableCell className="text-right">
                      <span className={item.ReceivedQuantity >= item.Quantity ? "text-green-600" : "text-orange-600"}>
                        {item.ReceivedQuantity}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(item.UnitCost)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.Quantity * item.UnitCost)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
