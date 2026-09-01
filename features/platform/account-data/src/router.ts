import { UnservableSlicesError } from "./errors";
import type { AccountDataSource, AccountRef, AccountSlice } from "./port";

export type FetchLeg = { source: AccountDataSource; slices: AccountSlice[] };
export type FetchPlan = FetchLeg[];

const isSuperset = (
  candidate: ReadonlySet<AccountSlice>,
  of: ReadonlySet<AccountSlice>,
): boolean => {
  for (const slice of of) if (!candidate.has(slice)) return false;
  return true;
};

/**
 * Decide which sources serve which slices — a capability set-cover, cheapest source first.
 *
 * The subtlety worth reading twice: each leg removes the source's **deliveries** from what is still
 * wanted, not the slices it was picked for. A source that produces everything as a side effect of
 * running (a full account sync) therefore satisfies the whole remainder in one go, and no
 * lower-priority leg gets queued for data that is about to arrive anyway.
 *
 * Two consequences follow, and they are the whole point:
 * - asking only for `balance` on a chain with a granular API costs one HTTP call;
 * - asking for anything only a full sync can produce silently opts the request back into that sync —
 *   so a screen that asks for more than it needs pays for more than it needs, visibly.
 *
 * @throws {UnservableSlicesError} when nothing registered can cover what is left.
 */
export function planFetch(
  ref: AccountRef,
  wanted: ReadonlySet<AccountSlice>,
  sources: readonly AccountDataSource[],
): FetchPlan {
  const remaining = new Set(wanted);
  const plan: FetchPlan = [];
  const supporting = sources.filter(source => source.supports(ref));
  const byPriority = [...supporting].sort((a, b) => b.priority - a.priority);

  for (const source of byPriority) {
    if (remaining.size === 0) break;
    const covered = [...source.capabilities(ref)].filter(slice => remaining.has(slice));
    if (covered.length === 0) continue;
    plan.push({ source, slices: covered });
    for (const slice of source.deliveries(ref)) remaining.delete(slice);
  }

  if (remaining.size > 0) {
    const fallback = byPriority.find(source => isSuperset(source.deliveries(ref), remaining));
    if (!fallback) throw new UnservableSlicesError(ref.accountId, [...remaining]);
    plan.push({ source: fallback, slices: [...remaining] });
  }

  return prune(ref, plan);
}

/**
 * Drop any leg whose slices the surviving legs already deliver.
 *
 * The greedy pass above picks the cheapest source per slice before it knows a fallback will be
 * needed at all. Once the whole plan is known, a leg can turn out to be pure waste: asking a chain
 * for a balance while a full sync — queued for a slice only it can produce — is about to deliver
 * that same balance anyway. Legs are considered cheapest-first, because the cheap leg is the
 * avoidable one; the fallback is in the plan precisely because nothing else covers what it covers.
 */
function prune(ref: AccountRef, plan: FetchPlan): FetchPlan {
  const survivors = [...plan];
  for (const leg of plan) {
    const others = survivors.filter(candidate => candidate !== leg);
    if (others.length === 0) continue;
    const delivered = new Set(others.flatMap(candidate => [...candidate.source.deliveries(ref)]));
    if (leg.slices.every(slice => delivered.has(slice))) {
      survivors.splice(survivors.indexOf(leg), 1);
    }
  }
  return survivors;
}
