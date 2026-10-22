import type { Account } from "@ledgerhq/types-live";
import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { genAccount } from "../../mock/account";
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

  it("fails when no legacy account backs the account", async () => {
    await expect(source(undefined).sync(target)).rejects.toThrow(FullSyncAccountNotFoundError);
    expect(syncLegacyAccount).not.toHaveBeenCalled();
  });
});
