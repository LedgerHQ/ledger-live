export function parseDateOrOffset(input: string): Date | undefined {
  const trimmed = input.trim();
  if (trimmed === "") return undefined;

  if (/^\d+$/.test(trimmed)) {
    const offsetDays = parseInt(trimmed, 10);
    const date = new Date();
    date.setDate(date.getDate() - offsetDays);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}
