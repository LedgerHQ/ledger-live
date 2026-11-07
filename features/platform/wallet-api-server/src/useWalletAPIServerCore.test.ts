import BigNumber from "bignumber.js";
import { renderHook, waitFor } from "@testing-library/react";
import type { Account } from "@ledgerhq/wallet-api-core";
import {
  useWalletAPIServerCore,
  type WalletAPIServerCoreOptions,
  type WalletAPIServerSession,
} from "./useWalletAPIServerCore";

type FakeSession = WalletAPIServerSession & { sent: string[]; activate: jest.Mock };

function fakeSession(): FakeSession {
  const sent: string[] = [];
  return {
    sent,
    onMessage: undefined,
    send: message => {
      sent.push(message);
    },
    activate: jest.fn(),
    cancelOnClose: promise => Promise.resolve(promise),
  };
}

const account: Account = {
  id: "account-1",
  name: "Bitcoin 1",
  address: "bc1q",
  currency: "bitcoin",
  balance: new BigNumber(1),
  spendableBalance: new BigNumber(1),
  blockHeight: undefined,
  lastSyncDate: new Date(0),
};

function options(overrides: Partial<WalletAPIServerCoreOptions> = {}): WalletAPIServerCoreOptions {
  return {
    session: fakeSession(),
    manifest: {
      id: "my-app",
      permissions: ["account.list", "storage.get"],
      currencies: ["bitcoin"],
    },
    config: {
      appId: "app",
      userId: "user",
      tracking: false,
      wallet: { name: "test", version: "1.0.0" },
    },
    ...overrides,
  };
}

async function request(session: FakeSession, method: string, params: object) {
  session.onMessage?.(JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }));
  await waitFor(() => expect(session.sent).toHaveLength(1));
  return JSON.parse(session.sent[0]);
}

describe("useWalletAPIServerCore", () => {
  it("activates the session once its handlers are registered", async () => {
    const session = fakeSession();
    renderHook(() => useWalletAPIServerCore(options({ session })));

    await waitFor(() => expect(session.activate).toHaveBeenCalledTimes(1));
  });

  it("keeps the server of a session, and creates one for a new session", () => {
    const initialProps = options();
    const { result, rerender } = renderHook(props => useWalletAPIServerCore(props), {
      initialProps,
    });
    const first = result.current;

    rerender({ ...initialProps, config: { ...initialProps.config, userId: "other" } });
    expect(result.current).toBe(first);

    rerender({ ...initialProps, session: fakeSession() });
    expect(result.current).not.toBe(first);
  });

  it("lists the provider's accounts, filtered by the manifest currencies", async () => {
    const session = fakeSession();
    const list = jest.fn().mockResolvedValue([account]);
    renderHook(() =>
      useWalletAPIServerCore(
        options({ session, accountsProvider: { list, fromLegacyAccountId: jest.fn() } }),
      ),
    );

    const response = await request(session, "account.list", {});

    expect(response.result.rawAccounts).toEqual([expect.objectContaining({ id: "account-1" })]);
    const [isAllowed] = list.mock.calls[0];
    expect(isAllowed("bitcoin", "bitcoin")).toBe(true);
    expect(isAllowed("ethereum", "ethereum")).toBe(false);
  });

  it("refuses a store the manifest does not list", async () => {
    const session = fakeSession();
    const get = jest.fn().mockResolvedValue("value");
    renderHook(() => useWalletAPIServerCore(options({ session, storage: { "storage.get": get } })));

    const response = await request(session, "storage.get", { key: "k", storeId: "other-app" });

    expect(response.error).toBeDefined();
    expect(get).not.toHaveBeenCalled();
  });

  it("serves the app's own store", async () => {
    const session = fakeSession();
    const get = jest.fn().mockResolvedValue("value");
    renderHook(() => useWalletAPIServerCore(options({ session, storage: { "storage.get": get } })));

    const response = await request(session, "storage.get", { key: "k", storeId: "my-app" });

    expect(response.result).toEqual({ value: "value" });
  });

  it("refuses a method the manifest does not permit", async () => {
    const session = fakeSession();
    const list = jest.fn().mockResolvedValue([account]);
    renderHook(() =>
      useWalletAPIServerCore(
        options({
          session,
          manifest: { id: "my-app", permissions: [], currencies: "*" },
          accountsProvider: { list, fromLegacyAccountId: jest.fn() },
        }),
      ),
    );

    const response = await request(session, "account.list", {});

    expect(response.error).toBeDefined();
    expect(list).not.toHaveBeenCalled();
  });
});
