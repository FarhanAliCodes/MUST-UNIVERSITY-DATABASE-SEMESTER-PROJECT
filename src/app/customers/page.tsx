"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { PageLoading } from "@/components/ui/Loading";
import { formatCurrency } from "@/lib/utils";
import { Plus, Edit } from "lucide-react";
import { Customer } from "@/types";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [formData, setFormData] = useState({
    CustomerName: "",
    Email: "",
    Phone: "",
    Address: "",
    City: "",
    Country: "",
    CustomerType: "Retail",
    CreditLimit: "",
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers");
      const data = await response.json();
      if (data.success) setCustomers(data.data);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingCustomer
        ? `/api/customers/${editingCustomer.CustomerID}`
        : "/api/customers";
      const method = editingCustomer ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          CreditLimit: formData.CreditLimit ? parseFloat(formData.CreditLimit) : 0,
        }),
      });

      if (response.ok) {
        setIsModalOpen(false);
        resetForm();
        fetchCustomers();
      }
    } catch (error) {
      console.error("Failed to save customer:", error);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      CustomerName: customer.CustomerName,
      Email: customer.Email || "",
      Phone: customer.Phone || "",
      Address: customer.Address || "",
      City: customer.City || "",
      Country: customer.Country || "",
      CustomerType: customer.CustomerType,
      CreditLimit: customer.CreditLimit.toString(),
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingCustomer(null);
    setFormData({
      CustomerName: "",
      Email: "",
      Phone: "",
      Address: "",
      City: "",
      Country: "",
      CustomerType: "Retail",
      CreditLimit: "",
    });
  };

  if (loading) return <PageLoading />;

  return (
    <div>
      <Header title="Customers" />

      <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Customer List</CardTitle>
            <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
              <Plus className="w-4 h-4" /> Add Customer
            </Button>
          </CardHeader>

          <CardBody>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Credit Limit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.CustomerID}>
                    <TableCell className="font-medium">{customer.CustomerName}</TableCell>
                    <TableCell>{customer.Email || "-"}</TableCell>
                    <TableCell>{customer.Phone || "-"}</TableCell>
                    <TableCell>{customer.City || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={customer.CustomerType === "Wholesale" ? "purple" : "info"}>
                        {customer.CustomerType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(customer.CreditLimit)}</TableCell>
                    <TableCell>
                      <Badge variant={customer.IsActive ? "success" : "default"}>
                        {customer.IsActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(customer)}>
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
        title={editingCustomer ? "Edit Customer" : "Add New Customer"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Customer Name"
            value={formData.CustomerName}
            onChange={(e) => setFormData({ ...formData, CustomerName: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              value={formData.Email}
              onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
            />
            <Input
              label="Phone"
              value={formData.Phone}
              onChange={(e) => setFormData({ ...formData, Phone: e.target.value })}
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

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Customer Type"
              options={[
                { value: "Retail", label: "Retail" },
                { value: "Wholesale", label: "Wholesale" },
              ]}
              value={formData.CustomerType}
              onChange={(e) => setFormData({ ...formData, CustomerType: e.target.value })}
            />
            <Input
              label="Credit Limit"
              type="number"
              value={formData.CreditLimit}
              onChange={(e) => setFormData({ ...formData, CreditLimit: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => { setIsModalOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button type="submit">
              {editingCustomer ? "Update" : "Create"} Customer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
