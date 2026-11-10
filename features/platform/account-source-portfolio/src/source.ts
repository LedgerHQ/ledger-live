import type { AccountDataSource } from "@domain/api-account-data";
import { AccountDataSourceIdSchema } from "@domain/entity-account-data";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import type { PortfolioId } from "@domain/entity-client-identity";
import { portfolioClientOf, type PortfolioClient, type PortfolioDispatch } from "./client";
import { createPortfolioContext, reconcile, refresh } from "./internals/portfolio";
import type { PortfolioSourceSnapshot } from "./types";

const PORTFOLIO_SOURCE_ID = AccountDataSourceIdSchema.parse("portfolio");

export type PortfolioSourceOptions = {
  readonly dispatch: PortfolioDispatch;
  /** Read at each call: the install's id replaces a placeholder once identities are loaded. */
  readonly portfolioId: () => PortfolioId;
  readonly client?: PortfolioClient;
};

export type PortfolioSource = {
  readonly source: AccountDataSource;
  /** Lists the portfolio again, creating it when the service does not know it. */
  refresh(): Promise<void>;
  /** Registers what the accounts miss and removes what none of them needs; never with no account. */
  reconcile(descriptors: readonly AccountDescriptor[]): Promise<void>;
  subscribe(listener: () => void): () => void;
  getSnapshot(): PortfolioSourceSnapshot;
};

/**
 * The Portfolio service as an account data source; it serves no read yet.
 *
 * `refresh` lists the portfolio, `reconcile` registers and removes through the serial queue, and
 * `subscribe` / `getSnapshot` expose what the source knows. The body only wires one context to
 * `internals/portfolio`.
 */
export function createPortfolioSource({
  dispatch,
  portfolioId,
  client = portfolioClientOf(dispatch),
}: PortfolioSourceOptions): PortfolioSource {
  const deps = createPortfolioContext({ client, portfolioId });
  return {
    source: {
      id: PORTFOLIO_SOURCE_ID,
      supports: () => false,
      maxBatchSize: 100,
      concurrency: 1,
    },
    refresh: () => refresh(deps),
    reconcile: descriptors => reconcile(deps, descriptors),
    subscribe: deps.store.subscribe,
    getSnapshot: deps.store.get,
  };
}
