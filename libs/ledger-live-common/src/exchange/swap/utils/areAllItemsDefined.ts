export function areAllItemsDefined(...items: unknown[]): boolean {
  return !items.some(item => item === undefined || item === null);
}
