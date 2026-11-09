import type { Account } from "@ledgerhq/types-live";
import { DEFAULT_ACCOUNT_DATA_MAX_AGE } from "@domain/api-account-data";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import BigNumber from "bignumber.js";
import { genAccount } from "../../mock/account";
import { createFixtureTokenAccount } from "../../mock/fixtures/cryptoCurrencies";
import { fromLegacyAccount } from "../../account/accountDescriptor";
import { createFullSyncSource } from "./createFullSyncSource";
import { FullSyncAccountNotFoundError } from "./errors";

const syncLegacyAccount = jest.fn(
  async (_account: Account, _options: unknown, _maxAge?: number) => {},
);
const syncDetached = jest.fn(async (..._args: unknown[]): Promise<Account> => account);
const isAccountUsed = jest.fn(async (_account: Account) => true);
jest.mock("./existence", () => ({
  syncDetached: (...args: unknown[]) => syncDetached(...args),
  isAccountUsed: (account: Account) => isAccountUsed(account),
}));

jest.mock("./syncLegacyAccount", () => ({
  syncLegacyAccount: (account: Account, options: unknown, maxAge?: number) =>
    syncLegacyAccount(account, options, maxAge),
}));

const account = genAccount("full-sync", { currency: getCryptoCurrencyById("ethereum") });
const descriptor = fromLegacyAccount(account);
const target = { accountUUID: computeAccountUUID(descriptor), descriptor };
const prepareCurrency = async () => undefined;
const updateAccountWithUpdater = jest.fn();

const source = (...found: (Account | undefined)[]) => {
  const findAccount = jest.fn();
  found.forEach(legacy => findAccount.mockReturnValueOnce(legacy));
  return createFullSyncSource({
    findAccount: accountUUID => (accountUUID === target.accountUUID ? findAccount() : undefined),
    prepareCurrency,
    updateAccountWithUpdater,
    blacklistedTokenIds: () => ["blacklisted"],
  });
};

beforeEach(() => jest.clearAllMocks());

describe("createFullSyncSource", () => {
  it("syncs the legacy account behind the target into the store unless fresh, then answers the stored one", async () => {
    const synced = { ...account, blockHeight: account.blockHeight + 1 };
    await expect(source(account, synced).sync(target)).resolves.toBe(synced);
    expect(syncLegacyAccount).toHaveBeenCalledWith(
      account,
      { prepareCurrency, updateAccountWithUpdater, blacklistedTokenIds: ["blacklisted"] },
      DEFAULT_ACCOUNT_DATA_MAX_AGE,
    );
  });

  it("reads the balances of the synced account, native coin first, then its tokens", async () => {
    const synced = {
      ...account,
      balance: new BigNumber(1000),
      spendableBalance: new BigNumber(400),
      subAccounts: [createFixtureTokenAccount("01")],
    };
    await expect(source(account, synced).read?.balance?.(target, undefined)).resolves.toEqual([
      { assetId: "ethereum", balance: "1000", spendableBalance: "400" },
      {
        assetId: "ethereum/erc20/usd_tether__erc20_",
        balance: "51281813126095913",
        spendableBalance: "51281813126095913",
      },
    ]);
    expect(syncLegacyAccount).toHaveBeenCalledTimes(1);
  });

  it("reads the operations of the synced account in one page", async () => {
    const synced = { ...account, pendingOperations: [], subAccounts: [] };
    const page = await source(account, synced).read?.operations?.(target, undefined);
    expect(page?.nextCursor).toBeUndefined();
    expect(page?.operations).toHaveLength(synced.operations.length);
    expect(syncLegacyAccount).toHaveBeenCalledTimes(1);
  });

  it("reads the balance history of the synced account for the requested range", async () => {
    const synced = { ...account, subAccounts: [createFixtureTokenAccount("01")] };
    const history = await source(account, synced).read?.balanceHistory?.(target, {
      range: "week",
    });
    expect(history?.range).toBe("week");
    expect(history?.series.map(({ assetId }) => assetId)).toEqual([
      "ethereum",
      "ethereum/erc20/usd_tether__erc20_",
    ]);
    expect(syncLegacyAccount).toHaveBeenCalledTimes(1);
  });

  it("applies the asset filter of the query to the operations", async () => {
    const synced = { ...account, pendingOperations: [], subAccounts: [] };
    const filterAsset = CryptoOrTokenCurrencyIdSchema.parse("ethereum/erc20/usd_tether__erc20_");
    const page = await source(account, synced).read?.operations?.(target, { filterAsset });
    expect(page?.operations).toEqual([]);
  });

  it("fails when no legacy account backs the account", async () => {
    await expect(source(undefined).sync(target)).rejects.toThrow(FullSyncAccountNotFoundError);
    expect(syncLegacyAccount).not.toHaveBeenCalled();
  });

  it("fails when the account left the store during its sync", async () => {
    await expect(source(account, undefined).sync(target)).rejects.toThrow(
      FullSyncAccountNotFoundError,
    );
  });

  it("fails the balance read when no legacy account backs the account", async () => {
    await expect(source(undefined).read?.balance?.(target, undefined)).rejects.toThrow(
      FullSyncAccountNotFoundError,
    );
  });

  it("answers the existence of an account the store holds from its sync into the store", async () => {
    const synced = { ...account, blockHeight: account.blockHeight + 1 };
    await expect(
      source(account, account, synced).read?.existence?.(target, undefined),
    ).resolves.toEqual({
      used: true,
    });
    expect(syncLegacyAccount).toHaveBeenCalledTimes(1);
    expect(isAccountUsed).toHaveBeenCalledWith(synced);
    expect(syncDetached).not.toHaveBeenCalled();
  });

  it("answers the existence of any other account from a sync kept out of the store", async () => {
    isAccountUsed.mockResolvedValueOnce(false);
    const signal = new AbortController().signal;
    await expect(
      source(undefined).read?.existence?.({ ...target, signal }, undefined),
    ).resolves.toEqual({ used: false });
    expect(syncDetached).toHaveBeenCalledWith(
      descriptor,
      { prepareCurrency, blacklistedTokenIds: ["blacklisted"] },
      signal,
    );
    expect(syncLegacyAccount).not.toHaveBeenCalled();
  });

  it("stops waiting for a stored account's sync once the existence read aborts", async () => {
    syncLegacyAccount.mockImplementationOnce(() => new Promise(() => undefined));
    const controller = new AbortController();
    const pending = source(account, account).read?.existence?.(
      { ...target, signal: controller.signal },
      undefined,
    );
    await new Promise(resolve => setTimeout(resolve, 0));
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
  });
});
