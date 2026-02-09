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
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { Product, Category, Supplier } from "@/types";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState({
    SKU: "",
    ProductName: "",
    Description: "",
    CategoryID: "",
    SupplierID: "",
    UnitPrice: "",
    CostPrice: "",
    ReorderLevel: "10",
    ReorderQuantity: "50",
    LeadTimeDays: "7",
  });

  useEffect(() => {
    fetchData();
  }, [search, selectedCategory]);

  const fetchData = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (selectedCategory) params.set("categoryId", selectedCategory);

      const [productsRes, categoriesRes, suppliersRes] = await Promise.all([
        fetch(`/api/products?${params}`),
        fetch("/api/categories"),
        fetch("/api/suppliers"),
      ]);

      const productsData = await productsRes.json();
      const categoriesData = await categoriesRes.json();
      const suppliersData = await suppliersRes.json();

      if (productsData.success) setProducts(productsData.data);
      if (categoriesData.success) setCategories(categoriesData.data);
      if (suppliersData.success) setSuppliers(suppliersData.data);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingProduct
        ? `/api/products/${editingProduct.ProductID}`
        : "/api/products";
      const method = editingProduct ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          CategoryID: formData.CategoryID ? parseInt(formData.CategoryID) : null,
          SupplierID: formData.SupplierID ? parseInt(formData.SupplierID) : null,
          UnitPrice: parseFloat(formData.UnitPrice),
          CostPrice: parseFloat(formData.CostPrice),
          ReorderLevel: parseInt(formData.ReorderLevel),
          ReorderQuantity: parseInt(formData.ReorderQuantity),
          LeadTimeDays: parseInt(formData.LeadTimeDays),
          IsActive: true,
        }),
      });

      if (response.ok) {
        setIsModalOpen(false);
        resetForm();
        fetchData();
      }
    } catch (error) {
      console.error("Failed to save product:", error);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      SKU: product.SKU,
      ProductName: product.ProductName,
      Description: product.Description || "",
      CategoryID: product.CategoryID?.toString() || "",
      SupplierID: product.SupplierID?.toString() || "",
      UnitPrice: product.UnitPrice.toString(),
      CostPrice: product.CostPrice.toString(),
      ReorderLevel: product.ReorderLevel.toString(),
      ReorderQuantity: product.ReorderQuantity.toString(),
      LeadTimeDays: product.LeadTimeDays.toString(),
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to deactivate this product?")) return;
    try {
      await fetch(`/api/products/${id}`, { method: "DELETE" });
      fetchData();
    } catch (error) {
      console.error("Failed to delete product:", error);
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      SKU: "",
      ProductName: "",
      Description: "",
      CategoryID: "",
      SupplierID: "",
      UnitPrice: "",
      CostPrice: "",
      ReorderLevel: "10",
      ReorderQuantity: "50",
      LeadTimeDays: "7",
    });
  };

  if (loading) return <PageLoading />;

  return (
    <div>
      <Header title="Products" />

      <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Product List</CardTitle>
            <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
              <Plus className="w-4 h-4" /> Add Product
            </Button>
          </CardHeader>

          <CardBody>
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select
                options={categories.map((c) => ({ value: c.CategoryID, label: c.CategoryName }))}
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-48"
              />
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.ProductID}>
                    <TableCell className="font-mono text-sm">{product.SKU}</TableCell>
                    <TableCell className="font-medium">{product.ProductName}</TableCell>
                    <TableCell>{product.CategoryName || "-"}</TableCell>
                    <TableCell>{product.SupplierName || "-"}</TableCell>
                    <TableCell className="text-right">{formatCurrency(product.CostPrice)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(product.UnitPrice)}</TableCell>
                    <TableCell>
                      <Badge variant={product.IsActive ? "success" : "default"}>
                        {product.IsActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(product)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(product.ProductID)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
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
        title={editingProduct ? "Edit Product" : "Add New Product"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="SKU"
              value={formData.SKU}
              onChange={(e) => setFormData({ ...formData, SKU: e.target.value })}
              required
            />
            <Input
              label="Product Name"
              value={formData.ProductName}
              onChange={(e) => setFormData({ ...formData, ProductName: e.target.value })}
              required
            />
          </div>

          <Input
            label="Description"
            value={formData.Description}
            onChange={(e) => setFormData({ ...formData, Description: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              options={categories.map((c) => ({ value: c.CategoryID, label: c.CategoryName }))}
              value={formData.CategoryID}
              onChange={(e) => setFormData({ ...formData, CategoryID: e.target.value })}
            />
            <Select
              label="Supplier"
              options={suppliers.map((s) => ({ value: s.SupplierID, label: s.SupplierName }))}
              value={formData.SupplierID}
              onChange={(e) => setFormData({ ...formData, SupplierID: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Cost Price"
              type="number"
              step="0.01"
              value={formData.CostPrice}
              onChange={(e) => setFormData({ ...formData, CostPrice: e.target.value })}
              required
            />
            <Input
              label="Unit Price"
              type="number"
              step="0.01"
              value={formData.UnitPrice}
              onChange={(e) => setFormData({ ...formData, UnitPrice: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Reorder Level"
              type="number"
              value={formData.ReorderLevel}
              onChange={(e) => setFormData({ ...formData, ReorderLevel: e.target.value })}
            />
            <Input
              label="Reorder Qty"
              type="number"
              value={formData.ReorderQuantity}
              onChange={(e) => setFormData({ ...formData, ReorderQuantity: e.target.value })}
            />
            <Input
              label="Lead Time (days)"
              type="number"
              value={formData.LeadTimeDays}
              onChange={(e) => setFormData({ ...formData, LeadTimeDays: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => { setIsModalOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button type="submit">
              {editingProduct ? "Update" : "Create"} Product
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
