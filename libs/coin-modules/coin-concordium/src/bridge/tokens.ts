import BigNumber from "bignumber.js";
import { emptyHistoryCache, encodeTokenAccountId } from "@ledgerhq/ledger-wallet-framework/account";
import { mergeOps } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { promiseAllBatched } from "@ledgerhq/coin-module-framework/promises";
import { log } from "@ledgerhq/logs";
import type { TokenAccount } from "@ledgerhq/types-live";
import type { TokenCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import { getAccountListStatus, isDecodedPltState } from "../network/plt";
import type {
  ConcordiumAccount,
  ConcordiumResources,
  ConcordiumTokenResources,
  PltAccountToken,
  PltTransferStatus,
} from "../types";

const CAL_LOOKUP_CONCURRENCY = 4;

/**
 * Result of one sync's token resolution.
 *
 * Discriminated rather than nullable so that a caller cannot conflate "the
 * chain says this account holds nothing" with "we learned nothing this round" —
 * the difference between clearing an account's tokens and preserving them.
 */
export type ResolvedTokens =
  | { kind: "cleared" }
  | { kind: "unchanged" }
  | {
      kind: "resolved";
      subAccounts: TokenAccount[];
      tokens: Record<string, ConcordiumTokenResources>;
    };

/**
 * Removes `subAccounts` entirely once the account shape has been applied.
 *
 * The shape cannot do this itself: `exactOptionalPropertyTypes` forbids an
 * explicit `undefined`, and omitting the key makes the shallow spread in
 * `makeSync` keep the previous array — the opposite of clearing. Running after
 * that spread is what lets the key be dropped rather than emptied.
 *
 * It matters because `[]` is not inert. Desktop `TokensList` bails on a falsy
 * `subAccounts`, but an empty array passes that guard and, once the currency
 * declares `tokenTypes`, renders the token section and its receive affordance —
 * for a feature that is switched off.
 */
export function stripSubAccounts<A extends { subAccounts?: TokenAccount[] }>(account: A): A {
  if (!("subAccounts" in account)) return account;
  const { subAccounts: _dropped, ...rest } = account;
  return rest as A;
}

/**
 * Turns a {@link ResolvedTokens} into the `subAccounts` slice of an account
 * shape.
 *
 * Omitting the key is not the same as emptying it: `makeSync` spreads the shape
 * over the previous account, so only `unchanged` may omit. `cleared` empties,
 * and {@link stripSubAccounts} drops the key afterwards.
 */
export function subAccountsPatch(resolved: ResolvedTokens): { subAccounts?: TokenAccount[] } {
  switch (resolved.kind) {
    case "resolved":
      return { subAccounts: resolved.subAccounts };
    case "cleared":
      return { subAccounts: [] };
    case "unchanged":
      return {};
  }
}

/**
 * Applies a {@link ResolvedTokens} to the account's resources.
 *
 * Clearing removes the key rather than setting it to `undefined`, matching
 * `copyResources`, which omits an undefined `tokens` on save.
 */
export function applyTokensToResources(
  resources: ConcordiumResources,
  resolved: ResolvedTokens,
): ConcordiumResources {
  switch (resolved.kind) {
    case "resolved":
      return { ...resources, tokens: resolved.tokens };
    case "cleared": {
      const { tokens: _cleared, ...withoutTokens } = resources;
      return withoutTokens;
    }
    case "unchanged":
      return resources;
  }
}

function buildTokenAccount(
  id: string,
  parentId: string,
  token: TokenCurrency,
  balance: BigNumber,
): TokenAccount {
  return {
    type: "TokenAccount",
    id,
    parentId,
    token,
    balance,
    spendableBalance: balance,
    creationDate: new Date(),
    operations: [],
    operationsCount: 0,
    pendingOperations: [],
    balanceHistoryCache: emptyHistoryCache,
    swapHistory: [],
  };
}

/**
 * Folds pause state and both list rules into the single verdict the send path
 * reads.
 *
 * Not interchangeable with `getAccountListStatus`, which answers only the list
 * half. The two share a shape, so assigning one to the other compiles and would
 * let a paused token through.
 */
function resolveTransferStatus(entry: PltAccountToken): PltTransferStatus {
  const moduleState = entry.token.tokenState.moduleState;
  if (!isDecodedPltState(moduleState)) return "unknown";
  if (moduleState.paused === true) return "blocked";
  return getAccountListStatus(entry);
}

/**
 * Checks the fields this module dereferences before it reads them.
 *
 * `Array.isArray` establishes the container, not the entries, and the response
 * is not schema-checked. Validating here costs one token; throwing on a nested
 * access costs the whole account sync.
 */
function isUsableEntry(entry: PltAccountToken): boolean {
  return (
    typeof entry?.token?.tokenId === "string" &&
    entry.token.tokenId.length > 0 &&
    typeof entry.token.tokenState?.decimals === "number"
  );
}

function readPaused(entry: PltAccountToken): boolean | undefined {
  const moduleState = entry.token.tokenState.moduleState;
  return isDecodedPltState(moduleState) ? moduleState.paused : undefined;
}

/**
 * Merges freshly built sub-accounts onto the previous ones, keyed by
 * sub-account id.
 *
 * Only the listed properties are taken from the new object, so anything the
 * previous sync established and this one does not know about survives. Notably
 * `balanceHistoryCache` is preserved: `recalculateAccountBalanceHistories`
 * regenerates a sub-account's cache only when it is reference-identical to the
 * previous one, so replacing it every sync would defeat that check.
 *
 * Unlike the coin-hedera helper this is modelled on, a previous sub-account
 * absent from `newSubAccounts` is dropped rather than carried forward. Callers
 * must therefore only reach this with an authoritative token list — see
 * {@link resolveTokenSubAccounts}.
 *
 * `keepIds` is the exception: ids listed there survive even when absent. It
 * carries tokens the chain still reports but this sync could not trust, so that
 * a data fault is never expressed as the account no longer holding the asset.
 */
export function mergeSubAccounts(
  previous: TokenAccount[] | undefined,
  newSubAccounts: TokenAccount[],
  keepIds: ReadonlySet<string> = new Set(),
): TokenAccount[] {
  if (!previous?.length) return newSubAccounts;

  const previousById = new Map(previous.map(sub => [sub.id, sub]));

  const merged = newSubAccounts.map(newSubAccount => {
    const old = previousById.get(newSubAccount.id);
    if (!old) return newSubAccount;

    const operations = mergeOps(old.operations, newSubAccount.operations);

    return {
      ...old,
      // Taken from the new object: CAL is the source of token metadata, and a
      // renamed or re-denominated token must not keep the stored copy.
      token: newSubAccount.token,
      balance: newSubAccount.balance,
      spendableBalance: newSubAccount.spendableBalance,
      operations,
      operationsCount: operations.length,
    };
  });

  const mergedIds = new Set(merged.map(sub => sub.id));
  const kept = previous.filter(sub => keepIds.has(sub.id) && !mergedIds.has(sub.id));

  return [...merged, ...kept];
}

type ResolvedEntry =
  | { entry: PltAccountToken; token: TokenCurrency; tokenId: string; balance: BigNumber }
  | { untrusted: string; tokenId: string }
  | undefined;

/**
 * Resolves to `undefined` when the lookup itself failed, which is distinct from
 * an entry resolving to `undefined` because the token is not curated.
 */
function resolveEntries({
  accountTokens,
  currencyId,
  accountId,
  blacklistedTokenIds,
}: {
  accountTokens: PltAccountToken[];
  currencyId: string;
  accountId: string;
  blacklistedTokenIds: string[];
}): Promise<ResolvedEntry[] | undefined> {
  return promiseAllBatched(
    CAL_LOOKUP_CONCURRENCY,
    accountTokens,
    async (entry: PltAccountToken): Promise<ResolvedEntry> => {
      if (!isUsableEntry(entry)) {
        log("concordium-sync", "PLT entry is malformed, skipping it and continuing the sync");
        return undefined;
      }

      const tokenId = entry.token.tokenId;
      const token = await getCryptoAssetsStore().findTokenByAddressInCurrency(tokenId, currencyId);

      if (!token) {
        log("concordium-sync", `PLT ${tokenId} is not in the CAL, skipping`);
        return undefined;
      }

      // A user-hidden token is a deliberate absence, so it drops like an
      // uncurated one rather than being preserved.
      if (blacklistedTokenIds.includes(token.id)) {
        return undefined;
      }

      // Balances arrive in the smallest unit, so both cases below leave the
      // amount undenominable. Both preserve the existing sub-account rather
      // than dropping it — a data fault must not read as a vanished asset — and
      // are logged separately because the remedies differ.
      const chainDecimals = entry.token.tokenState.decimals;
      const calMagnitude = token.units[0]?.magnitude;

      if (calMagnitude === undefined) {
        log(
          "concordium-sync",
          `PLT ${tokenId} has no CAL unit to denominate it, keeping the previous sub-account`,
        );
        return { untrusted: encodeTokenAccountId(accountId, token), tokenId };
      }

      if (calMagnitude !== chainDecimals) {
        log(
          "concordium-sync",
          `PLT ${tokenId} decimals mismatch: CAL ${calMagnitude}, chain ${chainDecimals}, keeping the previous sub-account`,
        );
        return { untrusted: encodeTokenAccountId(accountId, token), tokenId };
      }

      // An absent or non-numeric balance would otherwise reach BigNumber and
      // produce a NaN sub-account, which renders as a broken amount rather than
      // as an error.
      const balance = new BigNumber(entry.tokenAccountState?.balance?.value);
      if (!balance.isFinite()) {
        log(
          "concordium-sync",
          `PLT ${tokenId} has an unusable balance, keeping the previous sub-account`,
        );
        return { untrusted: encodeTokenAccountId(accountId, token), tokenId };
      }

      return { entry, token, tokenId, balance };
    },
  ).catch((error: unknown) => {
    log("concordium-sync", "PLT metadata lookup failed, keeping known tokens", { error });
    return undefined;
  });
}

/**
 * Builds the token sub-accounts and the per-token state for one sync.
 *
 * Only an actual array is authoritative enough to drop a token the account no
 * longer holds. Anything else preserves, because the absent list is reachable
 * on an HTTP 200: `getAccountBalance` performs no runtime validation, so a
 * response omitting `accountTokens` satisfies the declared type while carrying
 * nothing, and reading that as empty would delete every sub-account and its
 * operations.
 */
export async function resolveTokenSubAccounts({
  enableTokens,
  currencyId,
  accountId,
  accountTokens,
  initialAccount,
  blacklistedTokenIds = [],
}: {
  enableTokens: boolean;
  currencyId: string;
  accountId: string;
  accountTokens: PltAccountToken[] | undefined;
  initialAccount: ConcordiumAccount | undefined;
  blacklistedTokenIds?: string[];
}): Promise<ResolvedTokens> {
  if (!enableTokens) {
    return { kind: "cleared" };
  }

  if (!Array.isArray(accountTokens)) {
    log("concordium-sync", "PLT token list absent from the balance response, keeping known tokens");
    return { kind: "unchanged" };
  }

  const resolved = await resolveEntries({
    accountTokens,
    currencyId,
    accountId,
    blacklistedTokenIds,
  });

  // A CAL query error rejects rather than returning undefined, and one rejection
  // fails the whole batch. `getAccountShape` only logs and rethrows, so letting
  // it escape would discard an already-fetched CCD sync because a secondary
  // metadata service was down.
  if (resolved === undefined) {
    return { kind: "unchanged" };
  }

  const newSubAccounts: TokenAccount[] = [];
  const tokens: Record<string, ConcordiumTokenResources> = {};
  const untrustedIds = new Set<string>();
  const seenIds = new Set<string>();

  for (const item of resolved) {
    if (!item) continue;

    if ("untrusted" in item) {
      untrustedIds.add(item.untrusted);

      // The sub-account survives through `keepIds`, but the resources map is
      // rebuilt wholesale, so its prior entry has to be carried over with it.
      // Otherwise the send path sees a visible token with no transferStatus.
      const priorState = initialAccount?.concordiumResources?.tokens?.[item.tokenId];
      if (priorState) tokens[item.tokenId] = priorState;
      continue;
    }

    const { entry, token, tokenId, balance } = item;
    const subAccountId = encodeTokenAccountId(accountId, token);

    // A duplicate id would otherwise produce two sub-accounts for one token,
    // which the merge cannot reconcile. Only a malformed snapshot can cause it.
    if (seenIds.has(subAccountId)) {
      log("concordium-sync", `PLT ${tokenId} appears more than once, ignoring the repeat`);
      continue;
    }
    seenIds.add(subAccountId);

    newSubAccounts.push(buildTokenAccount(subAccountId, accountId, token, balance));

    const paused = readPaused(entry);
    tokens[tokenId] = {
      transferStatus: resolveTransferStatus(entry),
      ...(paused === undefined ? {} : { paused }),
    };
  }

  return {
    kind: "resolved",
    subAccounts: mergeSubAccounts(initialAccount?.subAccounts, newSubAccounts, untrustedIds),
    tokens,
  };
}
