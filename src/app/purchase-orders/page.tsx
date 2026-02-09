"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Badge, getStatusBadgeVariant } from "@/components/ui/Badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { PageLoading } from "@/components/ui/Loading";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Eye } from "lucide-react";
import Link from "next/link";
import { PurchaseOrder } from "@/types";

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);

      const response = await fetch(`/api/purchase-orders?${params}`);
      const data = await response.json();
      if (data.success) setOrders(data.data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: number, action: string) => {
    try {
      await fetch(`/api/purchase-orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      fetchOrders();
    } catch (error) {
      console.error("Failed to update order:", error);
    }
  };

  if (loading) return <PageLoading />;

  const statusOptions = [
    { value: "Pending", label: "Pending" },
    { value: "Approved", label: "Approved" },
    { value: "Received", label: "Received" },
    { value: "Cancelled", label: "Cancelled" },
  ];

  return (
    <div>
      <Header title="Purchase Orders" />

      <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Purchase Orders</CardTitle>
            <Link href="/purchase-orders/new">
              <Button>
                <Plus className="w-4 h-4" /> New Purchase Order
              </Button>
            </Link>
          </CardHeader>

          <CardBody>
            <div className="flex gap-4 mb-6">
              <Select
                options={statusOptions}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-48"
              />
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Expected</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.PurchaseOrderID}>
                    <TableCell className="font-medium">{order.PONumber}</TableCell>
                    <TableCell>{order.SupplierName}</TableCell>
                    <TableCell>{order.WarehouseName}</TableCell>
                    <TableCell>{formatDate(order.OrderDate)}</TableCell>
                    <TableCell>{order.ExpectedDate ? formatDate(order.ExpectedDate) : "-"}</TableCell>
                    <TableCell className="text-right">{formatCurrency(order.TotalAmount || 0)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(order.Status)}>
                        {order.Status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Link href={`/purchase-orders/${order.PurchaseOrderID}`}>
                          <Button size="sm" variant="ghost">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        {order.Status === "Pending" && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleStatusChange(order.PurchaseOrderID, "approve")}
                          >
                            Approve
                          </Button>
                        )}
                        {order.Status === "Approved" && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange(order.PurchaseOrderID, "receive")}
                          >
                            Receive
                          </Button>
                        )}
                      </div>
                    </TableCell>
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
