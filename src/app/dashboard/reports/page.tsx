"use client";

import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileBarChart, PieChart, Landmark, Tag } from "lucide-react";

export default function ReportsPage() {
  const { invoices } = useStore();

  const salesInvoices = invoices.filter(i => i.type === 'sales');
  const purchaseInvoices = invoices.filter(i => i.type === 'purchase');

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-headline font-bold text-primary">Reports & GSTR</h1>

      <Tabs defaultValue="sales" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="sales" className="flex gap-2"><PieChart className="w-4 h-4" /> Sales Report</TabsTrigger>
          <TabsTrigger value="purchase" className="flex gap-2"><Landmark className="w-4 h-4" /> Purchase Report</TabsTrigger>
          <TabsTrigger value="gstr1" className="flex gap-2"><FileBarChart className="w-4 h-4" /> GSTR-1</TabsTrigger>
          <TabsTrigger value="gstr3b" className="flex gap-2"><Tag className="w-4 h-4" /> GSTR-3B</TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          <Card>
            <CardHeader><CardTitle>Sales Transaction List</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Party</TableHead>
                    <TableHead>GSTIN</TableHead>
                    <TableHead className="text-right">Taxable</TableHead>
                    <TableHead className="text-right">CGST/SGST/IGST</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesInvoices.map(i => (
                    <TableRow key={i.id}>
                      <TableCell>{i.date}</TableCell>
                      <TableCell>{i.partyName}</TableCell>
                      <TableCell className="text-xs">{i.partyGstin || 'Unregistered'}</TableCell>
                      <TableCell className="text-right">₹{i.totalTaxable.toFixed(2)}</TableCell>
                      <TableCell className="text-right">₹{(i.totalCgst + i.totalSgst + i.totalIgst).toFixed(2)}</TableCell>
                      <TableCell className="text-right font-bold">₹{i.totalAmount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gstr1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="bg-primary text-primary-foreground">
              <CardHeader><CardTitle className="text-sm">B2B Sales (Registered)</CardTitle></CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  ₹{salesInvoices.filter(i => !!i.partyGstin).reduce((acc, curr) => acc + curr.totalAmount, 0).toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-accent text-accent-foreground">
              <CardHeader><CardTitle className="text-sm">B2C Sales (Unregistered)</CardTitle></CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  ₹{salesInvoices.filter(i => !i.partyGstin).reduce((acc, curr) => acc + curr.totalAmount, 0).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader><CardTitle>HSN Summary</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>HSN Code</TableHead>
                    <TableHead className="text-right">Taxable Value</TableHead>
                    <TableHead className="text-right">Total Tax</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Aggregated HSN logic */}
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground italic">HSN level aggregation will appear here based on invoice line items.</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gstr3b">
           <Card>
            <CardHeader><CardTitle>GSTR-3B Summary (Auto-calculated)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-bold mb-2">3.1 Outward Taxable Supplies</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <span>Total Taxable:</span>
                  <span className="text-right">₹{salesInvoices.reduce((acc, curr) => acc + curr.totalTaxable, 0).toFixed(2)}</span>
                  <span>Total Integrated Tax:</span>
                  <span className="text-right">₹{salesInvoices.reduce((acc, curr) => acc + curr.totalIgst, 0).toFixed(2)}</span>
                  <span>Total Central/State Tax:</span>
                  <span className="text-right">₹{salesInvoices.reduce((acc, curr) => acc + curr.totalCgst + curr.totalSgst, 0).toFixed(2)}</span>
                </div>
              </div>
              <div className="p-4 border rounded-lg bg-muted/20">
                <h4 className="font-bold mb-2">4. Eligible ITC</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <span>Total ITC Available:</span>
                  <span className="text-right">₹{purchaseInvoices.reduce((acc, curr) => acc + curr.totalCgst + curr.totalSgst + curr.totalIgst, 0).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}