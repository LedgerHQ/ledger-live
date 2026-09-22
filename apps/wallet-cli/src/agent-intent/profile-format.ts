/**
 * Strips userinfo (user:pass@) from a URL before it's ever displayed, matching NTTVS-745's
 * acceptance criteria that `profiles list`/`show` never reveal "secrets or URL credentials".
 * Generic URL hygiene, not Agent Intent protocol logic — safe to implement locally.
 */
export function redactUrlCredentials(value: string): string {
  try {
    const url = new URL(value);
    if (!url.username && !url.password) return value;
    url.username = "";
    url.password = "";
    return url.toString();
  } catch {
    return value;
  }
}
