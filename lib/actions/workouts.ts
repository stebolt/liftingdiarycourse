'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/src/db';
import { workouts } from '@/src/db/schema';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createWorkout(date: string, name?: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  const [newWorkout] = await db
    .insert(workouts)
    .values({
      userId,
      date,
      name: name || 'Untitled Workout',
    })
    .returning();

  revalidatePath('/dashboard');
  redirect(`/workout/${newWorkout.id}/edit`);
}
