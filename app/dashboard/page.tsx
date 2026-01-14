import { getWorkoutsByDate, getWorkoutDatesForMonth } from '@/data/workouts';
import { parseDateFromDb } from '@/lib/date-utils';
import { currentUser } from '@clerk/nextjs/server';
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

  // Fetch user's first name from Clerk (follows auth.md standards)
  const user = await currentUser();
  const userFirstName = user?.firstName || 'Your';

  return (
    <DashboardContent
      workouts={workouts}
      selectedDate={selectedDate}
      workoutDates={workoutDates}
      userFirstName={userFirstName}
    />
  );
}
