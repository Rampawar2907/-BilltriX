"use client";

import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarGroupContent } from "@/components/ui/sidebar";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  TrendingUp, 
  Wallet, 
  BookOpen, 
  BarChart3, 
  Settings, 
  UserCircle,
  LogOut,
  Package,
  Users,
  History,
  RotateCcw
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { name: 'Transactions', icon: History, href: '/dashboard/transactions' },
  { name: 'Sales Invoice', icon: TrendingUp, href: '/dashboard/sales' },
  { name: 'Sales Return', icon: RotateCcw, href: '/dashboard/sales-return' },
  { name: 'Purchase Invoice', icon: ShoppingCart, href: '/dashboard/purchase' },
  { name: 'Purchase Return', icon: RotateCcw, href: '/dashboard/purchase-return' },
  { name: 'Payments & Receipts', icon: Wallet, href: '/dashboard/vouchers' },
  { name: 'Party Ledger', icon: BookOpen, href: '/dashboard/ledger' },
  { name: 'Reports', icon: BarChart3, href: '/dashboard/reports' },
];

const management = [
  { name: 'Parties', icon: Users, href: '/dashboard/settings/parties' },
  { name: 'Inventory', icon: Package, href: '/dashboard/settings/inventory' },
  { name: 'Settings', icon: Settings, href: '/dashboard/settings' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar className="border-r border-sidebar-border shadow-lg">
          <SidebarHeader className="p-6">
            <h1 className="text-2xl font-headline font-bold text-sidebar-foreground tracking-tight">BilltriX</h1>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="text-sidebar-foreground/50">MAIN MENU</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigation.map((item) => (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={pathname === item.href}
                        tooltip={item.name}
                        className="transition-all duration-200"
                      >
                        <Link href={item.href}>
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="mt-4">
              <SidebarGroupLabel className="text-sidebar-foreground/50">MANAGEMENT</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {management.map((item) => (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={pathname === item.href}
                        tooltip={item.name}
                        className="transition-all duration-200"
                      >
                        <Link href={item.href}>
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3 p-2 bg-sidebar-accent rounded-lg">
              <UserCircle className="w-8 h-8 text-sidebar-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">Admin User</p>
                <p className="text-xs text-sidebar-foreground/70 truncate">admin@billtrix.com</p>
              </div>
              <Link href="/">
                <LogOut className="w-4 h-4 text-sidebar-foreground/70 hover:text-destructive transition-colors" />
              </Link>
            </div>
          </SidebarFooter>
        </Sidebar>
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}