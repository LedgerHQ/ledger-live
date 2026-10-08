import { afterAll, afterEach, beforeAll, describe, expect, it } from "bun:test";
import http from "node:http";
import https from "node:https";
import { liveCommonAxiosDefaults, redirectHttpTo, runCli } from "./cli-runner";
import { MockServer } from "./mock-server";

type Reply = { status: number; body: string };

function send(start: (onResponse: (res: http.IncomingMessage) => void) => http.ClientRequest) {
  return new Promise<Reply>((resolve, reject) => {
    const req = start(res => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", chunk => {
        body += chunk;
      });
      res.on("end", () => resolve({ status: res.statusCode ?? 0, body }));
    });
    req.on("error", reject);
    req.end();
  });
}

// Only the axios copy that live-common resolves is switched to fetch; the other copies in the
// tree (tronweb, ledger-cal-service) use axios' Node adapter, which goes through http(s).request.
describe("redirectHttpTo", () => {
  // `.invalid` never resolves, so a broken redirect fails fast instead of reaching the network.
  const EXTERNAL_HOST = "api.wallet-cli.invalid";

  const server = new MockServer([
    { method: "GET", match: "/url", response: { via: "url" } },
    { method: "POST", match: "/options", response: { via: "options" } },
    { method: "PUT", match: "/both", response: { via: "url-and-options" } },
    { method: "GET", match: "/local", response: { via: "local" } },
  ]);

  beforeAll(() => server.start());
  afterAll(() => server.stop());
  afterEach(() => redirectHttpTo(null));

  it("redirects an external http.request given a URL", async () => {
    await redirectHttpTo(server.port);

    const reply = await send(cb => http.request(`http://${EXTERNAL_HOST}/url`, cb));

    expect(reply).toEqual({ status: 200, body: JSON.stringify({ via: "url" }) });
  });

  it("redirects an external https.request given options", async () => {
    await redirectHttpTo(server.port);

    const reply = await send(cb =>
      https.request({ hostname: EXTERNAL_HOST, path: "/options", method: "POST" }, cb),
    );

    expect(reply).toEqual({ status: 200, body: JSON.stringify({ via: "options" }) });
  });

  it("keeps the method of an external https.request given a URL and options", async () => {
    await redirectHttpTo(server.port);

    const reply = await send(cb =>
      https.request(`https://${EXTERNAL_HOST}/both`, { method: "PUT" }, cb),
    );

    expect(reply).toEqual({ status: 200, body: JSON.stringify({ via: "url-and-options" }) });
  });

  it("leaves requests to localhost untouched", async () => {
    await redirectHttpTo(1);

    const reply = await send(cb => http.request(`http://localhost:${server.port}/local`, cb));

    expect(reply).toEqual({ status: 200, body: JSON.stringify({ via: "local" }) });
  });

  it("puts the original fetch, http(s).request and axios adapter back when cleared", async () => {
    const axiosDefaults = await liveCommonAxiosDefaults();
    const original = {
      fetch: globalThis.fetch,
      http: http.request,
      https: https.request,
      axiosAdapters: axiosDefaults.map(defaults => defaults.adapter),
    };

    await redirectHttpTo(server.port);
    expect(globalThis.fetch).not.toBe(original.fetch);
    expect(axiosDefaults.map(defaults => defaults.adapter)).toEqual(
      axiosDefaults.map(() => "fetch"),
    );
    await redirectHttpTo(null);

    expect(axiosDefaults).not.toHaveLength(0);
    expect(globalThis.fetch).toBe(original.fetch);
    expect(http.request).toBe(original.http);
    expect(https.request).toBe(original.https);
    expect(axiosDefaults.map(defaults => defaults.adapter)).toEqual(original.axiosAdapters);
    // axios never defaults to "fetch", so this holds even if an earlier test left it switched.
    expect(original.axiosAdapters).not.toContain("fetch");
  });
});

describe("runCli", () => {
  it("removes the HTTP redirect when setup fails before the command runs", async () => {
    const originalFetch = globalThis.fetch;

    await expect(
      runCli(["--version"], {
        WALLET_CLI_MOCK_PORT: "1",
        WALLET_CLI_MOCK_DMK: "1",
        WALLET_CLI_MOCK_APP_RESULTS: "not json",
      }),
    ).rejects.toThrow(SyntaxError);

    expect(globalThis.fetch).toBe(originalFetch);
  });
});
