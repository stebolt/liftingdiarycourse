"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateWorkoutAction, deleteWorkoutAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Workout } from "@/src/db/schema";

interface EditWorkoutFormProps {
  workout: Workout;
}

export function EditWorkoutForm({ workout }: EditWorkoutFormProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Format date for input (YYYY-MM-DD)
  const formattedDate = workout.date;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      id: workout.id,
      name: formData.get("name") as string,
      date: formData.get("date") as string,
      durationMinutes: formData.get("duration")
        ? Number(formData.get("duration"))
        : undefined,
      notes: (formData.get("notes") as string) || undefined,
    };

    const result = await updateWorkoutAction(data);

    if (result.success) {
      router.push("/dashboard");
    } else {
      setError(result.error || "Failed to update workout");
      setIsPending(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    setError(null);

    const result = await deleteWorkoutAction({ id: workout.id });

    if (result.success) {
      router.push("/dashboard");
    } else {
      setError(result.error || "Failed to delete workout");
      setIsDeleting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Workout</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Workout Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g., Upper Body Day"
              defaultValue={workout.name || ""}
              required
              disabled={isPending || isDeleting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              name="date"
              type="date"
              defaultValue={formattedDate}
              required
              disabled={isPending || isDeleting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              name="duration"
              type="number"
              min="1"
              placeholder="e.g., 60"
              defaultValue={workout.durationMinutes || ""}
              disabled={isPending || isDeleting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Add any notes about this workout..."
              rows={4}
              defaultValue={workout.notes || ""}
              disabled={isPending || isDeleting}
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={isPending || isDeleting}
              className="flex-1"
            >
              {isPending ? "Updating..." : "Update Workout"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isPending || isDeleting}
              onClick={() => router.push("/dashboard")}
            >
              Cancel
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={isPending || isDeleting}
                >
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this workout. This action
                    cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
