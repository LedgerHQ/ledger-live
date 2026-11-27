import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { createServer } from "node:net";
import { withRefusedTunnelAsResponse } from "./refused-tunnel";

const proxy = createServer(socket => {
  socket.once("data", () => {
    socket.end("HTTP/1.1 403 Forbidden\r\nContent-Length: 0\r\nConnection: close\r\n\r\n");
  });
});
let proxyUrl: string;

beforeAll(async () => {
  await new Promise<void>(resolve => proxy.listen(0, "127.0.0.1", resolve));
  const address = proxy.address();
  if (address === null || typeof address === "string") throw new Error("proxy has no TCP port");
  proxyUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(() => {
  proxy.close();
});

describe("withRefusedTunnelAsResponse", () => {
  it("answers 403 when a proxy refuses the tunnel to an https host", async () => {
    const proxiedFetch = withRefusedTunnelAsResponse(fetch);

    const response = await proxiedFetch("https://global.api.prd.ledger.com/v1/tokens", {
      proxy: proxyUrl,
    });

    expect(response.status).toBe(403);
    expect(response.statusText).toBe("Forbidden");
    expect(await response.text()).toContain("Proxy refused");
  });

  it.each([
    Object.assign(new Error("Unable to connect"), { code: "ECONNREFUSED" }),
    Object.assign(new Error("Proxy refused to open a tunnel: 600 X"), {
      code: "ERR_PROXY_TUNNEL",
      status: 600,
    }),
    Object.assign(new Error("Proxy refused to open a tunnel: 101 Switching Protocols"), {
      code: "ERR_PROXY_TUNNEL",
      status: 101,
    }),
  ])("rethrows a failure that is no HTTP answer unchanged (%#)", async failure => {
    const failingFetch = Object.assign(() => Promise.reject(failure), fetch);

    await expect(withRefusedTunnelAsResponse(failingFetch)("https://x.ledger.com")).rejects.toBe(
      failure,
    );
  });
});
