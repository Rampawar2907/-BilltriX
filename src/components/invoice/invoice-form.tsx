"use client";

import { useState, useEffect, useMemo } from "react";
import { useStore } from "@/lib/store";
import { Party, Product, Invoice, InvoiceItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Search, Save, Package, Barcode, Hash, Printer, X } from "lucide-react";
import { suggestPartyDetails } from "@/ai/flows/suggest-party-details";
import { suggestProductDetails } from "@/ai/flows/suggest-product-details";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

interface InvoiceFormProps {
  type: 'sales' | 'purchase';
  isReturn?: boolean;
}

export function InvoiceForm({ type, isReturn = false }: InvoiceFormProps) {
  const { business, parties, products, addInvoice, addParty, addProduct } = useStore();
  
  const [partySearch, setPartySearch] = useState("");
  const [suggestedParties, setSuggestedParties] = useState<Party[]>([]);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [isNewParty, setIsNewParty] = useState(false);
  const [newPartyDetails, setNewPartyDetails] = useState<Partial<Party>>({});

  const [invoiceMetadata, setInvoiceMetadata] = useState({
    invoiceNumber: `${isReturn ? 'RET-' : (type === 'sales' ? 'INV-' : 'PUR-')}${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString().split('T')[0],
    referenceNo: "",
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [currentItem, setCurrentItem] = useState<Partial<InvoiceItem & { purchasePrice: number, sellingPrice: number }>>({
    quantity: 1,
    price: 0,
    taxRate: 18,
    discountValue: 0,
    discountType: 'percentage',
    description: "",
    itemCode: "",
    barcode: "",
    purchasePrice: 0,
    sellingPrice: 0
  });
  const [productSearch, setProductSearch] = useState("");
  const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([]);

  // Preview State
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);

  const taxVisibility = useMemo(() => {
    if (!business?.gstin || (!selectedParty?.gstin && !newPartyDetails.gstin)) {
      return { show: false, type: 'none' as const };
    }
    const businessState = business.gstin.slice(0, 2);
    const partyGstin = selectedParty?.gstin || newPartyDetails.gstin;
    const partyState = partyGstin?.slice(0, 2);

    if (businessState === partyState) {
      return { show: true, type: 'cgst-sgst' as const };
    } else {
      return { show: true, type: 'igst' as const };
    }
  }, [business, selectedParty, newPartyDetails]);

  // Local Search + AI Suggestions for Parties
  useEffect(() => {
    if (partySearch.length > 0) {
      const searchLower = partySearch.toLowerCase();
      const localMatches = parties.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.mobileNumber.includes(partySearch) ||
        p.gstin?.toLowerCase().includes(searchLower)
      );
      setSuggestedParties(localMatches);

      if (partySearch.length > 2) {
        const timeout = setTimeout(async () => {
          try {
            const result = await suggestPartyDetails({
              partialPartyName: partySearch,
              existingParties: parties.map(p => ({
                ...p,
                gstin: p.gstin || "",
                pan: p.pan || "",
                address: `${p.addressLine1} ${p.addressLine2 || ""}`.trim(),
                mailId: p.mailId || "",
                website: p.website || ""
              }))
            });
            
            setSuggestedParties(prev => {
              const aiMatches = parties.filter(p => 
                result.suggestedParties.some(sp => sp.name.toLowerCase() === p.name.toLowerCase())
              );
              const combined = [...prev];
              aiMatches.forEach(am => {
                if (!combined.some(c => c.id === am.id)) combined.push(am);
              });
              return combined;
            });
          } catch (error) {
            console.error("AI Party Suggestion failed:", error);
          }
        }, 500);
        return () => clearTimeout(timeout);
      }
    } else {
      setSuggestedParties([]);
    }
  }, [partySearch, parties]);

  // Local Search + AI Suggestions for Products
  useEffect(() => {
    if (productSearch.length > 0) {
      const searchLower = productSearch.toLowerCase();
      const localMatches = products.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.hsnCode.toLowerCase().includes(searchLower) ||
        p.itemCode?.toLowerCase().includes(searchLower) ||
        p.barcode?.toLowerCase().includes(searchLower)
      );
      setSuggestedProducts(localMatches);

      if (productSearch.length > 2) {
        const timeout = setTimeout(async () => {
          try {
            const result = await suggestProductDetails({
              productSearchTerm: productSearch,
              existingProducts: products.map(p => ({
                name: p.name,
                description: p.description || "",
                hsnCode: p.hsnCode,
                price: p.price,
                itemCode: p.itemCode || "",
                barcode: p.barcode || "",
              }))
            });

            setSuggestedProducts(prev => {
              const aiMatches = products.filter(p => 
                result.suggestedProducts.some(sp => sp.name.toLowerCase() === p.name.toLowerCase())
              );
              const combined = [...prev];
              aiMatches.forEach(am => {
                if (!combined.some(c => c.id === am.id)) combined.push(am);
              });
              return combined;
            });
            
            if (result.suggestedHsnCode && !currentItem.hsnCode) {
              setCurrentItem(prev => ({ ...prev, hsnCode: result.suggestedHsnCode }));
            }
          } catch (error) {
            console.error("AI Product Suggestion failed:", error);
          }
        }, 500);
        return () => clearTimeout(timeout);
      }
    } else {
      setSuggestedProducts([]);
    }
  }, [productSearch, products]);

  const addItem = () => {
    if (!currentItem.name) return;

    const qty = currentItem.quantity || 0;
    const price = currentItem.price || 0;
    const taxable = qty * price;
    const discount = currentItem.discountType === 'percentage' 
      ? (taxable * (currentItem.discountValue || 0) / 100)
      : (currentItem.discountValue || 0);
    
    const finalTaxable = taxable - discount;
    let cgst = 0, sgst = 0, igst = 0;

    if (taxVisibility.show) {
      const taxRate = currentItem.taxRate || 0;
      if (taxVisibility.type === 'cgst-sgst') {
        cgst = (finalTaxable * (taxRate / 2) / 100);
        sgst = (finalTaxable * (taxRate / 2) / 100);
      } else {
        igst = (finalTaxable * taxRate / 100);
      }
    }

    const newItem: InvoiceItem = {
      id: Math.random().toString(36).substr(2, 9),
      productId: currentItem.productId || 'new',
      name: currentItem.name,
      description: currentItem.description,
      quantity: qty,
      price: price,
      taxRate: currentItem.taxRate || 18,
      discountValue: currentItem.discountValue || 0,
      discountType: currentItem.discountType || 'percentage',
      hsnCode: currentItem.hsnCode || '',
      itemCode: currentItem.itemCode || '',
      barcode: currentItem.barcode || '',
      taxableAmount: finalTaxable,
      cgst,
      sgst,
      igst,
      totalAmount: finalTaxable + cgst + sgst + igst
    };

    setItems([...items, newItem]);
    setCurrentItem({ 
      quantity: 1, 
      price: 0, 
      taxRate: 18, 
      discountValue: 0, 
      discountType: 'percentage',
      description: "",
      itemCode: "",
      barcode: "",
      purchasePrice: 0,
      sellingPrice: 0
    });
    setProductSearch("");
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const totals = useMemo(() => {
    return items.reduce((acc, curr) => ({
      taxable: acc.taxable + curr.taxableAmount,
      cgst: acc.cgst + curr.cgst,
      sgst: acc.sgst + curr.sgst,
      igst: acc.igst + curr.igst,
      total: acc.total + curr.totalAmount,
    }), { taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 });
  }, [items]);

  const saveInvoice = (showPreview = false) => {
    let partyId = selectedParty?.id;
    if (isNewParty && newPartyDetails.name) {
      const id = Math.random().toString(36).substr(2, 9);
      const party: Party = {
        id,
        name: newPartyDetails.name,
        gstin: newPartyDetails.gstin,
        pan: newPartyDetails.pan,
        addressLine1: newPartyDetails.addressLine1 || "",
        city: newPartyDetails.city || "",
        state: newPartyDetails.state || "",
        pin: newPartyDetails.pin || "",
        mobileNumber: newPartyDetails.mobileNumber || "",
        balance: 0
      };
      addParty(party);
      partyId = id;
    }

    if (!partyId) {
      toast({ variant: "destructive", title: "Missing Party", description: "Please select or add a party to continue." });
      return;
    }

    if (items.length === 0) {
      toast({ variant: "destructive", title: "Empty Invoice", description: "Please add at least one item to the invoice." });
      return;
    }

    // Auto-save new products
    items.forEach(item => {
      const isExisting = products.find(p => p.id === item.productId || p.name.toLowerCase() === item.name.toLowerCase());
      if (!isExisting || item.productId === 'new') {
        const newProd: Product = {
          id: Math.random().toString(36).substr(2, 9),
          name: item.name,
          description: item.description,
          hsnCode: item.hsnCode,
          itemCode: item.itemCode,
          barcode: item.barcode,
          price: type === 'purchase' ? item.price : 0, 
          taxRate: item.taxRate,
          sellingPrice: type === 'sales' ? item.price : item.price * 1.2, 
          isInclusive: true,
          stock: 0 
        };
        addProduct(newProd);
        item.productId = newProd.id;
      }
    });

    const invoice: Invoice = {
      id: Math.random().toString(36).substr(2, 9),
      invoiceNumber: invoiceMetadata.invoiceNumber,
      date: invoiceMetadata.date,
      referenceNo: invoiceMetadata.referenceNo,
      dueDate: invoiceMetadata.dueDate,
      partyId,
      partyName: selectedParty?.name || newPartyDetails.name || "",
      partyGstin: selectedParty?.gstin || newPartyDetails.gstin,
      type,
      isReturn,
      items,
      totalTaxable: totals.taxable,
      totalCgst: totals.cgst,
      totalSgst: totals.sgst,
      totalIgst: totals.igst,
      totalDiscount: 0,
      totalAmount: totals.total,
      paidAmount: 0,
      status: 'unpaid'
    };

    addInvoice(invoice);

    if (showPreview) {
      setPreviewInvoice(invoice);
      setItems([]);
      setSelectedParty(null);
      setIsNewParty(false);
      setInvoiceMetadata({
        ...invoiceMetadata,
        invoiceNumber: `${isReturn ? 'RET-' : (type === 'sales' ? 'INV-' : 'PUR-')}${Date.now().toString().slice(-6)}`,
      });
    } else {
      toast({ title: "Success", description: `${isReturn ? 'Return' : 'Invoice'} saved successfully. Inventory updated.` });
      setItems([]);
      setSelectedParty(null);
      setIsNewParty(false);
      setInvoiceMetadata({
        ...invoiceMetadata,
        invoiceNumber: `${isReturn ? 'RET-' : (type === 'sales' ? 'INV-' : 'PUR-')}${Date.now().toString().slice(-6)}`,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-headline font-bold text-primary">
          {isReturn ? (type === 'sales' ? 'Sales Return / Credit Note' : 'Purchase Return / Debit Note') : (type === 'sales' ? 'Sales Invoice' : 'Purchase Invoice')}
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => saveInvoice(true)} className="border-primary text-primary hover:bg-primary/5">
            <Printer className="w-4 h-4 mr-2" /> Save & Preview
          </Button>
          <Button onClick={() => saveInvoice(false)} className="bg-primary hover:bg-primary/90">
            <Save className="w-4 h-4 mr-2" /> Save {isReturn ? 'Return' : 'Invoice'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="w-4 h-4" /> Party Selection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedParty && !isNewParty ? (
              <div className="relative">
                <Input 
                  placeholder="Search party by name, GSTIN or phone..." 
                  value={partySearch}
                  onChange={(e) => setPartySearch(e.target.value)}
                />
                {suggestedParties.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-auto">
                    {suggestedParties.map(p => (
                      <div 
                        key={p.id} 
                        className="p-3 hover:bg-muted cursor-pointer flex flex-col"
                        onClick={() => { setSelectedParty(p); setPartySearch(""); setSuggestedParties([]); }}
                      >
                        <span className="font-bold">{p.name}</span>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{p.gstin || 'No GSTIN'}</span>
                          <span>{p.mobileNumber}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-4 flex items-center gap-2">
                  <Checkbox id="new-party" checked={isNewParty} onCheckedChange={(v) => setIsNewParty(!!v)} />
                  <Label htmlFor="new-party">Add New Party Details</Label>
                </div>
              </div>
            ) : selectedParty ? (
              <div className="p-4 border rounded-lg bg-muted/30 flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{selectedParty.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedParty.addressLine1}, {selectedParty.city}</p>
                  <p className="text-sm">GSTIN: {selectedParty.gstin || 'N/A'}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedParty(null)}>Change</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 border rounded-lg bg-accent/5">
                <Input placeholder="Party Name" value={newPartyDetails.name || ""} onChange={e => setNewPartyDetails({...newPartyDetails, name: e.target.value})} />
                <Input placeholder="GSTIN" value={newPartyDetails.gstin || ""} onChange={e => setNewPartyDetails({...newPartyDetails, gstin: e.target.value})} />
                <Input placeholder="City" value={newPartyDetails.city || ""} onChange={e => setNewPartyDetails({...newPartyDetails, city: e.target.value})} />
                <Input placeholder="Mobile" value={newPartyDetails.mobileNumber || ""} onChange={e => setNewPartyDetails({...newPartyDetails, mobileNumber: e.target.value})} />
                <Button variant="ghost" size="sm" onClick={() => setIsNewParty(false)} className="md:col-span-2">Cancel New Party</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{isReturn ? 'Return' : 'Invoice'} Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">{isReturn ? 'Note' : 'Invoice'} Number</Label>
              <Input value={invoiceMetadata.invoiceNumber} onChange={e => setInvoiceMetadata({...invoiceMetadata, invoiceNumber: e.target.value})} />
            </div>
            <div>
              <Label className="text-xs">Date</Label>
              <Input type="date" value={invoiceMetadata.date} onChange={e => setInvoiceMetadata({...invoiceMetadata, date: e.target.value})} />
            </div>
            <div>
              <Label className="text-xs">Reference No.</Label>
              <Input placeholder="Ref #" value={invoiceMetadata.referenceNo} onChange={e => setInvoiceMetadata({...invoiceMetadata, referenceNo: e.target.value})} />
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Line Items Entry</CardTitle>
          </CardHeader>
          <CardContent className="p-4 bg-muted/20 border-b">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 relative">
                  <Label className="text-xs font-bold uppercase">Product Name *</Label>
                  <Input 
                    placeholder="Search or type product name..." 
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setCurrentItem({...currentItem, name: e.target.value});
                    }}
                  />
                  {suggestedProducts.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-auto">
                      {suggestedProducts.map(p => (
                        <div 
                          key={p.id} 
                          className="p-3 hover:bg-muted cursor-pointer flex flex-col"
                          onClick={() => { 
                            setCurrentItem({
                              productId: p.id,
                              name: p.name,
                              description: p.description || "",
                              price: type === 'sales' ? p.sellingPrice : p.price,
                              hsnCode: p.hsnCode,
                              taxRate: p.taxRate,
                              itemCode: p.itemCode || "",
                              barcode: p.barcode || "",
                              quantity: 1
                            });
                            setProductSearch(p.name);
                            setSuggestedProducts([]);
                          }}
                        >
                          <span className="font-bold">{p.name}</span>
                          <div className="flex justify-between text-xs">
                            <span>₹{type === 'sales' ? p.sellingPrice : p.price} | HSN: {p.hsnCode}</span>
                            <span>Stock: {p.stock || 0}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase">HSN Code *</Label>
                  <Input value={currentItem.hsnCode || ""} onChange={e => setCurrentItem({...currentItem, hsnCode: e.target.value})} />
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold uppercase">Description</Label>
                <Textarea 
                  placeholder="Product details, specifications, etc." 
                  className="min-h-[60px]"
                  value={currentItem.description || ""}
                  onChange={e => setCurrentItem({...currentItem, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <Label className="text-xs font-bold uppercase">{type === 'sales' ? 'Price' : 'Purchase Price'}</Label>
                  <Input type="number" value={currentItem.price} onChange={e => setCurrentItem({...currentItem, price: Number(e.target.value)})} />
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase">Qty</Label>
                  <Input type="number" value={currentItem.quantity} onChange={e => setCurrentItem({...currentItem, quantity: Number(e.target.value)})} />
                </div>
                {taxVisibility.show && (
                  <div>
                    <Label className="text-xs font-bold uppercase">GST Rate %</Label>
                    <Input type="number" value={currentItem.taxRate} onChange={e => setCurrentItem({...currentItem, taxRate: Number(e.target.value)})} />
                  </div>
                )}
                <div>
                  <Label className="text-xs font-bold uppercase">Discount</Label>
                  <Input type="number" value={currentItem.discountValue || 0} onChange={e => setCurrentItem({...currentItem, discountValue: Number(e.target.value)})} />
                </div>
                <div className="flex items-end">
                  <Button className="w-full bg-accent hover:bg-accent/90" onClick={addItem}>
                    <Plus className="w-4 h-4 mr-2" /> Add Item
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
                 <div className="space-y-1">
                    <Label className="text-xs font-bold uppercase flex items-center gap-1"><Hash className="w-3 h-3" /> Item Code / SKU</Label>
                    <Input value={currentItem.itemCode || ""} onChange={e => setCurrentItem({...currentItem, itemCode: e.target.value})} placeholder="Internal ID" />
                 </div>
                 <div className="space-y-1">
                    <Label className="text-xs font-bold uppercase flex items-center gap-1"><Barcode className="w-3 h-3" /> Barcode</Label>
                    <Input value={currentItem.barcode || ""} onChange={e => setCurrentItem({...currentItem, barcode: e.target.value})} placeholder="UPC/EAN" />
                 </div>
              </div>
            </div>
          </CardContent>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30%]">Product</TableHead>
                  <TableHead>HSN</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Taxable</TableHead>
                  {taxVisibility.show && taxVisibility.type === 'cgst-sgst' && (
                    <>
                      <TableHead>CGST</TableHead>
                      <TableHead>SGST</TableHead>
                    </>
                  )}
                  {taxVisibility.show && taxVisibility.type === 'igst' && (
                    <TableHead>IGST</TableHead>
                  )}
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={taxVisibility.show ? 10 : 7} className="text-center py-10 text-muted-foreground italic">
                      No items added yet. Fill out the form above to add products.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{item.name}</span>
                          <span className="text-[10px] text-muted-foreground line-clamp-1">{item.description}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{item.hsnCode}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>₹{item.price}</TableCell>
                      <TableCell>₹{item.taxableAmount.toFixed(2)}</TableCell>
                      {taxVisibility.show && taxVisibility.type === 'cgst-sgst' && (
                        <>
                          <TableCell className="text-xs">₹{item.cgst.toFixed(2)}</TableCell>
                          <TableCell className="text-xs">₹{item.sgst.toFixed(2)}</TableCell>
                        </>
                      )}
                      {taxVisibility.show && taxVisibility.type === 'igst' && (
                        <TableCell className="text-xs">₹{item.igst.toFixed(2)}</TableCell>
                      )}
                      <TableCell className="text-right font-bold">₹{item.totalAmount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            <div className="p-6 bg-muted/30 border-t flex flex-col md:flex-row justify-between items-end gap-6">
              <div className="w-full md:w-1/2 space-y-2">
                <Label className="text-xs uppercase text-muted-foreground font-bold">Notes / Terms</Label>
                <Input placeholder="Notes..." />
              </div>
              <div className="w-full md:w-80 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxable Subtotal:</span>
                  <span>₹{totals.taxable.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t text-lg font-bold">
                  <span>Grand Total:</span>
                  <span className="text-primary">₹{totals.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Modal optimized for A4 Print */}
      <Dialog open={!!previewInvoice} onOpenChange={(open) => !open && setPreviewInvoice(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 border-none bg-white print:static print:max-h-none print:w-[210mm] print:overflow-visible">
          <DialogHeader className="sr-only">
            <DialogTitle>Invoice Preview</DialogTitle>
            <DialogDescription>Document preview for {previewInvoice?.invoiceNumber}</DialogDescription>
          </DialogHeader>
          <div className="p-10 space-y-8 print:p-0 print:space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-4xl font-headline font-bold text-primary mb-2">
                  {previewInvoice?.isReturn ? (previewInvoice?.type === 'purchase' ? 'CREDIT NOTE' : 'DEBIT NOTE') : (previewInvoice?.type === 'sales' ? 'TAX INVOICE' : 'PURCHASE BILL')}
                </h2>
                <p className="text-muted-foreground text-base">Voucher No: <span className="font-bold text-foreground">#{previewInvoice?.invoiceNumber}</span></p>
              </div>
              <div className="text-right space-y-1">
                <h3 className="text-2xl font-bold">{business?.name}</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line max-w-[250px] ml-auto">
                  {business?.addressLine1}{business?.city ? `, ${business.city}` : ''}<br/>
                  GSTIN: <span className="font-bold text-foreground">{business?.gstin || 'N/A'}</span>
                </p>
              </div>
            </div>

            <Separator className="h-px bg-slate-200" />

            <div className="grid grid-cols-2 gap-10 text-sm">
              <div className="space-y-2 p-4 bg-slate-50 rounded-lg">
                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Party Details / Billing To</p>
                <h4 className="font-bold text-base text-slate-900">{previewInvoice?.partyName}</h4>
                <p className="text-slate-600">GSTIN: <span className="font-medium text-slate-900">{previewInvoice?.partyGstin || 'Unregistered'}</span></p>
              </div>
              <div className="text-right space-y-2">
                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Invoice Details</p>
                <div className="flex justify-end gap-4">
                  <span className="text-slate-500">Date:</span>
                  <span className="font-bold">{previewInvoice?.date}</span>
                </div>
                {previewInvoice?.referenceNo && (
                  <div className="flex justify-end gap-4">
                    <span className="text-slate-500">Reference:</span>
                    <span className="font-bold">{previewInvoice.referenceNo}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-slate-50 border-b border-slate-200">
                  <TableRow>
                    <TableHead className="py-4 text-slate-900 font-bold">Item Description</TableHead>
                    <TableHead className="py-4 text-slate-900 font-bold">HSN</TableHead>
                    <TableHead className="py-4 text-right text-slate-900 font-bold">Qty</TableHead>
                    <TableHead className="py-4 text-right text-slate-900 font-bold">Rate</TableHead>
                    <TableHead className="py-4 text-right text-slate-900 font-bold">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewInvoice?.items.map((item) => (
                    <TableRow key={item.id} className="border-b border-slate-100 last:border-0">
                      <TableCell className="py-4 font-medium text-slate-800">{item.name}</TableCell>
                      <TableCell className="py-4 text-xs text-slate-500">{item.hsnCode}</TableCell>
                      <TableCell className="py-4 text-right text-slate-800">{item.quantity}</TableCell>
                      <TableCell className="py-4 text-right text-slate-800">₹{item.price.toLocaleString()}</TableCell>
                      <TableCell className="py-4 text-right font-bold text-slate-900">₹{item.totalAmount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end pt-2">
              <div className="w-72 p-6 bg-slate-900 text-white rounded-2xl shadow-xl">
                <div className="flex justify-between items-center text-sm mb-2 opacity-70">
                  <span>Grand Total</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-lg opacity-70">INR</span>
                  <span className="text-3xl font-bold">₹{previewInvoice?.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <div className="pt-10 mt-auto text-center border-t border-slate-100 print:pt-4">
               <p className="text-xs text-slate-400 font-medium tracking-tight italic">
                 This is a computer-generated document. No signature is required.
               </p>
            </div>
          </div>
          <div className="p-6 bg-slate-50 border-t flex justify-between print:hidden">
            <Button variant="ghost" onClick={() => setPreviewInvoice(null)} className="hover:bg-slate-200">
              <X className="w-4 h-4 mr-2" /> Close
            </Button>
            <Button onClick={() => window.print()} className="bg-primary hover:bg-primary/90 shadow-md">
              <Printer className="w-4 h-4 mr-2" /> Print Invoice
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}