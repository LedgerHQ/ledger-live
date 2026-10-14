/** Wraps `fetch` so requests without a `User-Agent` send `userAgent` instead of the runtime's. */
export function withDefaultUserAgent(baseFetch: typeof fetch, userAgent: string): typeof fetch {
  return Object.assign((input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input, init);
    if (!request.headers.has("User-Agent")) request.headers.set("User-Agent", userAgent);
    return baseFetch(request);
  }, baseFetch);
}
