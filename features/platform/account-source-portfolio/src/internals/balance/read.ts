import type { BalanceGroup, BalancePage } from "@domain/api-account-portfolio";
import type { PortfolioId } from "@domain/entity-client-identity";
import type { PortfolioClient } from "../../client";
import { PortfolioReadCancelledError } from "../portfolio";

/** Up to this many accounts, one filtered read each beats paging through the whole portfolio. */
const FILTERED_READS_UP_TO = 3;
const PAGE_SIZE = 100;
const MAX_PAGES = 50;

/** `truncated`: the scan stopped at its page cap with pages left. `failed`: accounts whose own filtered read failed or did not end. */
export type BalanceRead = {
  readonly groups: ReadonlyMap<string, BalanceGroup>;
  readonly truncated: boolean;
  readonly calls: number;
  readonly failed?: ReadonlySet<string>;
};

/** An account split over pages is one group; a failed group, told by its `error` even when it carries items, wins over the others. */
function mergeGroup(existing: BalanceGroup | undefined, group: BalanceGroup): BalanceGroup {
  if (!existing || "error" in existing) return existing ?? group;
  if ("error" in group) return group;
  return { ...existing, items: [...existing.items, ...group.items] };
}

type Paged = { readonly calls: number; readonly ended: boolean };

/** Reads pages from the first one until no token is left, the cap is hit, or `signal` aborts. */
async function readPages(
  read: (token: string | undefined) => Promise<BalancePage>,
  keep: (page: BalancePage) => void,
  signal: AbortSignal | undefined,
  token?: string,
  calls = 0,
): Promise<Paged> {
  if (signal?.aborted) throw new PortfolioReadCancelledError();
  const page = await read(token);
  keep(page);
  const next = page.nextToken ?? undefined;
  if (next === undefined) return { calls: calls + 1, ended: true };
  if (calls + 1 >= MAX_PAGES) return { calls: calls + 1, ended: false };
  return readPages(read, keep, signal, next, calls + 1);
}

const keeperOf = (groups: Map<string, BalanceGroup>) => (page: BalancePage) =>
  page.items.forEach(group =>
    groups.set(group.account_id, mergeGroup(groups.get(group.account_id), group)),
  );

/** One read per account, following its own page tokens. */
async function readEach(
  client: PortfolioClient,
  portfolioId: PortfolioId,
  serverIds: readonly string[],
  signal: AbortSignal | undefined,
  callsBefore = 0,
): Promise<BalanceRead> {
  const groups = new Map<string, BalanceGroup>();
  const keep = keeperOf(groups);
  let calls = callsBefore;
  const reads = await Promise.allSettled(
    serverIds.map(account =>
      readPages(
        token => {
          calls += 1;
          return client.getBalance(portfolioId, { account, size: PAGE_SIZE, token }, signal);
        },
        keep,
        signal,
      ),
    ),
  );
  const failed = new Set<string>();
  reads.forEach((read, index) => {
    if (read.status === "rejected" || !read.value.ended) failed.add(serverIds[index]);
  });
  return { groups, truncated: false, calls, failed };
}

/** Stops at `signal`: no page and no fallback starts once every reader has gone. */
export async function readBalanceGroups(
  client: PortfolioClient,
  portfolioId: PortfolioId,
  serverIds: readonly string[],
  signal?: AbortSignal,
): Promise<BalanceRead> {
  if (serverIds.length <= FILTERED_READS_UP_TO) {
    return readEach(client, portfolioId, serverIds, signal);
  }
  const groups = new Map<string, BalanceGroup>();
  let scanned = 0;
  try {
    const { calls, ended } = await readPages(
      token => {
        scanned += 1;
        return client.getBalance(portfolioId, { size: PAGE_SIZE, token }, signal);
      },
      keeperOf(groups),
      signal,
    );
    return { groups, truncated: !ended, calls };
  } catch {
    if (signal?.aborted) throw new PortfolioReadCancelledError();
    // The scan of a portfolio holding a heavy EVM address times out (504): one read per account still answers.
    return readEach(client, portfolioId, serverIds, signal, scanned);
  }
}
