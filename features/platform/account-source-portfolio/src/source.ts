import type { AccountDataSource } from "@domain/api-account-data";
import { AccountDataSourceIdSchema, type AccountDataKind } from "@domain/entity-account-data";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import type { PortfolioId } from "@domain/entity-client-identity";
import { portfolioClientOf, type PortfolioClient, type PortfolioDispatch } from "./client";
import { isEvmAccount } from "./evm";
import { balanceReader } from "./internals/balance/reader";
import { balanceHistoryReader } from "./internals/balanceHistory/reader";
import { operationsReader } from "./internals/operations/reader";
import { reconcile, refresh, type PortfolioDeps } from "./internals/portfolio";
import { createSerialQueue } from "./internals/queue";
import { createPortfolioStore } from "./internals/snapshot";
import type { PortfolioSourceSnapshot } from "./types";

const PORTFOLIO_SOURCE_ID = AccountDataSourceIdSchema.parse("portfolio");
const KINDS: ReadonlySet<AccountDataKind> = new Set(["balance", "balanceHistory", "operations"]);

export type PortfolioSourceOptions = {
  readonly dispatch: PortfolioDispatch;
  /** Read at each call: the install's id replaces a placeholder once identities are loaded. */
  readonly portfolioId: () => PortfolioId;
  readonly client?: PortfolioClient;
  readonly sleep?: (ms: number) => Promise<void>;
  readonly now?: () => number;
};

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

export type PortfolioSource = {
  readonly source: AccountDataSource;
  /** Lists the portfolio again, creating it when the service does not know it. */
  refresh(): Promise<void>;
  /** Registers what the accounts miss and removes what none of them needs; never with no account. */
  reconcile(descriptors: readonly AccountDescriptor[]): Promise<void>;
  subscribe(listener: () => void): () => void;
  getSnapshot(): PortfolioSourceSnapshot;
};

/** Balances, balance histories and operations from the Portfolio service; a read waits until its accounts are ready there. */
export function createPortfolioSource({
  dispatch,
  portfolioId,
  client = portfolioClientOf(dispatch),
  sleep = wait,
  now = Date.now,
}: PortfolioSourceOptions): PortfolioSource {
  const store = createPortfolioStore();
  const deps: PortfolioDeps = {
    client,
    portfolioId,
    queue: createSerialQueue(),
    store,
    sleep,
    timeout: wait,
    now,
  };
  return {
    source: {
      id: PORTFOLIO_SOURCE_ID,
      supports: (descriptor, kind) => KINDS.has(kind) && isEvmAccount(descriptor),
      maxBatchSize: 100,
      concurrency: 1,
      readBatch: {
        balance: balanceReader(deps),
        balanceHistory: balanceHistoryReader(deps),
        operations: operationsReader(deps),
      },
    },
    refresh: () => refresh(deps),
    reconcile: descriptors => reconcile(deps, descriptors),
    subscribe: store.subscribe,
    getSnapshot: store.get,
  };
}
