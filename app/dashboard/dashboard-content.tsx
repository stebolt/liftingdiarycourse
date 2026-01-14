'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar as CalendarIcon, Dumbbell, Clock, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDateForDb } from '@/lib/date-utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

type Set = {
  setNumber: number;
  weight: number | null;
  reps: number;
  rpe: number | null;
  isBodyweight: boolean;
};

type Exercise = {
  id: number;
  name: string;
  sets: Set[];
};

type Workout = {
  id: number;
  name: string | null;
  date: Date;
  durationMinutes: number | null;
  notes: string | null;
  exercises: Exercise[];
};

type DashboardContentProps = {
  workouts: Workout[];
  selectedDate: Date;
  workoutDates: Date[];
};

export default function DashboardContent({ workouts, selectedDate, workoutDates }: DashboardContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [openWorkoutId, setOpenWorkoutId] = useState<number | null>(null);

  const toggleWorkout = (id: number) => {
    setOpenWorkoutId(openWorkoutId === id ? null : id);
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      const params = new URLSearchParams(searchParams);
      // Use local timezone-aware date formatting
      params.set('date', formatDateForDb(date));
      router.push(`/dashboard?${params.toString()}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl" suppressHydrationWarning>
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Workout Dashboard</h1>

        <div className="flex items-center gap-4">
          {/* Date Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[240px] justify-start">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDate, 'do MMM yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateChange}
                initialFocus
                modifiers={{
                  hasWorkout: workoutDates,
                }}
                modifiersClassNames={{
                  hasWorkout: 'relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full',
                }}
              />
            </PopoverContent>
          </Popover>

          {/* New Workout Button */}
          <Button onClick={() => router.push(`/dashboard/workout/new?date=${formatDateForDb(selectedDate)}`)}>
            <Plus className="h-4 w-4 mr-2" />
            New Workout
          </Button>
        </div>
      </div>

      {/* Workouts List */}
      <div className="space-y-4">
        {workouts.length === 0 ? (
          // Empty State
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Dumbbell className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No workouts yet</h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                Click &quot;New Workout&quot; to create your first workout for
                this date.
              </p>
            </CardContent>
          </Card>
        ) : (
          // Workout Cards
          workouts.map((workout) => {
            const isOpen = openWorkoutId === workout.id;
            const exerciseCount = workout.exercises.length;
            const totalSets = workout.exercises.reduce(
              (sum, ex) => sum + ex.sets.length,
              0
            );

            return (
              <Card key={workout.id}>
                <Collapsible
                  open={isOpen}
                  onOpenChange={() => toggleWorkout(workout.id)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl">
                          {workout.name || 'Untitled Workout'}
                        </CardTitle>
                        <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                          {workout.durationMinutes && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{workout.durationMinutes} min</span>
                            </div>
                          )}
                          <Badge variant="secondary">
                            <Dumbbell className="h-3 w-3 mr-1" />
                            {exerciseCount}{' '}
                            {exerciseCount === 1 ? 'exercise' : 'exercises'}
                          </Badge>
                          <Badge variant="outline">{totalSets} sets</Badge>
                        </div>
                      </div>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm">
                          {isOpen ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </CardHeader>

                  <CollapsibleContent>
                    <CardContent>
                      {workout.notes && (
                        <p className="text-sm text-muted-foreground mb-4">
                          {workout.notes}
                        </p>
                      )}

                      <div className="space-y-4">
                        {workout.exercises.map((exercise) => (
                          <div
                            key={exercise.id}
                            className="border-l-2 border-primary pl-4"
                          >
                            <h4 className="font-semibold">{exercise.name}</h4>
                            <div className="mt-2 space-y-1">
                              {exercise.sets.map((set) => (
                                <div
                                  key={set.setNumber}
                                  className="text-sm flex items-center gap-2"
                                >
                                  <span className="text-muted-foreground">
                                    Set {set.setNumber}:
                                  </span>
                                  {set.isBodyweight ? (
                                    set.weight ? (
                                      <span>
                                        Bodyweight +{set.weight}kg × {set.reps}{' '}
                                        reps
                                      </span>
                                    ) : (
                                      <span>Bodyweight × {set.reps} reps</span>
                                    )
                                  ) : (
                                    <span>
                                      {set.weight}kg × {set.reps} reps
                                    </span>
                                  )}
                                  {set.rpe && (
                                    <Badge
                                      variant="outline"
                                      className="ml-auto"
                                    >
                                      RPE {set.rpe}
                                    </Badge>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
