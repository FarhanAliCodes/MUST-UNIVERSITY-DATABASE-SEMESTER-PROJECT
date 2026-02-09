"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { PageLoading } from "@/components/ui/Loading";
import { formatNumber } from "@/lib/utils";
import { Plus, Edit, Building2 } from "lucide-react";
import { Warehouse } from "@/types";

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);

  const [formData, setFormData] = useState({
    WarehouseName: "",
    Location: "",
    City: "",
    Capacity: "",
    ManagerName: "",
    Phone: "",
  });

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const response = await fetch("/api/warehouses");
      const data = await response.json();
      if (data.success) setWarehouses(data.data);
    } catch (error) {
      console.error("Failed to fetch warehouses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingWarehouse
        ? `/api/warehouses/${editingWarehouse.WarehouseID}`
        : "/api/warehouses";
      const method = editingWarehouse ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          Capacity: formData.Capacity ? parseInt(formData.Capacity) : null,
        }),
      });

      if (response.ok) {
        setIsModalOpen(false);
        resetForm();
        fetchWarehouses();
      }
    } catch (error) {
      console.error("Failed to save warehouse:", error);
    }
  };

  const handleEdit = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    setFormData({
      WarehouseName: warehouse.WarehouseName,
      Location: warehouse.Location || "",
      City: warehouse.City || "",
      Capacity: warehouse.Capacity?.toString() || "",
      ManagerName: warehouse.ManagerName || "",
      Phone: warehouse.Phone || "",
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingWarehouse(null);
    setFormData({
      WarehouseName: "",
      Location: "",
      City: "",
      Capacity: "",
      ManagerName: "",
      Phone: "",
    });
  };

  if (loading) return <PageLoading />;

  return (
    <div>
      <Header title="Warehouses" />

      <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {warehouses.map((warehouse) => (
            <Card key={warehouse.WarehouseID}>
              <CardBody>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary-100 p-2 rounded-lg">
                      <Building2 className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{warehouse.WarehouseName}</h3>
                      <p className="text-sm text-gray-500">{warehouse.City || "N/A"}</p>
                    </div>
                  </div>
                  <Badge variant={warehouse.IsActive ? "success" : "default"}>
                    {warehouse.IsActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Capacity:</span>
                    <span className="font-medium">{warehouse.Capacity ? formatNumber(warehouse.Capacity) : "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Manager:</span>
                    <span className="font-medium">{warehouse.ManagerName || "N/A"}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-4"
                  onClick={() => handleEdit(warehouse)}
                >
                  <Edit className="w-4 h-4" /> Edit
                </Button>
              </CardBody>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Warehouse List</CardTitle>
            <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
              <Plus className="w-4 h-4" /> Add Warehouse
            </Button>
          </CardHeader>

          <CardBody>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Warehouse Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead className="text-right">Capacity</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {warehouses.map((warehouse) => (
                  <TableRow key={warehouse.WarehouseID}>
                    <TableCell className="font-medium">{warehouse.WarehouseName}</TableCell>
                    <TableCell>{warehouse.Location || "-"}</TableCell>
                    <TableCell>{warehouse.City || "-"}</TableCell>
                    <TableCell className="text-right">
                      {warehouse.Capacity ? formatNumber(warehouse.Capacity) : "-"}
                    </TableCell>
                    <TableCell>{warehouse.ManagerName || "-"}</TableCell>
                    <TableCell>{warehouse.Phone || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={warehouse.IsActive ? "success" : "default"}>
                        {warehouse.IsActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(warehouse)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); resetForm(); }}
        title={editingWarehouse ? "Edit Warehouse" : "Add New Warehouse"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Warehouse Name"
            value={formData.WarehouseName}
            onChange={(e) => setFormData({ ...formData, WarehouseName: e.target.value })}
            required
          />

          <Input
            label="Location"
            value={formData.Location}
            onChange={(e) => setFormData({ ...formData, Location: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="City"
              value={formData.City}
              onChange={(e) => setFormData({ ...formData, City: e.target.value })}
            />
            <Input
              label="Capacity"
              type="number"
              value={formData.Capacity}
              onChange={(e) => setFormData({ ...formData, Capacity: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Manager Name"
              value={formData.ManagerName}
              onChange={(e) => setFormData({ ...formData, ManagerName: e.target.value })}
            />
            <Input
              label="Phone"
              value={formData.Phone}
              onChange={(e) => setFormData({ ...formData, Phone: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => { setIsModalOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button type="submit">
              {editingWarehouse ? "Update" : "Create"} Warehouse
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
