'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Clock, Dumbbell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { WorkoutWithDetails } from '@/lib/types/workout';

type Props = {
  workout: WorkoutWithDetails;
};

export function WorkoutCard({ workout }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const exerciseCount = workout.workoutExercises.length;
  const totalSets = workout.workoutExercises.reduce(
    (sum, we) => sum + we.sets.length,
    0
  );

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
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
              {workout.workoutExercises.map((we) => (
                <div key={we.id} className="border-l-2 border-primary pl-4">
                  <h4 className="font-semibold">{we.exercise.name}</h4>
                  {we.notes && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {we.notes}
                    </p>
                  )}
                  <div className="mt-2 space-y-1">
                    {we.sets.map((set) => (
                      <div
                        key={set.id}
                        className="text-sm flex items-center gap-2"
                      >
                        <span className="text-muted-foreground">
                          Set {set.setNumber}:
                        </span>
                        {set.isBodyweight ? (
                          set.weight ? (
                            <span>
                              Bodyweight +{set.weight}kg × {set.reps} reps
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
                          <Badge variant="outline" className="ml-auto">
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
}
