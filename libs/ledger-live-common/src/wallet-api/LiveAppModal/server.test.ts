jest.mock("@ledgerhq/wallet-api-server", () => ({
  RPCHandler: jest.fn(),
  customWrapper: jest.fn(handler => handler),
}));

jest.mock("@ledgerhq/wallet-api-core", () => ({
  createUnknownError: jest.fn(opts => ({ code: "UnknownError", ...opts })),
  ServerError: class ServerError extends Error {
    constructor(public error: { message?: string }) {
      super(error?.message ?? "ServerError");
    }
  },
}));

import { handlers } from "./server";
import * as registry from "./registry";
import { LiveAppModalAlreadyOpenError } from "./types";

describe("LiveAppModal server handlers", () => {
  beforeEach(() => {
    registry.__resetForTests();
  });

  it("open() forwards params to uiHook and resolves when close() is called", async () => {
    const uiOpen = jest.fn();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const h = handlers({ uiHooks: { "custom.liveApp.modal.open": uiOpen } }) as any;

    const openPromise = h["custom.liveApp.modal.open"]({
      path: "/modal/popular",
      payload: { assets: ["BTC"] },
      title: "Crowd favourites",
      manifestId: "another-app",
      useCase: "earn",
    });

    expect(uiOpen).toHaveBeenCalledTimes(1);
    const callArg = uiOpen.mock.calls[0][0];
    expect(callArg).toMatchObject({
      path: "/modal/popular",
      title: "Crowd favourites",
      useCase: "earn",
    });
    // A live-app must not be able to open a modal for a different manifest:
    // the host resolves the manifest from the caller, so manifestId is not forwarded.
    expect(callArg).not.toHaveProperty("manifestId");
    expect(typeof callArg.requestId).toBe("string");

    // Child fetches payload
    const { payload } = await h["custom.liveApp.modal.getInitialPayload"]({
      requestId: callArg.requestId,
    });
    expect(payload).toEqual({ assets: ["BTC"] });

    // Child closes with a result
    await h["custom.liveApp.modal.close"]({
      requestId: callArg.requestId,
      result: { picked: "BTC" },
    });

    await expect(openPromise).resolves.toEqual({
      requestId: callArg.requestId,
      result: { picked: "BTC" },
    });
  });

  it("open() rejects if another modal is already open", async () => {
    const uiOpen = jest.fn();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const h = handlers({ uiHooks: { "custom.liveApp.modal.open": uiOpen } }) as any;

    const firstPromise: Promise<unknown> = h["custom.liveApp.modal.open"]({ path: "/first" });
    // guard against potential unhandled rejection if the promise ever settles
    firstPromise.catch(() => {});
    await expect(h["custom.liveApp.modal.open"]({ path: "/second" })).rejects.toBeInstanceOf(
      LiveAppModalAlreadyOpenError,
    );
  });

  it("open() rejects without path", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const h = handlers({ uiHooks: { "custom.liveApp.modal.open": jest.fn() } }) as any;
    await expect(h["custom.liveApp.modal.open"]({})).rejects.toThrow(/path is required/);
  });

  it("open() cancels the request and rethrows if uiHook throws", async () => {
    const boom = new Error("ui failed");
    const uiOpen = jest.fn(() => {
      throw boom;
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const h = handlers({ uiHooks: { "custom.liveApp.modal.open": uiOpen } }) as any;
    await expect(h["custom.liveApp.modal.open"]({ path: "/x" })).rejects.toBe(boom);

    // Registry is cleared, a follow-up open can be initiated again (it will also reject
    // because the same uiHook still throws, but importantly it is not blocked by the
    // depth guard).
    await expect(h["custom.liveApp.modal.open"]({ path: "/y" })).rejects.toBe(boom);
  });

  it("getInitialPayload rejects unknown requestId", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const h = handlers({ uiHooks: { "custom.liveApp.modal.open": jest.fn() } }) as any;
    await expect(
      h["custom.liveApp.modal.getInitialPayload"]({ requestId: "unknown" }),
    ).rejects.toThrow();
  });

  it("close() on unknown requestId is a no-op", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const h = handlers({ uiHooks: { "custom.liveApp.modal.open": jest.fn() } }) as any;
    await expect(
      h["custom.liveApp.modal.close"]({ requestId: "unknown" }),
    ).resolves.toBeUndefined();
  });
});
