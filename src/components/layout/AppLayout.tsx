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
    <div className="flex min-h-screen overflow-x-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <MobileHeader />
        <main className="flex-1 bg-gray-50 pb-20 lg:pb-0 overflow-x-hidden">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}
