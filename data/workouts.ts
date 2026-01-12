import { db } from "@/src/db";
import { workouts, workoutExercises, exercises, sets } from "@/src/db/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { formatDateForDb, parseDateFromDb } from "@/lib/date-utils";

/**
 * Fetches workouts for the currently logged-in user for a specific date
 * with all related exercises and sets.
 */
export async function getWorkoutsByDate(date: Date) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Format date to YYYY-MM-DD string for database query (in local timezone)
  const dateString = formatDateForDb(date);

  // Fetch workouts for the user on the specified date
  const userWorkouts = await db
    .select()
    .from(workouts)
    .where(
      and(
        eq(workouts.userId, userId), // CRITICAL: User can only access their own data
        eq(workouts.date, dateString)
      )
    )
    .orderBy(desc(workouts.createdAt));

  // If no workouts found, return empty array
  if (userWorkouts.length === 0) {
    return [];
  }

  // Fetch all related data for all workouts
  const workoutIds = userWorkouts.map(w => w.id);

  // Get all workout exercises with exercise details and sets for all workouts
  const allWorkoutExerciseData = await Promise.all(
    workoutIds.map(async (workoutId) => {
      const data = await db
        .select({
          workoutExercise: workoutExercises,
          exercise: exercises,
          set: sets,
        })
        .from(workoutExercises)
        .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
        .leftJoin(sets, eq(workoutExercises.id, sets.workoutExerciseId))
        .where(eq(workoutExercises.workoutId, workoutId));

      return { workoutId, data };
    })
  );

  // Group the data by workout
  const workoutsWithExercises = userWorkouts.map(workout => {
    // Get all workout exercises for this workout
    const workoutData = allWorkoutExerciseData.find(
      item => item.workoutId === workout.id
    );
    const workoutExercisesForWorkout = workoutData?.data || [];

    // Group by exercise
    const exercisesMap = new Map();

    workoutExercisesForWorkout.forEach(item => {
      const exerciseId = item.workoutExercise.exerciseId;

      if (!exercisesMap.has(exerciseId)) {
        exercisesMap.set(exerciseId, {
          id: item.exercise.id,
          name: item.exercise.name,
          sets: [],
        });
      }

      // Add set if it exists
      if (item.set) {
        exercisesMap.get(exerciseId).sets.push({
          setNumber: item.set.setNumber,
          weight: item.set.weight ? parseFloat(item.set.weight) : null,
          reps: item.set.reps,
          rpe: item.set.rpe,
          isBodyweight: item.set.isBodyweight,
        });
      }
    });

    // Sort sets by setNumber
    exercisesMap.forEach(exercise => {
      exercise.sets.sort((a: any, b: any) => a.setNumber - b.setNumber);
    });

    return {
      id: workout.id,
      name: workout.name,
      date: new Date(workout.date),
      durationMinutes: workout.durationMinutes,
      notes: workout.notes,
      exercises: Array.from(exercisesMap.values()),
    };
  });

  return workoutsWithExercises;
}

/**
 * Fetches all unique dates that have workouts for the logged-in user
 * within a given month (used for calendar indicators)
 */
export async function getWorkoutDatesForMonth(year: number, month: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Create start and end dates for the month
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0); // Last day of the month

  const startDateString = formatDateForDb(startDate);
  const endDateString = formatDateForDb(endDate);

  // Fetch distinct dates that have workouts
  const result = await db
    .selectDistinct({ date: workouts.date })
    .from(workouts)
    .where(
      and(
        eq(workouts.userId, userId), // CRITICAL: User can only access their own data
        gte(workouts.date, startDateString),
        lte(workouts.date, endDateString)
      )
    );

  // Convert date strings back to Date objects
  return result.map(row => parseDateFromDb(row.date));
}
