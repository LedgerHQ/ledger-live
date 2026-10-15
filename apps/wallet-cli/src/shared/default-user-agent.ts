/** Wraps `fetch` so requests without a `User-Agent` send `userAgent` instead of the runtime's. */
export function withDefaultUserAgent(baseFetch: typeof fetch, userAgent: string): typeof fetch {
  return Object.assign((input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(
      init?.headers ?? (input instanceof Request ? input.headers : undefined),
    );
    if (headers.has("User-Agent")) return baseFetch(input, init);
    headers.set("User-Agent", userAgent);
    return baseFetch(input, { ...init, headers });
  }, baseFetch);
}
