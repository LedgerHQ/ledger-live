import { Observable, of } from "rxjs";
import type { Account } from "@ledgerhq/types-live";
import { AccountDescriptorSchema, toNetworkId } from "@domain/entity-account-descriptor";
import { placeholderAccount } from "./placeholderAccount";
import { syncDetached } from "./syncDetached";

jest.mock("./placeholderAccount", () => {
  const actual = jest.requireActual("./placeholderAccount");
  return { placeholderAccount: jest.fn(actual.placeholderAccount) };
});

const getAccountBridge = jest.fn(async (..._args: unknown[]): Promise<unknown> => ({}));
jest.mock("../../bridge", () => ({
  getAccountBridge: (...args: unknown[]) => getAccountBridge(...args),
}));

const address = "0x0000000000000000000000000000000000000001";
const descriptor = AccountDescriptorSchema.parse({
  purpose: "account",
  version: "2",
  type: "address",
  network: toNetworkId("ethereum"),
  key: address,
  path: "m/44h/60h/0h/0/0",
});

const options = { prepareCurrency: async () => undefined, blacklistedTokenIds: ["blacklisted"] };

beforeEach(() => jest.clearAllMocks());

describe("syncDetached", () => {
  it("applies the sync's updates to a placeholder of the descriptor, outside the store", async () => {
    const sync = jest.fn(() =>
      of(
        (account: Account) => ({ ...account, blockHeight: 1 }),
        (account: Account) => ({ ...account, operationsCount: account.blockHeight + 1 }),
      ),
    );
    getAccountBridge.mockResolvedValue({ sync });
    const synced = await syncDetached(descriptor, options, undefined);
    expect(synced).toMatchObject({
      blockHeight: 1,
      operationsCount: 2,
      freshAddress: address,
    });
    expect(sync).toHaveBeenCalledWith(expect.objectContaining({ used: false }), {
      paginationConfig: {},
      blacklistedTokenIds: ["blacklisted"],
    });
  });

  it("answers the placeholder itself when the sync has no update", async () => {
    getAccountBridge.mockResolvedValue({ sync: () => of() });
    await expect(syncDetached(descriptor, options, undefined)).resolves.toMatchObject({
      operationsCount: 0,
    });
  });

  it("rejects at once with an already aborted signal", async () => {
    const reason = new Error("cancelled");
    await expect(syncDetached(descriptor, options, AbortSignal.abort(reason))).rejects.toBe(reason);
    expect(placeholderAccount).not.toHaveBeenCalled();
  });

  it("unsubscribes the sync once the signal aborts", async () => {
    const teardown = jest.fn();
    const subscribed = new Promise<void>(started => {
      getAccountBridge.mockResolvedValue({
        sync: () =>
          new Observable(() => {
            started();
            return teardown;
          }),
      });
    });
    const controller = new AbortController();
    const pending = syncDetached(descriptor, options, controller.signal);
    await subscribed;
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    expect(teardown).toHaveBeenCalled();
  });

  it("releases the read when aborted while the currency is still being prepared", async () => {
    const sync = jest.fn(() => of());
    getAccountBridge.mockResolvedValue({ sync });
    const controller = new AbortController();
    const prepareCurrency = jest.fn<Promise<void>, []>();
    const preparing = new Promise<void>(started => {
      prepareCurrency.mockImplementation(() => {
        started();
        return new Promise<void>(() => undefined);
      });
    });
    const pending = syncDetached(descriptor, { ...options, prepareCurrency }, controller.signal);
    await preparing;
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    expect(sync).not.toHaveBeenCalled();
  });

  it("releases the read when aborted while the placeholder is still being built", async () => {
    jest.mocked(placeholderAccount).mockReturnValueOnce(new Promise(() => undefined));
    const controller = new AbortController();
    const reason = new Error("cancelled");
    const pending = syncDetached(descriptor, options, controller.signal);
    controller.abort(reason);
    await expect(pending).rejects.toBe(reason);
    expect(getAccountBridge).not.toHaveBeenCalled();
  });
});
