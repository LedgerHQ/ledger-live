import BigNumber from "bignumber.js";
import type {
  AccountData,
  AccountModuleApi,
  AccountOperation,
  CraftedAccountTransaction,
} from "@ledgerhq/account-module-framework";
import type { Operation as CoinOperation } from "@ledgerhq/coin-module-framework/api/types";
import { encodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import type { AccountModuleBinding } from "@ledgerhq/ledger-wallet-framework/api/types";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import type { PortfolioApi, PortfolioMode } from "@ledgerhq/portfolio-module-framework";
import {
  createLocalPortfolio,
  createMemoryPortfolioStore,
  type LocalNetwork,
} from "@ledgerhq/portfolio-module-local";
import type { Account, Operation } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";

export const bitcoin = getCryptoCurrencyById("bitcoin");
export const ripple = getCryptoCurrencyById("ripple");

/** A single-address account (ripple, "xrp" on the portfolio-service). */
export const ADDRESS = "rSender";
export const ADDRESS_PATH = "44'/144'/0'/0/0";
export const RIPPLE_ACCOUNT_ID = encodeAccountId({
  type: "js",
  version: "2",
  currencyId: "ripple",
  xpubOrAddress: ADDRESS,
  derivationMode: "",
});

/** An account-module account (bitcoin). */
export const XPUB = "xpub6Fake";
export const BITCOIN_ACCOUNT_ID = encodeAccountId({
  type: "js",
  version: "2",
  currencyId: "bitcoin",
  xpubOrAddress: XPUB,
  derivationMode: "native_segwit",
});

export const portfolioCoinConfig = (mode?: PortfolioMode) => ({
  portfolio: { enabled: true, ...(mode === undefined ? {} : { mode }) },
});

/** Serves `values` as the live config, for the portfolio-service config and the coin configs. */
export function mockLiveConfig(values: Record<string, unknown>): jest.SpyInstance {
  return jest
    .spyOn(LiveConfig, "getValueByKey")
    .mockImplementation(((key: string) => values[key]) as never);
}

const native = { type: "native" } as const;

export function coinOperation(fields: Partial<CoinOperation> = {}): CoinOperation {
  return {
    id: "coin-op-in",
    type: "IN",
    senders: ["rSomeone"],
    recipients: [ADDRESS],
    value: 500n,
    asset: native,
    tx: {
      hash: "in-hash",
      block: { height: 110, hash: "block-110", time: new Date("2026-10-01T10:00:00Z") },
      fees: 10n,
      date: new Date("2026-10-01T10:00:00Z"),
      failed: false,
    },
    ...fields,
  };
}

/** The `listOperations` of a coin module listing `operations` from the height it is asked for. */
export const listingFrom = (...operations: CoinOperation[]) =>
  jest.fn(async (_context: unknown, _address: string, { minHeight }: { minHeight: number }) => ({
    items: operations.filter(({ tx }) => tx.block.height >= minHeight),
  }));

/** A coin module of a single-address chain, every method a mock. */
export function fakeCoinModule(fields: Record<string, unknown> = {}) {
  return {
    lastBlock: jest.fn(async () => ({
      height: 120,
      hash: "tip-hash",
      time: new Date("2026-10-02T00:00:00Z"),
    })),
    listOperations: jest.fn(async () => ({ items: [coinOperation()] })),
    getBalance: jest.fn(async () => [
      { value: 1_000n, locked: 300n, asset: native },
      { value: 5n, asset: { type: "token", assetReference: "USD.rIssuer" } },
    ]),
    getStakes: jest.fn(async () => ({ items: [] })),
    getNextSequence: jest.fn(async () => 7n),
    estimateFees: jest.fn(async () => ({ value: 12n, parameters: { reserve: 10n } })),
    validateIntent: jest.fn(async () => ({
      errors: {},
      warnings: {},
      estimatedFees: 12n,
      amount: 100n,
      totalSpent: 112n,
    })),
    craftTransaction: jest.fn(async (_context: unknown, intent: { sequence?: bigint }) => ({
      transaction: `unsigned-${intent.sequence}`,
      details: { size: 10n },
    })),
    combine: jest.fn(
      async (_context: unknown, transaction: string, signatures: string[]) =>
        `${transaction}+${signatures[0]}`,
    ),
    broadcast: jest.fn(async () => "broadcast-hash"),
    craftTransactionData: jest.fn(() => ({ type: "none" })),
    ...fields,
  };
}

export type FakeCoinModule = ReturnType<typeof fakeCoinModule>;

export function accountOperation(fields: Partial<AccountOperation> = {}): AccountOperation {
  return {
    id: "synced-OUT",
    hash: "synced",
    type: "OUT",
    value: 2_000n,
    fee: 100n,
    asset: native,
    senders: ["bc1qmine"],
    recipients: ["bc1qthem"],
    block: { height: 790, hash: "block-790", time: new Date("2026-10-01T10:00:00Z") },
    date: new Date("2026-10-01T10:00:00Z"),
    failed: false,
    details: { inputs: ["prev-0"] },
    ...fields,
  };
}

export const CRAFTED_OPERATION = accountOperation({
  id: "",
  hash: "",
  block: null,
  optimistic: true,
  value: 51_000n,
  fee: 1_000n,
  recipients: ["bc1qrecipient"],
});

/**
 * The account module of a bitcoin-like family: its sync records one confirmed operation and a
 * state holding the balance, which its reads answer from.
 */
export function fakeAccountModule(): jest.Mocked<AccountModuleApi> {
  return {
    sync: jest.fn(async function* (_context: unknown, { history }: AccountData) {
      await history.upsert([accountOperation()]);
      yield { state: { version: 1, data: { balance: "900", locked: "100" } }, progress: {} };
    }),
    // Answered from the state its sync wrote; none from a state it did not (a persisted one).
    getBalances: jest.fn(async (_context: unknown, { state }: AccountData) => {
      const data = state?.data as { balance?: string; locked?: string } | undefined;
      return data?.balance === undefined
        ? []
        : [{ value: BigInt(data.balance), locked: BigInt(data.locked ?? "0"), asset: native }];
    }),
    getFreshAddress: jest.fn(async () => ({
      address: "bc1qfresh",
      derivationPath: "84'/0'/0'/0/5",
    })),
    estimateFees: jest.fn(async () => ({ value: 1_000n, parameters: { amount: 49_000n } })),
    validateIntent: jest.fn(),
    estimateMaxSpendable: jest.fn(),
    craftTransaction: jest.fn(async (): Promise<CraftedAccountTransaction> => ({
      transaction: "psbt",
      details: { inputs: 2n },
      operation: CRAFTED_OPERATION,
    })),
    combine: jest.fn(async () => "signed-psbt"),
    broadcast: jest.fn(async (_context, _account, _signed, crafted) => ({
      ...crafted.operation,
      hash: "account-module-hash",
    })),
    listOperations: jest.fn(),
    getPendingOperations: jest.fn(),
    getStakes: jest.fn(),
    getAddresses: jest.fn(),
  } as unknown as jest.Mocked<AccountModuleApi>;
}

export function fakeBinding(
  module: AccountModuleApi,
  fields: Partial<AccountModuleBinding> = {},
): jest.Mocked<AccountModuleBinding> {
  return {
    create: jest.fn(() => module),
    getAccountKey: jest.fn(async () => XPUB),
    readState: jest.fn((synced?: Account) =>
      synced ? { version: 1, data: { persisted: synced.id } } : undefined,
    ),
    accountFields: jest.fn(async ({ key }) => ({ xpub: key })),
    syncedHeight: jest.fn(() => undefined),
    accountOptions: jest.fn((transaction: Record<string, unknown>) => transaction.utxoStrategy),
    ...fields,
  } as jest.Mocked<AccountModuleBinding>;
}

export function liveOperation(fields: Partial<Operation> = {}): Operation {
  return {
    id: "op",
    hash: "known",
    type: "IN",
    value: new BigNumber(300),
    fee: new BigNumber(10),
    senders: ["rSomeone"],
    recipients: [ADDRESS],
    blockHeight: 90,
    blockHash: "block-90",
    accountId: RIPPLE_ACCOUNT_ID,
    date: new Date("2026-09-01T10:00:00Z"),
    extra: {},
    ...fields,
  };
}

function account(fields: Partial<Account>): Account {
  return {
    type: "Account",
    used: true,
    seedIdentifier: "seed",
    index: 0,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    creationDate: new Date("2026-01-01"),
    blockHeight: 0,
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date("2026-10-01"),
    balanceHistoryCache: {} as Account["balanceHistoryCache"],
    swapHistory: [],
    subAccounts: [],
    ...fields,
  } as Account;
}

export const rippleAccount = (fields: Partial<Account> = {}): Account =>
  account({
    id: RIPPLE_ACCOUNT_ID,
    currency: ripple,
    derivationMode: "",
    freshAddress: ADDRESS,
    freshAddressPath: ADDRESS_PATH,
    ...fields,
  });

export const bitcoinAccount = (fields: Partial<Account> = {}): Account =>
  account({
    id: BITCOIN_ACCOUNT_ID,
    currency: bitcoin,
    derivationMode: "native_segwit",
    freshAddress: "bc1qfresh",
    freshAddressPath: "84'/0'/0'/0/3",
    xpub: XPUB,
    ...fields,
  });

/** A local network of the service stand-in, `currency` served by `accountModule`. */
export function standInNetwork(
  currency: typeof ripple,
  coinModule: FakeCoinModule,
  accountModule: LocalNetwork["accountModule"],
  registrationType: "static" | "auto_derive",
): LocalNetwork {
  return {
    currencyId: currency.id,
    context: { config: async () => ({}), logger: () => undefined } as LocalNetwork["context"],
    coinModule: coinModule as unknown as LocalNetwork["coinModule"],
    accountModule,
    derivationMode: "",
    derivationPath: "",
    nativeAsset: { name: currency.name, ticker: currency.ticker, decimals: 6 },
    registrationTypes: [registrationType],
  };
}

export type SpiedPortfolio = { [K in keyof PortfolioApi]: jest.Mock };

/**
 * The portfolio-service, stood in for by a local portfolio of its own, which syncs what it
 * registers before answering (the service syncs on its own) and outlives the bridge calls.
 */
export function serviceStandIn(network: string, localNetwork: LocalNetwork): SpiedPortfolio {
  const service = createLocalPortfolio({
    networks: { [network]: localNetwork },
    store: createMemoryPortfolioStore(),
    generateId: () => "service-registration",
  });
  const spied = Object.fromEntries(
    Object.entries(service).map(([name, method]) => [
      name,
      jest.fn(method as (...args: unknown[]) => unknown),
    ]),
  ) as unknown as SpiedPortfolio & { sync: jest.Mock };
  spied.addRegistrations = jest.fn(async (portfolioId, registrations) => {
    await service.addRegistrations(portfolioId, registrations);
    await service.sync(portfolioId);
    return service.getPortfolio(portfolioId);
  });
  return spied;
}
