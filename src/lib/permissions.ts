export type Role = "Admin" | "Manager" | "Staff";

export interface Permission {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
}

type ResourcePermissions = Record<Role, Permission>;

const defaultPermission: Permission = {
  canView: false,
  canCreate: false,
  canEdit: false,
  canDelete: false,
  canApprove: false,
};

const fullAccess: Permission = {
  canView: true,
  canCreate: true,
  canEdit: true,
  canDelete: true,
  canApprove: true,
};

const viewOnly: Permission = {
  canView: true,
  canCreate: false,
  canEdit: false,
  canDelete: false,
  canApprove: false,
};

const viewAndCreate: Permission = {
  canView: true,
  canCreate: true,
  canEdit: false,
  canDelete: false,
  canApprove: false,
};

const viewCreateEdit: Permission = {
  canView: true,
  canCreate: true,
  canEdit: true,
  canDelete: false,
  canApprove: false,
};

export const permissions: Record<string, ResourcePermissions> = {
  dashboard: {
    Admin: fullAccess,
    Manager: { ...fullAccess, canDelete: false },
    Staff: viewOnly,
  },
  products: {
    Admin: fullAccess,
    Manager: viewCreateEdit,
    Staff: viewOnly,
  },
  inventory: {
    Admin: fullAccess,
    Manager: viewCreateEdit,
    Staff: viewOnly,
  },
  purchaseOrders: {
    Admin: fullAccess,
    Manager: { ...viewCreateEdit, canApprove: true },
    Staff: defaultPermission,
  },
  salesOrders: {
    Admin: fullAccess,
    Manager: { ...viewCreateEdit, canApprove: true },
    Staff: viewAndCreate,
  },
  suppliers: {
    Admin: fullAccess,
    Manager: viewCreateEdit,
    Staff: defaultPermission,
  },
  customers: {
    Admin: fullAccess,
    Manager: viewCreateEdit,
    Staff: viewOnly,
  },
  warehouses: {
    Admin: fullAccess,
    Manager: viewOnly,
    Staff: defaultPermission,
  },
  reports: {
    Admin: fullAccess,
    Manager: viewOnly,
    Staff: defaultPermission,
  },
};

export function getPermission(resource: string, role: Role): Permission {
  return permissions[resource]?.[role] || defaultPermission;
}

export function canAccessRoute(path: string, role: Role): boolean {
  const routeMap: Record<string, string> = {
    "/": "dashboard",
    "/products": "products",
    "/inventory": "inventory",
    "/purchase-orders": "purchaseOrders",
    "/sales-orders": "salesOrders",
    "/suppliers": "suppliers",
    "/customers": "customers",
    "/warehouses": "warehouses",
    "/reports": "reports",
  };

  const basePath = "/" + path.split("/").filter(Boolean)[0] || "/";
  const resource = routeMap[basePath] || routeMap["/"];
  const permission = getPermission(resource, role);

  return permission.canView;
}
