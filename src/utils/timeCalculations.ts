export function calculateElapsedTime(startTime: number): number {
  return Math.floor((Date.now() - startTime) / 1000);
}

export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function calculateTimeFee(startTime: number, hourlyRate: number): number {
  const elapsedHours = (Date.now() - startTime) / (1000 * 60 * 60);
  return Math.ceil(elapsedHours * hourlyRate);
}
