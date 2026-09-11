import type { AccountBalance } from "@domain/entity-account-balance";
import type { AccountId } from "@domain/entity-account";
import { NoAccountSourceError } from "./errors";

export type AccountRef = {
  accountId: AccountId;
  currencyId: string;
  address: string;
  derivationMode: string;
};

/** Identity of a ref: two refs with the same key ask the same question of the same source. */
export const refKeyOf = (ref: AccountRef): string =>
  [ref.accountId, ref.currencyId, ref.address, ref.derivationMode].join("|");

export type AccountSource = {
  readonly id: string;
  readonly priority: number;
  supports(ref: AccountRef): boolean;
};

export type AccountBalanceSource = AccountSource & {
  getBalances(ref: AccountRef, signal?: AbortSignal): Promise<AccountBalance[]>;
};

export function pickSource<S extends AccountSource>(
  ref: AccountRef,
  sources: readonly S[],
): S | undefined {
  let best: S | undefined;
  for (const source of sources) {
    if (!source.supports(ref)) continue;
    if (!best || source.priority > best.priority) best = source;
  }
  return best;
}

export async function readAccountBalances(
  ref: AccountRef,
  sources: readonly AccountBalanceSource[],
  signal?: AbortSignal,
): Promise<{ balances: AccountBalance[]; sourceId: string }> {
  const source = pickSource(ref, sources);
  if (!source) throw new NoAccountSourceError(ref.accountId, "balance");
  return { balances: await source.getBalances(ref, signal), sourceId: source.id };
}
