"use client";

import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Download, Printer, Search } from "lucide-react";

export default function LedgerPage() {
  const { parties, invoices, vouchers } = useStore();
  const [selectedPartyId, setSelectedPartyId] = useState("");

  const ledgerEntries = useMemo(() => {
    if (!selectedPartyId) return [];

    const entries: any[] = [];
    
    // Add Invoices
    invoices.filter(i => i.partyId === selectedPartyId).forEach(i => {
      entries.push({
        id: i.id,
        date: i.date,
        type: i.type === 'sales' ? 'Sale' : 'Purchase',
        ref: i.invoiceNumber,
        debit: i.type === 'sales' ? i.totalAmount : 0,
        credit: i.type === 'purchase' ? i.totalAmount : 0,
        balance: 0
      });
    });

    // Add Vouchers
    vouchers.filter(v => v.partyId === selectedPartyId).forEach(v => {
      entries.push({
        id: v.id,
        date: v.date,
        type: v.type === 'receipt' ? 'Receipt' : 'Payment',
        ref: v.voucherNumber,
        debit: v.type === 'payment' ? v.amount : 0,
        credit: v.type === 'receipt' ? v.amount : 0,
        balance: 0
      });
    });

    // Sort by date
    entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate running balance
    let runningBalance = 0;
    return entries.map(e => {
      runningBalance += (e.debit - e.credit);
      return { ...e, balance: runningBalance };
    });
  }, [selectedPartyId, invoices, vouchers]);

  const selectedParty = parties.find(p => p.id === selectedPartyId);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold text-primary">Party Ledger</h1>
          <p className="text-muted-foreground">Detailed transaction history and running balance.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><Printer className="w-4 h-4 mr-2" /> Print</Button>
          <Button variant="outline"><Download className="w-4 h-4 mr-2" /> Export</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="w-full md:w-80">
              <Label className="mb-2 block text-xs">Select Party to View Ledger</Label>
              <Select value={selectedPartyId} onValueChange={setSelectedPartyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a party..." />
                </SelectTrigger>
                <SelectContent>
                  {parties.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedParty && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Current Balance</p>
                <p className={`text-2xl font-bold ${selectedParty.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  ₹{Math.abs(selectedParty.balance).toLocaleString()} {selectedParty.balance >= 0 ? 'DR (Receivable)' : 'CR (Payable)'}
                </p>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!selectedPartyId ? (
            <div className="py-20 text-center text-muted-foreground flex flex-col items-center gap-4">
              <Search className="w-12 h-12 opacity-20" />
              <p>Select a party from the dropdown to see their ledger history.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Debit (+)</TableHead>
                  <TableHead className="text-right">Credit (-)</TableHead>
                  <TableHead className="text-right">Running Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledgerEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">No transactions found for this party.</TableCell>
                  </TableRow>
                ) : (
                  ledgerEntries.map(e => (
                    <TableRow key={e.id}>
                      <TableCell>{e.date}</TableCell>
                      <TableCell className="font-medium">{e.type}</TableCell>
                      <TableCell className="text-muted-foreground">{e.ref}</TableCell>
                      <TableCell className="text-right text-rose-600">{e.debit > 0 ? `₹${e.debit.toLocaleString()}` : '-'}</TableCell>
                      <TableCell className="text-right text-emerald-600">{e.credit > 0 ? `₹${e.credit.toLocaleString()}` : '-'}</TableCell>
                      <TableCell className={`text-right font-bold ${e.balance >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        ₹{Math.abs(e.balance).toLocaleString()} {e.balance >= 0 ? 'DR' : 'CR'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
