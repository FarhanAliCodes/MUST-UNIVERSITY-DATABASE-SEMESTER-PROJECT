"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge, getStatusBadgeVariant } from "@/components/ui/Badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { LineChart } from "@/components/charts/LineChart";
import { BarChart } from "@/components/charts/BarChart";
import { PieChart } from "@/components/charts/PieChart";
import { PageLoading } from "@/components/ui/Loading";
import { formatCurrency, formatNumber } from "@/lib/utils";
import {
  DollarSign,
  Package,
  ShoppingCart,
  AlertTriangle,
  TrendingUp,
  Users,
  Truck,
} from "lucide-react";

interface DashboardData {
  kpis: {
    TotalInventoryValue: number;
    PendingPurchaseOrders: number;
    PendingSalesOrders: number;
    LowStockProducts: number;
    MonthlyRevenue: number;
    TotalProducts: number;
    TotalSuppliers: number;
    TotalCustomers: number;
  };
  salesTrend: { Month: string; Revenue: number }[];
  topProducts: { ProductName: string; Revenue: number }[];
  inventoryByCategory: { CategoryName: string; Value: number }[];
  lowStockAlerts: {
    ProductName: string;
    WarehouseName: string;
    CurrentStock: number;
    ReorderLevel: number;
  }[];
  recentOrders: {
    OrderType: string;
    OrderNumber: string;
    PartyName: string;
    Status: string;
    TotalAmount: number;
  }[];
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/dashboard");
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <PageLoading />;

  if (!data) {
    return (
      <div className="p-4 lg:p-6">
        <Header title="Dashboard" />
        <div className="mt-6 text-center text-gray-500">
          <p>Unable to load dashboard data. Please check your database connection.</p>
        </div>
      </div>
    );
  }

  const kpiCards = [
    {
      title: "Total Inventory Value",
      value: formatCurrency(data.kpis.TotalInventoryValue),
      icon: DollarSign,
      color: "bg-blue-500",
    },
    {
      title: "Monthly Revenue",
      value: formatCurrency(data.kpis.MonthlyRevenue),
      icon: TrendingUp,
      color: "bg-green-500",
    },
    {
      title: "Pending Orders",
      value: formatNumber(data.kpis.PendingPurchaseOrders + data.kpis.PendingSalesOrders),
      icon: ShoppingCart,
      color: "bg-purple-500",
    },
    {
      title: "Low Stock Alerts",
      value: formatNumber(data.kpis.LowStockProducts),
      icon: AlertTriangle,
      color: "bg-red-500",
    },
  ];

  const statsCards = [
    { title: "Products", value: data.kpis.TotalProducts, icon: Package },
    { title: "Suppliers", value: data.kpis.TotalSuppliers, icon: Truck },
    { title: "Customers", value: data.kpis.TotalCustomers, icon: Users },
  ];

  return (
    <div>
      <Header title="Dashboard" />
      
      <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((kpi) => (
            <Card key={kpi.title}>
              <CardBody className="flex items-center gap-3">
                <div className={`${kpi.color} p-3 rounded-lg flex-shrink-0`}>
                  <kpi.icon className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500 truncate">{kpi.title}</p>
                  <p className="text-lg font-bold text-gray-900 truncate">{kpi.value}</p>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {statsCards.map((stat) => (
            <Card key={stat.title}>
              <CardBody className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-500">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <stat.icon className="w-8 h-8 text-gray-300 flex-shrink-0" />
              </CardBody>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Sales Trend</CardTitle>
            </CardHeader>
            <CardBody>
              <LineChart
                data={data.salesTrend}
                xKey="Month"
                yKey="Revenue"
                height={280}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Selling Products</CardTitle>
            </CardHeader>
            <CardBody>
              <BarChart
                data={data.topProducts.slice(0, 5)}
                xKey="ProductName"
                yKey="Revenue"
                height={280}
              />
            </CardBody>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Inventory by Category</CardTitle>
            </CardHeader>
            <CardBody>
              <PieChart
                data={data.inventoryByCategory.map((item) => ({
                  name: item.CategoryName,
                  value: item.Value,
                }))}
                height={280}
              />
            </CardBody>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Low Stock Alerts</CardTitle>
            </CardHeader>
            <CardBody className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Current</TableHead>
                    <TableHead>Reorder Level</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.lowStockAlerts.slice(0, 5).map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.ProductName}</TableCell>
                      <TableCell>{item.WarehouseName}</TableCell>
                      <TableCell>
                        <span className="text-red-600 font-medium">{item.CurrentStock}</span>
                      </TableCell>
                      <TableCell>{item.ReorderLevel}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Order Number</TableHead>
                  <TableHead>Party</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentOrders.map((order, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Badge variant={order.OrderType === "Purchase Order" ? "info" : "purple"}>
                        {order.OrderType === "Purchase Order" ? "PO" : "SO"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{order.OrderNumber}</TableCell>
                    <TableCell>{order.PartyName}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(order.Status)}>
                        {order.Status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(order.TotalAmount)}
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
