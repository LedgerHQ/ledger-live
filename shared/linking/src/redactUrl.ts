export function redactUrl(url: string): string {
  const { origin, protocol } = new URL(url);
  return origin === "null" ? protocol : origin;
}
