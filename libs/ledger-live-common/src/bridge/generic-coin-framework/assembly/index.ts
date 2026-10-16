import type { AssetInfo, Balance } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi, ChainReads } from "@ledgerhq/ledger-wallet-framework/api/types";
import {
  mergeOps,
  type AccountShapeInfo,
} from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { getDerivationScheme } from "@ledgerhq/ledger-wallet-framework/derivation";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { buildSubOperationIndex } from "@ledgerhq/ledger-wallet-framework/serialization";
import { log } from "@ledgerhq/logs";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type {
  Account,
  StakingResources,
  StakingValidatorItem,
  SyncConfig,
} from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { boundByTransaction } from "../boundByTransaction";
import { buildSubAccounts, mergeSubAccounts } from "../buildSubAccounts";
import type { FamilyData } from "../familyReads";
import type { OperationCommon } from "../types";
import { extractBalance, sumBalance } from "../utils";
import { buildParentOperations, isInternalLiveOp, relinkSubOperations } from "./parents";
import { hasStake, stakingShapeOf, type StakingPositionOnAccount } from "./staking";
import { isSyncFromScratch } from "./syncHash";
import {
  assetOperations,
  lateTokenBalances,
  vanishedTokenBalances,
  type TokenBalancesRead,
} from "./tokens";

/** What a sync read from the chain, whichever path read it. */
export type ChainSnapshot = {
  /** The network's balance list, in its order (getBalance): the first native balance is the account's own. */
  balances: Balance[];
  /** Listed by this sync: listedOperations(...) then adaptCoreOperationToLiveOperation. */
  newOperations: OperationCommon[];
  /**
   * Whether the listing stopped on the operation history bound (`paginateOperations`' `bounded`)
   * before finding out whether it reached back to the height it resumed from. Nothing stored is
   * then assumed contiguous with what it listed: the operations and the token operations stored
   * are discarded as on a sync from scratch, and the pending operations are not refreshed.
   */
  bounded: boolean;
  tipHeight: number;
  validators: StakingValidatorItem[];
  family: FamilyData;
};

export type AssemblyTarget = {
  info: AccountShapeInfo;
  syncConfig: SyncConfig;
  bridgeApi: BridgeApi;
  chain: ChainReads;
  accountId: string;
  syncHash: string;
  /** The token lookup of the sub-accounts; the family's `getTokenFromAsset` by default. */
  getTokenFromAsset?: (asset: AssetInfo) => Promise<TokenCurrency | undefined>;
  /**
   * The operation history bound (`resolveOperationHistoryBound`): the most operations the account
   * and each of its token accounts store, cut at a transaction boundary. Unbounded when undefined.
   */
  maxOperations?: number;
  /**
   * Reads the balances again for the tokens this sync listed without a balance entry
   * (`lateTokenBalances`). Only a path whose balance read can miss them passes it: the legacy one,
   * scoping its read to the tokens the account holds.
   */
  readTokenBalances?: TokenBalancesRead;
};

export type AssembledAccountShape = Partial<Account> & {
  stakingResources?: StakingResources;
  stakingPositions?: StakingPositionOnAccount[];
};

/** The stored operations under the account id of this sync (pre-framework ids are rewritten). */
function storedOperations(initialAccount: Account | undefined, accountId: string) {
  return ((initialAccount?.operations || []) as OperationCommon[]).map(op =>
    op.accountId === accountId
      ? op
      : { ...op, accountId, id: encodeOperationId(accountId, op.hash, op.type) },
  );
}

/**
 * The account an address family syncs, from what the chain says: the native balance and its stakes,
 * the token sub-accounts, the operations of this sync merged over the stored ones, and the family's
 * own fields. Both paths feed it, the legacy one from the coin module, the portfolio one from the
 * portfolio models; a family hook reads the chain through `chain` only.
 */
export async function assembleAccountShape(
  target: AssemblyTarget,
  snapshot: ChainSnapshot,
): Promise<AssembledAccountShape> {
  const { info, syncConfig, bridgeApi, chain, accountId, syncHash, maxOperations } = target;
  const { address, initialAccount, currency, derivationMode, rest } = info;
  const { balances, bounded, tipHeight, validators, family } = snapshot;
  const getTokenFromAsset = target.getTokenFromAsset ?? bridgeApi.getTokenFromAsset;

  const nativeAsset = bridgeApi.partitionsNativeBalance
    ? sumBalance(balances, "native")
    : extractBalance(balances, "native");
  const freshTokenBalances = balances.filter(b => b.asset.type !== "native");
  const allTokenAssetsBalances = [
    ...freshTokenBalances,
    ...vanishedTokenBalances(
      initialAccount,
      freshTokenBalances,
      bridgeApi.getAssetFromToken,
      address,
    ),
  ];

  const nativeBalance = nativeAsset.value;
  const spendableBalance = nativeBalance - (nativeAsset.locked ?? 0n);
  const staking = stakingShapeOf(
    balances.filter(hasStake).map(b => b.stake),
    validators,
    bridgeApi,
  );

  const oldOps = storedOperations(initialAccount, accountId);
  const syncFromScratch = isSyncFromScratch(initialAccount, syncHash);
  // A bounded round is treated as a from-scratch sync for both merges below: `bounded` means the
  // listing stopped before finding out whether it reached back to the stored history, so nothing
  // stored can be assumed contiguous with it. Merging anyway would leave a hole strictly between
  // the old watermark and wherever the bound cut, which nothing revisits: the next watermark
  // derives from this round's newest operation, past the hole. A bounded round always carries at
  // least one operation: both walks filter before the bound counts, and a bounded stop never
  // returns an empty list.
  const discardOld = syncFromScratch || bounded;

  const newOps = bridgeApi.adaptOperations
    ? (bridgeApi.adaptOperations(address, snapshot.newOperations) as OperationCommon[])
    : snapshot.newOperations;

  const newInternalOperations: OperationCommon[] = [];
  const newNonInternalOperations: OperationCommon[] = [];
  for (const op of newOps) {
    if (isInternalLiveOp(op)) newInternalOperations.push(op);
    else newNonInternalOperations.push(op);
  }

  const newAssetOperations = assetOperations(newOps);
  const lateBalances = target.readTokenBalances
    ? await lateTokenBalances(
        newAssetOperations,
        allTokenAssetsBalances,
        { getTokenFromAsset, getAssetFromToken: bridgeApi.getAssetFromToken },
        address,
        syncConfig.blacklistedTokenIds ?? [],
        target.readTokenBalances,
      )
    : [];

  const newSubAccounts = await buildSubAccounts({
    accountId,
    allTokenAssetsBalances: [...allTokenAssetsBalances, ...lateBalances],
    syncConfig,
    operations: newAssetOperations,
    getTokenFromAsset,
    familyShapes: family.tokenShapes,
  });
  // A from-scratch sync goes through the same merge with nothing stored, rather than around it:
  // the bound has to apply to the sub-accounts this sync creates too (a bounded walk hands back up
  // to the bound plus one page, and all of that overshoot can belong to a single token). A bounded
  // round empties each stored sub-account's operations rather than dropping the sub-account: an
  // empty stored list skips the carry-over of `pendingOperations`, `swapHistory`,
  // `balanceHistoryCache` and `creationDate` (`swapHistory` is local only, never re-derivable),
  // while emptied operations still keep the old rows out of the merge.
  const subAccounts = mergeSubAccounts(
    syncFromScratch
      ? []
      : (initialAccount?.subAccounts ?? []).map(sa =>
          discardOld ? { ...sa, operations: [] } : sa,
        ),
    newSubAccounts,
    maxOperations,
  );

  // From the bounded sub-accounts, not `newSubAccounts`: a restored account recomputes each
  // parent's sub-operations from the stored (bounded) ones, so the synced shape has to as well.
  // Confirmed rows only: a token transfer that just confirmed still has its optimistic row in
  // `pendingOperations` until `postSync` prunes it, and both rows would attach to the same parent.
  const subOperationIndex = buildSubOperationIndex(
    subAccounts.map(sa => ({ ...sa, pendingOperations: [] })),
  );
  const newOpsWithSubs = buildParentOperations(
    subOperationIndex,
    newNonInternalOperations,
    newInternalOperations,
    accountId,
    address,
  );
  // The pending operations broadcast and not listed by this sync, refreshed for chains without an
  // explorer. Not on a bounded round: it starts from an empty history, and a confirmation older
  // than the cut would sit below a gap nothing revisits. Those stay pending until a round reaches
  // them.
  const operationsToRefresh = bounded
    ? []
    : initialAccount?.pendingOperations.filter(
        pendingOp => pendingOp.hash && !newOpsWithSubs.some(newOp => pendingOp.hash === newOp.hash),
      );
  const confirmedOperations =
    bridgeApi.refreshOperations && operationsToRefresh?.length
      ? await bridgeApi.refreshOperations(operationsToRefresh, chain)
      : [];
  // A parent carried over from the stored ones keeps the sub-operations it was stored with, some
  // of which the token bound may just have evicted: relinked against the index the new parents
  // use, so every retained parent points at what is actually stored.
  const mergedOperations = mergeOps(
    discardOld ? [] : relinkSubOperations(oldOps, subOperationIndex),
    [...confirmedOperations, ...newOpsWithSubs],
  ) as OperationCommon[];
  // Store bound: `mergeOps` returns newest first, so keeping the head keeps the newest (and the
  // next sync's `minHeight`, derived from the newest stored operation). Cut on transactions rather
  // than on a row index: a self-send is two top-level rows, and a flat slice could keep one only.
  const operations = boundByTransaction(mergedOperations, maxOperations);

  const { stakingResources, stakingPositions, delegationsCount, unbondingsCount } = staking;
  const stakingEnabled =
    bridgeApi.stakingSupported ?? (delegationsCount > 0 || unbondingsCount > 0);
  const enrichedStakingResources =
    stakingEnabled && bridgeApi.enrichStakingResources && stakingResources
      ? await bridgeApi
          .enrichStakingResources(currency, address, operations, stakingResources, chain)
          .catch(e => {
            log(
              "generic-coin-framework",
              "enrichStakingResources failed, falling back to base staking resources",
              { error: e instanceof Error ? e.message : String(e) },
            );
            return stakingResources;
          })
      : stakingResources;

  let stakingShape: Pick<AssembledAccountShape, "stakingResources" | "stakingPositions"> = {};
  if (stakingPositions) {
    stakingShape = { stakingPositions };
  } else if (stakingEnabled) {
    stakingShape = { stakingResources: enrichedStakingResources };
  }

  // A shared xpub makes `sameAccountIdentity` merge the accounts.
  const isXpubShared =
    bridgeApi.addressLookup !== undefined &&
    !getDerivationScheme({ derivationMode, currency }).includes("<account>");

  return {
    ...family.familyShape,
    id: accountId,
    // `||` (not `??`): a device getAddress may return an empty-string publicKey (e.g. when the
    // chain code is not requested); treat "" as absent and fall back rather than storing a blank xpub.
    xpub: isXpubShared ? undefined : rest?.publicKey || initialAccount?.xpub || address,
    blockHeight: operations.length === 0 ? 0 : tipHeight || initialAccount?.blockHeight,
    balance: new BigNumber(nativeBalance.toString()),
    spendableBalance: new BigNumber(spendableBalance.toString()),
    operations,
    subAccounts,
    // The retained count once a bound applies, not the account's true count: kept consistent with
    // what is displayed, with no source of truth for the real one.
    operationsCount: operations.length,
    syncHash,
    // key omitted rather than set to undefined: jsHelpers merges `{ ...a, ...shape }`, so a failed
    // readiness lookup retains the last persisted value instead of clearing it.
    ...(family.readiness !== undefined ? { readiness: family.readiness } : {}),
    ...(family.sequence !== undefined ? { sequence: family.sequence } : {}),
    ...stakingShape,
  };
}
