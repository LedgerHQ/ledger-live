/// <reference types="jest" />
import type { AccountDescriptor, AccountModuleApi } from "@ledgerhq/account-module-framework";
import { testContext } from "@ledgerhq/account-module-framework/test-utils";
import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import { createMemoryPortfolioStore } from "../store";
import type { LocalNetwork, LocalPortfolioDeps, StoredAccount, StoredPortfolio } from "../types";

export type FakeAccountModule = jest.Mocked<AccountModuleApi<any>>;
export type FakeCoinModule = jest.Mocked<CoinModuleApi<any, any, any>>;
export type FakeNetwork = LocalNetwork & {
  accountModule: FakeAccountModule;
  coinModule: FakeCoinModule;
};

const unexpected = (name: string) =>
  jest.fn(() => {
    throw new Error(`Unexpected call to ${name}`);
  });

/** Every method throws until a test mocks it; sync yields nothing, getBalances returns []. */
export const fakeAccountModule = (): FakeAccountModule =>
  ({
    sync: jest.fn(async function* () {}),
    getBalances: jest.fn(async () => []),
    listOperations: unexpected("listOperations"),
    getPendingOperations: unexpected("getPendingOperations"),
    getStakes: unexpected("getStakes"),
    getAddresses: unexpected("getAddresses"),
    getFreshAddress: unexpected("getFreshAddress"),
    estimateFees: unexpected("accountModule.estimateFees"),
    validateIntent: unexpected("validateIntent"),
    estimateMaxSpendable: unexpected("estimateMaxSpendable"),
    craftTransaction: unexpected("accountModule.craftTransaction"),
    combine: unexpected("accountModule.combine"),
    broadcast: unexpected("accountModule.broadcast"),
  }) as unknown as FakeAccountModule;

/** Every method throws until a test mocks it. */
export const fakeCoinModule = (): FakeCoinModule =>
  Object.fromEntries(
    [
      "lastBlock",
      "getBlockInfo",
      "getBlock",
      "call",
      "getValidators",
      "getBalance",
      "listOperations",
      "getStakes",
      "getRewards",
      "register",
      "craftTransaction",
      "craftRawTransaction",
      "estimateFees",
      "combine",
      "broadcast",
      "validateIntent",
      "getNextSequence",
      "validateAddress",
      "craftTransactionData",
    ].map(name => [name, unexpected(`coinModule.${name}`)]),
  ) as unknown as FakeCoinModule;

/** A bitcoin-like network serving auto_derive registrations. */
export const aLocalNetwork = (
  fields: Partial<Omit<LocalNetwork, "accountModule" | "coinModule">> = {},
): FakeNetwork => ({
  currencyId: "bitcoin",
  context: testContext(),
  accountModule: fakeAccountModule(),
  coinModule: fakeCoinModule(),
  derivationMode: "native_segwit",
  derivationPath: "84'/0'/0'",
  nativeAsset: { name: "Bitcoin", ticker: "BTC", decimals: 8 },
  registrationTypes: ["auto_derive"],
  ...fields,
});

export const sequentialIds = (prefix = "id") => {
  let count = 0;
  return () => `${prefix}-${++count}`;
};

export const NOW = Date.parse("2026-01-10T00:00:00.000Z");

export const someDeps = (fields: Partial<LocalPortfolioDeps> = {}): LocalPortfolioDeps => ({
  networks: { bitcoin: aLocalNetwork() },
  store: createMemoryPortfolioStore(),
  generateId: sequentialIds(),
  now: () => NOW,
  ...fields,
});

export const aDescriptor = (key: string, fields: Partial<AccountDescriptor> = {}) => ({
  currencyId: "bitcoin",
  derivationMode: "native_segwit",
  index: 0,
  key,
  derivationPath: "84'/0'/0'",
  ...fields,
});

/** A synchronized bitcoin account served locally, keyed `key-<id>`. */
export const aStoredAccount = (fields: Partial<StoredAccount> = {}): StoredAccount => {
  const id = fields.id ?? "account";
  return {
    id,
    network: "bitcoin",
    registrationId: "registration",
    status: "synchronized",
    descriptor: aDescriptor(`key-${id}`),
    ...fields,
  };
};

/** The same account as an account not served locally. */
export const aFailedAccount = (fields: Partial<StoredAccount> = {}): StoredAccount => {
  const { descriptor, ...account } = aStoredAccount({
    status: "registration_failure",
    error: "not served",
    ...fields,
  });
  return account;
};

/** A portfolio whose accounts all belong to one auto_derive registration on bitcoin. */
export const aStoredPortfolio = (fields: Partial<StoredPortfolio> = {}): StoredPortfolio => ({
  id: "portfolio",
  registrations: [{ type: "auto_derive", id: "registration", network: "bitcoin", xpub: "xpub" }],
  accounts: [aStoredAccount()],
  ...fields,
});
