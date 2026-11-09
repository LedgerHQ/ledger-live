import { Observable, of } from "rxjs";
import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import { AccountDescriptorSchema, toNetworkId } from "@domain/entity-account-descriptor";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { genAccount } from "../../mock/account";
import { createFixtureTokenAccount } from "../../mock/fixtures/cryptoCurrencies";
import { isAccountUsed, syncDetached } from "./existence";

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
  address,
  path: "m/44h/60h/0h/0/0",
});

const options = { prepareCurrency: async () => undefined, blacklistedTokenIds: ["blacklisted"] };

const empty = (currencyId: string): Account => ({
  ...genAccount(currencyId, { currency: getCryptoCurrencyById(currencyId), operationsSize: 0 }),
  balance: new BigNumber(0),
  operationsCount: 0,
  subAccounts: [],
});

beforeEach(() => jest.clearAllMocks());

describe("isAccountUsed", () => {
  it("counts an account with a balance, an operation or a token account as used", async () => {
    await expect(isAccountUsed(empty("ethereum"))).resolves.toBe(false);
    await expect(isAccountUsed({ ...empty("ethereum"), balance: new BigNumber(1) })).resolves.toBe(
      true,
    );
    await expect(
      isAccountUsed({ ...empty("ethereum"), subAccounts: [createFixtureTokenAccount("01")] }),
    ).resolves.toBe(true);
  });

  it("follows the family's rule: a Cosmos account that sent a transaction is used", async () => {
    const cosmos = { ...empty("cosmos"), sequence: 1 };
    await expect(isAccountUsed(cosmos)).resolves.toBe(true);
    await expect(isAccountUsed({ ...cosmos, sequence: 0 })).resolves.toBe(false);
  });

  it("follows the family's rule: a VeChain account only holding an empty VTHO is unused", async () => {
    const vtho = { ...createFixtureTokenAccount("01"), balance: new BigNumber(0) };
    await expect(isAccountUsed({ ...empty("vechain"), subAccounts: [vtho] })).resolves.toBe(false);
  });
});

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

  it("unsubscribes the sync once the signal aborts", async () => {
    const teardown = jest.fn();
    getAccountBridge.mockResolvedValue({ sync: () => new Observable(() => teardown) });
    const controller = new AbortController();
    const pending = syncDetached(descriptor, options, controller.signal);
    await new Promise(resolve => setTimeout(resolve, 0));
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    expect(teardown).toHaveBeenCalled();
  });

  it("releases the read when aborted while the currency is still being prepared", async () => {
    const sync = jest.fn(() => of());
    getAccountBridge.mockResolvedValue({ sync });
    const controller = new AbortController();
    const pending = syncDetached(
      descriptor,
      { ...options, prepareCurrency: () => new Promise(() => undefined) },
      controller.signal,
    );
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    expect(sync).not.toHaveBeenCalled();
  });
});
