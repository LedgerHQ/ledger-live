import { encodeAccountId, getSyncHash } from "@ledgerhq/ledger-wallet-framework/account/index";
import { GetAccountShape, mergeOps } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { log } from "@ledgerhq/logs";
import BigNumber from "bignumber.js";
import groupBy from "lodash/groupBy";
import { A4Client } from "./a4/client/index";
import { deriveA4AccountId } from "./a4/client/accountId";
import { fetchA4Operations } from "./a4/client/operations";
import { ensureA4Registered } from "./a4/client/registration";
import { toA4Network, resolveA4BaseUrl } from "./a4/client/utils";
import { toA4HttpError } from "./a4/client/errors";
import { resolveA4ChainConfig } from "./a4/config";
import { logA4 } from "./a4/log";
import { resolveOperationHistoryBound } from "./operationHistoryBound";
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
import {
  buildSubOperationIndex,
  type SubOperationIndex,
} from "@ledgerhq/ledger-wallet-framework/serialization";
import { boundByTransaction } from "./boundByTransaction";
import { buildSubAccounts, mergeSubAccounts } from "./buildSubAccounts";
import { paginateOperations } from "./paginateOperations";
import type {
  AssetInfo,
  Balance,
  BalanceOptions,
  Operation,
  Stake,
} from "@ledgerhq/coin-module-framework/api/types";
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
import { UnexpectedGetBalanceError } from "@ledgerhq/coin-module-framework/errors";
import { CurrencyRegionRestrictedError } from "../../errors";
import { isRegionRestrictedFailure } from "./regionRestriction";

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
  // `inactive` would otherwise fall through both lists and vanish from `stakingResources`.
  return state === "deactivating" || state === "withdrawable" || state === "inactive";
}

function delegatedAmountForStakingResources(b: Balance): bigint {
  return b.stake?.amount ?? 0n;
}

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
  subOperationIndex: SubOperationIndex,
  accountId: string,
  address: string,
): OperationCommon[] {
  const nativeOps = transactionOps.filter(isNativeLiveOp);
  // subOperationIndex holds types-live Operation[]; we use OperationCommon in this bridge
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- framework type vs bridge type
  const subOperations = (subOperationIndex.get(hash) ?? []) as OperationCommon[];

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
  subOperationIndex: SubOperationIndex,
  accountId: string,
): OperationCommon[] {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- framework type vs bridge type
  const subOperations = (subOperationIndex.get(hash) ?? []) as OperationCommon[];
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
  // Built once for all transactions rather than once per hash — the group-once pattern above
  // already applies to the other side of this join (transactions grouped by hash); this applies it
  // to the sub-account side.
  const subOperationIndex = buildSubOperationIndex(newSubAccounts);

  const result: OperationCommon[] = [];

  // Inspect non-internal ops first to create parent ops
  for (const [hash, transactionOps] of Object.entries(nonInternalByHash)) {
    const internalOperations = internalByHash[hash] ?? [];
    result.push(
      ...parentOpsForTxWithNonInternalOperations(
        hash,
        transactionOps,
        internalOperations,
        subOperationIndex,
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
        subOperationIndex,
        accountId,
      ),
    );
  }

  return result;
}

// A4 being intentionally off for a chain is a per-chain steady-state config fact, not a per-sync
// event: logged once per chain per process, same reasoning as loggedReadDecisions below.
const loggedRegisterOffChains = new Set<string>();

async function registerWithA4(currencyId: string, address: string): Promise<void> {
  const a4Network = toA4Network(currencyId);
  if (a4Network === null) {
    return;
  }

  const { register, environment } = resolveA4ChainConfig(a4Network);
  if (!register) {
    if (!loggedRegisterOffChains.has(a4Network)) {
      loggedRegisterOffChains.add(a4Network);
      logA4({
        level: "info",
        message: "A4 registration is off for this chain",
        decision: "register_off_intentional",
        chain: a4Network,
      });
    }
    return;
  }

  try {
    const a4AccountId = deriveA4AccountId(address);
    const url = resolveA4BaseUrl(environment);
    const client = new A4Client(url, a4Network);
    await ensureA4Registered(client, a4AccountId, [address], a4Network);
  } catch (e) {
    logA4({
      level: "error",
      message: `A4 registration setup failed unexpectedly: ${e instanceof Error ? e.message : String(e)}`,
      decision: "register_setup_error",
      chain: a4Network,
      error: e,
    });
  }
}

// Read-vs-delegate is a per-chain steady-state fact, not a per-sync event: logging it every sync
// (syncs run frequently) would violate the "not spammy for common paths" requirement, so it's
// logged once per chain per process instead.
const loggedReadDecisions = new Set<string>();

function logReadDecisionOnce(chain: string, decision: string, message: string): void {
  const key = `${chain}:${decision}`;
  if (loggedReadDecisions.has(key)) {
    return;
  }
  loggedReadDecisions.add(key);
  logA4({ level: "info", message, decision, chain });
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

    void registerWithA4(currency.id, address);
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

    // Assets the account is already known to hold, so the module can resume discovery from
    // `fromHeight` instead of rewalking the whole history: a token whose last transfer predates
    // the watermark is still balance-read because it is listed here.
    //
    // The completeness `fromHeight` requires holds by induction, and `syncHash` is what makes it
    // hold. This list is what the *caller* kept, which is a filtered view -- on the reference
    // account, 134 sub-accounts for 2 847 contracts discovered, because the family's
    // `includeAssets` keeps only CAL-resolvable tokens. That filter is hashed into `syncHash`
    // (`getTokensSyncHash` over the currency's CAL list, plus the blacklist), so the day a token
    // becomes listed -- or the user blacklists one -- the hash changes, `syncFromScratch` goes
    // true, and the next sync rediscovers everything from height 0 with no `knownAssets`. Within
    // one hash generation the kept set is therefore complete with respect to what this caller can
    // ever store, which is exactly the guarantee the option asks for.
    const knownAssets = syncFromScratch
      ? undefined
      : ((initialAccount?.subAccounts ?? []) as TokenAccount[])
          .map(sub => bridgeApi.getAssetFromToken?.(sub.token, address))
          .filter((asset): asset is AssetInfo => asset !== undefined);

    // Assigned onto a typed object rather than spread into the literal. A spread of a conditional
    // object escapes excess-property checking, so the resume would compile against a coin module
    // whose `BalanceOptions` has neither field and ship as a silent no-op -- verified, not feared.
    // Written this way the compiler enforces the cross-repo ordering: this file does not build
    // until a coin-module-framework carrying both options is in the catalog.
    // `getBalance` is called with no options at all unless the family declares some. Several
    // modules routed through this framework reject *any* options object outright -- coin-tron and
    // coin-casper wrap their `getBalance` in `rejectBalanceOptions`, which throws on a truthy
    // value, `{}` included -- so building an object unconditionally would fail their every sync.
    // A family that declares `balanceOptions` accepts the parameter by construction, which makes
    // it the one place the resume fields can be attached safely; today that is evm alone, the
    // only family whose module reads them.
    //
    // Assigned onto a typed object rather than spread into a literal. A spread of a conditional
    // object escapes excess-property checking, so the resume would compile against a coin module
    // whose `BalanceOptions` has neither field and ship as a silent no-op -- verified, not feared.
    // Written this way the compiler enforces the cross-repo ordering: this file does not build
    // until a coin-module-framework carrying both options is in the catalog.
    let balanceOptions: BalanceOptions | undefined = bridgeApi.balanceOptions;
    if (balanceOptions && knownAssets?.length) {
      const resumed: BalanceOptions = { ...balanceOptions };
      resumed.knownAssets = knownAssets;
      resumed.fromHeight = minHeight;
      balanceOptions = resumed;
    }

    const balancePromise = coinModuleApi
      .getBalance(context, address, balanceOptions)
      .catch(async err => {
        // The config rejects when the currency has none, which is not a region restriction.
        const config = await context.config().catch(() => undefined);
        if (isRegionRestrictedFailure(err, config)) {
          throw new CurrencyRegionRestrictedError(currency.name, err);
        }
        throw new UnexpectedGetBalanceError("", err);
      });

    const [blockInfo, balanceRes, validators, readiness, chainSpecificShape] = await Promise.all([
      coinModuleApi.lastBlock(context),
      balancePromise,
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
          // `inactive` also covers an idle stake, so trust `actions` rather than the state.
          status:
            b.stake.state === "withdrawable" ||
            b.stake.actions?.some(action => action === "withdraw")
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

    const a4Network = toA4Network(currency.id);
    const a4ChainConfig = a4Network ? resolveA4ChainConfig(a4Network) : null;

    // Resolved once per sync, keyed on `currency.id` (not the coin-framework `network` family
    // key) so a remote payload written in the same per-currency key space as every other config
    // in this framework actually matches. A bound always resolves -- the shipped default is a
    // measured safety ceiling, not `undefined` -- and a remote payload can only lower or raise
    // it, never disable it. The walk bound below protects sync-time memory and traffic; the store
    // bound applied after `mergeOps` (parent and per-sub-account) protects persistence and
    // stability across syncs -- bounding only the walk would still let the stored history grow
    // sync after sync, since `minHeight` resumes from the newest stored operation and `mergeOps`
    // appends.
    const { maxOperations, pageSize } = resolveOperationHistoryBound(currency.id, network);

    // delegateNewOps is lazy: getAccountRawAssignHooks is only awaited when the coin-module path is taken
    const delegateNewOps = async (): Promise<OperationCommon[]> => {
      const coreOps = await paginateOperations(
        cursor =>
          coinModuleApi.listOperations(context, address, {
            minHeight,
            cursor,
            order: "desc",
            // Sent only to a family whose `limit` support is established, and independently of
            // `maxOperations`. Those are two different gates. `limit` bounds what one page costs
            // (crash safety) while `maxOperations` bounds what is retained (a product decision), so
            // coupling them would put crash safety behind a product call -- measured on the address
            // from the out-of-memory report, a page size of 100 holds the sync flat whatever the
            // retention bound, and sending no `limit` puts the Ledger-explorer arm back on its
            // exhaustive path and reproduces the crash.
            //
            // But support is a real gate: the contract requires a module to *raise* when sent a
            // `limit` it does not support, so sending one blindly fails the sync of every such
            // family. Omitting the key entirely, rather than passing `undefined`, keeps the option
            // absent for them -- which is their behaviour today.
            ...(pageSize !== undefined ? { limit: pageSize } : {}),
          }),
        maxOperations,
      );
      // Same hooks the persist/restore path uses, so the family bag on a freshly-synced operation
      // ends up in the shape a restored one has — the family's `fromOperationExtraRaw` is the
      // single definition of it. Loaded per sync rather than per operation; the registry caches the import.
      const { fromOperationExtraRaw: reviveFamilyExtra } = await getAccountRawAssignHooks(network);
      // Coin module returns NFT and failed-incoming ops; exclude them (A4 adapter handles this internally)
      return coreOps
        .filter(op => !isNftCoreOp(op) && (!isIncomingCoreOp(op) || !op.tx.failed))
        .map(op =>
          adaptCoreOperationToLiveOperation(accountId, op, reviveFamilyExtra),
        ) as OperationCommon[];
    };

    let newOps: OperationCommon[];

    if (a4Network && a4ChainConfig?.read) {
      try {
        const url = resolveA4BaseUrl(a4ChainConfig.environment);
        const a4Client = new A4Client(url, a4Network);
        const a4AccountId = deriveA4AccountId(address);
        // NFT and failed-incoming filtering is handled inside adaptA4OperationToLiveOperation (returns [])
        newOps = (await fetchA4Operations(
          a4Client,
          a4AccountId,
          accountId,
          address,
          a4Network,
          minHeight,
          a4ChainConfig.maxDcRoamRetries,
          // The same walk bound the delegate gets: this path paginates too, and without it a
          // large A4-backed account materialises its whole history before the store bound below
          // ever runs.
          maxOperations,
        )) as OperationCommon[];
        logReadDecisionOnce(a4Network, "read_served_by_a4", "A4 is serving reads for this chain");
      } catch (e) {
        const status = toA4HttpError(e).status;
        logA4({
          level: "warn",
          message: `A4 read failed, falling back to delegate: ${e instanceof Error ? e.message : String(e)}`,
          decision: "read_failover_to_delegate",
          chain: a4Network,
          status,
          error: e,
        });
        newOps = await delegateNewOps();
      }
    } else {
      if (a4Network) {
        logReadDecisionOnce(
          a4Network,
          "read_off_intentional",
          "A4 read is off for this chain, delegate is used",
        );
      }
      newOps = await delegateNewOps();
    }

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
    // A from-scratch sync goes through the same call with nothing stored, rather than around it:
    // the bound has to apply to the sub-accounts this sync *creates* too. `paginateOperations`
    // returns the whole page that reached the bound rather than splitting a transaction, so a walk
    // bounded at N hands back up to N plus one page -- and all of that overshoot can belong to a
    // single token.
    const subAccounts = mergeSubAccounts(
      syncFromScratch ? [] : (initialAccount?.subAccounts ?? []),
      newSubAccounts,
      maxOperations,
    );

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
    const mergedOperations = mergeOps(
      syncFromScratch ? [] : oldOps,
      newOperations,
    ) as OperationCommon[];
    // Store bound: `mergeOps` returns newest-first (its own contract), so keeping the head keeps
    // the newest -- this also keeps `minHeight` correct on the next sync, since it derives from
    // the newest stored operation, which the head always retains. Cut on transactions rather than
    // on a row index: `buildParentOperations` emits two top-level rows for a self-send, and a flat
    // slice at that boundary would persist one and lose its sibling for good.
    const operations = boundByTransaction(mergedOperations, maxOperations);
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
      // `operations.length`, i.e. the retained count once a bound applies, not the account's true
      // count -- kept consistent with what is actually displayed rather than tracking a real
      // count this bridge has no source of truth for. A bounded sync is still distinguishable via
      // the `paginateOperations` log line (see `resolveOperationHistoryBound` above), which is
      // this task's observability requirement; whether `operationsCount` itself should carry a
      // different meaning is being decided on `account-data`'s own bridge (draft PRs #21560 and
      // #21566) and is out of scope here.
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
