'use client';

import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

type Props = {
  date: Date;
  onDateChange: (date: Date | undefined) => void;
  workoutDates: string[];
};

export function DatePicker({ date, onDateChange, workoutDates }: Props) {
  // Convert workout date strings to Date objects for highlighting
  const workoutDateObjects = workoutDates.map((dateStr) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-[240px] justify-start">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {format(date, 'do MMM yyyy')}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onDateChange}
          initialFocus
          modifiers={{
            hasWorkout: workoutDateObjects,
          }}
          modifiersClassNames={{
            hasWorkout: 'font-bold text-primary underline',
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
