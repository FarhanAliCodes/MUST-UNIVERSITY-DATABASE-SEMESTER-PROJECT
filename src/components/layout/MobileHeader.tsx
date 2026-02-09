"use client";

import { useState, useRef, useEffect } from "react";
import { Warehouse, LogOut, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

type Role = "Admin" | "Manager" | "Staff";

const roleColors: Record<Role, { bg: string; text: string }> = {
  Admin: { bg: "bg-purple-100", text: "text-purple-700" },
  Manager: { bg: "bg-blue-100", text: "text-blue-700" },
  Staff: { bg: "bg-green-100", text: "text-green-700" },
};

export default function MobileHeader() {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const initials = user?.FullName
    ? user.FullName.split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  const userRole = (user?.Role || "Staff") as Role;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {showDropdown && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setShowDropdown(false)}
        />
      )}
      
      <header className="lg:hidden sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-md">
              <Warehouse className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-sm leading-tight">InvenTrack</h1>
              <p className="text-[10px] text-gray-500">Supply Chain System</p>
            </div>
          </div>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-sm active:scale-95 transition-transform"
            >
              {initials}
            </button>

            {showDropdown && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-semibold shadow-sm">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate text-sm">{user?.FullName}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Shield className="w-3 h-3 text-gray-400" />
                        <span className={cn(
                          "text-xs font-medium px-1.5 py-0.5 rounded",
                          roleColors[userRole].bg,
                          roleColors[userRole].text
                        )}>
                          {user?.Role}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-2">
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      logout();
                    }}
                    className="flex items-center gap-3 w-full px-3 py-2.5 text-red-600 hover:bg-red-50 active:bg-red-100 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="font-medium text-sm">Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
