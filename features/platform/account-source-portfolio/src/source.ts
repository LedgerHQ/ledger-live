import type { Portfolio } from "@domain/api-account-portfolio";
import type { AccountDataSource, AccountTarget } from "@domain/api-account-data";
import type { AccountAssetBalance } from "@domain/entity-account-balance";
import { AccountDataSourceIdSchema } from "@domain/entity-account-data";
import { PortfolioAccountNotServedError, PortfolioAccountPendingError } from "./errors";
import { toAccountBalances } from "./internals/balances";
import { readBalanceGroups } from "./internals/groups";
import { strategyOf } from "./registration";
import type { PortfolioPorts, PortfolioSourceRuntime } from "./runtime";
import {
  portfolioOutcomesRecorded,
  selectPortfolioId,
  selectPortfolioServer,
  type PortfolioAccountOutcome,
} from "./slice";

export const PORTFOLIO_SOURCE_ID = AccountDataSourceIdSchema.parse("portfolio");

export type PortfolioSourceOptions = {
  readonly runtime: PortfolioSourceRuntime;
  readonly ports: PortfolioPorts;
};

type Settled = PromiseSettledResult<AccountAssetBalance[]>;

/** Why the service has nothing for an account it was asked about. */
function missingReason(
  target: AccountTarget,
  portfolio: Portfolio,
  serverIds: readonly string[],
  truncated: boolean,
): Error {
  if (truncated) return new Error("The balance read stopped before reaching this account");
  if (strategyOf(target.descriptor)?.strategy.isNotServed(target.descriptor, portfolio)) {
    return new PortfolioAccountNotServedError(
      `The service tracks no ${target.descriptor.network} account for this registration`,
    );
  }
  // Statuses only: a service account id holds the address, and this message reaches the logs.
  const statuses = (portfolio.accounts ?? [])
    .filter(account => serverIds.includes(account.id))
    .map(account => account.status);
  return new PortfolioAccountPendingError(
    statuses.length > 0
      ? `Service account ${statuses.join(", ")}`
      : "Not created by the service yet",
  );
}

/** The networks the service listed accounts on, or undefined before it listed any. */
function listedNetworks(portfolio: Portfolio | undefined): ReadonlySet<string> | undefined {
  const networks = portfolio?.accounts?.map(account => account.network) ?? [];
  return networks.length > 0 ? new Set(networks) : undefined;
}

/** Balances from the Portfolio service: each batch registers what is missing, then reads in few calls. */
export function createPortfolioSource({
  runtime,
  ports,
}: PortfolioSourceOptions): AccountDataSource {
  async function readBatch(targets: readonly AccountTarget[]): Promise<Settled[]> {
    return runtime.logged(ports, "balance", async () => {
      const { portfolioId, portfolio } = await runtime.ensure(
        ports,
        targets.map(target => target.descriptor),
      );
      const serverIds = targets.map(
        target =>
          strategyOf(target.descriptor)?.strategy.accountIdsOf(target.descriptor, portfolio) ?? [],
      );
      const { groups, calls, truncated } = await readBalanceGroups(
        runtime.client(ports),
        portfolioId,
        new Set(serverIds.flat()),
      );
      const at = Date.now();
      const outcomes: Record<string, PortfolioAccountOutcome> = {};
      const settled = targets.map((target, index): Settled => {
        const ids = serverIds[index];
        const found = ids.flatMap(id => groups.get(id) ?? []);
        const entries = found.flatMap(group => ("items" in group ? group.items : []));
        const failures = found.flatMap(group => ("error" in group ? [group.error] : []));
        let result: Settled;
        // One failed group makes the balance partial: no total is better than an understated one.
        if (found.length > 0 && failures.length === 0) {
          const { rows, skipped } = toAccountBalances(target.descriptor, entries);
          result = { status: "fulfilled", value: rows };
          outcomes[target.accountUUID] = {
            outcome: "ok",
            detail:
              skipped > 0
                ? `${skipped} entries left out: no CAL id or unreadable amount`
                : undefined,
            serverIds: ids,
            rows: rows.length,
            at,
          };
        } else {
          const reason =
            failures.length > 0
              ? new Error(`The service failed ${failures.length} balance read(s) of this account`)
              : missingReason(target, portfolio, ids, truncated);
          result = { status: "rejected", reason };
          outcomes[target.accountUUID] = {
            outcome: reason instanceof PortfolioAccountPendingError ? "pending" : "failed",
            detail: failures.length > 0 ? failures.join("; ") : `${reason.name}: ${reason.message}`,
            serverIds: ids,
            rows: 0,
            at,
          };
        }
        return result;
      });
      ports.dispatch(portfolioOutcomesRecorded({ portfolioId, outcomes }));
      const count = (outcome: PortfolioAccountOutcome["outcome"]) =>
        Object.values(outcomes).filter(each => each.outcome === outcome).length;
      return {
        value: settled,
        summary: `Balance of ${targets.length} accounts in ${calls} calls: ${count("ok")} ok, ${count("pending")} pending, ${count("failed")} failed`,
      };
    });
  }

  // A failed service call fails the batch: its accounts say so, rather than keep an older outcome.
  async function readBalances(targets: readonly AccountTarget[]): Promise<Settled[]> {
    try {
      return await readBatch(targets);
    } catch (error) {
      const portfolioId = selectPortfolioId(ports.getState());
      if (portfolioId) {
        const detail = error instanceof Error ? `${error.name}: ${error.message}` : "Unknown error";
        const at = Date.now();
        const outcomes = Object.fromEntries(
          targets.map(target => [
            target.accountUUID,
            { outcome: "failed" as const, detail, serverIds: [], rows: 0, at },
          ]),
        );
        ports.dispatch(portfolioOutcomesRecorded({ portfolioId, outcomes }));
      }
      throw error;
    }
  }

  return {
    id: PORTFOLIO_SOURCE_ID,
    supports: (descriptor, kind) =>
      kind === "balance" &&
      strategyOf(descriptor) !== undefined &&
      (listedNetworks(selectPortfolioServer(ports.getState())?.portfolio)?.has(
        descriptor.network,
      ) ??
        true),
    maxBatchSize: 100,
    concurrency: 1,
    readBatch: { balance: readBalances },
  };
}
