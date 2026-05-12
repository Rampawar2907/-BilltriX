
"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Package, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell 
} from "recharts";
import Link from "next/link";

export default function DashboardPage() {
  const store = useStore();
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydration guard to ensure data is loaded from localStorage before rendering stats
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const { invoices, parties, products } = store;

  const salesTotal = invoices.filter(i => i.type === 'sales').reduce((acc, curr) => acc + curr.totalAmount, 0);
  const purchaseTotal = invoices.filter(i => i.type === 'purchase').reduce((acc, curr) => acc + curr.totalAmount, 0);
  const receivable = parties.filter(p => p.balance > 0).reduce((acc, curr) => acc + curr.balance, 0);
  const payable = parties.filter(p => p.balance < 0).reduce((acc, curr) => acc + Math.abs(curr.balance), 0);

  const chartData = [
    { name: 'Sales', amount: salesTotal, fill: 'hsl(var(--chart-1))' },
    { name: 'Purchase', amount: purchaseTotal, fill: 'hsl(var(--chart-2))' },
    { name: 'Receivable', amount: receivable, fill: 'hsl(var(--chart-3))' },
    { name: 'Payable', amount: payable, fill: 'hsl(var(--destructive))' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold text-primary">Overview</h1>
        <p className="text-muted-foreground">Welcome back, here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/dashboard/transactions?type=sales">
          <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{salesTotal.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <ArrowUpRight className="w-3 h-3 text-emerald-500" /> View All Transactions
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/transactions?type=purchase">
          <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Purchase</CardTitle>
              <TrendingDown className="w-4 h-4 text-rose-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{purchaseTotal.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <ArrowDownRight className="w-3 h-3 text-rose-500" /> View All Transactions
              </p>
            </CardContent>
          </Card>
        </Link>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Receivables</CardTitle>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">₹{receivable.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Pending from {parties.filter(p => p.balance > 0).length} parties</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Payables</CardTitle>
            <AlertCircle className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">₹{payable.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Due to {parties.filter(p => p.balance < 0).length} vendors</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-headline">Financial Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/dashboard/settings/parties" className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-primary" />
                <span className="font-medium">Total Parties</span>
              </div>
              <span className="font-bold">{parties.length}</span>
            </Link>
            <Link href="/dashboard/settings/inventory" className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-primary" />
                <span className="font-medium">Products</span>
              </div>
              <span className="font-bold">{products.length}</span>
            </Link>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                <span className="font-medium">Active Invoices</span>
              </div>
              <span className="font-bold">{invoices.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
