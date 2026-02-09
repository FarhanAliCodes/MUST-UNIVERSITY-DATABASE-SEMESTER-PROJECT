"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { LineChart } from "@/components/charts/LineChart";
import { BarChart } from "@/components/charts/BarChart";
import { PageLoading } from "@/components/ui/Loading";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Download, TrendingUp, Package, Truck, Users } from "lucide-react";

type ReportType = "sales" | "inventory" | "suppliers" | "customers" | "products";

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>("sales");
  const [reportData, setReportData] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [reportType]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reports?type=${reportType}`);
      const data = await response.json();
      if (data.success) setReportData(data.data);
    } catch (error) {
      console.error("Failed to fetch report:", error);
    } finally {
      setLoading(false);
    }
  };

  const reportTypes = [
    { value: "sales", label: "Sales Analytics", icon: TrendingUp },
    { value: "inventory", label: "Inventory Report", icon: Package },
    { value: "suppliers", label: "Supplier Performance", icon: Truck },
    { value: "customers", label: "Customer Analysis", icon: Users },
    { value: "products", label: "Product Performance", icon: Package },
  ];

  const exportToCSV = () => {
    if (reportData.length === 0) return;
    
    const headers = Object.keys(reportData[0] as object).join(",");
    const rows = reportData.map((row) =>
      Object.values(row as object)
        .map((val) => `"${val}"`)
        .join(",")
    );
    const csv = [headers, ...rows].join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportType}-report.csv`;
    a.click();
  };

  const renderSalesReport = () => {
    const data = reportData as { MonthName: string; TotalOrders: number; Revenue: number; Profit: number }[];
    return (
      <>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardBody>
            <LineChart
              data={data}
              xKey="MonthName"
              yKey="Revenue"
              height={300}
            />
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{row.MonthName}</TableCell>
                    <TableCell className="text-right">{row.TotalOrders}</TableCell>
                    <TableCell className="text-right">{formatCurrency(row.Revenue)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(row.Revenue - row.Profit)}</TableCell>
                    <TableCell className="text-right text-green-600">{formatCurrency(row.Profit)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      </>
    );
  };

  const renderInventoryReport = () => {
    const data = reportData as { WarehouseName: string; CategoryName: string; ProductCount: number; TotalQuantity: number; TotalValue: number; LowStockCount: number }[];
    return (
      <Card>
        <CardBody className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Warehouse</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Products</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead className="text-right">Low Stock</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{row.WarehouseName}</TableCell>
                  <TableCell>{row.CategoryName}</TableCell>
                  <TableCell className="text-right">{row.ProductCount}</TableCell>
                  <TableCell className="text-right">{formatNumber(row.TotalQuantity)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(row.TotalValue)}</TableCell>
                  <TableCell className="text-right text-red-600">{row.LowStockCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    );
  };

  const renderSuppliersReport = () => {
    const data = reportData as { SupplierName: string; TotalOrders: number; CompletedOrders: number; OnTimeDeliveryPercent: number; TotalOrderValue: number; Rating: number }[];
    return (
      <>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Supplier Order Value</CardTitle>
          </CardHeader>
          <CardBody>
            <BarChart
              data={data.slice(0, 10)}
              xKey="SupplierName"
              yKey="TotalOrderValue"
              height={300}
            />
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="text-right">Total Orders</TableHead>
                  <TableHead className="text-right">Completed</TableHead>
                  <TableHead className="text-right">On-Time %</TableHead>
                  <TableHead className="text-right">Total Value</TableHead>
                  <TableHead className="text-right">Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{row.SupplierName}</TableCell>
                    <TableCell className="text-right">{row.TotalOrders}</TableCell>
                    <TableCell className="text-right">{row.CompletedOrders}</TableCell>
                    <TableCell className="text-right">{row.OnTimeDeliveryPercent?.toFixed(1)}%</TableCell>
                    <TableCell className="text-right">{formatCurrency(row.TotalOrderValue)}</TableCell>
                    <TableCell className="text-right">{row.Rating?.toFixed(1) || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      </>
    );
  };

  const renderCustomersReport = () => {
    const data = reportData as { CustomerName: string; CustomerType: string; TotalOrders: number; LifetimeValue: number; AvgOrderValue: number; DaysSinceLastOrder: number }[];
    return (
      <Card>
        <CardBody className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Lifetime Value</TableHead>
                <TableHead className="text-right">Avg Order</TableHead>
                <TableHead className="text-right">Days Since Last</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{row.CustomerName}</TableCell>
                  <TableCell>{row.CustomerType}</TableCell>
                  <TableCell className="text-right">{row.TotalOrders}</TableCell>
                  <TableCell className="text-right">{formatCurrency(row.LifetimeValue)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(row.AvgOrderValue)}</TableCell>
                  <TableCell className="text-right">{row.DaysSinceLastOrder || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    );
  };

  const renderProductsReport = () => {
    const data = reportData as { ProductName: string; CategoryName: string; TotalOrders: number; TotalQuantitySold: number; TotalRevenue: number; ProfitMarginPercent: number }[];
    return (
      <>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Top Products by Revenue</CardTitle>
          </CardHeader>
          <CardBody>
            <BarChart
              data={data.slice(0, 10)}
              xKey="ProductName"
              yKey="TotalRevenue"
              height={300}
            />
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Qty Sold</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Margin %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{row.ProductName}</TableCell>
                    <TableCell>{row.CategoryName}</TableCell>
                    <TableCell className="text-right">{row.TotalOrders}</TableCell>
                    <TableCell className="text-right">{formatNumber(row.TotalQuantitySold)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(row.TotalRevenue)}</TableCell>
                    <TableCell className="text-right">{row.ProfitMarginPercent?.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      </>
    );
  };

  const renderReport = () => {
    if (loading) return <PageLoading />;
    if (reportData.length === 0) return <p className="text-center text-gray-500 py-8">No data available</p>;

    switch (reportType) {
      case "sales":
        return renderSalesReport();
      case "inventory":
        return renderInventoryReport();
      case "suppliers":
        return renderSuppliersReport();
      case "customers":
        return renderCustomersReport();
      case "products":
        return renderProductsReport();
      default:
        return null;
    }
  };

  return (
    <div>
      <Header title="Reports" />

      <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {reportTypes.map((type) => (
                  <Button
                    key={type.value}
                    variant={reportType === type.value ? "primary" : "secondary"}
                    onClick={() => setReportType(type.value as ReportType)}
                  >
                    <type.icon className="w-4 h-4" />
                    {type.label}
                  </Button>
                ))}
              </div>
              <Button variant="secondary" onClick={exportToCSV}>
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
            </div>
          </CardBody>
        </Card>

        {renderReport()}
      </div>
    </div>
  );
}
