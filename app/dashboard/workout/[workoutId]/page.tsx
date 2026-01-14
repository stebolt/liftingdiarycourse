import { notFound } from "next/navigation";
import { getWorkoutById } from "@/src/data/workouts";
import { EditWorkoutForm } from "./_components/edit-workout-form";

export default async function EditWorkoutPage({
  params,
}: {
  params: Promise<{ workoutId: string }>;
}) {
  const { workoutId } = await params;
  const workout = await getWorkoutById(Number(workoutId));

  if (!workout) {
    notFound();
  }

  return (
    <div className="container max-w-2xl py-8">
      <EditWorkoutForm workout={workout} />
    </div>
  );
}
