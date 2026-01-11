import type { Workout, WorkoutExercise, Exercise, Set } from '@/src/db/schema';

export type WorkoutWithDetails = Workout & {
  workoutExercises: (WorkoutExercise & {
    exercise: Exercise;
    sets: Set[];
  })[];
};
