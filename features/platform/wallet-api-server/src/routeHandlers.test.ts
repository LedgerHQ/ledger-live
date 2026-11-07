import type { WalletAPIServer, WalletHandlers } from "@ledgerhq/wallet-api-server";
import { createHandlerRoutes, ensureRoute, NotServedByAccountDataError } from "./routeHandlers";

function setup() {
  const registered = new Map<string, (params: unknown) => unknown>();
  const server = {
    setHandler: (method: string, handler: (params: unknown) => unknown) => {
      registered.set(method, handler);
    },
  } as unknown as WalletAPIServer;
  const routes = createHandlerRoutes();
  ensureRoute(server, routes, "bitcoin.getXPub");
  const call = () => registered.get("bitcoin.getXPub")?.({ accountId: "a" });
  return { routes, call, registered };
}

const handler = (fn: () => Promise<string>): WalletHandlers["bitcoin.getXPub"] => fn;

describe("handler routes", () => {
  it("answers from the account data first", async () => {
    const { routes, call } = setup();
    routes.own["bitcoin.getXPub"] = handler(async () => "own");
    routes.legacy["bitcoin.getXPub"] = handler(async () => "legacy");

    await expect(call()).resolves.toBe("own");
  });

  it("falls back to legacy when the account data does not serve the request", async () => {
    const { routes, call } = setup();
    routes.own["bitcoin.getXPub"] = handler(async () => {
      throw new NotServedByAccountDataError("not here");
    });
    routes.legacy["bitcoin.getXPub"] = handler(async () => "legacy");

    await expect(call()).resolves.toBe("legacy");
  });

  it("keeps any other failure of the account data", async () => {
    const { routes, call } = setup();
    routes.own["bitcoin.getXPub"] = handler(async () => {
      throw new Error("device refused");
    });
    routes.legacy["bitcoin.getXPub"] = handler(async () => "legacy");

    await expect(call()).rejects.toThrow("device refused");
  });

  it("reads the handlers at each request, legacy only when no own handler is left", async () => {
    const { routes, call } = setup();
    routes.legacy["bitcoin.getXPub"] = handler(async () => "legacy");

    await expect(call()).resolves.toBe("legacy");
  });

  it("registers a method once per server", () => {
    const { routes, registered } = setup();
    const before = registered.get("bitcoin.getXPub");
    ensureRoute(
      { setHandler: () => registered.clear() } as unknown as WalletAPIServer,
      routes,
      "bitcoin.getXPub",
    );
    expect(registered.get("bitcoin.getXPub")).toBe(before);
  });
});
