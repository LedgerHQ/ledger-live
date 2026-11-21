import { startSandbox } from "./sandbox";

describe("startSandbox", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("should keep waiting when the sandbox instance is preparing", async () => {
    const monitor = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            instance: "instance-id",
            family: "ethereum",
            network: "sepolia",
            status: "preparing",
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            instance: "instance-id",
            family: "ethereum",
            network: "sepolia",
            status: "up",
            endpoints: { rpc: "http://localhost:8545" },
          }),
        ),
      );
    global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === "string"
          ? new URL(input)
          : input instanceof URL
            ? input
            : new URL(input.url);
      if (init?.method === "GET") return monitor();
      if (url.pathname.endsWith("/down")) return new Response(JSON.stringify({}));
      return new Response(
        JSON.stringify({
          instance: "instance-id",
          family: "ethereum",
          network: "sepolia",
          status: "preparing",
        }),
        { status: 202, headers: { Location: "/monitor", "Retry-After": "0" } },
      );
    });

    const sandbox = await startSandbox(
      { family: "ethereum", network: "sepolia" },
      {},
      { intervalMs: 0 },
    );

    expect(monitor).toHaveBeenCalledTimes(2);
    expect(sandbox.endpoints).toEqual({ rpc: "http://localhost:8545" });
    await sandbox.down();
  });
});
