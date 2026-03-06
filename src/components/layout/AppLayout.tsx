"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import MobileHeader from "./MobileHeader";
import { PageLoading } from "@/components/ui/Loading";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return <PageLoading />;
  }

  if (pathname === "/login") {
    return <>{children}</>;
  }

  if (!user) {
    return <PageLoading />;
  }

  return (
    <div style={{ height: "100vh", display: "flex", overflow: "hidden" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100vh", overflow: "hidden" }}>
        <MobileHeader />
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 pb-20 lg:pb-0">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
