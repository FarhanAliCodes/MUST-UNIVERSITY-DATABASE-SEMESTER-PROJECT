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
import { Plus, Edit, Star } from "lucide-react";
import { Supplier } from "@/types";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const [formData, setFormData] = useState({
    SupplierName: "",
    ContactPerson: "",
    Email: "",
    Phone: "",
    Address: "",
    City: "",
    Country: "",
    Rating: "",
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await fetch("/api/suppliers");
      const data = await response.json();
      if (data.success) setSuppliers(data.data);
    } catch (error) {
      console.error("Failed to fetch suppliers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingSupplier
        ? `/api/suppliers/${editingSupplier.SupplierID}`
        : "/api/suppliers";
      const method = editingSupplier ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          Rating: formData.Rating ? parseFloat(formData.Rating) : null,
          IsActive: true,
        }),
      });

      if (response.ok) {
        setIsModalOpen(false);
        resetForm();
        fetchSuppliers();
      }
    } catch (error) {
      console.error("Failed to save supplier:", error);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      SupplierName: supplier.SupplierName,
      ContactPerson: supplier.ContactPerson || "",
      Email: supplier.Email || "",
      Phone: supplier.Phone || "",
      Address: supplier.Address || "",
      City: supplier.City || "",
      Country: supplier.Country || "",
      Rating: supplier.Rating?.toString() || "",
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingSupplier(null);
    setFormData({
      SupplierName: "",
      ContactPerson: "",
      Email: "",
      Phone: "",
      Address: "",
      City: "",
      Country: "",
      Rating: "",
    });
  };

  const renderRating = (rating: number | null) => {
    if (!rating) return "-";
    return (
      <div className="flex items-center gap-1">
        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
        <span>{rating.toFixed(1)}</span>
      </div>
    );
  };

  if (loading) return <PageLoading />;

  return (
    <div>
      <Header title="Suppliers" />

      <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Supplier List</CardTitle>
            <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
              <Plus className="w-4 h-4" /> Add Supplier
            </Button>
          </CardHeader>

          <CardBody>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier Name</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((supplier) => (
                  <TableRow key={supplier.SupplierID}>
                    <TableCell className="font-medium">{supplier.SupplierName}</TableCell>
                    <TableCell>{supplier.ContactPerson || "-"}</TableCell>
                    <TableCell>{supplier.Email || "-"}</TableCell>
                    <TableCell>{supplier.Phone || "-"}</TableCell>
                    <TableCell>{supplier.City || "-"}</TableCell>
                    <TableCell>{renderRating(supplier.Rating)}</TableCell>
                    <TableCell>
                      <Badge variant={supplier.IsActive ? "success" : "default"}>
                        {supplier.IsActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(supplier)}>
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
        title={editingSupplier ? "Edit Supplier" : "Add New Supplier"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Supplier Name"
            value={formData.SupplierName}
            onChange={(e) => setFormData({ ...formData, SupplierName: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Contact Person"
              value={formData.ContactPerson}
              onChange={(e) => setFormData({ ...formData, ContactPerson: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              value={formData.Email}
              onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Phone"
              value={formData.Phone}
              onChange={(e) => setFormData({ ...formData, Phone: e.target.value })}
            />
            <Input
              label="Rating (1-5)"
              type="number"
              min="1"
              max="5"
              step="0.1"
              value={formData.Rating}
              onChange={(e) => setFormData({ ...formData, Rating: e.target.value })}
            />
          </div>

          <Input
            label="Address"
            value={formData.Address}
            onChange={(e) => setFormData({ ...formData, Address: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="City"
              value={formData.City}
              onChange={(e) => setFormData({ ...formData, City: e.target.value })}
            />
            <Input
              label="Country"
              value={formData.Country}
              onChange={(e) => setFormData({ ...formData, Country: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => { setIsModalOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button type="submit">
              {editingSupplier ? "Update" : "Create"} Supplier
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
