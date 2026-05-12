"use client";

import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { Invoice, Voucher } from "@/lib/types";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Search, 
  IndianRupee, 
  CheckCircle2,
  Clock,
  AlertCircle,
  Printer,
  RotateCcw,
  X,
  Trash2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export default function TransactionsPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "all";
  
  const { invoices, business, deleteInvoice, updateInvoice, addInvoice, addVoucher } = useStore();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modals State
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState("Cash");

  const filteredInvoices = useMemo(() => {
    return invoices.filter(i => {
      let matchesTab = true;
      if (activeTab === 'sales') matchesTab = i.type === 'sales' && !i.isReturn;
      if (activeTab === 'purchase') matchesTab = i.type === 'purchase' && !i.isReturn;
      if (activeTab === 'sales_return') matchesTab = i.type === 'purchase' && i.isReturn;
      if (activeTab === 'purchase_return') matchesTab = i.type === 'sales' && i.isReturn;
      
      const matchesSearch = i.partyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           i.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesTab && matchesSearch;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [invoices, activeTab, searchTerm]);

  const handlePayment = () => {
    if (!selectedInvoice) return;
    
    const newPaidAmount = (selectedInvoice.paidAmount || 0) + paymentAmount;
    const balance = selectedInvoice.totalAmount - newPaidAmount;
    
    let status: Invoice['status'] = 'partially_paid';
    if (balance <= 0) status = 'paid';
    if (newPaidAmount === 0) status = 'unpaid';

    const updatedInvoice: Invoice = {
      ...selectedInvoice,
      paidAmount: newPaidAmount,
      status: status
    };

    updateInvoice(updatedInvoice);

    const voucher: Voucher = {
      id: Math.random().toString(36).substr(2, 9),
      voucherNumber: `VCH-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().split('T')[0],
      partyId: selectedInvoice.partyId,
      partyName: selectedInvoice.partyName,
      type: selectedInvoice.type === 'sales' ? 'receipt' : 'payment',
      amount: paymentAmount,
      paymentMethod: paymentMethod,
      transactionId: `AUTO-${selectedInvoice.invoiceNumber}`,
    };
    
    addVoucher(voucher);
    toast({ title: "Payment Recorded", description: `₹${paymentAmount} payment added.` });
    setSelectedInvoice(null);
    setPaymentAmount(0);
  };

  const handleReturn = (invoice: Invoice) => {
    const returnInvoice: Invoice = {
      ...invoice,
      id: Math.random().toString(36).substr(2, 9),
      invoiceNumber: `RET-${invoice.invoiceNumber}`,
      date: new Date().toISOString().split('T')[0],
      referenceNo: invoice.invoiceNumber,
      isReturn: true,
      type: invoice.type === 'sales' ? 'purchase' : 'sales',
      paidAmount: 0,
      status: 'unpaid'
    };

    addInvoice(returnInvoice);
    toast({ title: "Return Created", description: `Return transaction generated.` });
  };

  const getStatusBadge = (invoice: Invoice) => {
    if (invoice.isReturn) {
      return <span className="flex items-center gap-1 text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full text-xs font-bold"><RotateCcw className="w-3 h-3" /> Return</span>;
    }
    switch (invoice.status) {
      case 'paid':
        return <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-xs font-bold"><CheckCircle2 className="w-3 h-3" /> Paid</span>;
      case 'partially_paid':
        return <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full text-xs font-bold"><Clock className="w-3 h-3" /> Partial</span>;
      case 'unpaid':
        return <span className="flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full text-xs font-bold"><AlertCircle className="w-3 h-3" /> Unpaid</span>;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold text-primary">Transaction History</h1>
          <p className="text-muted-foreground">Manage all your invoices and returns.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/sales"><Button className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4 mr-2" /> New Sale</Button></Link>
          <Link href="/dashboard/purchase"><Button className="bg-rose-600 hover:bg-rose-700"><Plus className="w-4 h-4 mr-2" /> New Purchase</Button></Link>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-96 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by party or invoice #..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="purchase">Purchase</TabsTrigger>
            <TabsTrigger value="sales_return">Sales Returns</TabsTrigger>
            <TabsTrigger value="purchase_return">Purchase Returns</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Number</TableHead>
                <TableHead>Party</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="w-[180px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-20 text-muted-foreground">No transactions found.</TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((i) => (
                  <TableRow key={i.id} className={i.isReturn ? "bg-muted/30" : ""}>
                    <TableCell className="text-xs">{i.date}</TableCell>
                    <TableCell className="font-medium text-xs">{i.invoiceNumber}</TableCell>
                    <TableCell className="font-bold">{i.partyName}</TableCell>
                    <TableCell>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${i.type === 'sales' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {i.isReturn ? 'RETURN' : i.type.toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(i)}</TableCell>
                    <TableCell className="text-right font-medium">₹{i.totalAmount.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-bold text-rose-600">₹{(i.totalAmount - i.paidAmount).toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end flex-wrap">
                        <Button variant="ghost" size="icon" className="text-emerald-600 h-8 w-8" onClick={() => { setSelectedInvoice(i); setPaymentAmount(i.totalAmount - i.paidAmount); }} disabled={i.status === 'paid' || i.isReturn} title="Add Payment"><IndianRupee className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPreviewInvoice(i)} title="View/Print Preview"><Printer className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-purple-600" onClick={() => handleReturn(i)} disabled={i.isReturn} title="Create Return"><RotateCcw className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteInvoice(i.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedInvoice} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Payment - {selectedInvoice?.invoiceNumber}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-between text-sm p-3 bg-muted rounded-lg">
              <span>Pending Amount:</span>
              <span className="font-bold">₹{(selectedInvoice ? (selectedInvoice.totalAmount - selectedInvoice.paidAmount) : 0).toLocaleString()}</span>
            </div>
            <div className="space-y-2">
              <Label>Amount to Pay</Label>
              <Input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(Number(e.target.value))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSelectedInvoice(null)}>Cancel</Button>
            <Button onClick={handlePayment}>Record Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal optimized for A4 Print */}
      <Dialog open={!!previewInvoice} onOpenChange={(open) => !open && setPreviewInvoice(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 border-none bg-white print:static print:max-h-none print:w-[210mm] print:overflow-visible">
          <DialogHeader className="sr-only">
            <DialogTitle>Invoice Preview</DialogTitle>
            <DialogDescription>Preview for {previewInvoice?.invoiceNumber}</DialogDescription>
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