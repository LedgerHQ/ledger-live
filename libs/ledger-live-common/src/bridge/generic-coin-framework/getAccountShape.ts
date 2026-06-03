import { encodeAccountId, getSyncHash } from "@ledgerhq/ledger-wallet-framework/account/index";
import { GetAccountShape, mergeOps } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { log } from "@ledgerhq/logs";
import BigNumber from "bignumber.js";
import groupBy from "lodash/groupBy";
import { getCoinModuleApi } from "./api";
import { getBridgeApi } from "./bridge";
import { adaptCoreOperationToLiveOperation, cleanedOperation, extractBalance } from "./utils";
import { inferSubOperations } from "@ledgerhq/ledger-wallet-framework/serialization";
import { buildSubAccounts, mergeSubAccounts } from "./buildSubAccounts";
import type { Balance, Operation, Stake } from "@ledgerhq/coin-module-framework/api/types";
import type { OperationCommon } from "./types";
import type {
  Account,
  StakingDelegation,
  StakingResources,
  StakingUnbonding,
  TokenAccount,
} from "@ledgerhq/types-live";

function isNftCoreOp(operation: Operation): boolean {
  return (
    typeof operation.details?.ledgerOpType === "string" &&
    ["NFT_IN", "NFT_OUT"].includes(operation.details?.ledgerOpType)
  );
}

function isIncomingCoreOp(operation: Operation): boolean {
  const type =
    typeof operation.details?.ledgerOpType === "string"
      ? operation.details.ledgerOpType
      : operation.type;

  return type === "IN";
}

function isInternalLiveOp(operation: OperationCommon): boolean {
  return !!operation.extra?.internal;
}

function hasStake(balance: Balance): balance is Balance & { stake: Stake } {
  return balance.stake !== undefined;
}

function hasActiveStake(balance: Balance): balance is Balance & {
  stake: Stake & { state: "active" | "activating" };
} {
  return balance.stake !== undefined && ["active", "activating"].includes(balance.stake.state);
}

function hasDeactivatingStake(balance: Balance): balance is Balance & {
  stake: Stake & { state: "deactivating" };
} {
  return balance.stake !== undefined && balance.stake.state === "deactivating";
}

function hasStakeDelegate<T extends Balance & { stake: Stake }>(
  balance: T,
): balance is T & { stake: Stake & { delegate: string } } {
  return typeof balance.stake.delegate === "string" && balance.stake.delegate.length > 0;
}

function delegatedAmountForStakingResources(b: Balance): bigint {
  return b.stake?.amount ?? 0n;
}

/**
 * On-Account shape for `stakingPositions`: framework `Stake` with `bigint`
 * amounts converted to `BigNumber`, matching the convention used elsewhere on
 * the Account (`balance`, `spendableBalance`, `stakingResources.*`).
 */
type StakingPositionOnAccount = Omit<Stake, "amount" | "amountDeposited" | "amountRewarded"> & {
  amount: BigNumber;
  amountDeposited?: BigNumber;
  amountRewarded?: BigNumber;
};

function toStakingPositionOnAccount(stake: Stake): StakingPositionOnAccount {
  const { amount, amountDeposited, amountRewarded, ...rest } = stake;
  return {
    ...rest,
    amount: new BigNumber(amount.toString()),
    ...(amountDeposited !== undefined && {
      amountDeposited: new BigNumber(amountDeposited.toString()),
    }),
    ...(amountRewarded !== undefined && {
      amountRewarded: new BigNumber(amountRewarded.toString()),
    }),
  };
}

/** True when the op is a main-account (native) op, not a token/sub-account op */
function isNativeLiveOp(operation: OperationCommon): boolean {
  const assetReference = operation.extra?.assetReference;
  const assetOwner = operation.extra?.assetOwner;
  const hasAssetReference = typeof assetReference === "string" && assetReference.length > 0;
  const hasAssetOwner = typeof assetOwner === "string" && assetOwner.length > 0;

  // Native ops are those that do not have a non-empty asset reference/owner
  return !(hasAssetReference || hasAssetOwner);
}

/**
 * Parent recipients for token-only ops: use the token contract (assetReference), not the token transfer recipient.
 */
function getTokenContract(op: OperationCommon): string | undefined {
  const ref = op.extra?.assetReference;
  return typeof ref === "string" && ref.length > 0 ? ref : undefined;
}

/** Get the fee payer for this tx from the op (from API/extra). */
function getFeePayer(op: OperationCommon): string | undefined {
  const fp = op.extra?.feePayer;
  return typeof fp === "string" && fp.length > 0 ? fp : undefined;
}

/** Compare two addresses for equality, ignoring case. */
function isSameAddress(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

/** True when the native op is outbound with value equal to fee (fees-only). */
function isFeesOnlyNativeOp(op: OperationCommon): boolean {
  return op.type === "OUT" && op.value !== null && op.fee != null && op.value.eq(op.fee);
}

/** Emit one parent op per native op: FEES when fees-only, otherwise passthrough. */
function parentOpsFromNativeOps(
  nativeOps: OperationCommon[],
  accountId: string,
  subOperations: OperationCommon[],
  internalOperations: OperationCommon[],
): OperationCommon[] {
  const out: OperationCommon[] = [];
  for (const nativeOp of nativeOps) {
    // Native outgoing operation with value 0 (only fees) => output as single FEES op
    if (isFeesOnlyNativeOp(nativeOp)) {
      out.push(
        cleanedOperation({
          id: encodeOperationId(accountId, nativeOp.hash, "FEES"),
          hash: nativeOp.hash,
          accountId,
          type: "FEES",
          value: nativeOp.fee,
          fee: nativeOp.fee,
          blockHash: nativeOp.blockHash,
          blockHeight: nativeOp.blockHeight,
          senders: nativeOp.senders,
          recipients: nativeOp.recipients,
          date: nativeOp.date,
          transactionSequenceNumber: nativeOp.transactionSequenceNumber,
          hasFailed: nativeOp.hasFailed,
          extra: nativeOp.extra,
          subOperations,
          internalOperations,
        }),
      );
    }
    // Otherwise, don't transform the operation
    else {
      out.push(
        cleanedOperation({
          ...nativeOp,
          subOperations,
          internalOperations,
        }),
      );
    }
  }
  return out;
}

/** One synthetic FEES or NONE parent when the tx has no native ops (e.g. token-only). */
function syntheticParentForTokenOnlyTx(
  referenceOp: OperationCommon,
  accountId: string,
  address: string,
  subOperations: OperationCommon[],
  internalOperations: OperationCommon[],
): OperationCommon {
  // Parent operation is of type FEES if account has paid fees for the transaction, NONE otherwise.
  const feePayer = getFeePayer(referenceOp);
  const isFeePayer = feePayer !== undefined && isSameAddress(address, feePayer);
  const parentType = isFeePayer ? "FEES" : "NONE";
  const parentValue = isFeePayer ? referenceOp.fee : new BigNumber(0);
  // In the case of smart contract interaction, the contract must be the recipient of the parent operation => this
  // is why we need to extract this information from the operation details.
  const contract = getTokenContract(referenceOp);
  const parentRecipients = contract === undefined ? (referenceOp.recipients ?? []) : [contract];
  const parentSenders = referenceOp.senders ?? [];
  return cleanedOperation({
    id: encodeOperationId(accountId, referenceOp.hash, parentType),
    hash: referenceOp.hash,
    accountId,
    type: parentType,
    value: parentValue,
    fee: referenceOp.fee,
    blockHash: referenceOp.blockHash,
    blockHeight: referenceOp.blockHeight,
    senders: parentSenders,
    recipients: parentRecipients,
    date: referenceOp.date,
    transactionSequenceNumber: referenceOp.transactionSequenceNumber,
    hasFailed: referenceOp.hasFailed,
    extra: referenceOp.extra,
    subOperations,
    internalOperations,
  });
}

/** Parent op(s) for a tx that has non-internal ops (native and/or token). */
function parentOpsForTxWithNonInternalOperations(
  hash: string,
  transactionOps: OperationCommon[],
  internalOperations: OperationCommon[],
  newSubAccounts: TokenAccount[],
  accountId: string,
  address: string,
): OperationCommon[] {
  const nativeOps = transactionOps.filter(isNativeLiveOp);
  // inferSubOperations returns types-live Operation[]; we use OperationCommon in this bridge
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- framework type vs bridge type
  const subOperations = inferSubOperations(hash, newSubAccounts) as OperationCommon[];

  // If transaction has native ops, use them as parents
  if (nativeOps.length > 0)
    return parentOpsFromNativeOps(nativeOps, accountId, subOperations, internalOperations);

  // If transaction has no native ops, create a synthetic parent
  const firstOp = transactionOps[0];
  return [
    syntheticParentForTokenOnlyTx(firstOp, accountId, address, subOperations, internalOperations),
  ];
}

/**
 * Synthetic NONE parent for a tx that has only internal ops (e.g. contract transfer from B to C).
 * This case happens when an address A calls a smart contract, that performs a transfer from B to C,
 * seen from B or C's perspective. The parent operation is of type NONE, with A as the sender
 * (empty if unknown) and the contract as the recipient. Internal ops are attached to the NONE parent,
 * not emitted as additional top-level operations.
 */
function parentOpsForTxWithOnlyInternalOperations(
  hash: string,
  internalOperations: OperationCommon[],
  newSubAccounts: TokenAccount[],
  accountId: string,
): OperationCommon[] {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- framework type vs bridge type
  const subOperations = inferSubOperations(hash, newSubAccounts) as OperationCommon[];
  const firstInternal = internalOperations[0];
  if (!firstInternal) return [];

  const feePayer = getFeePayer(firstInternal);
  return [
    cleanedOperation({
      id: encodeOperationId(accountId, hash, "NONE"),
      hash,
      accountId,
      type: "NONE",
      value: new BigNumber(0),
      fee: firstInternal.fee,
      blockHash: firstInternal.blockHash,
      blockHeight: firstInternal.blockHeight,
      senders: feePayer ? [feePayer] : [],
      recipients: firstInternal.senders,
      date: firstInternal.date,
      transactionSequenceNumber: firstInternal.transactionSequenceNumber,
      hasFailed: firstInternal.hasFailed,
      extra: firstInternal.extra,
      subOperations,
      internalOperations,
    }),
  ];
}

/**
 * Emit parent operations per tx hash: one top-level operation per transaction for normal transactions,
 * two for self-sends (IN + OUT). Internal-only transactions produce a single NONE parent with internal
 * ops attached, not emitted as additional top-level operations.
 */
function buildParentOperations(
  newSubAccounts: TokenAccount[],
  newNonInternalOperations: OperationCommon[],
  newInternalOperations: OperationCommon[],
  accountId: string,
  address: string,
): OperationCommon[] {
  const nonInternalByHash = groupBy(newNonInternalOperations, "hash");
  const internalByHash = groupBy(newInternalOperations, "hash");

  const result: OperationCommon[] = [];

  // Inspect non-internal ops first to create parent ops
  for (const [hash, transactionOps] of Object.entries(nonInternalByHash)) {
    const internalOperations = internalByHash[hash] ?? [];
    result.push(
      ...parentOpsForTxWithNonInternalOperations(
        hash,
        transactionOps,
        internalOperations,
        newSubAccounts,
        accountId,
        address,
      ),
    );
  }

  // If transaction only has internal ops, we must create a synthetic parent op as well
  for (const [hash, internalOperations] of Object.entries(internalByHash)) {
    if (hash in nonInternalByHash) continue;
    result.push(
      ...parentOpsForTxWithOnlyInternalOperations(
        hash,
        internalOperations,
        newSubAccounts,
        accountId,
      ),
    );
  }

  return result;
}

export function genericGetAccountShape(network: string, kind: string): GetAccountShape {
  return async (info, syncConfig) => {
    const { address, initialAccount, currency, derivationMode } = info;
    const coinModuleApi = await getCoinModuleApi(currency.id, kind);
    const bridgeApi = await getBridgeApi(currency, network);

    const chainSpecificValidation = bridgeApi.getChainSpecificRules;
    if (chainSpecificValidation) {
      chainSpecificValidation.getAccountShape(address);
    }
    const accountId = encodeAccountId({
      type: "js",
      version: "2",
      currencyId: currency.id,
      xpubOrAddress: address,
      derivationMode,
    });

    const validatorsPromise = coinModuleApi.stakingSupported
      ? coinModuleApi
          .getValidators()
          .then(page =>
            page.items.map(validator => ({
              validatorAddress: validator.address,
              name: validator.name ?? validator.address,
              commission: Number(validator.commissionRate ?? 0),
              tokens: (validator.balance ?? 0n).toString(),
              votingPower: 0,
              estimatedYearlyRewardsRate: Number(validator.apy ?? 0),
            })),
          )
          .catch(() => [])
      : Promise.resolve([]);

    const [blockInfo, balanceRes, validators] = await Promise.all([
      coinModuleApi.lastBlock(),
      coinModuleApi.getBalance(address, bridgeApi.balanceOptions),
      validatorsPromise,
    ]);

    const nativeAsset = extractBalance(balanceRes, "native");
    const allTokenAssetsBalances = balanceRes.filter(b => b.asset.type !== "native");

    const usesStakingPositions = bridgeApi.usesStakingPositions === true;

    const nativeBalance = nativeAsset?.value ?? 0n;
    const nativeLocked = nativeAsset?.locked ?? 0n;

    // balance reflects only the native available balance.
    // Staked/unbonding amounts are tracked separately (stakingResources or stakingPositions).
    const spendableBalance = nativeBalance - nativeLocked;

    let stakingResources: StakingResources | undefined;
    let stakingPositions: StakingPositionOnAccount[] = [];
    let delegationsCount = 0;
    let unbondingsCount = 0;
    if (usesStakingPositions) {
      // Per-stake positions preserved so the UI can group by uid prefix
      // (delegation-* / stake-* / unstaking-* / finalizable-*). `bigint` framework
      // amounts are converted to `BigNumber` to match the Account-side convention
      // (balance, spendableBalance, stakingResources also use BigNumber).
      stakingPositions = balanceRes.filter(hasStake).map(b => toStakingPositionOnAccount(b.stake));
    } else {
      const activeStakes = balanceRes.filter(hasActiveStake);
      const deactivatingStakes = balanceRes.filter(hasDeactivatingStake);

      const delegatedBalance = activeStakes.reduce(
        (acc, b) => acc + delegatedAmountForStakingResources(b),
        0n,
      );
      const unbondingBalance = deactivatingStakes.reduce(
        (acc, b) => acc + delegatedAmountForStakingResources(b),
        0n,
      );
      const pendingRewardsBalance = activeStakes.reduce(
        (acc, b) => acc + (b.stake.amountRewarded ?? 0n),
        0n,
      );

      const delegations: StakingDelegation[] = activeStakes.filter(hasStakeDelegate).map(b => {
        const delegated: bigint = delegatedAmountForStakingResources(b);
        const rewarded: bigint = b.stake.amountRewarded ?? 0n;
        return {
          validatorAddress: b.stake.delegate,
          amount: new BigNumber(delegated.toString()),
          pendingRewards: new BigNumber(rewarded.toString()),
          status: "bonded" as const,
        };
      });
      const unbondings: StakingUnbonding[] = deactivatingStakes.filter(hasStakeDelegate).map(b => {
        const delegated: bigint = delegatedAmountForStakingResources(b);
        return {
          validatorAddress: b.stake.delegate,
          amount: new BigNumber(delegated.toString()),
          completionDate: b.stake.stateUpdatedAt ?? new Date(),
        };
      });
      stakingResources = {
        delegations,
        redelegations: [],
        unbondings,
        delegatedBalance: new BigNumber(delegatedBalance.toString()),
        pendingRewardsBalance: new BigNumber(pendingRewardsBalance.toString()),
        unbondingBalance: new BigNumber(unbondingBalance.toString()),
        ...(validators.length > 0 ? { validators } : {}),
      };
      delegationsCount = delegations.length;
      unbondingsCount = unbondings.length;
    }

    // Normalize pre-coin-framework operations to the new accountId to keep UI rendering consistent
    const oldOps = ((initialAccount?.operations || []) as OperationCommon[]).map(op =>
      op.accountId === accountId
        ? op
        : { ...op, accountId, id: encodeOperationId(accountId, op.hash, op.type) },
    );
    const cursor = oldOps[0]?.extra?.pagingToken || "";
    const syncHash = await getSyncHash(currency.id, syncConfig.blacklistedTokenIds);
    const syncFromScratch = !initialAccount?.blockHeight || initialAccount?.syncHash !== syncHash;
    // Calculate minHeight for pagination
    const minHeight = syncFromScratch ? 0 : (oldOps[0]?.blockHeight ?? 0) + 1;
    const paginationCursor = cursor && !syncFromScratch ? cursor : undefined;

    const { items: newCoreOps } = await coinModuleApi.listOperations(address, {
      minHeight,
      cursor: paginationCursor,
      order: "desc",
    });
    const newOps = newCoreOps
      .filter(op => !isNftCoreOp(op) && (!isIncomingCoreOp(op) || !op.tx.failed))
      .map(op => adaptCoreOperationToLiveOperation(accountId, op)) as OperationCommon[];

    const newAssetOperations = newOps.filter(
      operation =>
        operation?.extra?.assetReference &&
        operation?.extra?.assetOwner &&
        !["OPT_IN", "OPT_OUT"].includes(operation.type),
    );

    const newInternalOperations: OperationCommon[] = [];
    const newNonInternalOperations: OperationCommon[] = [];
    for (const op of newOps) {
      if (isInternalLiveOp(op)) newInternalOperations.push(op);
      else newNonInternalOperations.push(op);
    }

    const newSubAccounts = await buildSubAccounts({
      accountId,
      allTokenAssetsBalances,
      syncConfig,
      operations: newAssetOperations,
      getTokenFromAsset: bridgeApi.getTokenFromAsset,
    });
    const subAccounts = syncFromScratch
      ? newSubAccounts
      : mergeSubAccounts(initialAccount?.subAccounts ?? [], newSubAccounts);

    const newOpsWithSubs = buildParentOperations(
      newSubAccounts,
      newNonInternalOperations,
      newInternalOperations,
      accountId,
      address,
    );
    // Try to refresh known pending and broadcasted operations (if not already updated)
    // Useful for integrations without explorers
    const operationsToRefresh = initialAccount?.pendingOperations.filter(
      pendingOp =>
        pendingOp.hash && // operation has been broadcasted
        !newOpsWithSubs.some(newOp => pendingOp.hash === newOp.hash), // operation is not confirmed yet
    );
    const confirmedOperations =
      coinModuleApi.refreshOperations && operationsToRefresh?.length
        ? await coinModuleApi.refreshOperations(operationsToRefresh)
        : [];
    const newOperations = [...confirmedOperations, ...newOpsWithSubs];
    const operations = mergeOps(syncFromScratch ? [] : oldOps, newOperations) as OperationCommon[];
    const stakingEnabled =
      coinModuleApi.stakingSupported ?? (delegationsCount > 0 || unbondingsCount > 0);
    let stakingShape: {
      stakingResources?: StakingResources;
      stakingPositions?: StakingPositionOnAccount[];
    } = {};

    const enrichedStakingResources =
      stakingEnabled && bridgeApi.enrichStakingResources && stakingResources
        ? await bridgeApi
            .enrichStakingResources(currency, address, operations, stakingResources)
            .catch(e => {
              log(
                "generic-coin-framework",
                "enrichStakingResources failed, falling back to base staking resources",
                { error: e instanceof Error ? e.message : String(e) },
              );
              return stakingResources;
            })
        : stakingResources;

    if (usesStakingPositions) {
      stakingShape = { stakingPositions };
    } else if (stakingEnabled) {
      stakingShape = { stakingResources: enrichedStakingResources };
    }

    const res: Partial<Account> & {
      stakingResources?: StakingResources;
      stakingPositions?: StakingPositionOnAccount[];
    } = {
      id: accountId,
      xpub: address,
      blockHeight: operations.length === 0 ? 0 : blockInfo.height || initialAccount?.blockHeight,
      balance: new BigNumber(nativeBalance.toString()),
      spendableBalance: new BigNumber(spendableBalance.toString()),
      operations,
      subAccounts,
      operationsCount: operations.length,
      syncHash,
      ...stakingShape,
    };
    return res;
  };
}
