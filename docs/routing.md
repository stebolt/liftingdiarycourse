# Routing Standards

## Core Principle: All Routes Under /dashboard

**All application routes must be accessed via `/dashboard`. This is a protected route that requires authentication.**

### Rule

❌ **DO NOT create routes outside of `/dashboard`**
✅ **ALL app features must be under `/dashboard/*`**

## Why This Standard?

1. **Security**: All authenticated content is centralized under one protected path
2. **Simplicity**: Single middleware rule protects all app features
3. **Consistency**: Clear separation between public (landing page) and private (app) routes
4. **Maintainability**: Easy to reason about route protection

## Route Structure

```
app/
├── page.tsx                          # Public landing page (/)
├── dashboard/
│   ├── page.tsx                      # Protected dashboard home (/dashboard)
│   ├── loading.tsx                   # Loading state for dashboard
│   ├── error.tsx                     # Error boundary for dashboard
│   ├── _components/                  # Shared dashboard components (NOT routes)
│   │   ├── workout-card.tsx
│   │   └── ...
│   └── workout/
│       ├── new/
│       │   ├── page.tsx              # /dashboard/workout/new
│       │   ├── actions.ts            # Server actions for this route
│       │   └── _components/          # Route-specific components
│       │       └── create-workout-form.tsx
│       └── [workoutId]/
│           ├── page.tsx              # /dashboard/workout/[workoutId]
│           ├── actions.ts            # Server actions for this route
│           └── _components/          # Route-specific components
│               └── edit-workout-form.tsx
```

## Route Protection via Middleware

Route protection is handled exclusively by Next.js middleware using Clerk.

### Current Middleware Configuration

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

### Key Points

1. **`createRouteMatcher`**: Defines which routes require authentication
2. **`/dashboard(.*)`**: Protects `/dashboard` and ALL sub-routes
3. **`auth.protect()`**: Redirects unauthenticated users to sign-in
4. **Matcher config**: Ensures middleware runs on all relevant routes

## Creating New Routes

### ✅ CORRECT: Routes Under /dashboard

```
app/dashboard/workout/new/page.tsx        → /dashboard/workout/new
app/dashboard/exercises/page.tsx          → /dashboard/exercises
app/dashboard/settings/page.tsx           → /dashboard/settings
app/dashboard/history/page.tsx            → /dashboard/history
```

### ❌ INCORRECT: Routes Outside /dashboard

```
app/workout/page.tsx                      → /workout (WRONG!)
app/exercises/page.tsx                    → /exercises (WRONG!)
app/settings/page.tsx                     → /settings (WRONG!)
```

## Route Conventions

### Directory Structure for Routes

Each route should follow this structure:

```
app/dashboard/[feature]/
├── page.tsx              # The page component (required)
├── loading.tsx           # Loading state (optional)
├── error.tsx             # Error boundary (optional)
├── actions.ts            # Server actions for this route (if needed)
└── _components/          # Route-specific components (NOT accessible as routes)
    └── feature-form.tsx
```

### Using `_components` Directory

Directories prefixed with `_` are NOT treated as routes by Next.js. Use this for:

- Route-specific components
- Shared components within a route segment

```tsx
// app/dashboard/workout/new/_components/create-workout-form.tsx
// This is a component, NOT a route

"use client";

import { Button } from "@/components/ui/button";
// ...

export function CreateWorkoutForm() {
  // Form implementation
}
```

### Dynamic Routes

Use `[param]` for dynamic segments:

```
app/dashboard/workout/[workoutId]/page.tsx  → /dashboard/workout/123
app/dashboard/exercises/[exerciseId]/       → /dashboard/exercises/456
```

Access the parameter in the page:

```tsx
// app/dashboard/workout/[workoutId]/page.tsx

interface PageProps {
  params: Promise<{ workoutId: string }>;
}

export default async function WorkoutPage({ params }: PageProps) {
  const { workoutId } = await params;
  // Use workoutId to fetch data
}
```

## Server Actions Location

Server actions should be colocated with their routes:

```
app/dashboard/workout/new/
├── page.tsx
└── actions.ts            # createWorkout action

app/dashboard/workout/[workoutId]/
├── page.tsx
└── actions.ts            # updateWorkout, deleteWorkout actions
```

See `docs/data-mutations.md` for server action standards.

## Linking Between Routes

Use Next.js `Link` component for navigation:

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

// As a link
<Link href="/dashboard/workout/new">
  Create Workout
</Link>

// As a button link
<Button asChild>
  <Link href="/dashboard/workout/new">
    Create Workout
  </Link>
</Button>

// With dynamic segments
<Link href={`/dashboard/workout/${workout.id}`}>
  View Workout
</Link>
```

## Redirects

Use Next.js `redirect` for server-side redirects:

```tsx
import { redirect } from "next/navigation";

// In a server action
export async function createWorkout(data: WorkoutData) {
  const workout = await insertWorkout(data);
  redirect(`/dashboard/workout/${workout.id}`);
}

// In a page (for access control)
export default async function SomePage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Page content
}
```

## Public Routes

The only routes that should exist outside `/dashboard`:

| Route | Purpose |
|-------|---------|
| `/` | Public landing page |
| `/sign-in` | Clerk sign-in (handled by Clerk) |
| `/sign-up` | Clerk sign-up (handled by Clerk) |

All other routes MUST be under `/dashboard`.

## Summary

### The One Rule

**All app routes must be under `/dashboard`. Route protection is handled by middleware.**

### Quick Reference

✅ **DO**:
- Create all feature routes under `app/dashboard/`
- Use `_components/` directories for route-specific components
- Colocate server actions in `actions.ts` files
- Use dynamic routes with `[param]` syntax
- Use `Link` from `next/link` for navigation
- Use `redirect` from `next/navigation` for server-side redirects

❌ **DON'T**:
- Create routes outside `/dashboard`
- Add route protection logic in individual pages
- Create components directories without `_` prefix in route folders
- Use client-side router for programmatic navigation (use server actions + redirect)

### Route Protection Checklist

- [ ] New route is under `/dashboard`
- [ ] Middleware pattern `/dashboard(.*)` covers the new route
- [ ] No duplicate auth checks in pages (middleware handles it)
- [ ] Server actions validate `userId` for data operations (see `docs/data-mutations.md`)
