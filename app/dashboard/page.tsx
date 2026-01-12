import { getWorkoutsByDate, getWorkoutDatesForMonth } from '@/data/workouts';
import { parseDateFromDb } from '@/lib/date-utils';
import DashboardContent from './dashboard-content';

type PageProps = {
  searchParams: Promise<{ date?: string }>;
};

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;

  // Parse date from searchParams or use today's date (in local timezone)
  const selectedDate = params.date
    ? parseDateFromDb(params.date)
    : new Date();

  // Fetch workouts for the selected date (SERVER COMPONENT - follows data-fetching.md standards)
  const workouts = await getWorkoutsByDate(selectedDate);

  // Fetch all workout dates for the current month (for calendar indicators)
  const workoutDates = await getWorkoutDatesForMonth(
    selectedDate.getFullYear(),
    selectedDate.getMonth()
  );

  return (
    <DashboardContent
      workouts={workouts}
      selectedDate={selectedDate}
      workoutDates={workoutDates}
    />
  );
}
