import {
  pgTable,
  serial,
  text,
  integer,
  numeric,
  date,
  timestamp,
  boolean,
  check,
  unique,
  index,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// ============================================
// EXERCISES TABLE
// ============================================
export const exercises = pgTable(
  'exercises',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    nameIdx: index('exercises_name_idx').on(table.name),
  })
);

// ============================================
// WORKOUTS TABLE
// ============================================
export const workouts = pgTable(
  'workouts',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id').notNull(),
    date: date('date').notNull(),
    name: text('name'),
    durationMinutes: integer('duration_minutes'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdIdx: index('workouts_user_id_idx').on(table.userId),
    userIdDateIdx: index('workouts_user_id_date_idx').on(
      table.userId,
      table.date
    ),
    dateIdx: index('workouts_date_idx').on(table.date),
  })
);

// ============================================
// WORKOUT_EXERCISES TABLE (Junction)
// ============================================
export const workoutExercises = pgTable(
  'workout_exercises',
  {
    id: serial('id').primaryKey(),
    workoutId: integer('workout_id')
      .notNull()
      .references(() => workouts.id, { onDelete: 'cascade' }),
    exerciseId: integer('exercise_id')
      .notNull()
      .references(() => exercises.id, { onDelete: 'restrict' }),
    order: integer('order').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    workoutIdIdx: index('workout_exercises_workout_id_idx').on(table.workoutId),
    workoutIdOrderIdx: index('workout_exercises_workout_id_order_idx').on(
      table.workoutId,
      table.order
    ),
    uniqueWorkoutExercise: unique('workout_exercises_workout_id_exercise_id_unique').on(
      table.workoutId,
      table.exerciseId
    ),
  })
);

// ============================================
// SETS TABLE
// ============================================
export const sets = pgTable(
  'sets',
  {
    id: serial('id').primaryKey(),
    workoutExerciseId: integer('workout_exercise_id')
      .notNull()
      .references(() => workoutExercises.id, { onDelete: 'cascade' }),
    setNumber: integer('set_number').notNull(),
    isBodyweight: boolean('is_bodyweight').notNull().default(false),
    weight: numeric('weight', { precision: 10, scale: 2 }),
    reps: integer('reps').notNull(),
    rpe: integer('rpe'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    workoutExerciseIdIdx: index('sets_workout_exercise_id_idx').on(
      table.workoutExerciseId
    ),
    workoutExerciseIdSetNumberIdx: index('sets_workout_exercise_id_set_number_idx').on(
      table.workoutExerciseId,
      table.setNumber
    ),
    rpeCheck: check(
      'sets_rpe_check',
      sql`${table.rpe} IS NULL OR (${table.rpe} >= 1 AND ${table.rpe} <= 10)`
    ),
    repsCheck: check('sets_reps_check', sql`${table.reps} > 0`),
    weightCheck: check(
      'sets_weight_check',
      sql`${table.weight} IS NULL OR ${table.weight} >= 0`
    ),
    setNumberCheck: check('sets_set_number_check', sql`${table.setNumber} > 0`),
  })
);

// ============================================
// RELATIONS (for Drizzle Relational Queries)
// ============================================
export const exercisesRelations = relations(exercises, ({ many }) => ({
  workoutExercises: many(workoutExercises),
}));

export const workoutsRelations = relations(workouts, ({ many }) => ({
  workoutExercises: many(workoutExercises),
}));

export const workoutExercisesRelations = relations(
  workoutExercises,
  ({ one, many }) => ({
    workout: one(workouts, {
      fields: [workoutExercises.workoutId],
      references: [workouts.id],
    }),
    exercise: one(exercises, {
      fields: [workoutExercises.exerciseId],
      references: [exercises.id],
    }),
    sets: many(sets),
  })
);

export const setsRelations = relations(sets, ({ one }) => ({
  workoutExercise: one(workoutExercises, {
    fields: [sets.workoutExerciseId],
    references: [workoutExercises.id],
  }),
}));

// ============================================
// TYPE EXPORTS (for TypeScript)
// ============================================
export type Exercise = typeof exercises.$inferSelect;
export type NewExercise = typeof exercises.$inferInsert;

export type Workout = typeof workouts.$inferSelect;
export type NewWorkout = typeof workouts.$inferInsert;

export type WorkoutExercise = typeof workoutExercises.$inferSelect;
export type NewWorkoutExercise = typeof workoutExercises.$inferInsert;

export type Set = typeof sets.$inferSelect;
export type NewSet = typeof sets.$inferInsert;
