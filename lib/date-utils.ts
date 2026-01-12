/**
 * Date utility functions that are safe to use in both client and server components.
 * These functions handle timezone-aware date formatting for local dates.
 */

/**
 * Helper function to format a date as YYYY-MM-DD in local timezone
 */
export function formatDateForDb(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Helper function to parse a YYYY-MM-DD string to a Date in local timezone
 */
export function parseDateFromDb(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}
