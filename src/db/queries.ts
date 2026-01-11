import { db } from './index';
import { workouts, workoutExercises, sets } from './schema';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import type { WorkoutWithDetails } from '@/lib/types/workout';

export async function getWorkoutsByUserAndDate(
  userId: string,
  date: string
): Promise<WorkoutWithDetails[]> {
  const result = await db.query.workouts.findMany({
    where: and(eq(workouts.userId, userId), eq(workouts.date, date)),
    orderBy: [desc(workouts.createdAt)],
    with: {
      workoutExercises: {
        orderBy: [workoutExercises.order],
        with: {
          exercise: true,
          sets: {
            orderBy: [sets.setNumber],
          },
        },
      },
    },
  });

  return result;
}

export async function getWorkoutDatesForUser(
  userId: string,
  startDate: string,
  endDate: string
): Promise<string[]> {
  const result = await db
    .selectDistinct({ date: workouts.date })
    .from(workouts)
    .where(
      and(
        eq(workouts.userId, userId),
        gte(workouts.date, startDate),
        lte(workouts.date, endDate)
      )
    )
    .orderBy(workouts.date);

  return result.map((row) => row.date);
}
