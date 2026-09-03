import { encodeAccountId, getSyncHash } from "@ledgerhq/ledger-wallet-framework/account/index";
import { GetAccountShape, mergeOps } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { log } from "@ledgerhq/logs";
import BigNumber from "bignumber.js";
import groupBy from "lodash/groupBy";
import { A4Client } from "./a4/client/index";
import { deriveA4AccountId } from "./a4/client/accountId";
import { ensureA4Registered } from "./a4/client/registration";
import { toA4Network, resolveA4BaseUrl } from "./a4/client/utils";
import { resolveA4ChainConfig } from "./a4/config";
import { getCoinModuleApi } from "./api";
import { buildContext } from "./api/context";
import { getBridgeApi } from "./bridge";
import { getAccountRawAssignHooks } from "./accountRawAssign";
import {
  adaptCoreOperationToLiveOperation,
  cleanedOperation,
  extractBalance,
  optionalNumeric,
} from "./utils";
import { inferSubOperations } from "@ledgerhq/ledger-wallet-framework/serialization";
import { buildSubAccounts, mergeSubAccounts } from "./buildSubAccounts";
import { paginateOperations } from "./paginateOperations";
import type { Balance, Operation, Stake } from "@ledgerhq/coin-module-framework/api/types";
import type { OperationCommon } from "./types";
import type {
  Account,
  AccountReadiness,
  StakingDelegation,
  StakingPositionDetails,
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
  stake: Stake;
} {
  const state = balance.stake?.state;
  // `inactive` is a fully deactivated stake: the framework declares it, so it must be classified
  // here rather than left to fall through both lists and vanish from `stakingResources`.
  return state === "deactivating" || state === "withdrawable" || state === "inactive";
}

function delegatedAmountForStakingResources(b: Balance): bigint {
  return b.stake?.amount ?? 0n;
}

/**
 * Per-position breakdown, for chains that address stakes individually. A chain that stakes at
 * validator level sets none of these and gets an empty object, as before. Keys are read
 * defensively, like `validatorId`/`shares` below.
 */
function stakingPositionDetails(stake: Stake): StakingPositionDetails {
  const details = stake.details ?? {};
  const activeAmount = optionalNumeric(details.activeAmount);
  const inactiveAmount = optionalNumeric(details.inactiveAmount);
  const withdrawableAmount = optionalNumeric(details.withdrawableAmount);
  const lockedReserve = optionalNumeric(details.lockedReserve);

  // `!== undefined`, not truthiness: a zero amount is meaningful.
  return {
    ...(stake.uid ? { positionId: stake.uid } : {}),
    ...(activeAmount !== undefined ? { activeAmount } : {}),
    ...(inactiveAmount !== undefined ? { inactiveAmount } : {}),
    ...(withdrawableAmount !== undefined ? { withdrawableAmount } : {}),
    ...(lockedReserve !== undefined ? { lockedReserve } : {}),
    ...(typeof details.canStake === "boolean" ? { canStake: details.canStake } : {}),
    ...(typeof details.canWithdraw === "boolean" ? { canWithdraw: details.canWithdraw } : {}),
  };
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
  // Parent op is FEES only when the account actually paid a fee; NONE otherwise. A zero fee (e.g. a
  // token send whose energy/bandwidth is fully covered) is not a FEES row — it stays hidden as NONE
  // rather than surfacing an empty "0 fee" parent. An undefined fee is treated as paid, preserving the
  // prior behaviour for ops synced without a fee value.
  const feePayer = getFeePayer(referenceOp);
  const isFeePayer = feePayer !== undefined && isSameAddress(address, feePayer);
  const paysFee = isFeePayer && !referenceOp.fee?.isZero();
  const parentType = paysFee ? "FEES" : "NONE";
  const parentValue = paysFee ? referenceOp.fee : new BigNumber(0);
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

async function registerWithA4(currencyId: string, address: string): Promise<void> {
  const a4Network = toA4Network(currencyId);
  if (a4Network === null) {
    return;
  }

  const { register, environment } = resolveA4ChainConfig(a4Network);
  if (!register) {
    return;
  }

  const a4AccountId = deriveA4AccountId(address);
  const url = resolveA4BaseUrl(environment);
  const client = new A4Client(url, a4Network);
  return ensureA4Registered(client, a4AccountId, [address]);
}

export function genericGetAccountShape(network: string, kind: string): GetAccountShape {
  return async (info, syncConfig) => {
    const { address, initialAccount, currency, derivationMode, rest } = info;
    const coinModuleApi = await getCoinModuleApi(currency.id, kind);
    const context = buildContext(currency.id);
    const bridgeApi = await getBridgeApi(currency, network);

    const chainSpecificValidation = bridgeApi.getChainSpecificRules;
    if (chainSpecificValidation) {
      chainSpecificValidation.getAccountShape(address);
    }
    // `getAccountInfo` (ADR-045) is fetched only when a family declares a mapper: coin-tezos
    // implements the fetch without one, so an unconditional call would add a request to every tezos
    // sync for a result nothing reads.
    //
    // Deliberately uncaught, unlike `validatorsPromise` / `readinessPromise` below: those are the
    // framework's own optional enrichments, whereas what this hook returns is the family's contract —
    // it may be fields that family's screens require (a tron account derives `isAccountEmpty` from
    // `tronResources.bandwidth.freeLimit`, so a missing `tronResources` breaks that check and hides
    // its staking actions) or something cosmetic, and the framework cannot tell. Catching here would impose degradation on every family with no way back; a family whose
    // contribution is optional catches inside its own hook and returns undefined, which this path
    // already treats as nothing to contribute.
    const buildShape = bridgeApi.buildAccountShape;
    const chainSpecificShapePromise = buildShape
      ? Promise.resolve(coinModuleApi.getAccountInfo?.(context, address)).then(accountInfo =>
          buildShape(address, accountInfo),
        )
      : Promise.resolve(undefined);
    const accountId = encodeAccountId({
      type: "js",
      version: "2",
      currencyId: currency.id,
      xpubOrAddress: address,
      derivationMode,
    });

    void registerWithA4(currency.id, address).catch(e => {
      log("generic-coin-framework", "a4 registration error", {
        error: e instanceof Error ? e.message : String(e),
      });
    });
    const validatorsPromise = bridgeApi.stakingSupported
      ? coinModuleApi
          .getValidators(context)
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

    const readinessPromise: Promise<AccountReadiness | undefined> = bridgeApi.getAccountReadiness
      ? bridgeApi.getAccountReadiness(currency, address).catch(e => {
          log("generic-coin-framework", "getAccountReadiness failed, leaving readiness undefined", {
            error: e instanceof Error ? e.message : String(e),
          });
          return undefined;
        })
      : Promise.resolve(undefined);

    const [blockInfo, balanceRes, validators, readiness, chainSpecificShape] = await Promise.all([
      coinModuleApi.lastBlock(context),
      coinModuleApi.getBalance(context, address, bridgeApi.balanceOptions),
      validatorsPromise,
      readinessPromise,
      chainSpecificShapePromise,
    ]);

    const nativeAsset = extractBalance(balanceRes, "native");
    const freshTokenAssetsBalances = balanceRes.filter(b => b.asset.type !== "native");

    // A token account fully swept to zero can disappear entirely from the balance response
    // (some chains' balance-listing endpoints only return non-zero holdings) rather than being
    // reported with a 0 value. `buildSubAccounts` below only ever processes tokens present in
    // this list, so without this, a previously-tracked token that vanished from a fresh balance
    // read would never be re-processed -- silently freezing its subAccount's balance and
    // operations at their pre-sweep state forever instead of ever reflecting the sweep.
    const getAssetFromToken = bridgeApi.getAssetFromToken;
    // Lower-cased: a chain's balance-listing response and its own `getAssetFromToken` derivation
    // aren't guaranteed to agree on reference casing (observed on Stacks -- the balance response
    // lowercases addresses, `getAssetFromToken` returns the contract address verbatim/uppercase),
    // so a case-sensitive comparison here would misclassify an still-held, non-zero token as
    // vanished and inject a spurious zero-value duplicate for it.
    const freshAssetReferences = new Set(
      freshTokenAssetsBalances
        .map(b => ("assetReference" in b.asset ? b.asset.assetReference : undefined))
        .filter((ref): ref is string => !!ref)
        .map(ref => ref.toLowerCase()),
    );
    // Not gated on "fresh list non-empty": a wallet whose only token gets fully swept legitimately
    // reports an empty token list on the next balance read (some chains, e.g. Stacks, omit
    // zero-balance entries entirely), and that sweep must still zero the sub-account. Gating this
    // on list-non-emptiness (to defend against a hypothetical degraded 200 with a truncated token
    // list) breaks exactly that real case -- reproduced by the coin-tester's "Send max CTT"
    // scenario, which never converges because the lone token's balance is never seen as "gone".
    // A family's balance hook throwing/degrading already rejects the `Promise.all` above and
    // aborts the whole sync, rather than silently reaching this point with a partial result.
    const vanishedTokenBalances: Balance[] = getAssetFromToken
      ? (initialAccount?.subAccounts ?? []).flatMap(subAccount => {
          // A throwing family implementation must not fail the whole sync over one sub-account.
          let asset: ReturnType<typeof getAssetFromToken>;
          try {
            asset = getAssetFromToken(subAccount.token, address);
          } catch {
            return [];
          }
          if (
            !asset ||
            !("assetReference" in asset) ||
            !asset.assetReference ||
            freshAssetReferences.has(asset.assetReference.toLowerCase())
          ) {
            return [];
          }
          return [{ value: 0n, asset }];
        })
      : [];
    const allTokenAssetsBalances = [...freshTokenAssetsBalances, ...vanishedTokenBalances];

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

      const delegations: StakingDelegation[] = activeStakes.map(b => {
        const delegated: bigint = delegatedAmountForStakingResources(b);
        const rewarded: bigint = b.stake.amountRewarded ?? 0n;
        const validatorId = b.stake.details?.validatorId;
        const validatorName = b.stake.details?.validatorName;
        const sharesRaw = b.stake.details?.shares;
        return {
          ...stakingPositionDetails(b.stake),
          validatorAddress: b.stake.delegate ?? "",
          amount: new BigNumber(delegated.toString()),
          pendingRewards: new BigNumber(rewarded.toString()),
          status: b.stake.state === "activating" ? "activating" : "bonded",
          ...(typeof validatorId === "string" ? { validatorId } : {}),
          ...(typeof validatorName === "string" ? { validatorName } : {}),
          ...(typeof sharesRaw === "bigint" ? { shares: new BigNumber(sharesRaw.toString()) } : {}),
        };
      });
      const unbondings: StakingUnbonding[] = deactivatingStakes.map(b => {
        const delegated: bigint = delegatedAmountForStakingResources(b);
        const validatorId = b.stake.details?.validatorId;
        const validatorName = b.stake.details?.validatorName;
        const withdrawId = b.stake.details?.withdrawId;

        return {
          ...stakingPositionDetails(b.stake),
          validatorAddress: b.stake.delegate ?? "",
          amount: new BigNumber(delegated.toString()),
          completionDate: b.stake.stateUpdatedAt ?? new Date(),
          status:
            b.stake.state === "withdrawable" || b.stake.state === "inactive"
              ? "withdrawable"
              : "deactivating",
          ...(typeof validatorId === "string" ? { validatorId } : {}),
          ...(typeof validatorName === "string" ? { validatorName } : {}),
          ...(typeof withdrawId === "number" ? { withdrawId } : {}),
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
    const syncHash = await getSyncHash(currency.id, syncConfig.blacklistedTokenIds);
    const syncFromScratch = !initialAccount?.blockHeight || initialAccount?.syncHash !== syncHash;
    // Resume position across syncs: `minHeight` alone, derived from the newest stored operation.
    // It is non-volatile by construction and already persisted, unlike a module cursor (coin-hypercore
    // documents its own as volatile). Only the cursor varies from page to page below.
    const minHeight = syncFromScratch ? 0 : (oldOps[0]?.blockHeight ?? 0) + 1;

    const newCoreOps = await paginateOperations(cursor =>
      coinModuleApi.listOperations(context, address, {
        minHeight,
        cursor,
        order: "desc",
      }),
    );
    // Same hooks the persist/restore path uses, so the family bag on a freshly-synced operation ends
    // up in the shape a restored one has — the family's `fromOperationExtraRaw` is the single
    // definition of it. Loaded per sync rather than per operation; the registry caches the import.
    const { fromOperationExtraRaw: reviveFamilyExtra } = await getAccountRawAssignHooks(network);
    const newOps = newCoreOps
      .filter(op => !isNftCoreOp(op) && (!isIncomingCoreOp(op) || !op.tx.failed))
      .map(op =>
        adaptCoreOperationToLiveOperation(accountId, op, reviveFamilyExtra),
      ) as OperationCommon[];

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
      bridgeApi.refreshOperations && operationsToRefresh?.length
        ? await bridgeApi.refreshOperations(operationsToRefresh)
        : [];
    const newOperations = [...confirmedOperations, ...newOpsWithSubs];
    const operations = mergeOps(syncFromScratch ? [] : oldOps, newOperations) as OperationCommon[];
    const stakingEnabled =
      bridgeApi.stakingSupported ?? (delegationsCount > 0 || unbondingsCount > 0);
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
      ...chainSpecificShape,
      id: accountId,
      // `||` (not `??`): a device getAddress may return an empty-string publicKey (e.g. when the
      // chain code is not requested); treat "" as absent and fall back rather than storing a blank xpub.
      xpub: rest?.publicKey || initialAccount?.xpub || address,
      blockHeight: operations.length === 0 ? 0 : blockInfo.height || initialAccount?.blockHeight,
      balance: new BigNumber(nativeBalance.toString()),
      spendableBalance: new BigNumber(spendableBalance.toString()),
      operations,
      subAccounts,
      operationsCount: operations.length,
      syncHash,
      // key omitted rather than set to undefined: jsHelpers merges `{ ...a, ...shape }`, so a failed
      // readiness lookup retains the last persisted value instead of clearing it.
      ...(readiness !== undefined ? { readiness } : {}),
      ...stakingShape,
    };
    return res;
  };
}
