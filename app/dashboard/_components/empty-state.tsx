import { Dumbbell } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function EmptyState() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Dumbbell className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No workouts yet</h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          Click &quot;New Workout&quot; to create your first workout for this
          date.
        </p>
      </CardContent>
    </Card>
  );
}
