type RefusedTunnel = { message: string; status: number; statusText: string };

function isResponseStatus(status: number): boolean {
  return status >= 200 && status <= 599;
}

function refusedTunnel(error: unknown): RefusedTunnel | undefined {
  if (!(error instanceof Error) || !("code" in error) || error.code !== "ERR_PROXY_TUNNEL") {
    return undefined;
  }
  if (!("status" in error) || typeof error.status !== "number" || !isResponseStatus(error.status)) {
    return undefined;
  }
  const statusText =
    "statusText" in error && typeof error.statusText === "string" ? error.statusText : "";
  return { message: error.message, status: error.status, statusText };
}

// Bun 1.4.4 rejects a fetch whose proxy refuses the tunnel; older Bun returned the proxy's answer.
export function withRefusedTunnelAsResponse(baseFetch: typeof fetch): typeof fetch {
  return Object.assign(
    (input: RequestInfo | URL, init?: RequestInit) =>
      baseFetch(input, init).catch((error: unknown) => {
        const refused = refusedTunnel(error);
        if (refused === undefined) throw error;
        const { message, status, statusText } = refused;
        return new Response(message, { status, statusText });
      }),
    baseFetch,
  );
}
