"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Party, Voucher } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, FileText, Printer, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function VouchersPage() {
  const { parties, vouchers, addVoucher } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  
  const [formData, setFormData] = useState({
    partyId: "",
    type: "receipt" as "receipt" | "payment",
    amount: 0,
    paymentMethod: "Cash",
    transactionId: "",
    date: new Date().toISOString().split('T')[0],
    receiverName: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const party = parties.find(p => p.id === formData.partyId);
    if (!party) {
      toast({ title: "Error", description: "Please select a party" });
      return;
    }

    const newVoucher: Voucher = {
      id: Math.random().toString(36).substr(2, 9),
      voucherNumber: `VCH-${Date.now().toString().slice(-6)}`,
      partyId: party.id,
      partyName: party.name,
      ...formData
    };

    addVoucher(newVoucher);
    toast({ title: "Success", description: "Voucher created successfully" });
    setIsAdding(false);
    setFormData({
      partyId: "",
      type: "receipt",
      amount: 0,
      paymentMethod: "Cash",
      transactionId: "",
      date: new Date().toISOString().split('T')[0],
      receiverName: ""
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold text-primary">Payments & Receipts</h1>
          <p className="text-muted-foreground">Manage cash and bank transactions.</p>
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} className="bg-accent hover:bg-accent/90">
            <Plus className="w-4 h-4 mr-2" /> New Voucher
          </Button>
        )}
      </div>

      {isAdding && (
        <Card className="animate-in fade-in slide-in-from-top-4 duration-300">
          <CardHeader>
            <CardTitle>Create Voucher</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <RadioGroup 
                    defaultValue="receipt" 
                    value={formData.type}
                    onValueChange={(v) => setFormData({...formData, type: v as "receipt" | "payment"})}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="receipt" id="r1" />
                      <Label htmlFor="r1">Receipt (Money In)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="payment" id="r2" />
                      <Label htmlFor="r2">Payment (Money Out)</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Select Party</Label>
                  <Select value={formData.partyId} onValueChange={id => setFormData({...formData, partyId: id})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Search party..." />
                    </SelectTrigger>
                    <SelectContent>
                      {parties.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input type="number" placeholder="0.00" value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} required />
                </div>
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select value={formData.paymentMethod} onValueChange={m => setFormData({...formData, paymentMethod: m})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="Cheque">Cheque</SelectItem>
                      <SelectItem value="UPI">UPI / Digital</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Transaction ID / Reference</Label>
                  <Input placeholder="TXN123456" value={formData.transactionId} onChange={e => setFormData({...formData, transactionId: e.target.value})} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90">Save Voucher</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Vouchers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Voucher #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Party</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vouchers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    No vouchers found.
                  </TableCell>
                </TableRow>
              ) : (
                vouchers.map(v => (
                  <TableRow key={v.id}>
                    <TableCell className="font-bold">{v.voucherNumber}</TableCell>
                    <TableCell>{v.date}</TableCell>
                    <TableCell>{v.partyName}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${v.type === 'receipt' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {v.type.toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell>{v.paymentMethod}</TableCell>
                    <TableCell className={`text-right font-bold ${v.type === 'receipt' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      ₹{v.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon"><Printer className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon"><Trash2 className="w-4 h-4 text-destructive" /></Button>
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