import {
  toJsonBalance,
  type AccountDescriptor,
  type AccountOperation,
  type Versioned,
} from "@ledgerhq/account-module-framework";
import { SINGLE_ADDRESS_ACCOUNT_STATE_VERSION } from "@ledgerhq/account-module-single-address";
import type { AccountModuleBinding } from "@ledgerhq/ledger-wallet-framework/api/types";
import {
  isPortfolioApiError,
  PortfolioApiError,
  type Network,
  type OperationView,
  type Portfolio,
  type PortfolioApi,
  type PortfolioMode,
  type Registration,
} from "@ledgerhq/portfolio-module-framework";
import {
  readSide,
  registrationSides,
  writeSide,
  type HybridPortfolioApi,
  type Side,
} from "@ledgerhq/portfolio-module-hybrid";
import type { PortfolioStore } from "@ledgerhq/portfolio-module-local";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { Account, Operation, SyncConfig } from "@ledgerhq/types-live";
import { toAccountOperation } from "../accountModule";
import { isSyncFromScratch, tokensSyncHash } from "../assembly/syncHash";
import type { OperationHistoryBound } from "../operationHistoryBound";
import { extractBalances } from "../utils";
import { networkOf, portfolioModeOf, readPortfolioServiceConfig } from "./config";
import { UNBOUNDED_HISTORY, type ListingWalk } from "./listing";
import {
  localNetworkOf,
  memoisedTokenLookup,
  portfolioSides,
  type PortfolioDeps,
  type PortfolioPurpose,
  type TokenLookup,
} from "./network";

/** A Ledger Wallet account, as the portfolio layer serves it. */
export type PortfolioAccountSource = {
  currency: CryptoCurrency;
  /** The Ledger Wallet account id; the local side keys the account by it too. */
  accountId: string;
  /** The extended public key of a family served by an account module; the address otherwise. */
  key: string;
  derivationMode: string;
  /** The account path ("84'/0'/0'") of an account module family; the address path otherwise. */
  derivationPath: string;
  index: number;
  /** What the account holds already: its operations, its pending ones, its module state. */
  account?: Account;
};

export type AccountPortfolioDeps = PortfolioDeps;

/** The registration of an account: its extended public key, or its address. */
export type AccountRegistration =
  | { type: "auto_derive"; network: Network; xpub: string }
  | { type: "static"; accountId: string; network: Network; addresses: string[] };

/**
 * The portfolio of one Ledger Wallet account, served by the sides the mode of its chain names.
 * Each portfolio holds that account only: a network filter reads it alone, on either side, though
 * the service links no account to the registration that brought it. Ledger Wallet calls the
 * router: neither the local side nor its account module is exposed.
 */
export type AccountPortfolio = {
  portfolio: HybridPortfolioApi;
  /**
   * The side serving the reads of this call: the one the mode names, or the local twin while the
   * service has not synchronized the account yet.
   */
  readSide: Side;
  /** The portfolio API of `readSide`. */
  reader: PortfolioApi;
  /** The local side's store: Ledger Wallet provides it, seeded from the account. */
  store: PortfolioStore;
  portfolioId: string;
  network: Network;
  mode: PortfolioMode;
  /** The `syncHash` a read gives the account (`portfolioSyncHash`); none for a write. */
  syncHash: string | undefined;
  /** Whether the read resumes above what the account holds, rather than listing from scratch. */
  resumable: boolean;
  /** The family's token lookup for this call, shared with the local side's catalog lookup. */
  getTokenFromAsset: TokenLookup | undefined;
  /**
   * How the local side's listing of the account ended, once a read synced it: `bounded` when the
   * operation history bound stopped it (an account module family lists unbounded).
   */
  walk: ListingWalk;
};

/** Marks the operations Ledger Wallet seeds the history with: what the account holds already. */
export const SEEDED_DETAILS_KEY = "ledgerWalletSeeded";

/** Whether the local side answers an operation Ledger Wallet seeded, rather than one it listed. */
export const isSeeded = (op: OperationView): boolean => op.details?.[SEEDED_DETAILS_KEY] === true;

export function registrationOf(
  source: PortfolioAccountSource,
  binding: AccountModuleBinding | undefined,
): AccountRegistration {
  const network = networkOf(source.currency.id);
  return binding
    ? { type: "auto_derive", network, xpub: source.key }
    : { type: "static", accountId: source.accountId, network, addresses: [source.key] };
}

/** Whether `registration` registers what `input` does, whatever id its side gave it. */
export function registers(input: AccountRegistration, registration: Registration): boolean {
  if (registration.type !== input.type || registration.network !== input.network) return false;
  return input.type === "auto_derive"
    ? registration.type === "auto_derive" && registration.xpub === input.xpub
    : registration.type === "static" && (registration.addresses ?? []).includes(input.addresses[0]);
}

/**
 * The `syncHash` of an account the portfolio layer synced in `mode`, over the tokens hash of the
 * legacy path (`tokensHash[-syncVersion]`): moving a chain from the legacy path, from another mode,
 * or changing the blacklisted tokens resyncs the account from scratch.
 */
export const portfolioSyncHash = (mode: PortfolioMode, tokensHash: string): string =>
  `portfolio-${mode}-${tokensHash}`;

/**
 * The module state the local side starts from. A family with a binding persists its own. A
 * single-address account gets the height it was synced at when the read resumes (0 otherwise:
 * listed from scratch), and the balances the legacy path validates with: the reserve and the pending
 * spends locked, the staking positions (carved out of the native balance of a family that
 * partitions it), the tokens and their pending spends. Ledger Wallet, as the store provider, writes
 * its pending locks into the state; a read's sync replaces them.
 */
export function moduleStateOf(
  binding: AccountModuleBinding | undefined,
  account: Account | undefined,
  {
    resumable,
    getAssetFromToken,
    partitionsNativeBalance,
    getHeldNativeAmount,
  }: { resumable: boolean } & Pick<
    PortfolioDeps["bridgeApi"],
    "getAssetFromToken" | "partitionsNativeBalance" | "getHeldNativeAmount"
  >,
): Versioned | undefined {
  if (binding) return binding.readState(account);
  return {
    version: SINGLE_ADDRESS_ACCOUNT_STATE_VERSION,
    data: {
      syncedHeight: resumable ? (account?.blockHeight ?? 0) : 0,
      balances: account
        ? extractBalances(
            account,
            getAssetFromToken,
            partitionsNativeBalance,
            getHeldNativeAmount,
          ).map(toJsonBalance)
        : [],
      stakes: [],
    },
  };
}

/**
 * Where the account is registered. A read registers it as its mode says, and a family served by an
 * account module keeps its hidden local twin in `remote` mode too: the twin's state is the only
 * source of its fresh address and outputs. A write registers it on the side writing only, which
 * needs no portfolio on the service.
 */
export function accountSides(
  mode: PortfolioMode,
  purpose: PortfolioPurpose,
  binding: AccountModuleBinding | undefined,
): readonly Side[] {
  if (purpose === "write") return writeSide(mode) === "local" ? ["local"] : [];
  return binding && mode === "remote" ? registrationSides("hybrid") : registrationSides(mode);
}

/**
 * Whether the service synchronized the accounts it holds on `network`: until then, it reads them
 * as empty. An account it failed to register fails.
 */
export function serviceSynchronized(portfolio: Portfolio, network: Network): boolean {
  const accounts = (portfolio.accounts ?? []).filter(account => account.network === network);
  const failed = accounts.find(({ status }) => status === "registration_failure");
  if (failed) {
    throw new Error(`The portfolio-service failed to register the ${network} account ${failed.id}`);
  }
  return accounts.length > 0 && accounts.every(({ status }) => status === "synchronized");
}

const seeded = (op: AccountOperation): AccountOperation => ({
  ...op,
  details: { ...op.details, [SEEDED_DETAILS_KEY]: true },
});

/**
 * The confirmed operations of the block the legacy path resumes above: the one of the newest
 * operation the account holds (`operations[0]`). It is not always the highest block: operations
 * sharing a date are ordered by id, so the newest may sit in a lower block than another one. None
 * when the newest operation has no block: legacy then lists from height 1, the module from 0, the
 * same operations but for a block 0 one.
 */
function resumeBlockOperations(operations: Operation[]): Operation[] {
  const height = operations[0]?.blockHeight;
  if (typeof height !== "number") return [];
  return operations.filter(({ blockHeight }) => blockHeight === height);
}

/**
 * The history the account module starts from. The pending operations always, optimistic: the next
 * sequence steps over them. A family with a binding gets every operation the account holds, its
 * module owning the whole history. A single-address account resuming gets the operations of the
 * block of its newest operation only, marked as seeded: its module lists above the highest block it
 * holds, so it asks for what legacy asks for, the operations above the newest one the account holds
 * (`minHeight`: its block height + 1); the shape never reads them back.
 */
async function seedHistory(
  store: PortfolioStore,
  source: PortfolioAccountSource,
  { binding, resumable }: { binding: AccountModuleBinding | undefined; resumable: boolean },
): Promise<void> {
  const operations = source.account?.operations ?? [];
  let confirmed: AccountOperation[] = [];
  if (binding) confirmed = operations.map(op => toAccountOperation(op, false));
  else if (resumable) {
    confirmed = resumeBlockOperations(operations).map(op => seeded(toAccountOperation(op, false)));
  }
  const history = [
    ...confirmed,
    ...(source.account?.pendingOperations ?? []).map(op => toAccountOperation(op, true)),
  ];
  if (history.length > 0) await store.history(source.accountId).upsert(history);
}

/** The local account takes the account's own descriptor and module state. */
async function seedLocalAccount(
  store: PortfolioStore,
  portfolioId: string,
  accountId: string,
  descriptor: AccountDescriptor,
  state: Versioned | undefined,
): Promise<void> {
  const portfolio = await store.get(portfolioId);
  if (!portfolio?.accounts.some(({ id }) => id === accountId)) {
    throw new Error(`The local portfolio ${portfolioId} does not serve account ${accountId}`);
  }
  await store.put({
    ...portfolio,
    accounts: portfolio.accounts.map(stored =>
      stored.id === accountId ? { ...stored, descriptor, ...(state ? { state } : {}) } : stored,
    ),
  });
}

/**
 * The service persists its registrations: the account is registered there once. The portfolio the
 * service answers tells how far it got with the account.
 */
async function ensureRemoteRegistration(
  remote: PortfolioApi,
  portfolioId: string,
  registration: AccountRegistration,
): Promise<Portfolio> {
  let portfolio;
  try {
    portfolio = await remote.getPortfolio(portfolioId);
  } catch (error) {
    if (!isPortfolioApiError(error) || error.type !== "NOT_FOUND") throw error;
    portfolio = await remote.createPortfolio(portfolioId);
  }
  if ((portfolio.registrations ?? []).some(existing => registers(registration, existing))) {
    return portfolio;
  }
  return remote.addRegistrations(portfolioId, [registration]);
}

/**
 * What only a read needs: the blacklisted tokens of the sync, part of its `syncHash`, and the
 * operation history bound its listing walks under (none: unbounded).
 */
export type OpenOptions = { syncConfig?: SyncConfig; bound?: OperationHistoryBound };

/**
 * Opens the portfolio of a Ledger Wallet account, for one bridge call. Ledger Wallet is the local
 * side's store: it is seeded from what the account holds (its module state, its pending locks, the
 * operations the module resumes from), and the account keeps what the call reads back. The service
 * persists its own side.
 *
 * A read registers the account on the local side when its network keeps one (`local`, the hidden
 * twin of `hybrid`, and of `remote` for an account module family), on the service when it serves
 * the network (`remote`, `hybrid`). Until the service has synchronized the account, the local twin
 * serves the reads; without one, the read fails with UNAVAILABLE. A write registers the account on
 * the local side when it writes, and nowhere otherwise. Without a portfolio-service url, the remote
 * side fails with UNAVAILABLE. The local side of a single-address account lists as the legacy path
 * does, under `bound` (`boundedListingModule`).
 */
export async function openAccountPortfolio(
  source: PortfolioAccountSource,
  deps: AccountPortfolioDeps,
  purpose: PortfolioPurpose = "read",
  { syncConfig = { paginationConfig: {} }, bound = UNBOUNDED_HISTORY }: OpenOptions = {},
): Promise<AccountPortfolio> {
  const { binding, bridgeApi } = deps;
  const { currency } = source;
  const network = networkOf(currency.id);
  const mode = await portfolioModeOf(network);
  const portfolioId = `${readPortfolioServiceConfig().portfolioId}:${source.accountId}`;
  const registration = registrationOf(source, binding);
  const syncHash =
    purpose === "read"
      ? portfolioSyncHash(mode, await tokensSyncHash(currency.id, syncConfig, bridgeApi))
      : undefined;
  const resumable = syncHash !== undefined && !isSyncFromScratch(source.account, syncHash);
  const getTokenFromAsset = memoisedTokenLookup(bridgeApi.getTokenFromAsset);
  const walk: ListingWalk = { bounded: false };

  const { local, remote, portfolio, store } = portfolioSides(
    network,
    localNetworkOf(currency, deps, {
      derivationMode: source.derivationMode,
      derivationPath: source.derivationPath,
      registrationTypes: [registration.type],
      getTokenFromAsset,
      listing: { bound, walk },
    }),
    mode,
    () => `lw:${source.accountId}`,
  );

  const sides = accountSides(mode, purpose, binding);
  await local.createPortfolio(portfolioId);
  if (sides.includes("local")) {
    await seedHistory(store, source, { binding, resumable });
    await local.addRegistrations(portfolioId, [registration]);
    await seedLocalAccount(
      store,
      portfolioId,
      source.accountId,
      {
        currencyId: currency.id,
        derivationMode: source.derivationMode,
        index: source.index,
        key: source.key,
        derivationPath: source.derivationPath,
      },
      moduleStateOf(binding, source.account, {
        resumable,
        getAssetFromToken: bridgeApi.getAssetFromToken,
        partitionsNativeBalance: bridgeApi.partitionsNativeBalance,
        getHeldNativeAmount: bridgeApi.getHeldNativeAmount,
      }),
    );
  }
  let reads = readSide(mode);
  if (sides.includes("remote")) {
    const servicePortfolio = await ensureRemoteRegistration(remote, portfolioId, registration);
    if (!serviceSynchronized(servicePortfolio, network)) {
      if (!sides.includes("local")) {
        throw new PortfolioApiError(
          "UNAVAILABLE",
          `The portfolio-service has not synchronized the ${network} account ${source.accountId} yet`,
        );
      }
      reads = "local";
    }
  }

  return {
    portfolio,
    readSide: reads,
    reader: reads === "local" ? local : portfolio,
    store,
    portfolioId,
    network,
    mode,
    syncHash,
    resumable,
    getTokenFromAsset,
    walk,
  };
}
