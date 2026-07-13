export function getContactInitial(name: string): string {
  return (Array.from(name)[0] ?? "").toUpperCase();
}
