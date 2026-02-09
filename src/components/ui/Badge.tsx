import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "purple";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  const variants = {
    default: "bg-gray-100 text-gray-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    danger: "bg-red-100 text-red-800",
    info: "bg-blue-100 text-blue-800",
    purple: "bg-purple-100 text-purple-800",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function getStatusBadgeVariant(status: string): BadgeProps["variant"] {
  const statusMap: Record<string, BadgeProps["variant"]> = {
    Pending: "warning",
    Approved: "info",
    Processing: "info",
    Received: "success",
    Shipped: "purple",
    InTransit: "purple",
    Delivered: "success",
    Cancelled: "danger",
    Active: "success",
    Inactive: "default",
  };
  return statusMap[status] || "default";
}
