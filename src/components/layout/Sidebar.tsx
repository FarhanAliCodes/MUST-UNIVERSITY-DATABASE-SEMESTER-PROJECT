"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingCart,
  Truck,
  Users,
  Building2,
  BarChart3,
  ClipboardList,
  BoxesIcon,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

type Role = "Admin" | "Manager" | "Staff";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  roles: Role[];
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, roles: ["Admin", "Manager", "Staff"] },
  { name: "Products", href: "/products", icon: Package, roles: ["Admin", "Manager", "Staff"] },
  { name: "Inventory", href: "/inventory", icon: BoxesIcon, roles: ["Admin", "Manager", "Staff"] },
  { name: "Purchase Orders", href: "/purchase-orders", icon: ClipboardList, roles: ["Admin", "Manager"] },
  { name: "Sales Orders", href: "/sales-orders", icon: ShoppingCart, roles: ["Admin", "Manager", "Staff"] },
  { name: "Suppliers", href: "/suppliers", icon: Truck, roles: ["Admin", "Manager"] },
  { name: "Customers", href: "/customers", icon: Users, roles: ["Admin", "Manager", "Staff"] },
  { name: "Warehouses", href: "/warehouses", icon: Building2, roles: ["Admin"] },
  { name: "Reports", href: "/reports", icon: BarChart3, roles: ["Admin", "Manager"] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const userRole = (user?.Role || "Staff") as Role;
  const filteredNavigation = navigation.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <aside className="hidden lg:flex w-64 bg-gradient-to-b from-slate-900 to-slate-800 h-screen flex-col shadow-xl sticky top-0">
      <div className="flex-shrink-0 p-5 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25">
            <Warehouse className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white tracking-tight">InvenTrack</h1>
            <p className="text-xs text-slate-400">Supply Chain System</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto min-h-0">
        <p className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Menu
        </p>
        {filteredNavigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                isActive
                  ? "bg-primary-600 text-white shadow-lg shadow-primary-600/30"
                  : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
              )}
            >
              <item.icon
                className={cn(
                  "w-5 h-5 transition-transform group-hover:scale-110",
                  isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                )}
              />
              <span className="font-medium text-sm">{item.name}</span>
              {isActive && (
                <ChevronRight className="w-4 h-4 ml-auto" />
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
