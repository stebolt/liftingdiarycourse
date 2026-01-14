# Authentication Standards

## ⚠️ CRITICAL: Clerk for Authentication ONLY

**This application uses EXCLUSIVELY Clerk for all authentication and user management.**

### Rule

❌ **DO NOT implement custom authentication**
✅ **ONLY use Clerk for authentication**

All authentication, user management, and session handling must be done through Clerk. Custom authentication solutions are strictly prohibited.

## Why Clerk?

1. **Security**: Enterprise-grade security with built-in protections
2. **User Management**: Complete user lifecycle management out of the box
3. **Social Auth**: Pre-configured OAuth providers (Google, GitHub, etc.)
4. **Sessions**: Secure session management with automatic refresh
5. **Multi-tenancy**: Support for organizations and multi-tenancy
6. **Developer Experience**: Simple API with React hooks and server utilities
7. **Compliance**: Handles GDPR, SOC 2, and other compliance requirements

## Setup Requirements

### 1. Environment Variables

Create `.env.local` in the project root with your Clerk keys:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

Get your keys from: https://dashboard.clerk.com/last-active?path=api-keys

### 2. Middleware Configuration

The `middleware.ts` file at the project root protects all routes:

```typescript
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
```

**IMPORTANT**: Always use `clerkMiddleware()` from `@clerk/nextjs/server`. The old `authMiddleware()` is deprecated.

### 3. Root Layout Integration

The root layout (`app/layout.tsx`) wraps the entire app with `<ClerkProvider>`:

```typescript
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <header>
            <SignedOut>
              <SignInButton mode="modal">
                <button>Sign In</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button>Sign Up</button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </header>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
```

## Client Components

### Core Components

Clerk provides pre-built components for authentication UI:

```typescript
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
```

### Component Usage

#### Conditional Rendering

```tsx
// Show content only to signed-in users
<SignedIn>
  <div>This is visible only to authenticated users</div>
</SignedIn>

// Show content only to signed-out users
<SignedOut>
  <div>Please sign in to continue</div>
</SignedOut>
```

#### Sign In/Sign Up Buttons

```tsx
// Sign In Button with modal
<SignInButton mode="modal">
  <button className="px-4 py-2 rounded bg-zinc-900 text-white">
    Sign In
  </button>
</SignInButton>

// Sign Up Button with modal
<SignUpButton mode="modal">
  <button className="px-4 py-2 rounded bg-blue-600 text-white">
    Sign Up
  </button>
</SignUpButton>

// Redirect mode (full page)
<SignInButton mode="redirect" redirectUrl="/dashboard" />
```

#### User Button

The `<UserButton />` component provides a complete user management UI:

```tsx
import { UserButton } from "@clerk/nextjs";

<SignedIn>
  <UserButton />
</SignedIn>
```

Features included:
- User profile management
- Account settings
- Sign out functionality
- Organization switching (if multi-tenancy enabled)

### Client-Side Hooks

For client components that need user data:

```typescript
"use client";

import { useUser } from "@clerk/nextjs";

export function UserProfile() {
  const { isSignedIn, user, isLoaded } = useUser();

  // Wait for Clerk to load
  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  // User is not signed in
  if (!isSignedIn) {
    return <div>Please sign in</div>;
  }

  // User is signed in
  return (
    <div>
      <p>Hello, {user.firstName}!</p>
      <p>Email: {user.primaryEmailAddress?.emailAddress}</p>
    </div>
  );
}
```

### Available Hooks

```typescript
import {
  useUser,          // Current user information
  useAuth,          // Authentication state and utilities
  useSignIn,        // Sign in functionality
  useSignUp,        // Sign up functionality
  useClerk,         // Core Clerk instance
} from "@clerk/nextjs";
```

## Server Components & Server Actions

### Getting User ID in Server Components

```typescript
import { auth } from "@clerk/nextjs/server";

export default async function Page() {
  const { userId } = await auth();

  if (!userId) {
    // User is not authenticated
    return <div>Please sign in</div>;
  }

  // Fetch user-specific data
  const userWorkouts = await getUserWorkouts(userId);

  return <div>{/* Render user data */}</div>;
}
```

### Getting Full User Object

```typescript
import { currentUser } from "@clerk/nextjs/server";

export default async function Page() {
  const user = await currentUser();

  if (!user) {
    return <div>Not signed in</div>;
  }

  return (
    <div>
      <p>Hello, {user.firstName}!</p>
      <p>Email: {user.emailAddresses[0].emailAddress}</p>
    </div>
  );
}
```

### Server Actions

```typescript
"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/src/db";
import { workouts } from "@/src/db/schema";

export async function createWorkout(formData: FormData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized: User must be signed in");
  }

  const name = formData.get("name") as string;

  await db.insert(workouts).values({
    userId,
    name,
    date: new Date(),
  });
}
```

## Data Access Pattern

### CRITICAL: Always Filter by User ID

**Every database query MUST include the user ID to ensure data isolation.**

```typescript
import { auth } from "@clerk/nextjs/server";
import { db } from "@/src/db";
import { workouts } from "@/src/db/schema";
import { eq, and } from "drizzle-orm";

// ✅ CORRECT: Always filter by userId
export async function getUserWorkouts() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  return await db
    .select()
    .from(workouts)
    .where(eq(workouts.userId, userId))
    .orderBy(workouts.date);
}

// ❌ FORBIDDEN: No userId filter (security risk!)
export async function getAllWorkouts() {
  return await db.select().from(workouts); // SECURITY RISK!
}
```

### Standard Pattern for Data Helpers

All data fetching functions in the `/data` directory must follow this pattern:

```typescript
import { auth } from "@clerk/nextjs/server";
import { db } from "@/src/db";
import { workouts } from "@/src/db/schema";
import { eq, and } from "drizzle-orm";

export async function getWorkoutById(workoutId: number) {
  // 1. Get the current user
  const { userId } = await auth();

  // 2. Check if user is authenticated
  if (!userId) {
    throw new Error("Unauthorized");
  }

  // 3. Query with userId filter (CRITICAL)
  const result = await db
    .select()
    .from(workouts)
    .where(
      and(
        eq(workouts.id, workoutId),
        eq(workouts.userId, userId) // CRITICAL: User isolation
      )
    )
    .limit(1);

  return result[0];
}
```

## Route Protection

### Public vs Protected Routes

By default, all routes are accessible. To protect specific routes:

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/workouts(.*)',
  '/profile(.*)',
]);

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

### Public Routes

To make specific routes public:

```typescript
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/about',
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});
```

## Database Schema Integration

### User ID Storage

The `userId` field in database tables stores the Clerk user ID:

```typescript
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const workouts = pgTable("workouts", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), // Clerk user ID
  name: text("name").notNull(),
  date: timestamp("date").notNull(),
  // ... other fields
});
```

### Creating Records

Always include the `userId` when creating records:

```typescript
import { auth } from "@clerk/nextjs/server";

export async function createWorkout(data: { name: string; date: Date }) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  return await db.insert(workouts).values({
    ...data,
    userId, // CRITICAL: Always include userId
  }).returning();
}
```

## User Metadata

### Accessing User Information

```typescript
import { currentUser } from "@clerk/nextjs/server";

export async function getUserProfile() {
  const user = await currentUser();

  if (!user) return null;

  return {
    id: user.id,
    email: user.emailAddresses[0].emailAddress,
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl,
    createdAt: user.createdAt,
  };
}
```

### Available User Fields

```typescript
user.id                              // Clerk user ID (use for database)
user.firstName                       // User's first name
user.lastName                        // User's last name
user.emailAddresses                  // Array of email addresses
user.primaryEmailAddress             // Primary email
user.imageUrl                        // Profile image URL
user.createdAt                       // Account creation timestamp
user.updatedAt                       // Last update timestamp
```

## Authentication Checklist

Before deploying any feature with authentication:

- [ ] Environment variables configured (`.env.local`)
- [ ] Middleware properly configured with `clerkMiddleware()`
- [ ] Root layout wrapped with `<ClerkProvider>`
- [ ] All server-side data queries use `await auth()` to get `userId`
- [ ] All queries filter by `userId` (user data isolation)
- [ ] Unauthorized access throws errors
- [ ] Client components use appropriate Clerk hooks
- [ ] Database schema includes `userId` field for user-owned data

## Common Patterns

### Protected Page

```typescript
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Fetch user-specific data
  const data = await getUserData(userId);

  return <div>{/* Render page */}</div>;
}
```

### Conditional UI Based on Auth

```tsx
import { SignedIn, SignedOut } from "@clerk/nextjs";

export function NavBar() {
  return (
    <nav>
      <SignedOut>
        <a href="/sign-in">Sign In</a>
      </SignedOut>
      <SignedIn>
        <a href="/dashboard">Dashboard</a>
        <UserButton />
      </SignedIn>
    </nav>
  );
}
```

### Client Component with Auth

```typescript
"use client";

import { useUser } from "@clerk/nextjs";

export function WelcomeMessage() {
  const { isSignedIn, user, isLoaded } = useUser();

  if (!isLoaded) return <div>Loading...</div>;
  if (!isSignedIn) return null;

  return <h1>Welcome back, {user.firstName}!</h1>;
}
```

## Security Best Practices

### 1. Never Trust Client-Side Auth

```typescript
// ❌ WRONG: Client-side only check
"use client";
export function DeleteButton({ workoutId }) {
  const { userId } = useAuth();

  const handleDelete = async () => {
    // This is NOT secure! Client can manipulate this
    await fetch(`/api/workouts/${workoutId}`, { method: "DELETE" });
  };
}

// ✅ CORRECT: Server-side verification
"use server";
export async function deleteWorkout(workoutId: number) {
  const { userId } = await auth();

  if (!userId) throw new Error("Unauthorized");

  // Verify ownership before deletion
  await db
    .delete(workouts)
    .where(
      and(
        eq(workouts.id, workoutId),
        eq(workouts.userId, userId) // CRITICAL
      )
    );
}
```

### 2. Always Verify User Ownership

```typescript
export async function updateWorkout(workoutId: number, data: any) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // First, verify the workout belongs to the user
  const workout = await db
    .select()
    .from(workouts)
    .where(
      and(
        eq(workouts.id, workoutId),
        eq(workouts.userId, userId)
      )
    )
    .limit(1);

  if (!workout[0]) {
    throw new Error("Workout not found or access denied");
  }

  // Then perform the update
  return await db
    .update(workouts)
    .set(data)
    .where(eq(workouts.id, workoutId));
}
```

### 3. Handle Unauthenticated States

```typescript
export async function getProtectedData() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized: User must be signed in");
  }

  // Continue with logic...
}
```

## Troubleshooting

### Common Issues

1. **"Clerk: auth() was called but Clerk can't detect usage of clerkMiddleware()"**
   - Ensure `middleware.ts` is at the project root
   - Check that `clerkMiddleware()` is properly exported

2. **"Invalid publishable key"**
   - Verify `.env.local` has correct keys
   - Ensure keys start with `pk_test_` or `pk_live_`

3. **User data not persisting**
   - Check that `userId` is being stored in database
   - Verify queries include `userId` filter

4. **Redirect loops**
   - Check middleware matcher configuration
   - Ensure sign-in routes are not protected

## Resources

- **Clerk Documentation**: https://clerk.com/docs
- **Next.js Integration**: https://clerk.com/docs/quickstarts/nextjs
- **API Reference**: https://clerk.com/docs/references/nextjs/overview
- **Dashboard**: https://dashboard.clerk.com

## Summary

### The Golden Rules

1. ✅ **Use ONLY Clerk for authentication** (no custom auth)
2. ✅ **Always use `await auth()` in server components** to get `userId`
3. ✅ **Filter ALL queries by `userId`** (user data isolation)
4. ✅ **Use `clerkMiddleware()`** (not deprecated `authMiddleware()`)
5. ✅ **Import from correct packages**:
   - Server: `@clerk/nextjs/server`
   - Client: `@clerk/nextjs`
6. ✅ **Never trust client-side auth** (always verify server-side)
7. ✅ **Store `userId` as `text` type** in database
8. ✅ **Throw errors** when `userId` is missing

### Quick Reference

```typescript
// Server Components
import { auth, currentUser } from "@clerk/nextjs/server";
const { userId } = await auth();
const user = await currentUser();

// Client Components
import { useUser, useAuth } from "@clerk/nextjs";
const { user, isSignedIn, isLoaded } = useUser();
const { userId } = useAuth();

// UI Components
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

// Middleware
import { clerkMiddleware } from "@clerk/nextjs/server";
export default clerkMiddleware();
```

**Remember: Authentication is critical. Always verify user identity server-side. Never trust the client.**
