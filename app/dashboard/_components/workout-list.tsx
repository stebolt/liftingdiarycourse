import { WorkoutCard } from './workout-card';
import { EmptyState } from './empty-state';
import type { WorkoutWithDetails } from '@/lib/types/workout';

type Props = {
  workouts: WorkoutWithDetails[];
};

export function WorkoutList({ workouts }: Props) {
  if (workouts.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-4">
      {workouts.map((workout) => (
        <WorkoutCard key={workout.id} workout={workout} />
      ))}
    </div>
  );
}
