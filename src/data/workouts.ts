import { db } from "@/src/db";
import { workouts } from "@/src/db/schema";
import { eq, and, desc } from "drizzle-orm";
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
      date: data.date.toISOString().split("T")[0],
      userId,
    })
    .returning();

  return workout;
}

export async function getRecentWorkouts(limit: number = 10) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const userWorkouts = await db
    .select()
    .from(workouts)
    .where(eq(workouts.userId, userId))
    .orderBy(desc(workouts.date))
    .limit(limit);

  return userWorkouts;
}

export async function getWorkoutById(workoutId: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const [workout] = await db
    .select()
    .from(workouts)
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)))
    .limit(1);

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

  const updateData: {
    name?: string;
    date?: string;
    durationMinutes?: number;
    notes?: string;
  } = {
    name: data.name,
    durationMinutes: data.durationMinutes,
    notes: data.notes,
  };

  if (data.date) {
    updateData.date = data.date.toISOString().split("T")[0];
  }

  const [workout] = await db
    .update(workouts)
    .set(updateData)
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)))
    .returning();

  return workout;
}

export async function deleteWorkout(workoutId: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const [deleted] = await db
    .delete(workouts)
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)))
    .returning();

  return deleted;
}
