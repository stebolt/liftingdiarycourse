# Data Mutations Standards

## ⚠️ CRITICAL: Server Actions with Zod Validation ONLY

**ALL data mutations in this application MUST be done exclusively via Server Actions with Zod validation.**

### ✅ ALLOWED
- **Server Actions** in colocated `actions.ts` files with Zod validation
- **Helper functions** in `src/data` directory that wrap Drizzle ORM calls

### ❌ FORBIDDEN
- ❌ Route handlers (API routes) for mutations
- ❌ Client-side mutations
- ❌ Direct database calls from server actions
- ❌ Server actions without Zod validation
- ❌ Server actions with `FormData` parameter types
- ❌ Raw SQL for mutations
- ❌ Using `redirect()` within server actions (redirect client-side after action resolves)
- ❌ Any other mutation pattern

## Architecture Overview

Data mutations follow a strict 3-layer architecture:

```
Server Action (actions.ts)
    ↓ validates input with Zod
    ↓ passes typed data
Helper Function (src/data/*.ts)
    ↓ wraps database logic
    ↓ uses Drizzle ORM
Database
```

### Why This Architecture?

1. **Validation**: Zod ensures type-safe, runtime-validated inputs
2. **Separation of Concerns**: Business logic separated from validation
3. **Reusability**: Helper functions can be reused across multiple actions
4. **Security**: Input validation prevents injection attacks
5. **Type Safety**: End-to-end TypeScript type safety
6. **Testability**: Each layer can be tested independently

## Layer 1: Helper Functions in `src/data`

**ALL database mutations MUST be placed in helper functions within the `src/data` directory.**

### ✅ CORRECT: Helper Function in `src/data/workouts.ts`

```typescript
import { db } from "@/src/db";
import { workouts } from "@/src/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export async function createWorkout(data: {
  name: string;
  date: Date;
  durationMinutes?: number;
  notes?: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const [workout] = await db
    .insert(workouts)
    .values({
      ...data,
      userId, // CRITICAL: Always set userId
    })
    .returning();

  return workout;
}

export async function updateWorkout(
  workoutId: number,
  data: {
    name?: string;
    date?: Date;
    durationMinutes?: number;
    notes?: string;
  }
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // CRITICAL: Update only if workout belongs to user
  const [updated] = await db
    .update(workouts)
    .set(data)
    .where(
      and(
        eq(workouts.id, workoutId),
        eq(workouts.userId, userId)
      )
    )
    .returning();

  return updated;
}

export async function deleteWorkout(workoutId: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // CRITICAL: Delete only if workout belongs to user
  const [deleted] = await db
    .delete(workouts)
    .where(
      and(
        eq(workouts.id, workoutId),
        eq(workouts.userId, userId)
      )
    )
    .returning();

  return deleted;
}
```

### ⚠️ CRITICAL: Use Drizzle ORM ONLY

**NEVER use raw SQL for mutations. ALWAYS use Drizzle ORM.**

```typescript
// ❌ FORBIDDEN: Raw SQL
await db.execute(sql`INSERT INTO workouts (name, userId) VALUES (${name}, ${userId})`);

// ✅ CORRECT: Drizzle ORM
await db.insert(workouts).values({ name, userId });
```

### 🔒 Security: User Data Isolation

**THIS IS CRITICALLY IMPORTANT: Users MUST ONLY mutate their own data.**

Every mutation helper MUST:
- Call `await auth()` to get `userId`
- Check if `userId` exists (throw error if not)
- Filter ALL mutations by `userId` (for updates/deletes)
- Set `userId` on ALL inserts

## Layer 2: Server Actions in `actions.ts`

**ALL mutations MUST be triggered via Server Actions.**

Server actions MUST be:
1. Placed in colocated `actions.ts` files
2. Marked with `"use server"` directive
3. Have typed parameters (NOT `FormData`)
4. Validate ALL inputs with Zod
5. Call helper functions from `src/data`

### File Structure

```
app/
├── workouts/
│   ├── actions.ts           # Server actions for workout mutations
│   └── page.tsx
├── dashboard/
│   ├── actions.ts           # Server actions for dashboard mutations
│   └── page.tsx
└── ...

src/
└── data/
    ├── workouts.ts          # Database helpers for workouts
    ├── exercises.ts         # Database helpers for exercises
    └── sets.ts              # Database helpers for sets
```

### ✅ CORRECT: Server Action with Zod Validation

```typescript
// app/workouts/actions.ts
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createWorkout, updateWorkout, deleteWorkout } from "@/src/data/workouts";

// Define Zod schemas for validation
const createWorkoutSchema = z.object({
  name: z.string().min(1, "Workout name is required").max(100),
  date: z.date(),
  durationMinutes: z.number().int().positive().optional(),
  notes: z.string().max(1000).optional(),
});

const updateWorkoutSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(100).optional(),
  date: z.date().optional(),
  durationMinutes: z.number().int().positive().optional(),
  notes: z.string().max(1000).optional(),
});

const deleteWorkoutSchema = z.object({
  id: z.number().int().positive(),
});

// Server action with typed parameters and Zod validation
export async function createWorkoutAction(input: z.infer<typeof createWorkoutSchema>) {
  // CRITICAL: Validate input with Zod
  const validatedData = createWorkoutSchema.parse(input);

  // Call helper function
  const workout = await createWorkout(validatedData);

  // Revalidate cache
  revalidatePath("/workouts");

  // Return success with created data
  return { success: true, data: workout };
}

export async function updateWorkoutAction(input: z.infer<typeof updateWorkoutSchema>) {
  // CRITICAL: Validate input with Zod
  const validatedData = updateWorkoutSchema.parse(input);

  const { id, ...data } = validatedData;

  // Call helper function
  const workout = await updateWorkout(id, data);

  if (!workout) {
    return { success: false, error: "Workout not found or unauthorized" };
  }

  // Revalidate cache
  revalidatePath("/workouts");
  revalidatePath(`/workouts/${id}`);

  return { success: true, data: workout };
}

export async function deleteWorkoutAction(input: z.infer<typeof deleteWorkoutSchema>) {
  // CRITICAL: Validate input with Zod
  const validatedData = deleteWorkoutSchema.parse(input);

  // Call helper function
  const deleted = await deleteWorkout(validatedData.id);

  if (!deleted) {
    return { success: false, error: "Workout not found or unauthorized" };
  }

  // Revalidate cache
  revalidatePath("/workouts");

  // Optionally redirect
  redirect("/workouts");
}
```

### ❌ INCORRECT: Server Action Without Zod Validation

```typescript
// ❌ FORBIDDEN: No Zod validation
"use server";

export async function createWorkoutAction(name: string, date: Date) {
  // MISSING: Zod validation
  // SECURITY RISK: No input validation
  const workout = await createWorkout({ name, date });
  return workout;
}
```

### ❌ INCORRECT: Server Action with FormData

```typescript
// ❌ FORBIDDEN: FormData parameter type
"use server";

export async function createWorkoutAction(formData: FormData) {
  // WRONG: Should use typed parameters, not FormData
  const name = formData.get("name") as string;
  const workout = await createWorkout({ name, date: new Date() });
  return workout;
}
```

### ❌ INCORRECT: Direct Database Call from Server Action

```typescript
// ❌ FORBIDDEN: Direct database call
"use server";

import { db } from "@/src/db";
import { workouts } from "@/src/db/schema";

export async function createWorkoutAction(input: unknown) {
  const validatedData = createWorkoutSchema.parse(input);

  // WRONG: Should call helper function, not database directly
  const workout = await db.insert(workouts).values(validatedData).returning();

  return workout;
}
```

## Zod Validation Requirements

### ALL Server Actions MUST Validate with Zod

Every server action must:
1. Define a Zod schema for input validation
2. Call `schema.parse(input)` or `schema.safeParse(input)` before processing
3. Handle validation errors appropriately

### Zod Schema Patterns

```typescript
import { z } from "zod";

// Basic string validation
const nameSchema = z.string().min(1, "Name is required").max(100);

// Number validation
const durationSchema = z.number().int().positive().optional();

// Date validation
const dateSchema = z.date();

// Email validation
const emailSchema = z.string().email("Invalid email address");

// Enum validation
const statusSchema = z.enum(["pending", "completed", "cancelled"]);

// Array validation
const exercisesSchema = z.array(z.object({
  exerciseId: z.number().int().positive(),
  sets: z.number().int().positive(),
}));

// Nested object validation
const workoutSchema = z.object({
  name: z.string().min(1).max(100),
  date: z.date(),
  exercises: z.array(z.object({
    exerciseId: z.number().int().positive(),
    sets: z.number().int().positive(),
    reps: z.number().int().positive(),
  })),
});

// Optional fields
const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  notes: z.string().max(1000).optional(),
});
```

### Error Handling with Zod

```typescript
"use server";

import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
});

// Option 1: Use parse() - throws on validation error
export async function actionWithParse(input: unknown) {
  try {
    const validatedData = schema.parse(input);
    // Continue with validated data
    const result = await createWorkout(validatedData);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: "An unexpected error occurred" };
  }
}

// Option 2: Use safeParse() - returns result object
export async function actionWithSafeParse(input: unknown) {
  const result = schema.safeParse(input);

  if (!result.success) {
    return {
      success: false,
      error: result.error.errors[0].message,
      errors: result.error.flatten(),
    };
  }

  const workout = await createWorkout(result.data);
  return { success: true, data: workout };
}
```

## Calling Server Actions from Components

### Client Component Usage

```typescript
// app/workouts/_components/create-workout-form.tsx
"use client";

import { useState } from "react";
import { createWorkoutAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CreateWorkoutForm() {
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      date: new Date(formData.get("date") as string),
      durationMinutes: Number(formData.get("duration")) || undefined,
      notes: formData.get("notes") as string || undefined,
    };

    const result = await createWorkoutAction(data);

    if (result.success) {
      // Handle success
      alert("Workout created!");
    } else {
      // Handle error
      alert(result.error);
    }

    setIsPending(false);
  }

  return (
    <form onSubmit={handleSubmit}>
      <Input name="name" placeholder="Workout name" required />
      <Input name="date" type="date" required />
      <Input name="duration" type="number" placeholder="Duration (minutes)" />
      <Input name="notes" placeholder="Notes" />
      <Button type="submit" disabled={isPending}>
        {isPending ? "Creating..." : "Create Workout"}
      </Button>
    </form>
  );
}
```

### Using with React 19 useActionState

```typescript
"use client";

import { useActionState } from "react";
import { createWorkoutAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CreateWorkoutForm() {
  const [state, formAction, isPending] = useActionState(
    createWorkoutAction,
    { success: false }
  );

  return (
    <form action={formAction}>
      {state.error && (
        <div className="text-destructive">{state.error}</div>
      )}
      {state.success && (
        <div className="text-green-600">Workout created!</div>
      )}
      <Input name="name" placeholder="Workout name" required />
      <Input name="date" type="date" required />
      <Button type="submit" disabled={isPending}>
        {isPending ? "Creating..." : "Create Workout"}
      </Button>
    </form>
  );
}
```

## Cache Revalidation

After mutations, ALWAYS revalidate affected paths:

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { revalidateTag } from "next/cache";

export async function createWorkoutAction(input: unknown) {
  const validatedData = createWorkoutSchema.parse(input);
  const workout = await createWorkout(validatedData);

  // Revalidate specific path
  revalidatePath("/workouts");

  // Revalidate nested paths
  revalidatePath("/dashboard");

  // Revalidate with type
  revalidatePath("/workouts", "page");
  revalidatePath("/workouts", "layout");

  // Revalidate by tag (if using fetch with tags)
  revalidateTag("workouts");

  return { success: true, data: workout };
}
```

## Navigation After Mutations

**CRITICAL: DO NOT use `redirect()` inside server actions.**

The `redirect()` function from `next/navigation` throws an error internally to perform the redirect, which interferes with proper error handling in server actions. Instead, handle navigation client-side after the server action resolves.

### ❌ INCORRECT: Using redirect() in Server Action

```typescript
"use server";

import { redirect } from "next/navigation";

export async function createWorkoutAction(input: unknown) {
  try {
    const validatedData = createWorkoutSchema.parse(input);
    const workout = await createWorkout(validatedData);
    revalidatePath("/dashboard");
    redirect("/dashboard"); // ❌ WRONG: This throws internally and breaks error handling
  } catch (error) {
    // This catch block won't work properly because redirect() throws
    return { success: false, error: "Failed to create workout" };
  }
}
```

### ✅ CORRECT: Client-Side Navigation After Server Action

```typescript
// Server Action - NO redirect()
"use server";

export async function createWorkoutAction(input: unknown) {
  try {
    const validatedData = createWorkoutSchema.parse(input);
    const workout = await createWorkout(validatedData);
    revalidatePath("/dashboard");
    return { success: true, data: workout }; // ✅ Return success, let client handle navigation
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: "Failed to create workout" };
  }
}
```

```typescript
// Client Component - Handle navigation
"use client";

import { useRouter } from "next/navigation";
import { createWorkoutAction } from "../actions";

export function CreateWorkoutForm() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsPending(true);

    const result = await createWorkoutAction(data);

    if (result.success) {
      router.push("/dashboard"); // ✅ Navigate client-side after success
    } else {
      setError(result.error);
      setIsPending(false);
    }
  }

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Why This Matters

1. **Error Handling**: `redirect()` throws internally, which breaks try/catch blocks
2. **Type Safety**: Server actions should return consistent response objects
3. **Testability**: Actions that return values are easier to test than those that redirect
4. **Flexibility**: Client-side navigation allows for custom loading states, animations, etc.

## Complete Example: Workout Mutations

### `src/data/workouts.ts` - Database Helpers

```typescript
import { db } from "@/src/db";
import { workouts, workoutExercises, sets } from "@/src/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export async function createWorkout(data: {
  name: string;
  date: Date;
  durationMinutes?: number;
  notes?: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const [workout] = await db
    .insert(workouts)
    .values({ ...data, userId })
    .returning();

  return workout;
}

export async function updateWorkout(
  workoutId: number,
  data: {
    name?: string;
    date?: Date;
    durationMinutes?: number;
    notes?: string;
  }
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const [workout] = await db
    .update(workouts)
    .set(data)
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)))
    .returning();

  return workout;
}

export async function deleteWorkout(workoutId: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Delete related records first (if not using CASCADE)
  await db
    .delete(sets)
    .where(
      eq(
        sets.workoutExerciseId,
        db.select({ id: workoutExercises.id })
          .from(workoutExercises)
          .where(eq(workoutExercises.workoutId, workoutId))
      )
    );

  await db
    .delete(workoutExercises)
    .where(eq(workoutExercises.workoutId, workoutId));

  const [deleted] = await db
    .delete(workouts)
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)))
    .returning();

  return deleted;
}
```

### `app/workouts/actions.ts` - Server Actions

```typescript
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createWorkout,
  updateWorkout,
  deleteWorkout,
} from "@/src/data/workouts";

const createWorkoutSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  date: z.date(),
  durationMinutes: z.number().int().positive().optional(),
  notes: z.string().max(1000).optional(),
});

const updateWorkoutSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(100).optional(),
  date: z.date().optional(),
  durationMinutes: z.number().int().positive().optional(),
  notes: z.string().max(1000).optional(),
});

const deleteWorkoutSchema = z.object({
  id: z.number().int().positive(),
});

export async function createWorkoutAction(input: z.infer<typeof createWorkoutSchema>) {
  try {
    const validatedData = createWorkoutSchema.parse(input);
    const workout = await createWorkout(validatedData);
    revalidatePath("/workouts");
    revalidatePath("/dashboard");
    return { success: true, data: workout };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: "Failed to create workout" };
  }
}

export async function updateWorkoutAction(input: z.infer<typeof updateWorkoutSchema>) {
  try {
    const validatedData = updateWorkoutSchema.parse(input);
    const { id, ...data } = validatedData;
    const workout = await updateWorkout(id, data);

    if (!workout) {
      return { success: false, error: "Workout not found" };
    }

    revalidatePath("/workouts");
    revalidatePath(`/workouts/${id}`);
    revalidatePath("/dashboard");
    return { success: true, data: workout };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: "Failed to update workout" };
  }
}

export async function deleteWorkoutAction(input: z.infer<typeof deleteWorkoutSchema>) {
  try {
    const validatedData = deleteWorkoutSchema.parse(input);
    const deleted = await deleteWorkout(validatedData.id);

    if (!deleted) {
      return { success: false, error: "Workout not found" };
    }

    revalidatePath("/workouts");
    revalidatePath("/dashboard");
    redirect("/workouts");
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: "Failed to delete workout" };
  }
}
```

## Security Checklist

Before writing any mutation function, verify:

- [ ] Helper function is in `src/data` directory
- [ ] Uses Drizzle ORM (NO raw SQL)
- [ ] Calls `await auth()` to get `userId`
- [ ] Checks if `userId` exists (throws error if not)
- [ ] Filters ALL mutations by `userId`
- [ ] Server action is in colocated `actions.ts` file
- [ ] Server action has `"use server"` directive
- [ ] Server action parameters are typed (NOT FormData)
- [ ] Server action validates ALL inputs with Zod
- [ ] Server action calls helper function (not database directly)
- [ ] Revalidates affected paths after mutation
- [ ] Returns success/error response object
- [ ] Handles errors appropriately

## Common Patterns

### Optimistic UI Updates

```typescript
"use client";

import { useOptimistic } from "react";
import { deleteWorkoutAction } from "../actions";

export function WorkoutList({ workouts }) {
  const [optimisticWorkouts, setOptimisticWorkouts] = useOptimistic(workouts);

  async function handleDelete(id: number) {
    // Optimistically remove from UI
    setOptimisticWorkouts((prev) => prev.filter((w) => w.id !== id));

    // Perform server action
    await deleteWorkoutAction({ id });
  }

  return (
    <div>
      {optimisticWorkouts.map((workout) => (
        <div key={workout.id}>
          {workout.name}
          <button onClick={() => handleDelete(workout.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
```

### Batch Mutations

```typescript
// src/data/workouts.ts
export async function createWorkoutWithExercises(data: {
  workout: { name: string; date: Date };
  exercises: Array<{ exerciseId: number; order: number }>;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  return await db.transaction(async (tx) => {
    // Insert workout
    const [workout] = await tx
      .insert(workouts)
      .values({ ...data.workout, userId })
      .returning();

    // Insert workout exercises
    const workoutExerciseData = data.exercises.map((ex) => ({
      workoutId: workout.id,
      exerciseId: ex.exerciseId,
      order: ex.order,
    }));

    await tx.insert(workoutExercises).values(workoutExerciseData);

    return workout;
  });
}
```

### Conditional Mutations

```typescript
export async function toggleWorkoutCompletion(workoutId: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // First, get current state
  const [workout] = await db
    .select()
    .from(workouts)
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)))
    .limit(1);

  if (!workout) throw new Error("Workout not found");

  // Update with opposite state
  const [updated] = await db
    .update(workouts)
    .set({ completed: !workout.completed })
    .where(eq(workouts.id, workoutId))
    .returning();

  return updated;
}
```

## Testing Server Actions

```typescript
// __tests__/actions.test.ts
import { describe, it, expect, vi } from "vitest";
import { createWorkoutAction } from "@/app/workouts/actions";
import * as workoutData from "@/src/data/workouts";

// Mock the helper function
vi.mock("@/src/data/workouts");

describe("createWorkoutAction", () => {
  it("should validate input with Zod", async () => {
    const invalidInput = { name: "", date: "invalid" };
    const result = await createWorkoutAction(invalidInput);

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("should call helper function with validated data", async () => {
    const mockCreateWorkout = vi.spyOn(workoutData, "createWorkout");
    mockCreateWorkout.mockResolvedValue({ id: 1, name: "Test", date: new Date() });

    const validInput = { name: "Test Workout", date: new Date() };
    const result = await createWorkoutAction(validInput);

    expect(result.success).toBe(true);
    expect(mockCreateWorkout).toHaveBeenCalledWith(validInput);
  });
});
```

## Summary

### The Golden Rules

1. ✅ **Server Actions in `actions.ts`** - ALL mutations via server actions
2. ✅ **Helper functions in `src/data`** - Database logic separated
3. ✅ **Zod validation ALWAYS** - Validate all inputs with Zod schemas
4. ✅ **Typed parameters ONLY** - NO FormData parameter types
5. ✅ **Drizzle ORM ONLY** - No raw SQL for mutations
6. ✅ **ALWAYS filter by `userId`** - Users can only mutate their own data
7. ✅ **Revalidate paths** - Clear cache after mutations
8. ✅ **Return response objects** - `{ success: boolean, data?, error? }`

### Quick Reference

#### Directory Structure
```
app/
└── [feature]/
    └── actions.ts          # Server actions with Zod validation

src/
└── data/
    └── [feature].ts        # Database helpers with Drizzle ORM
```

#### Server Action Template
```typescript
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { helperFunction } from "@/src/data/feature";

const schema = z.object({
  field: z.string().min(1),
});

export async function myAction(input: z.infer<typeof schema>) {
  try {
    const validatedData = schema.parse(input);
    const result = await helperFunction(validatedData);
    revalidatePath("/path");
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: "Failed" };
  }
}
```

#### Helper Function Template
```typescript
import { db } from "@/src/db";
import { table } from "@/src/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export async function mutateData(data: DataType) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const [result] = await db
    .insert(table)
    .values({ ...data, userId })
    .returning();

  return result;
}
```

### Remember

**Data security is paramount. Every mutation must validate inputs with Zod, verify user ownership, and use the helper function architecture. Never skip validation. Never trust input. Always filter by userId.**

## Resources

- **Zod Documentation**: https://zod.dev
- **Server Actions**: https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations
- **Drizzle ORM**: https://orm.drizzle.team/docs
- **Next.js Revalidation**: https://nextjs.org/docs/app/building-your-application/caching
