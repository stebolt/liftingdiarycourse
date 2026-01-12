'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DatePicker } from './date-picker';
import { WorkoutList } from './workout-list';
import { Button } from '@/components/ui/button';
import { createWorkout } from '@/lib/actions/workouts';
import type { WorkoutWithDetails } from '@/lib/types/workout';

type Props = {
  initialWorkouts: WorkoutWithDetails[];
  initialDate: string;
  workoutDates: string[];
};

// Helper to format date without timezone conversion
function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper to parse date string as local date
function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function DashboardClient({ initialWorkouts, initialDate, workoutDates }: Props) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const handleDateChange = (date: Date | undefined) => {
    if (!date) return;
    const dateStr = formatDateString(date);
    router.push(`/dashboard?date=${dateStr}`);
  };

  const handleCreateWorkout = async () => {
    setIsPending(true);
    try {
      await createWorkout(initialDate);
    } catch (error) {
      console.error('Failed to create workout:', error);
      setIsPending(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Workout Dashboard</h1>
        <div className="flex items-center gap-4">
          <DatePicker
            date={parseDateString(initialDate)}
            onDateChange={handleDateChange}
            workoutDates={workoutDates}
          />
          <Button onClick={handleCreateWorkout} disabled={isPending}>
            New Workout
          </Button>
        </div>
      </div>

      <WorkoutList workouts={initialWorkouts} />
    </div>
  );
}
