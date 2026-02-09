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
import { SalesOrder } from "@/types";

export default function SalesOrdersPage() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);

      const response = await fetch(`/api/sales-orders?${params}`);
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
      await fetch(`/api/sales-orders/${id}`, {
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
    { value: "Processing", label: "Processing" },
    { value: "Shipped", label: "Shipped" },
    { value: "Delivered", label: "Delivered" },
    { value: "Cancelled", label: "Cancelled" },
  ];

  return (
    <div>
      <Header title="Sales Orders" />

      <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Sales Orders</CardTitle>
            <Link href="/sales-orders/new">
              <Button>
                <Plus className="w-4 h-4" /> New Sales Order
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
                  <TableHead>SO Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Required</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.SalesOrderID}>
                    <TableCell className="font-medium">{order.SONumber}</TableCell>
                    <TableCell>{order.CustomerName}</TableCell>
                    <TableCell>{order.WarehouseName}</TableCell>
                    <TableCell>{formatDate(order.OrderDate)}</TableCell>
                    <TableCell>{order.RequiredDate ? formatDate(order.RequiredDate) : "-"}</TableCell>
                    <TableCell className="text-right">{formatCurrency(order.TotalAmount || 0)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(order.Status)}>
                        {order.Status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Link href={`/sales-orders/${order.SalesOrderID}`}>
                          <Button size="sm" variant="ghost">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        {(order.Status === "Pending" || order.Status === "Processing") && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange(order.SalesOrderID, "process")}
                          >
                            Ship
                          </Button>
                        )}
                        {order.Status === "Shipped" && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleStatusChange(order.SalesOrderID, "deliver")}
                          >
                            Deliver
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
