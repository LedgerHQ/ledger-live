import type { Portfolio } from "@domain/api-account-portfolio";
import {
  AccountDataNotServedError,
  type AccountDataSource,
  type AccountTarget,
} from "@domain/api-account-data";
import type { AccountAssetBalance } from "@domain/entity-account-balance";
import { AccountDataSourceIdSchema } from "@domain/entity-account-data";
import { toAccountBalances } from "./internals/balances";
import { isFreshListing } from "./internals/listing";
import { strategyOf } from "./registration";
import type { PortfolioPorts, PortfolioSourceRuntime } from "./runtime";
import {
  portfolioOutcomesRecorded,
  selectPortfolioServer,
  type PortfolioAccountOutcome,
} from "./slice";

export const PORTFOLIO_SOURCE_ID = AccountDataSourceIdSchema.parse("portfolio");

export type PortfolioSourceOptions = {
  readonly runtime: PortfolioSourceRuntime;
  readonly ports: PortfolioPorts;
};

type Settled = PromiseSettledResult<AccountAssetBalance[]>;
type Outcome = Omit<PortfolioAccountOutcome, "at">;

const describe = (error: unknown) =>
  error instanceof Error ? `${error.name}: ${error.message}` : String(error);

const notServed = (outcome: Outcome["outcome"]): Settled => ({
  status: "rejected",
  reason: new AccountDataNotServedError(`Portfolio: ${outcome}`),
});

/** Why the service has nothing for an account; never a service account id, it holds the address. */
function missing(target: AccountTarget, portfolio: Portfolio, ids: readonly string[]): Outcome {
  if (strategyOf(target.descriptor)?.strategy.isNotServed(target.descriptor, portfolio)) {
    return {
      outcome: "failed",
      detail: `The service tracks no ${target.descriptor.network} account for it`,
      serverIds: ids,
      rows: 0,
    };
  }
  const statuses = (portfolio.accounts ?? [])
    .filter(account => ids.includes(account.id))
    .map(account => account.status);
  return {
    outcome: "pending",
    detail: statuses.length > 0 ? `Service account ${statuses.join(", ")}` : "Not created yet",
    serverIds: ids,
    rows: 0,
  };
}

/** The networks a recent listing has accounts on; undefined claims every network, so a read can probe. */
function listedNetworks(ports: PortfolioPorts): ReadonlySet<string> | undefined {
  const listing = selectPortfolioServer(ports.getState());
  if (!isFreshListing(listing)) return undefined;
  const networks = listing.portfolio.accounts?.map(account => account.network) ?? [];
  return networks.length > 0 ? new Set(networks) : undefined;
}

/** Balances from the Portfolio service; an account it cannot answer goes to the next ranked source. */
export function createPortfolioSource({
  runtime,
  ports,
}: PortfolioSourceOptions): AccountDataSource {
  async function read(targets: readonly AccountTarget[]) {
    const portfolio = await runtime.ensure(
      ports,
      targets.map(target => target.descriptor),
    );
    const serverIds = targets.map(
      target =>
        strategyOf(target.descriptor)?.strategy.accountIdsOf(target.descriptor, portfolio) ?? [],
    );
    const { groups, calls, truncated } = await runtime.balanceGroups(
      ports,
      new Set(serverIds.flat()),
    );
    const at = Date.now();
    const outcomes: Record<string, PortfolioAccountOutcome> = {};
    const settled = targets.map((target, index): Settled => {
      const ids = serverIds[index];
      const found = ids.flatMap(id => groups.get(id) ?? []);
      const failures = found.flatMap(group => ("error" in group ? [group.error] : []));
      const entries = found.flatMap(group => ("items" in group ? group.items : []));
      const mapped = toAccountBalances(target.descriptor, entries);
      const hasNative = mapped.rows[0]?.assetId === target.descriptor.network;
      if (found.length > 0 && failures.length === 0 && mapped.unreadable === 0 && hasNative) {
        outcomes[target.accountUUID] = {
          outcome: "ok",
          detail:
            mapped.unmapped > 0 ? `${mapped.unmapped} tokens without a CAL id left out` : undefined,
          serverIds: ids,
          rows: mapped.rows.length,
          at,
        };
        return { status: "fulfilled", value: mapped.rows };
      }
      // A partial balance would understate the account: the next source answers it whole.
      let outcome: Outcome;
      if (mapped.unreadable > 0) {
        outcome = {
          outcome: "failed",
          detail: `${mapped.unreadable} assets with an unreadable amount`,
          serverIds: ids,
          rows: 0,
        };
      } else if (found.length > 0 && failures.length === 0) {
        // No native coin in a successful group: not an answer the balance can be replaced with.
        outcome = {
          outcome: "pending",
          detail: "No native coin balance yet",
          serverIds: ids,
          rows: 0,
        };
      } else if (failures.length > 0) {
        outcome = { outcome: "failed", detail: failures.join("; "), serverIds: ids, rows: 0 };
      } else if (truncated) {
        outcome = {
          outcome: "failed",
          detail: "The balance scan stopped before it",
          serverIds: ids,
          rows: 0,
        };
      } else {
        outcome = missing(target, portfolio, ids);
      }
      outcomes[target.accountUUID] = { ...outcome, at };
      return notServed(outcome.outcome);
    });
    ports.dispatch(portfolioOutcomesRecorded(outcomes));
    const count = (kind: Outcome["outcome"]) =>
      Object.values(outcomes).filter(each => each.outcome === kind).length;
    return {
      value: settled,
      summary: `Balance of ${targets.length} accounts in ${calls} calls: ${count("ok")} ok, ${count("pending")} pending, ${count("failed")} failed`,
    };
  }

  // A failed service call fails no account: each one goes to the next ranked source.
  async function readBalances(targets: readonly AccountTarget[]): Promise<Settled[]> {
    try {
      return await runtime.logged(ports, "balance", () => read(targets));
    } catch (error) {
      const at = Date.now();
      const detail = describe(error);
      ports.dispatch(
        portfolioOutcomesRecorded(
          Object.fromEntries(
            targets.map(target => [
              target.accountUUID,
              { outcome: "failed" as const, detail, serverIds: [], rows: 0, at },
            ]),
          ),
        ),
      );
      return targets.map(() => notServed("failed"));
    }
  }

  return {
    id: PORTFOLIO_SOURCE_ID,
    supports: (descriptor, kind) =>
      kind === "balance" &&
      strategyOf(descriptor) !== undefined &&
      (listedNetworks(ports)?.has(descriptor.network) ?? true),
    maxBatchSize: 100,
    concurrency: 1,
    readBatch: { balance: readBalances },
  };
}
