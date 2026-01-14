"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { updateWorkout, deleteWorkout } from "@/src/data/workouts";

const updateWorkoutSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1, "Workout name is required").max(100),
  date: z.string().min(1, "Date is required"),
  durationMinutes: z.number().int().positive().optional(),
  notes: z.string().max(1000).optional(),
});

const deleteWorkoutSchema = z.object({
  id: z.number().int().positive(),
});

export async function updateWorkoutAction(
  input: z.infer<typeof updateWorkoutSchema>
) {
  try {
    const validatedData = updateWorkoutSchema.parse(input);

    const { id, ...data } = validatedData;

    const workout = await updateWorkout(id, {
      name: data.name,
      date: new Date(data.date),
      durationMinutes: data.durationMinutes,
      notes: data.notes,
    });

    if (!workout) {
      return { success: false, error: "Workout not found or unauthorized" };
    }

    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/workout/${id}`);
    return { success: true, data: workout };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "Failed to update workout" };
  }
}

export async function deleteWorkoutAction(
  input: z.infer<typeof deleteWorkoutSchema>
) {
  try {
    const validatedData = deleteWorkoutSchema.parse(input);

    const deleted = await deleteWorkout(validatedData.id);

    if (!deleted) {
      return { success: false, error: "Workout not found or unauthorized" };
    }

    revalidatePath("/dashboard");
    return { success: true, data: deleted };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "Failed to delete workout" };
  }
}
