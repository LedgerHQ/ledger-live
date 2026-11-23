function refusedTunnelStatus(error: unknown): number | undefined {
  if (!(error instanceof Error) || !("code" in error) || error.code !== "ERR_PROXY_TUNNEL") {
    return undefined;
  }
  return "status" in error && typeof error.status === "number" ? error.status : undefined;
}

// Bun 1.4.4 rejects a fetch whose proxy refuses the tunnel; older Bun returned the proxy's answer.
export function withRefusedTunnelAsResponse(baseFetch: typeof fetch): typeof fetch {
  return Object.assign(
    (input: RequestInfo | URL, init?: RequestInit) =>
      baseFetch(input, init).catch((error: unknown) => {
        const status = refusedTunnelStatus(error);
        if (status === undefined) throw error;
        return new Response(null, { status });
      }),
    baseFetch,
  );
}
