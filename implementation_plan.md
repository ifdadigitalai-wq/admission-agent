# Role-Based Access Control (RBAC) for IDFA Admin Panel

Implement a multi-role permission system so that different team members (Admin, Counselor, Telecaller, Manager, Support) see only the sidebar items and access only the features they're authorized for.

## Current State

- **Admin model** already has a `role` string field (defaults to `"admin"`)
- **JWT payload** already includes `role` — it's signed at login and decoded in middleware
- **No permission checks** exist anywhere — every authenticated user sees everything
- The `verifyAdmin()` function is duplicated across 4 API route files instead of using the shared `lib/auth/middleware.ts`

## Proposed Role→Permission Matrix

| Feature Area | Route / API | Admin | Counselor | Telecaller | Manager | Support |
|---|---|---|---|---|---|---|
| **Overview Dashboard** | `/admin/dashboard` | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Conversations (Chats)** | `/admin/conversations` | ✅ | ✅ (assigned) | ✅ | ❌ | ✅ (service only) |
| **Lead Management** | `/admin` (leads page) | ✅ | ✅ (assigned) | ❌ | ❌ | ❌ |
| **Data Export** | `/api/admin/leads/export` | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Analytics API** | `/api/admin/analytics` | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Lead CRUD API** | `/api/admin/leads/*` | ✅ | ✅ | ❌ | ✅ (read-only) | ❌ |
| **Conversation API** | `/api/admin/conversations/*` | ✅ | ✅ | ✅ | ❌ | ✅ |

> [!IMPORTANT]
> **"Assigned" chat/lead filtering** (Counselor sees only their assigned leads) would require adding an `assignedTo` field on the Lead and Conversation models. This plan does **NOT** add assignment logic — it only gates visibility of entire feature sections. Assignment-based filtering can be a follow-up phase.

## User Review Required

> [!WARNING]
> **Sidebar visibility only, not data-level assignment**: In Phase 1, a Counselor can see *all* chats and *all* leads (not just assigned ones). True per-user assignment filtering requires schema changes (adding `assignedTo` foreign key on Lead and Conversation models). Should I include that in this plan, or keep it as a future enhancement?

> [!IMPORTANT]
> **Seed script roles**: The current seed creates admins without explicit roles (they default to `"admin"`). The updated seed will create one user per role for testing. Confirm the emails/passwords below are acceptable:
> | Role | Email | Password |
> |---|---|---|
> | Admin | admin@ifdadigitalai.com | Admin@123 |
> | Counselor |  | Counselor@123 |
> | Telecaller | telecaller@ifdadigitalai.com | Telecaller@123 |
> | Manager | manager@ifdadigitalai.com | Manager@123 |
> | Support | support@ifdadigitalai.com | Support@123 |

## Open Questions

1. **Should the login page redirect to different default pages per role?** e.g., Counselor → Conversations, Manager → Dashboard, Telecaller → Conversations, Support → Conversations?
2. **Should Manager have read-only or full counselor@ifdadigitalai.comaccess to leads?** Current proposal: read-only (can view but not update status/notes).
3. **Should Telecaller have lead access for follow-ups?** The matrix above gives them chat-only — confirm if they also need to *view* (not edit) leads.

---

## Proposed Changes

### 1. Permissions Config (new shared module)

#### [NEW] [permissions.ts](file:///c:/Users/pc/Desktop/idfa/lib/auth/permissions.ts)

A central config defining which roles can access which features. Single source of truth used by both frontend sidebar and backend API guards.

```typescript
export type Role = "admin" | "counselor" | "telecaller" | "manager" | "support";

export type Feature = "overview" | "conversations" | "leads" | "export" | "analytics";

export const ROLE_PERMISSIONS: Record<Role, Feature[]> = {
  admin:      ["overview", "conversations", "leads", "export", "analytics"],
  counselor:  ["conversations", "leads"],
  telecaller: ["conversations"],
  manager:    ["overview", "export", "analytics"],
  support:    ["conversations"],
};

export function hasPermission(role: string, feature: Feature): boolean {
  return ROLE_PERMISSIONS[role as Role]?.includes(feature) ?? false;
}
```

---

### 2. Prisma Schema — Role Enum

#### [MODIFY] [schema.prisma](file:///c:/Users/pc/Desktop/idfa/prisma/schema.prisma)

Change the `role` field from a free-form `String` to an `enum AdminRole` for type safety.

```diff
+enum AdminRole {
+  ADMIN
+  COUNSELOR
+  TELECALLER
+  MANAGER
+  SUPPORT
+}
+
 model Admin {
   id        String   @id @default(uuid())
   name      String
   email     String   @unique
   password  String
-  role      String   @default("admin")
+  role      AdminRole @default(ADMIN)
   createdAt DateTime @default(now())
 }
```

Then run `npx prisma migrate dev --name add_admin_role_enum`.

---

### 3. Auth Library Updates

#### [MODIFY] [jwt.ts](file:///c:/Users/pc/Desktop/idfa/lib/auth/jwt.ts)

No structural changes needed — `role` is already a string in the payload. We just ensure it's passed through.

#### [MODIFY] [middleware.ts](file:///c:/Users/pc/Desktop/idfa/lib/auth/middleware.ts) (lib/auth/)

Add a `requireRole()` helper that API routes can call:

```typescript
export function requireRole(req: NextRequest, allowedFeature: Feature): AdminPayload {
  const admin = getAdminFromRequest(req);
  if (!admin) throw new Error("Unauthorized");
  if (!hasPermission(admin.role, allowedFeature)) throw new Error("Forbidden");
  return admin;
}
```

---

### 4. API Route Guards

Each API route that currently just checks `verifyAdmin()` will be updated to also check the role's permission for the relevant feature.

#### [MODIFY] [route.ts](file:///c:/Users/pc/Desktop/idfa/app/api/admin/analytics/route.ts)
- Replace inline `verifyAdmin()` with `requireRole(req, "analytics")`
- Return 403 if role lacks analytics permission

#### [MODIFY] [route.ts](file:///c:/Users/pc/Desktop/idfa/app/api/admin/leads/route.ts)
- Replace inline `verifyAdmin()` with `requireRole(req, "leads")`

#### [MODIFY] [route.ts](file:///c:/Users/pc/Desktop/idfa/app/api/admin/leads/[id]/route.ts)
- Replace inline `verifyAdmin()` with `requireRole(req, "leads")`

#### [MODIFY] [route.ts](file:///c:/Users/pc/Desktop/idfa/app/api/admin/conversations/route.ts)
- Replace inline `verifyAdmin()` with `requireRole(req, "conversations")`

#### [MODIFY] [route.ts](file:///c:/Users/pc/Desktop/idfa/app/api/admin/conversations/[id]/route.ts)
- Replace inline `verifyAdmin()` with `requireRole(req, "conversations")`

---

### 5. Frontend — Sidebar Permission Filtering

#### [MODIFY] [page.tsx](file:///c:/Users/pc/Desktop/idfa/app/admin/dashboard/page.tsx)

Import `hasPermission` and filter sidebar nav links based on the logged-in user's role. The `admin` object already has `role` from the `/api/admin/auth/me` response.

```tsx
const navItems = [
  { label: "Overview",        href: "#",                       feature: "overview",      icon: "..." },
  { label: "Conversations",   href: "/admin/conversations",    feature: "conversations", icon: "..." },
  { label: "Lead Management", href: "/admin",                  feature: "leads",         icon: "..." },
  { label: "Data Export",     href: "/api/admin/leads/export", feature: "export",        icon: "..." },
].filter(item => hasPermission(admin?.role || "", item.feature));
```

---

### 6. Frontend — Page-Level Access Guards

#### [MODIFY] [page.tsx](file:///c:/Users/pc/Desktop/idfa/app/admin/page.tsx) (Leads Management)
- After fetching `/api/admin/auth/me`, check `hasPermission(admin.role, "leads")` — redirect to dashboard or show "Access Denied" if unauthorized.

#### [MODIFY] [page.tsx](file:///c:/Users/pc/Desktop/idfa/app/admin/conversations/page.tsx)
- After fetching `/api/admin/auth/me`, check `hasPermission(admin.role, "conversations")` — redirect or deny if unauthorized.

---

### 7. Seed Script Update

#### [MODIFY] [seedAdmin.ts](file:///c:/Users/pc/Desktop/idfa/prisma/sccripts/seedAdmin.ts)

Add all 5 roles for testing:

```typescript
const admins = [
  { name: "Super Admin",  email: "admin@ifdadigitalai.com",      password: "Admin@123",      role: "ADMIN" },
  { name: "Counselor",    email: "counselor@ifdadigitalai.com",   password: "Counselor@123",  role: "COUNSELOR" },
  { name: "Telecaller",   email: "telecaller@ifdadigitalai.com",  password: "Telecaller@123", role: "TELECALLER" },
  { name: "Manager",      email: "manager@ifdadigitalai.com",     password: "Manager@123",    role: "MANAGER" },
  { name: "Support",      email: "support@ifdadigitalai.com",     password: "Support@123",    role: "SUPPORT" },
];
```

---

## Verification Plan

### Automated Tests
1. Run `npx prisma migrate dev` — confirm migration succeeds
2. Run the updated seed script — confirm all 5 users are created
3. Run `npm run dev` and test login with each role

### Manual Verification
- **Admin login** → sees all 4 sidebar items, full access
- **Counselor login** → sees only Conversations + Lead Management
- **Telecaller login** → sees only Conversations
- **Manager login** → sees Overview + Data Export
- **Support login** → sees only Conversations
- **API guard test**: Hit `/api/admin/analytics` with a Telecaller token → expect 403
- **Sidebar rendering**: Confirm no hidden items leak through for restricted roles
