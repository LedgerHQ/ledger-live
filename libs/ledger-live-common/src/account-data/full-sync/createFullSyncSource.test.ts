import type { Account } from "@ledgerhq/types-live";
import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { BigNumber } from "bignumber.js";
import { genAccount } from "../../mock/account";
import { createFixtureTokenAccount } from "../../mock/fixtures/cryptoCurrencies";
import { fromLegacyAccount } from "../../account/accountDescriptor";
import { createFullSyncSource } from "./createFullSyncSource";
import { FullSyncAccountNotFoundError } from "./errors";

const syncLegacyAccount = jest.fn(async (account: Account, _options: unknown) => account);
jest.mock("./syncLegacyAccount", () => ({
  syncLegacyAccount: (account: Account, options: unknown) => syncLegacyAccount(account, options),
}));

const account = genAccount("full-sync", { currency: getCryptoCurrencyById("ethereum") });
const descriptor = fromLegacyAccount(account);
const target = { accountUUID: computeAccountUUID(descriptor), descriptor };
const prepareCurrency = async () => undefined;

const source = (found: Account | undefined) =>
  createFullSyncSource({
    findAccount: accountUUID => (accountUUID === target.accountUUID ? found : undefined),
    prepareCurrency,
    blacklistedTokenIds: () => ["blacklisted"],
  });

beforeEach(() => jest.clearAllMocks());

describe("createFullSyncSource", () => {
  it("syncs the legacy account behind the target with the host's options", async () => {
    await expect(source(account).sync(target)).resolves.toBe(account);
    expect(syncLegacyAccount).toHaveBeenCalledWith(account, {
      prepareCurrency,
      blacklistedTokenIds: ["blacklisted"],
    });
  });

  it("shares one sync between concurrent reads of the account", async () => {
    const reads = source(account);
    await Promise.all([reads.sync(target), reads.sync(target)]);
    expect(syncLegacyAccount).toHaveBeenCalledTimes(1);
  });

  it("reads the balances of the synced account, native coin first, then its tokens", async () => {
    syncLegacyAccount.mockResolvedValueOnce({
      ...account,
      balance: new BigNumber(1000),
      spendableBalance: new BigNumber(400),
      subAccounts: [createFixtureTokenAccount("01")],
    });
    await expect(source(account).read?.balance?.(target, undefined)).resolves.toEqual([
      { assetId: "ethereum", balance: "1000", spendableBalance: "400" },
      {
        assetId: "ethereum/erc20/usd_tether__erc20_",
        balance: "51281813126095913",
        spendableBalance: "51281813126095913",
      },
    ]);
    expect(syncLegacyAccount).toHaveBeenCalledTimes(1);
  });

  it("fails when no legacy account backs the account", async () => {
    await expect(source(undefined).sync(target)).rejects.toThrow(FullSyncAccountNotFoundError);
    expect(syncLegacyAccount).not.toHaveBeenCalled();
  });

  it("fails the balance read when no legacy account backs the account", async () => {
    await expect(source(undefined).read?.balance?.(target, undefined)).rejects.toThrow(
      FullSyncAccountNotFoundError,
    );
  });
});
