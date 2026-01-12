# Data Fetching Standards

## ⚠️ CRITICAL: Server Components ONLY

**ALL data fetching in this application MUST be done exclusively via Server Components.**

### ✅ ALLOWED
- **Server Components** fetching data directly

### ❌ FORBIDDEN
- ❌ Route handlers (API routes) for data fetching
- ❌ Client components fetching data
- ❌ `useEffect` hooks with fetch calls
- ❌ React Query, SWR, or other client-side data fetching libraries
- ❌ Any other data fetching pattern

## Database Query Requirements

### Helper Functions in `/data` Directory

**ALL database queries MUST be placed in helper functions within the `/data` directory.**

```typescript
// ✅ CORRECT: Helper function in /data/workouts.ts
import { db } from "@/src/db";
import { workouts } from "@/src/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export async function getUserWorkouts() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  return await db
    .select()
    .from(workouts)
    .where(eq(workouts.userId, userId))
    .orderBy(workouts.date);
}
```

### ⚠️ CRITICAL: Use Drizzle ORM ONLY

**NEVER use raw SQL queries. ALWAYS use Drizzle ORM.**

```typescript
// ❌ FORBIDDEN: Raw SQL
const results = await db.execute(sql`SELECT * FROM workouts WHERE userId = ${userId}`);

// ✅ CORRECT: Drizzle ORM
const results = await db
  .select()
  .from(workouts)
  .where(eq(workouts.userId, userId));
```

## 🔒 Security: User Data Isolation

**THIS IS CRITICALLY IMPORTANT: Users MUST ONLY access their own data.**

### Every Query MUST Include User ID Filter

```typescript
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";

export async function getWorkoutById(workoutId: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // ✅ CORRECT: Always filter by userId
  const result = await db
    .select()
    .from(workouts)
    .where(
      and(
        eq(workouts.id, workoutId),
        eq(workouts.userId, userId) // CRITICAL: User can only access their own data
      )
    )
    .limit(1);

  return result[0];
}

// ❌ FORBIDDEN: Missing userId filter
export async function getWorkoutById(workoutId: number) {
  return await db
    .select()
    .from(workouts)
    .where(eq(workouts.id, workoutId)) // SECURITY RISK: No userId check!
    .limit(1);
}
```

### Security Checklist

Before writing any data fetching function, verify:

- [ ] Function is a helper in the `/data` directory
- [ ] Uses Drizzle ORM (NO raw SQL)
- [ ] Calls `await auth()` to get `userId`
- [ ] Checks if `userId` exists (throws error if not)
- [ ] **Filters ALL queries by `userId`** (or related user data)
- [ ] Cannot access other users' data under any circumstance

## Usage Pattern

### 1. Create Helper Function in `/data`

```typescript
// /data/workouts.ts
import { db } from "@/src/db";
import { workouts } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export async function getRecentWorkouts(limit: number = 10) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  return await db
    .select()
    .from(workouts)
    .where(eq(workouts.userId, userId))
    .orderBy(workouts.date)
    .limit(limit);
}
```

### 2. Call from Server Component

```typescript
// app/workouts/page.tsx
import { getRecentWorkouts } from "@/data/workouts";

export default async function WorkoutsPage() {
  const workouts = await getRecentWorkouts(10);

  return (
    <div>
      {workouts.map(workout => (
        <div key={workout.id}>{workout.name}</div>
      ))}
    </div>
  );
}
```

## Common Patterns

### Fetching Related Data

```typescript
import { db } from "@/src/db";
import { workouts, workoutExercises, exercises, sets } from "@/src/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export async function getWorkoutWithExercises(workoutId: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // First verify the workout belongs to the user
  const workout = await db
    .select()
    .from(workouts)
    .where(
      and(
        eq(workouts.id, workoutId),
        eq(workouts.userId, userId) // CRITICAL
      )
    )
    .limit(1);

  if (!workout[0]) return null;

  // Then fetch related data
  const workoutExerciseData = await db
    .select()
    .from(workoutExercises)
    .leftJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
    .leftJoin(sets, eq(workoutExercises.id, sets.workoutExerciseId))
    .where(eq(workoutExercises.workoutId, workoutId));

  return { workout: workout[0], exercises: workoutExerciseData };
}
```

### Creating Data

```typescript
export async function createWorkout(data: {
  name: string;
  date: Date;
  durationMinutes?: number;
  notes?: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  return await db.insert(workouts).values({
    ...data,
    userId, // CRITICAL: Always set userId
  }).returning();
}
```

### Updating Data

```typescript
export async function updateWorkout(
  workoutId: number,
  data: { name?: string; notes?: string }
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // CRITICAL: Update only if workout belongs to user
  return await db
    .update(workouts)
    .set(data)
    .where(
      and(
        eq(workouts.id, workoutId),
        eq(workouts.userId, userId) // CRITICAL
      )
    )
    .returning();
}
```

### Deleting Data

```typescript
export async function deleteWorkout(workoutId: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // CRITICAL: Delete only if workout belongs to user
  return await db
    .delete(workouts)
    .where(
      and(
        eq(workouts.id, workoutId),
        eq(workouts.userId, userId) // CRITICAL
      )
    );
}
```

## Error Handling

Always handle authentication and authorization errors:

```typescript
export async function getUserData() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized: User must be logged in");
  }

  // Continue with query...
}
```

## Summary

### The Golden Rules

1. ✅ **Server Components ONLY** for data fetching
2. ✅ **Helper functions in `/data` directory** for all database queries
3. ✅ **Drizzle ORM ONLY** (no raw SQL)
4. ✅ **ALWAYS filter by `userId`** - users can only access their own data
5. ✅ **Always call `await auth()`** to get the current user
6. ✅ **Throw errors** when `userId` is missing

### Remember

**Data security is paramount. Every single query must verify user ownership. Never trust input. Always filter by userId.**
