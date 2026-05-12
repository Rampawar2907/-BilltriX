
"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { Product } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit2, Trash2, Package, Barcode, Hash } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function InventoryPage() {
  const { products, addProduct, updateProduct, deleteProduct } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState<Partial<Product>>({
    name: "",
    description: "",
    hsnCode: "",
    price: 0,
    taxRate: 18,
    sellingPrice: 0,
    itemCode: "",
    barcode: "",
    isInclusive: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.hsnCode) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Name and HSN Code are required." });
      return;
    }

    if (editingId) {
      updateProduct({ id: editingId, ...formData } as Product);
      toast({ title: "Updated", description: "Product updated successfully" });
    } else {
      addProduct({ id: Math.random().toString(36).substr(2, 9), ...formData } as Product);
      toast({ title: "Added", description: "Product added to inventory" });
    }
    setIsAdding(false);
    setEditingId(null);
    setFormData({ name: "", description: "", hsnCode: "", price: 0, taxRate: 18, sellingPrice: 0, itemCode: "", barcode: "", isInclusive: true });
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.hsnCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.itemCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold text-primary">Inventory Management</h1>
          <p className="text-muted-foreground">Manage your product catalog, HSN codes, and pricing.</p>
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} className="bg-accent hover:bg-accent/90">
            <Plus className="w-4 h-4 mr-2" /> New Product
          </Button>
        )}
      </div>

      {isAdding && (
        <Card className="shadow-lg border-none animate-in fade-in slide-in-from-top-4">
          <CardHeader>
            <CardTitle>{editingId ? 'Edit' : 'Add'} Product</CardTitle>
            <CardDescription>Enter complete details for better inventory tracking and invoicing.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label>Product Name *</Label>
                  <Input 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    placeholder="e.g. Wireless Mouse"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>HSN Code *</Label>
                  <Input 
                    value={formData.hsnCode} 
                    onChange={e => setFormData({...formData, hsnCode: e.target.value})} 
                    placeholder="8-digit code"
                    required 
                  />
                </div>
                <div className="md:col-span-3 space-y-2">
                  <Label>Description</Label>
                  <Textarea 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                    placeholder="Product details, specifications, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Purchase Price (Excl. GST)</Label>
                  <Input type="number" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <Label>GST Rate %</Label>
                  <Input type="number" value={formData.taxRate} onChange={e => setFormData({...formData, taxRate: Number(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <Label>Selling Price (Incl. GST)</Label>
                  <Input type="number" value={formData.sellingPrice} onChange={e => setFormData({...formData, sellingPrice: Number(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Hash className="w-3 h-3" /> Item Code / SKU</Label>
                  <Input value={formData.itemCode} onChange={e => setFormData({...formData, itemCode: e.target.value})} placeholder="Internal ID" />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Barcode className="w-3 h-3" /> Barcode</Label>
                  <Input value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} placeholder="UPC/EAN" />
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t pt-6">
                <Button type="button" variant="ghost" onClick={() => { setIsAdding(false); setEditingId(null); }}>Cancel</Button>
                <Button type="submit" className="bg-primary">Save Product</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name, HSN or SKU..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Details</TableHead>
                <TableHead>HSN/SKU</TableHead>
                <TableHead>Purchase</TableHead>
                <TableHead>Selling</TableHead>
                <TableHead>Tax %</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No products found in inventory.</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map(p => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold">{p.name}</span>
                        <span className="text-xs text-muted-foreground line-clamp-1">{p.description || "No description"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs">
                        <span>HSN: {p.hsnCode}</span>
                        {p.itemCode && <span className="text-muted-foreground">SKU: {p.itemCode}</span>}
                      </div>
                    </TableCell>
                    <TableCell>₹{p.price.toLocaleString()}</TableCell>
                    <TableCell className="text-primary font-bold">₹{p.sellingPrice.toLocaleString()}</TableCell>
                    <TableCell>{p.taxRate}%</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setIsAdding(true); setEditingId(p.id); setFormData(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteProduct(p.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
