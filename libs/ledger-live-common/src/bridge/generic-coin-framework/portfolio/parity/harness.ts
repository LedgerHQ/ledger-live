import BigNumber from "bignumber.js";
import { ethers } from "ethers";
import { lastValueFrom, reduce } from "rxjs";
import { toJsonSafe } from "@ledgerhq/account-module-framework";
import type {
  AssetInfo,
  Operation as CoinOperation,
} from "@ledgerhq/coin-module-framework/api/types";
import { encodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { getSeedIdentifierDerivation } from "@ledgerhq/ledger-wallet-framework/derivation";
import { emptyHistoryCache } from "@ledgerhq/ledger-wallet-framework/account/balanceHistoryCache";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import type { PortfolioMode } from "@ledgerhq/portfolio-module-framework";
import type { Account, SyncConfig, TransactionStatusCommon } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { getCoinFrameworkAccountBridge } from "../../accountBridge";
import { getCoinFrameworkCurrencyBridge } from "../../currencyBridge";
import { getCoinModuleApi } from "../../api";
import type { CoinFrameworkSigner } from "../../types";
import { callsOf, fakeCoinModule, type FakeChain, type FakeCoinModule } from "./fakeCoinModule";

/** The bridge path a run takes: the legacy one, or the portfolio layer in a mode. */
export type Path = "legacy" | PortfolioMode;

/** The time of every run: `buildSubAccounts`, jsHelpers and the shape default to `new Date()`. */
export const FROZEN_NOW = new Date("2026-10-10T12:00:00.000Z");

/** Freezes `Date` only: the timers the bridge awaits keep running. */
export function freezeTime(): void {
  jest.useFakeTimers({
    now: FROZEN_NOW,
    doNotFake: [
      "hrtime",
      "nextTick",
      "performance",
      "queueMicrotask",
      "requestAnimationFrame",
      "cancelAnimationFrame",
      "requestIdleCallback",
      "cancelIdleCallback",
      "setImmediate",
      "clearImmediate",
      "setInterval",
      "clearInterval",
      "setTimeout",
      "clearTimeout",
    ],
  });
}

/** A catalog token of a scenario. */
export function token(fields: {
  id: string;
  parentCurrencyId: string;
  contractAddress: string;
  tokenType: string;
  tokenIdentifier?: string;
}): TokenCurrency {
  return {
    type: "TokenCurrency",
    name: fields.id,
    ticker: fields.id.toUpperCase(),
    units: [{ name: fields.id, code: "TKN", magnitude: 6 }],
    ...fields,
  } as TokenCurrency;
}

/**
 * Ledger Wallet's catalog for the scenarios: `tokens`, looked up by id, or by address (case
 * insensitive) and token identifier within a currency.
 */
export function useTokens(tokens: TokenCurrency[]): void {
  setCryptoAssetsStore({
    findTokenById: async id => tokens.find(t => t.id === id),
    findTokenByAddressInCurrency: async (address, currencyId, tokenIdentifier) =>
      tokens.find(
        t =>
          t.parentCurrencyId === currencyId &&
          t.contractAddress.toLowerCase() === address.toLowerCase() &&
          (tokenIdentifier === undefined || t.tokenIdentifier === tokenIdentifier),
      ),
    getTokensSyncHash: async currencyId =>
      `tokens-${currencyId}-${tokens.filter(t => t.parentCurrencyId === currencyId).length}`,
  });
}

/**
 * The live config of a run: the coin config of `currency` on `path`, A4 off unless `a4` says
 * otherwise (the parity baseline is the coin-module path), the portfolio-service when `serviceUrl`
 * is set, and the operation history bound when `operationHistory` sets one.
 */
export function configure(
  currency: CryptoCurrency,
  path: Path,
  {
    coinConfig = {},
    serviceUrl = "",
    a4,
    operationHistory,
  }: { coinConfig?: object; serviceUrl?: string; a4?: object; operationHistory?: object } = {},
): void {
  const values: Record<string, unknown> = {
    [`config_currency_${currency.id}`]: {
      status: { type: "active" },
      ...coinConfig,
      ...(path === "legacy" ? {} : { portfolio: { enabled: true, mode: path } }),
    },
    // By default, A4 off for the currency (its A4 network is its id): neither read nor registration.
    config_generic_a4: a4 ?? {
      environment: "prd",
      chains: { [currency.id]: { enabled: false, registerOnly: false } },
    },
    config_portfolio_service: { url: serviceUrl, portfolioId: "wallet" },
    config_generic_operation_history: operationHistory,
  };
  jest
    .spyOn(LiveConfig, "getValueByKey")
    .mockImplementation(((key: string) => values[key]) as never);
}

/** Serves `module` as the coin module of every currency (`getCoinModuleApi`). */
export function serveModule<M>(module: M): M {
  jest.mocked(getCoinModuleApi).mockResolvedValue(module as never);
  return module;
}

/** Serves `chain` as the coin module of every currency, through a fresh recording module. */
export const serveChain = (chain: FakeChain, guard?: (method: string) => void): FakeCoinModule =>
  serveModule(fakeCoinModule(chain, guard));

/** The device of the scenarios: a public key per path, a signature per payload. */
export const fakeSigner: CoinFrameworkSigner = {
  getAddress: jest.fn(async (_deviceId: string, { path }: { path: string }) => ({
    address: `address-${path}`,
    publicKey: `public-key-${path}`,
    path,
  })) as never,
  context: (async (
    _deviceId: string,
    fn: (signer: {
      getAddress: () => Promise<{ address: string; publicKey: string }>;
      signTransaction: (path: string, unsigned: string) => Promise<string>;
    }) => Promise<unknown>,
  ) =>
    fn({
      getAddress: async () => ({ address: "device-address", publicKey: "device-public-key" }),
      signTransaction: async (_path, unsigned) => `signature(${unsigned})`,
    })) as never,
};

/** The accounts a currency bridge's scan discovers on `family`. */
export async function scanAccounts(
  family: string,
  currency: CryptoCurrency,
  syncConfig: SyncConfig = { paginationConfig: {} },
): Promise<Account[]> {
  const bridge = await getCoinFrameworkCurrencyBridge(family, "local", fakeSigner);
  const events = await lastValueFrom(
    bridge
      .scanAccounts({ currency, deviceId: "device", syncConfig })
      .pipe(
        reduce((all, event) => [...all, event], [] as Array<{ type: string; account: Account }>),
      ),
  );
  return events.filter(({ type }) => type === "discovered").map(({ account }) => account);
}

/** An account as a scan leaves it before its first sync: no operation, no block height. */
export function emptyAccount(
  currency: CryptoCurrency,
  address: string,
  {
    derivationMode = "",
    xpubOrAddress = address,
    seedIdentifier = "seed",
  }: { derivationMode?: string; xpubOrAddress?: string; seedIdentifier?: string } = {},
): Account {
  const mode = derivationMode as Account["derivationMode"];
  return {
    type: "Account",
    id: encodeAccountId({
      type: "js",
      version: "2",
      currencyId: currency.id,
      xpubOrAddress,
      derivationMode: mode,
    }),
    seedIdentifier,
    derivationMode: mode,
    index: 0,
    freshAddress: address,
    freshAddressPath: getSeedIdentifierDerivation(currency, mode),
    used: false,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    creationDate: FROZEN_NOW,
    blockHeight: 0,
    currency,
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date(0),
    balanceHistoryCache: emptyHistoryCache,
    swapHistory: [],
    subAccounts: [],
  } as Account;
}

/** The account bridge's `sync` of `family`, its updates applied to `account`. */
export async function syncAccount(
  family: string,
  account: Account,
  syncConfig: SyncConfig = { paginationConfig: {} },
): Promise<Account> {
  const bridge = await getCoinFrameworkAccountBridge(family, "local", fakeSigner);
  return lastValueFrom(
    bridge.sync(account, syncConfig).pipe(reduce((synced, update) => update(synced), account)),
  );
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

/**
 * A value both paths can be compared on: BigNumbers and bigints as tagged decimal strings, dates
 * as ISO strings, bytes as hex, undefined keys dropped, catalog entries by name.
 */
export function normalise(value: unknown): unknown {
  if (BigNumber.isBigNumber(value)) return `BN:${value.toFixed()}`;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "bigint") return `${value}n`;
  if (Buffer.isBuffer(value)) return `0x${value.toString("hex")}`;
  if (Array.isArray(value)) return value.map(normalise);
  if (!isRecord(value)) return value;
  if (value.type === "CryptoCurrency" || value.type === "TokenCurrency") {
    return `${String(value.type)}:${String(value.id)}`;
  }
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, item]) => item !== undefined)
      .map(([key, item]) => [key, normalise(item)]),
  );
}

/**
 * An account as both paths are compared: normalised, its `syncHash` without the portfolio mode
 * prefix, its staking position details in their JSON form (a bigint in legacy memory is the
 * decimal string the portfolio path holds; both serialize the same).
 */
export function normaliseAccount(account: Account): unknown {
  const { syncHash, ...rest } = account;
  const positions = (account as { stakingPositions?: Array<{ details?: unknown }> })
    .stakingPositions;
  return normalise({
    ...rest,
    syncHash: syncHash?.replace(/^portfolio-[a-z]+-/, ""),
    ...(positions
      ? {
          stakingPositions: positions.map(position => ({
            ...position,
            details: position.details === undefined ? undefined : toJsonSafe(position.details),
          })),
        }
      : {}),
  });
}

/** The two accounts of a scenario, each continuing on its own path. */
export type ParityAccounts = { legacy: Account; portfolio: Account };

/** What a step of a scenario ran: the accounts after it, and the coin module each path called. */
export type ParityStep = ParityAccounts & {
  legacyModule: FakeCoinModule;
  portfolioModule: FakeCoinModule;
};

/**
 * Syncs each account of a scenario on its path against the same `chain`: the legacy path, then the
 * portfolio layer in `mode`, each through a coin module of its own.
 */
export async function syncBoth(
  {
    currency,
    family,
    chain,
    coinConfig,
    mode = "local",
    syncConfig,
    operationHistory,
  }: {
    currency: CryptoCurrency;
    family: string;
    chain: FakeChain;
    coinConfig?: object;
    mode?: PortfolioMode;
    syncConfig?: SyncConfig;
    /** The operation history bound (`config_generic_operation_history`) of both runs. */
    operationHistory?: object;
  },
  accounts: ParityAccounts,
): Promise<ParityStep> {
  configure(currency, "legacy", { coinConfig, operationHistory });
  const legacyModule = serveChain(chain);
  const legacy = await syncAccount(family, accounts.legacy, syncConfig);

  configure(currency, mode, { coinConfig, operationHistory });
  const portfolioModule = serveChain(chain);
  const portfolio = await syncAccount(family, accounts.portfolio, syncConfig);
  return { legacy, portfolio, legacyModule, portfolioModule };
}

/** A block of the scenarios' chains: its time is a minute per height after a fixed origin. */
export const blockAt = (height: number) => ({
  height,
  hash: `block-${height}`,
  time: new Date(Date.UTC(2026, 9, 1) + height * 60_000),
});

/**
 * A coin module operation of the scenarios, in block `height`, dated by its block unless `date`
 * says otherwise (blocks sharing a time, as Stacks blocks share their Bitcoin burn time).
 */
export function coinOperation({
  height,
  hash = `tx-${height}`,
  type = "IN",
  value = 0n,
  fees = 0n,
  asset = { type: "native" },
  failed = false,
  date,
  ...fields
}: {
  height: number;
  hash?: string;
  type?: string;
  value?: bigint;
  fees?: bigint;
  asset?: AssetInfo;
  failed?: boolean;
  date?: Date;
  id?: string;
  senders?: string[];
  recipients?: string[];
  feesPayer?: string;
  details?: Record<string, unknown>;
  memo?: unknown;
}): CoinOperation {
  const {
    id = `${hash}-${type}`,
    senders = [],
    recipients = [],
    feesPayer,
    details,
    memo,
  } = fields;
  const block = blockAt(height);
  return {
    id,
    type,
    senders,
    recipients,
    value,
    asset,
    ...(memo === undefined ? {} : { memo: memo as never }),
    ...(details === undefined ? {} : { details }),
    tx: {
      hash,
      block,
      fees,
      ...(feesPayer === undefined ? {} : { feesPayer }),
      date: date ?? block.time,
      failed,
    },
  };
}

/**
 * The accounts of a step are equal field by field once normalised, and the coin module of each
 * path was asked for the same listings.
 */
export function expectParity(step: ParityStep): void {
  expect(normaliseAccount(step.portfolio)).toEqual(normaliseAccount(step.legacy));
  expect(callsOf(step.portfolioModule.listOperations)).toEqual(
    callsOf(step.legacyModule.listOperations),
  );
}

/** Errors as both paths must give them: each one's class, name, message and field types. */
const describeErrors = (errors: Record<string, Error>) =>
  Object.fromEntries(
    Object.entries(errors).map(([key, error]) => [
      key,
      {
        constructor: error.constructor,
        name: error.name,
        message: error.message,
        fields: Object.fromEntries(
          Object.entries(error).map(([field, value]) => [field, [typeof value, normalise(value)]]),
        ),
      },
    ]),
  );

/** A transaction status as both paths must give it: its errors and warnings described, its amounts. */
export const describeStatus = ({
  errors,
  warnings,
  ...amounts
}: Pick<TransactionStatusCommon, "errors" | "warnings"> & Record<string, unknown>) => ({
  errors: describeErrors(errors),
  warnings: describeErrors(warnings),
  amounts: normalise(amounts),
});

/** A scenario's first accounts: the same never synced account on both paths. */
export const fromScratch = (account: Account): ParityAccounts => ({
  legacy: account,
  portfolio: account,
});

/**
 * What the account holds of its own between two syncs, the same on both paths: a pending
 * operation (`pendingHash`, sequence 9) the next listing may confirm, and on its first token
 * account a pending operation and a swap.
 */
function withLocalState(account: Account, pendingHash: string): Account {
  const [first] = account.operations;
  const subAccounts = account.subAccounts?.map((sub, index) =>
    index === 0 && sub.operations[0]
      ? {
          ...sub,
          pendingOperations: [
            {
              ...sub.operations[0],
              id: `${sub.id}-pending-token-OUT`,
              hash: "pending-token",
              blockHeight: null,
              blockHash: null,
            },
          ],
          swapHistory: [{ swapId: "swap" } as never],
        }
      : sub,
  );
  return {
    ...account,
    subAccounts,
    pendingOperations: first
      ? [
          {
            ...first,
            id: `${account.id}-${pendingHash}-OUT`,
            hash: pendingHash,
            type: "OUT",
            blockHeight: null,
            blockHash: null,
            transactionSequenceNumber: new BigNumber(9),
            subOperations: [],
            internalOperations: [],
          },
        ]
      : [],
  };
}

/** A sync scenario of a family: its chain before and after new activity. */
export type SyncScenario = {
  currency: CryptoCurrency;
  family: string;
  account: Account;
  /** The chain of the first sync. */
  chain: FakeChain;
  /** The chain of the incremental sync: it confirms `pendingHash`. */
  next: FakeChain;
  pendingHash: string;
  /** A token blacklisted for the first two syncs, then no longer. */
  blacklisted?: string;
  coinConfig?: object;
  mode?: PortfolioMode;
  /** The operation history bound (`config_generic_operation_history`) of every step. */
  operationHistory?: object;
  /** What the account gains of its own before the incremental sync, on both paths. */
  between?: (account: Account) => Account;
};

/**
 * The steps every sync scenario runs on both paths, each step's accounts compared: from scratch,
 * incrementally (new operations, a token swept and gone, a pending operation confirmed, the
 * account's own pending operations and swap history kept), after a blacklist change (from scratch
 * on both), and from scratch over a listing starting with an empty page carrying a cursor.
 */
export async function runSyncScenario(scenario: SyncScenario): Promise<ParityStep[]> {
  const {
    currency,
    family,
    account,
    chain,
    next,
    pendingHash,
    blacklisted,
    coinConfig,
    mode,
    operationHistory,
  } = scenario;
  const between = scenario.between ?? ((held: Account) => held);
  const blacklistedTokenIds = blacklisted ? [blacklisted] : [];
  const base = { currency, family, coinConfig, mode, operationHistory };
  const syncConfig = { paginationConfig: {}, blacklistedTokenIds };

  const first = await syncBoth({ ...base, chain, syncConfig }, fromScratch(account));
  // Each path served its account: the portfolio layer tags the hash with its mode.
  expect(first.portfolio.syncHash).toMatch(new RegExp(`^portfolio-${mode ?? "local"}-`));
  expect(first.legacy.syncHash).not.toMatch(/^portfolio-/);
  expectParity(first);
  const second = await syncBoth(
    { ...base, chain: next, syncConfig },
    {
      legacy: between(withLocalState(first.legacy, pendingHash)),
      portfolio: between(withLocalState(first.portfolio, pendingHash)),
    },
  );
  expectParity(second);
  const third = await syncBoth(
    { ...base, chain: next, syncConfig: { paginationConfig: {}, blacklistedTokenIds: [] } },
    second,
  );
  expectParity(third);
  const paged = await syncBoth(
    { ...base, chain: { ...chain, pageSize: 2, leadingEmptyPage: true }, syncConfig },
    fromScratch(account),
  );
  expectParity(paged);
  return [first, second, third, paged];
}

/** A signed EVM transaction, so the EVM broadcast pre-check can read what a fake module combined. */
export function signedEvmTransaction(): string {
  const transaction = ethers.Transaction.from({
    type: 0,
    to: "0x2222222222222222222222222222222222222222",
    nonce: 7,
    gasLimit: 65_000n,
    gasPrice: 30n,
    value: 0n,
    chainId: 1n,
  });
  transaction.signature = new ethers.SigningKey(`0x${"01".repeat(32)}`).sign(
    transaction.unsignedHash,
  );
  return transaction.serialized;
}
