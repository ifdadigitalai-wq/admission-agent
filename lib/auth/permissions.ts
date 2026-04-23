export type Role = "admin" | "counselor" | "telecaller" | "manager" | "support";

export type Feature = "overview" | "conversations" | "leads" | "export" | "analytics" | "knowledge";

/** Maps each role to the features it can access. */
export const ROLE_PERMISSIONS: Record<Role, Feature[]> = {
  admin:      ["overview", "conversations", "leads", "export", "analytics", "knowledge"],
  counselor:  ["conversations", "leads"],
  telecaller: ["conversations"],
  manager:    ["overview", "export", "analytics", "knowledge"],
  support:    ["conversations"],
};

/** Default landing page per role (used after login redirect). */
export const ROLE_DEFAULT_PAGE: Record<Role, string> = {
  admin:      "/admin/dashboard",
  counselor:  "/admin/conversations",
  telecaller: "/admin/conversations",
  manager:    "/admin/dashboard",
  support:    "/admin/conversations",
};

/**
 * Check whether a given role has access to a specific feature.
 * Returns false for unknown roles.
 */
export function hasPermission(role: string, feature: Feature): boolean {
  const normalised = role.toLowerCase() as Role;
  return ROLE_PERMISSIONS[normalised]?.includes(feature) ?? false;
}

/**
 * Get the default landing page for a role.
 */
export function getDefaultPage(role: string): string {
  const normalised = role.toLowerCase() as Role;
  return ROLE_DEFAULT_PAGE[normalised] ?? "/admin/dashboard";
}
