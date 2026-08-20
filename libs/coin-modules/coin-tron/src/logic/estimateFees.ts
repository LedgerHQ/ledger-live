import type { FeeEstimation, TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import { log } from "@ledgerhq/logs";
import BigNumber from "bignumber.js";
import type { TronCoinConfig } from "../config";
import {
  fetchTronAccount,
  getChainParameters,
  getTronAccountNetwork,
  triggerConstantContract,
} from "../network";
import { decode58Check } from "../network/format";
import type { AccountTronAPI, ChainParameters } from "../network/types";
import { abiEncodeTrc20Transfer } from "../network/utils";
import type { NetworkInfo, TronMemo, TronTxData } from "../types";
import { ACTIVATION_FEES, ONE_TRX, STANDARD_FEES_NATIVE, STANDARD_FEES_TRC_20 } from "./constants";
import { getBalance } from "./getBalance";
import { findBalance } from "./utils";
import { getEnergyRentQuote } from "./energyRent";

type TronIntent = TransactionIntent<TronMemo, TronTxData>;

/**
 * Resource telemetry behind a Tron fee estimate, surfaced through `FeeEstimation.parameters` so the
 * UI can explain *why* a fee is what it is (the LIVE-33341 energy/bandwidth tooltip) and so
 * `validateIntent` can warn on an energy shortfall.
 *
 * Plain integer **strings** so nothing has to depend on a `BigNumber` shape crossing the untyped
 * `feeParameters` channel the generic layer carries these on. Telemetry only — fee *method*
 * selection is ADR-050's `listFeeOptions`, not this.
 */
export type TronResourceBreakdown = {
  energyRequired: string;
  energyAvailable: string;
  bandwidthRequired: string;
  bandwidthAvailable: string;
  /** False when the energy simulation failed and `energyRequired` is a pessimistic sentinel. */
  energyEstimated: boolean;
};

// Byte sizes of the fully signed transaction (raw_data + signature + protobuf wrapping).
// craftTransaction's raw_data_hex alone would underestimate by ~50%: it excludes the signature and
// the outer envelope.
export const estimatedTxSize = (intent: TronIntent): number => {
  switch (intent.type) {
    case "send":
      if (intent.asset.type === "trc10") return 285; // TransferAssetContract
      if (intent.asset.type === "trc20") return 350; // TriggerSmartContract
      return 270; // TransferContract
    case "freeze":
    case "unfreeze":
    case "claimReward":
    case "withdrawExpireUnfreeze":
    case "unDelegateResource":
    case "legacyUnfreeze":
      return 260;
    case "vote": {
      // Each vote adds a ~19-byte protobuf entry, so a flat estimate under-prices multi-vote
      // transactions.
      const votes = intent.data?.votes?.length ?? 0;
      return 290 + votes * 19;
    }
    default:
      throw new Error(`unsupported Tron intent type for fee estimation: ${intent.type}`);
  }
};

export const estimateEnergy = async (
  config: TronCoinConfig,
  intent: TronIntent,
): Promise<number> => {
  // Only a TRC20 *transfer* burns energy. Resource-staking modes never do, even when the intent
  // still carries a token asset from a previously-selected sub-account.
  if (intent.type !== "send" || intent.asset.type !== "trc20" || !intent.asset.assetReference) {
    return 0;
  }

  // A zero-amount non-max send is headed for `AmountRequired`, so there is nothing to price — and
  // `transfer(to, 0)` can revert, which would show the flat TRC20 fallback fee next to the amount
  // error.
  if (intent.amount === 0n && !intent.useAllAmount) return 0;

  // A send-max intent carries amount 0 until the max is resolved, and `transfer(to, 0)` can take a
  // cheaper contract path than the real amount. Simulate with the token balance instead.
  let simulatedAmount = new BigNumber(intent.amount.toString());
  if (intent.useAllAmount) {
    simulatedAmount = await tokenBalance(config, intent.sender, intent.asset.assetReference);
  }

  const response = await triggerConstantContract(config, {
    ownerAddress: decode58Check(intent.sender),
    contractAddress: decode58Check(intent.asset.assetReference),
    functionSelector: "transfer(address,uint256)",
    parameter: abiEncodeTrc20Transfer(decode58Check(intent.recipient), simulatedAmount),
  });
  // A reverted simulation reports an unreliable energy_used — surface it.
  if (response.result?.result === false) {
    throw new Error(
      `triggerConstantContract failed: ${response.result.code ?? "unknown"} ${response.result.message ?? ""}`.trim(),
    );
  }
  // A successful simulation that omits energy_used (or returns a non-numeric value) is uncertainty,
  // not "0 energy". Defaulting to 0 would let a TRC20 transfer report a zero/under-stated fee; throw
  // so callers fall back to the pessimistic flat fee instead.
  const energyUsed = response.energy_used;
  if (energyUsed === undefined || !Number.isFinite(energyUsed)) {
    throw new Error("triggerConstantContract returned no energy_used for a TRC20 transfer");
  }
  return energyUsed;
};

async function tokenBalance(
  config: TronCoinConfig,
  sender: string,
  assetReference: string,
): Promise<BigNumber> {
  const balances = await getBalance(config, sender);
  const match = findBalance({ type: "trc20", assetReference }, balances);
  return new BigNumber((match?.value ?? 0n).toString());
}

// java-tron's BandwidthProcessor tries the staked and the free pool independently and consumes each
// all-or-nothing: when neither covers the whole transaction it burns `bytes * TRANSACTION_FEE` for
// the *entire* size, never just the shortfall (chainbase BandwidthProcessor#consumeBandwidth).
export const computeBandwidthFee = (
  size: number,
  networkInfo: NetworkInfo,
  params: ChainParameters,
): BigNumber => {
  const largestPool = BigNumber.maximum(stakedBandwidth(networkInfo), freeBandwidth(networkInfo));
  if (largestPool.gte(size)) return new BigNumber(0);
  return new BigNumber(size).multipliedBy(params.transactionFee);
};

export const computeEnergyFee = (
  energyNeeded: number,
  networkInfo: NetworkInfo,
  params: ChainParameters,
): BigNumber => {
  const missing = BigNumber.maximum(
    0,
    new BigNumber(energyNeeded).minus(energyAvailable(networkInfo)),
  );
  return missing.multipliedBy(params.energyFee);
};

// Each pool is clamped to ≥ 0 on its own: a node reporting used > limit in one pool must not eat
// into the other's availability.
const freeBandwidth = (networkInfo: NetworkInfo): BigNumber =>
  BigNumber.maximum(0, networkInfo.freeNetLimit.minus(networkInfo.freeNetUsed));

const stakedBandwidth = (networkInfo: NetworkInfo): BigNumber =>
  BigNumber.maximum(0, networkInfo.netLimit.minus(networkInfo.netUsed));

// Telemetry total only. A consumer must NOT read `bandwidthRequired <= bandwidthAvailable` as "no
// fee": the pools are consumed independently, so a transaction larger than either one alone is
// charged in full even when the sum would cover it. `computeBandwidthFee` is the only fee authority.
const bandwidthAvailable = (networkInfo: NetworkInfo): BigNumber =>
  freeBandwidth(networkInfo).plus(stakedBandwidth(networkInfo));

const energyAvailable = (networkInfo: NetworkInfo): BigNumber =>
  BigNumber.maximum(0, networkInfo.energyLimit.minus(networkInfo.energyUsed));

const computeActivationFee = (
  intent: TronIntent,
  recipientAccount: AccountTronAPI | undefined,
  params: ChainParameters,
): BigNumber => {
  if (intent.type !== "send") return new BigNumber(0);
  if (recipientAccount) return new BigNumber(0);
  // Charged for a native TransferContract only. TRON burns the create-account fee whenever it
  // activates an address, regardless of how much bandwidth the sender has staked — so this is not
  // gated on the sender's bandwidth, which would under-quote a well-staked sender by the whole fee.
  //
  // Whether TRON also charges it on a TransferAssetContract (TRC-10) to an unactivated address is
  // unverified — TRC-10 consumes no energy, so it cannot be "covered by energy" either.
  if (intent.asset.type !== "native") return new BigNumber(0);
  return new BigNumber(params.createAccountFee).plus(params.createNewAccountFeeInSystemContract);
};

// Pessimistic fallback when on-chain estimation fails — over-estimates rather than failing.
// Native/TRC10 worst case: activation fee (recipient inactive) + standard bandwidth burn.
const fallbackFee = (intent: TronIntent): bigint => {
  if (isTrc20Send(intent)) {
    return BigInt(STANDARD_FEES_TRC_20.toString());
  }
  return BigInt(ACTIVATION_FEES.plus(STANDARD_FEES_NATIVE).toString());
};

const isTrc20Send = (intent: TronIntent): boolean =>
  intent.type === "send" && intent.asset.type === "trc20";

// Internal: compute fee from a pre-fetched energyNeeded. Does NOT catch — callers decide
// whether to fall back. Allows callers that already have energyNeeded to avoid re-fetching it.
async function computeFeesRaw(
  config: TronCoinConfig,
  transactionIntent: TronIntent,
  energyNeeded: number,
): Promise<bigint> {
  const [networkInfo, recipientAccount, chainParams] = await Promise.all([
    getTronAccountNetwork(config, transactionIntent.sender),
    // Only native sends need the recipient account for the activation-fee branch.
    transactionIntent.type === "send" &&
    transactionIntent.asset.type === "native" &&
    transactionIntent.recipient
      ? fetchTronAccount(config, transactionIntent.recipient).then(accounts => accounts[0])
      : Promise.resolve<AccountTronAPI | undefined>(undefined),
    getChainParameters(config),
  ]);

  const total = computeBandwidthFee(estimatedTxSize(transactionIntent), networkInfo, chainParams)
    .plus(computeEnergyFee(energyNeeded, networkInfo, chainParams))
    .plus(computeActivationFee(transactionIntent, recipientAccount, chainParams));

  return BigInt(total.integerValue(BigNumber.ROUND_CEIL).toFixed());
}

export async function estimateFees(
  config: TronCoinConfig,
  transactionIntent: TronIntent,
): Promise<FeeEstimation> {
  // Deliberately outside the try: an unsupported mode is a caller bug, not a network failure, so it
  // must reject instead of being priced at the pessimistic fallback fee below.
  const size = estimatedTxSize(transactionIntent);

  try {
    const [networkInfo, recipientAccount, chainParams] = await Promise.all([
      getTronAccountNetwork(config, transactionIntent.sender),
      // Only native sends need the recipient account for the activation-fee branch, and only once a
      // recipient exists: `prepareTransaction` estimates on every transaction change, so an empty
      // recipient would send `/v1/accounts/` with no address, and `fetchTronAccount` propagates that
      // failure into the outer catch — quoting the pessimistic flat fee before the user has typed
      // anything.
      transactionIntent.type === "send" &&
      transactionIntent.asset.type === "native" &&
      transactionIntent.recipient
        ? fetchTronAccount(config, transactionIntent.recipient).then(accounts => accounts[0])
        : Promise.resolve<AccountTronAPI | undefined>(undefined),
      getChainParameters(config),
    ]);

    const energyPool = energyAvailable(networkInfo);
    let energyRequired: BigNumber;
    let energyEstimated = true;
    try {
      energyRequired = new BigNumber(await estimateEnergy(config, transactionIntent)).integerValue(
        BigNumber.ROUND_CEIL,
      );
    } catch (err) {
      // The simulation is the only way to know the real energy cost. Report one more than available
      // so the tooltip and `validateIntent` both read "insufficient" rather than "covered", and price
      // the transaction at the flat fee below.
      log("tron/estimateFees", "energy simulation failed, reporting insufficient energy", { err });
      energyRequired = energyPool.plus(1);
      energyEstimated = false;
    }

    const breakdown: TronResourceBreakdown = {
      energyRequired: energyRequired.toFixed(),
      energyAvailable: energyPool.toFixed(),
      bandwidthRequired: String(size),
      bandwidthAvailable: bandwidthAvailable(networkInfo).toFixed(),
      energyEstimated,
    };

    // An unmeasurable energy cost is uncertainty, not a 1-energy shortfall: charge the flat fee.
    if (!energyEstimated && isTrc20Send(transactionIntent)) {
      return withBreakdown(BigInt(STANDARD_FEES_TRC_20.toString()), breakdown);
    }

    const total = computeBandwidthFee(size, networkInfo, chainParams)
      .plus(computeEnergyFee(energyRequired.toNumber(), networkInfo, chainParams))
      .plus(computeActivationFee(transactionIntent, recipientAccount, chainParams));

    return withBreakdown(BigInt(total.integerValue(BigNumber.ROUND_CEIL).toFixed()), breakdown);
  } catch (err) {
    log("tron/estimateFees", "falling back to pessimistic constants", { err });
    // Network data is unavailable, so the resource pools are unknown rather than zero. Report a
    // non-zero requirement against a zero pool: the fee is flat and the tooltip must not claim
    // resources cover it.
    return withBreakdown(fallbackFee(transactionIntent), {
      energyRequired: isTrc20Send(transactionIntent) ? "1" : "0",
      energyAvailable: "0",
      bandwidthRequired: String(size),
      bandwidthAvailable: "0",
      energyEstimated: false,
    });
  }
}

const withBreakdown = (value: bigint, breakdown: TronResourceBreakdown): FeeEstimation => ({
  value,
  parameters: { ...breakdown },
});

// 10-min fastTrade window matching the UI's fee-quote TTL
const TRONIFY_RENTAL_DURATION_SECONDS = 600;
// Bandwidth top-up Tronify bundles with each rental to cover the transaction's bandwidth cost
const TRONIFY_RENTAL_EXTRA_TRX = 0.8;

/**
 * Estimate fees for the Tronify energy-rent option.
 *
 * Calls the Tronify quote API and returns a priced FeeEstimation alongside the standard burn cost
 * for comparison. Only applicable to TRC-20 transfers (the only intent type Tronify covers).
 *
 * Throws on any error — including Tronify API failures — as the caller must handle unavailability
 * explicitly (no silent fallback, per ADR-050 Option 3 AC).
 */
export async function estimateTronifyFees(
  config: TronCoinConfig,
  intent: TronIntent,
): Promise<FeeEstimation> {
  if (intent.type !== "send" || intent.asset.type !== "trc20" || !intent.asset.assetReference) {
    throw new Error("Tronify fee option is only available for TRC-20 send intents");
  }

  // Single energy simulation; result feeds both the standard burn calc and the Tronify quote.
  const energyNeeded = await estimateEnergy(config, intent);

  // computeFeesRaw does not catch — any chain-params failure propagates here (no silent fallback
  // on originalValue, per ADR-050 Option 3). Both calls are independent once energyNeeded is
  // known, so they run in parallel to keep pricing latency minimal.
  // getEnergyRentQuote resolves its provider through the coinConfig singleton (not `config`); this
  // is the shared design of the energyRent module — the provider is selected via remote coin-config.
  const [originalValue, quote] = await Promise.all([
    computeFeesRaw(config, intent, energyNeeded),
    getEnergyRentQuote({
      payerAddress: intent.sender,
      receiverAddress: intent.sender, // energy is delegated to the sender (they call the contract)
      energy: BigInt(energyNeeded),
      durationSeconds: TRONIFY_RENTAL_DURATION_SECONDS,
      extraTrx: TRONIFY_RENTAL_EXTRA_TRX,
    }),
  ]);

  // Only TRX-denominated quotes are supported here. USDT-denominated rent (Flow 2) carries amounts
  // in a different unit than the standard fee and requires separate handling.
  if (quote.payCoinCode.toUpperCase() !== "TRX") {
    throw new Error(
      `Tronify returned unsupported payCoinCode: ${quote.payCoinCode}; only TRX is supported`,
    );
  }

  const value = BigInt(
    new BigNumber(quote.payCoinAmt)
      .multipliedBy(ONE_TRX)
      .integerValue(BigNumber.ROUND_CEIL)
      .toFixed(),
  );

  return {
    value,
    originalValue,
    // Clamp to 0n: Tronify may be more expensive than burning during low-energy-price periods.
    savings: originalValue > value ? originalValue - value : 0n,
  };
}
