"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createWorkout } from "@/src/data/workouts";

const createWorkoutSchema = z.object({
  name: z.string().min(1, "Workout name is required").max(100),
  date: z.string().min(1, "Date is required"),
  durationMinutes: z.number().int().positive().optional(),
  notes: z.string().max(1000).optional(),
});

export async function createWorkoutAction(
  input: z.infer<typeof createWorkoutSchema>
) {
  try {
    const validatedData = createWorkoutSchema.parse(input);

    // Convert date string to Date object
    const workout = await createWorkout({
      name: validatedData.name,
      date: new Date(validatedData.date),
      durationMinutes: validatedData.durationMinutes,
      notes: validatedData.notes,
    });

    revalidatePath("/dashboard");
    return { success: true, data: workout };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "Failed to create workout" };
  }
}
