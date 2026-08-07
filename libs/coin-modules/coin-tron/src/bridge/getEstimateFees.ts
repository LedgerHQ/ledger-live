import type { TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import { parseCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies";
import { log } from "@ledgerhq/logs";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { estimateFees, getAccount } from "../logic";
import { ACTIVATION_FEES, STANDARD_FEES_NATIVE, STANDARD_FEES_TRC_20 } from "../logic/constants";
import { getEnergyProvider } from "../logic/energyProviders";
import { getEnergyRentQuote } from "../logic/energyRent";
import { computeBandwidthFee, computeEnergyFee, estimateEnergy } from "../logic/estimateFees";
import { getChainParameters, getTronAccountNetwork } from "../network";
import type { AccountTronAPI, ChainParameters } from "../network/types";
import type { NetworkInfo, SponsoredEnergyEstimate, Transaction } from "../types";
import { extractBandwidthInfo, getEstimatedBlockSize } from "./utils";

// see : https://developers.tron.network/docs/bandwith#section-bandwidth-points-consumption
// 1. cost around 200 Bandwidth, if not enough check Free Bandwidth
// 2. If not enough, will cost some TRX
// 3. normal transfert cost around 0.270 TRX
const getFeesFromBandwidth = (account: Account, transaction: Transaction): BigNumber => {
  const { freeUsed, freeLimit, gainedUsed, gainedLimit } = extractBandwidthInfo(
    transaction.networkInfo,
  );
  // Clamp each bucket (free, staked/gained) to ≥ 0 before summing, mirroring the resource breakdown:
  // a node reporting used > limit in one bucket must not eat into the other's availability, which
  // would otherwise charge a fee while the breakdown reports bandwidth as sufficient.
  const available = BigNumber.maximum(0, freeLimit.minus(freeUsed)).plus(
    BigNumber.maximum(0, gainedLimit.minus(gainedUsed)),
  );
  const estimatedBandwidthCost = getEstimatedBlockSize(account, transaction);

  if (available.lt(estimatedBandwidthCost)) {
    return STANDARD_FEES_NATIVE; // cost is around 0.270 TRX
  }

  return new BigNumber(0); // no fee
};

export type FeeResourceBreakdown = {
  energyRequired: BigNumber;
  energyAvailable: BigNumber;
  bandwidthRequired: BigNumber;
  bandwidthAvailable: BigNumber;
  // False when the energy simulation failed and `energyRequired` is a safe "insufficient" sentinel.
  energyEstimated: boolean;
  // The networkInfo used above (fetched if the tx was unprepared); reused by the fee computation.
  networkInfo: NetworkInfo;
};

// Energy/bandwidth required-vs-available for a transaction, feeding both the status fields and the
// energy-aware TRC20 fee. Never throws: on failure it reports energy insufficient
// (`energyEstimated: false`) so callers can fall back to a pessimistic fee.
export const getFeeResourceBreakdown = async (
  account: Account,
  transaction: Transaction,
  tokenAccount?: TokenAccount | null,
): Promise<FeeResourceBreakdown> => {
  // TODO(LIVE-32892): when `transaction.energyProviderInfo` is set, augment energy availability with
  // rented (sponsored) energy. Dormant for now — LIVE-32776 only exposes the informational estimate.

  // Energy is only required for an actual TRC20 transfer — native/TRC10 use none, non-"send" modes
  // don't transfer, and a zero-amount non-max send is headed for AmountRequired. Compute it up front
  // so the network-failure path reports the "insufficient" sentinel only when energy is truly needed.
  const isZeroAmountSend = transaction.amount.isZero() && !transaction.useAllAmount;
  const needsEnergySim =
    tokenAccount?.token.tokenType === "trc20" && transaction.mode === "send" && !isZeroAmountSend;

  let networkInfo: NetworkInfo;
  try {
    networkInfo = transaction.networkInfo ?? (await getTronAccountNetwork(account.freshAddress));
  } catch (err) {
    log("tron/getFeeResourceBreakdown", "failed to fetch network info", { err });
    const zero = new BigNumber(0);
    return {
      // Sentinel only when energy is genuinely needed; native/TRC10 (and non-transfers) need 0.
      energyRequired: needsEnergySim ? zero.plus(1) : zero,
      energyAvailable: zero,
      bandwidthRequired: getEstimatedBlockSize(account, transaction),
      bandwidthAvailable: zero,
      energyEstimated: !needsEnergySim,
      networkInfo: {
        family: "tron",
        freeNetUsed: zero,
        freeNetLimit: zero,
        netUsed: zero,
        netLimit: zero,
        energyUsed: zero,
        energyLimit: zero,
      },
    };
  }

  const { freeUsed, freeLimit, gainedUsed, gainedLimit } = extractBandwidthInfo(networkInfo);
  // Clamp each bucket (free, staked/gained) to ≥ 0 before summing: a node reporting used > limit in
  // one bucket must not reduce the other, and a negative "available" is nonsensical for the UI.
  const bandwidthAvailable = BigNumber.maximum(0, freeLimit.minus(freeUsed)).plus(
    BigNumber.maximum(0, gainedLimit.minus(gainedUsed)),
  );
  const bandwidthRequired = getEstimatedBlockSize(account, transaction);
  const energyAvailable = BigNumber.maximum(
    0,
    networkInfo.energyLimit.minus(networkInfo.energyUsed),
  );

  // Only an actual TRC20 transfer needs an energy simulation (see needsEnergySim above); everything
  // else has a genuine 0 energy requirement.
  if (!needsEnergySim) {
    return {
      energyRequired: new BigNumber(0),
      energyAvailable,
      bandwidthRequired,
      bandwidthAvailable,
      energyEstimated: true,
      networkInfo,
    };
  }

  try {
    // For "send max" the transaction amount is still 0 at this point, so simulate with the token
    // balance — a 0-value transfer can revert or mis-estimate energy. Use toFixed() (not toString(),
    // which switches to exponential notation for large values that BigInt() cannot parse).
    const simulatedAmount = transaction.useAllAmount ? tokenAccount.balance : transaction.amount;
    const transactionIntent: TransactionIntent = {
      intentType: "transaction",
      type: transaction.mode,
      sender: account.freshAddress,
      recipient: transaction.recipient,
      amount: BigInt(simulatedAmount.toFixed()),
      asset: { type: "trc20", assetReference: tokenAccount.token.contractAddress },
    };
    // Full simulated energy, NOT scaled by consume_user_resource_percent: mainnet USDT transfers
    // charge the caller 100% of energy_used (origin_energy_usage = 0), so scaling would under-report
    // and risk a surprise TRX burn.
    const energyUsed = await estimateEnergy(transactionIntent);
    const energyRequired = new BigNumber(energyUsed).integerValue(BigNumber.ROUND_CEIL);

    return {
      energyRequired,
      energyAvailable,
      bandwidthRequired,
      bandwidthAvailable,
      energyEstimated: true,
      networkInfo,
    };
  } catch (err) {
    log("tron/getFeeResourceBreakdown", "energy simulation failed, reporting insufficient energy", {
      err,
    });
    return {
      energyRequired: energyAvailable.plus(1),
      energyAvailable,
      bandwidthRequired,
      bandwidthAvailable,
      energyEstimated: false,
      networkInfo,
    };
  }
};

// LIVE-32776: informational savings estimate for a sponsored send. Purely additive — it does NOT
// change fees (that re-pricing is LIVE-32892). The avoided cost is the full energy cost of the
// transfer (energyRequired × energyFee), independent of the user's own staked energy, matching the
// PRD framing ("every USDT transfer burns ~6.4 TRX"). Returns null when the send isn't sponsored,
// the provider id is unknown, or energy couldn't be reliably estimated (so we never surface a number
// derived from the failure sentinel). Reuses the breakdown already computed by the status path, so
// it adds no network round trips (getChainParameters is LRU-cached).
export const computeSponsoredEnergyEstimate = async (
  transaction: Transaction,
  breakdown: FeeResourceBreakdown,
): Promise<SponsoredEnergyEstimate | null> => {
  const info = transaction.energyProviderInfo;
  if (!info) return null;
  const provider = getEnergyProvider(info.providerId);
  if (!provider || !breakdown.energyEstimated) return null;
  // Only an energy-bearing TRC20 transfer has a saving to disclose. Native/TRC10 and non-"send"
  // modes report energyRequired 0 — surfacing a {provider, 0} estimate there would render a
  // misleading "Saved $0.00 with <provider>" third-party disclosure on an unsponsored tx.
  if (breakdown.energyRequired.lte(0)) return null;

  try {
    const params: ChainParameters = await getChainParameters();
    const avoidedEnergyFees = breakdown.energyRequired
      .multipliedBy(params.energyFee)
      .integerValue(BigNumber.ROUND_CEIL);
    return { provider, avoidedEnergyFees };
  } catch (err) {
    // Informational only: a chain-params fetch failure must not break the whole status computation.
    log("tron/computeSponsoredEnergyEstimate", "chain params unavailable, omitting estimate", {
      err,
    });
    return null;
  }
};

// Rental-quote params for the sponsored-fee guard.
// TODO(LIVE-32892): align these with the params the real energy-rent order uses at signing time.
const SPONSORED_RENTAL_DURATION_SECONDS = 600; // 10-min fastTrade window (~200-block lock, per PRD)
const SPONSORED_RENTAL_EXTRA_TRX = 0.8; // bandwidth top-up Tronify bundles in the USDT-paid flow

// LIVE-32777: the USDT rental fee (in the token's base units) that a sponsored TRC20 send must
// reserve on top of the transfer amount, so the send can't be confirmed when the USDT balance can't
// cover fee + amount (the Trust Wallet "Case 2" loss). Live Tronify quote using the breakdown's
// energyRequired. Returns 0 when not applicable — not sponsored, not a TRC20 send, no reliable
// energy figure, or the rent is priced in a currency other than the token being sent (Flow 1 / TRX).
// Never throws: a quote failure degrades to no reservation (mirrors getFeeResourceBreakdown), logged.
export const computeSponsoredUsdtFee = async (
  account: Account,
  transaction: Transaction,
  tokenAccount: TokenAccount | null | undefined,
  breakdown: FeeResourceBreakdown,
): Promise<BigNumber> => {
  if (!transaction.energyProviderInfo) return new BigNumber(0);
  if (tokenAccount?.token.tokenType !== "trc20") return new BigNumber(0);
  if (!breakdown.energyEstimated || breakdown.energyRequired.lte(0)) return new BigNumber(0);

  try {
    const quote = await getEnergyRentQuote({
      payerAddress: account.freshAddress,
      receiverAddress: account.freshAddress,
      energy: BigInt(breakdown.energyRequired.integerValue(BigNumber.ROUND_CEIL).toFixed()),
      durationSeconds: SPONSORED_RENTAL_DURATION_SECONDS,
      extraTrx: SPONSORED_RENTAL_EXTRA_TRX,
    });
    // Only reserve when the rent is paid in the SAME asset being sent (Flow 2 / USDT); a TRX-paid
    // rent (Flow 1) is charged to the parent account, not this token balance.
    if (quote.payCoinCode.toUpperCase() !== tokenAccount.token.ticker.toUpperCase()) {
      return new BigNumber(0);
    }
    return parseCurrencyUnit(tokenAccount.token.units[0], quote.payCoinAmt);
  } catch (err) {
    log("tron/computeSponsoredUsdtFee", "rent quote unavailable, skipping fee reservation", {
      err,
    });
    return new BigNumber(0);
  }
};

// Energy-aware fee for an active-recipient TRC20 transfer: 0 when energy and bandwidth cover it, the
// real shortfall otherwise, and the flat STANDARD_FEES_TRC_20 on any uncertainty.
const computeActiveRecipientTrc20Fee = async (
  account: Account,
  transaction: Transaction,
  tokenAccount: TokenAccount,
  breakdown?: FeeResourceBreakdown,
): Promise<BigNumber> => {
  // TODO(LIVE-32892): when `transaction.energyProviderInfo` is set, price the send as energy-rented
  // (sponsored) instead of burning TRX. Dormant for now — LIVE-32776 only exposes the estimate.

  try {
    const resourceBreakdown =
      breakdown ?? (await getFeeResourceBreakdown(account, transaction, tokenAccount));

    if (!resourceBreakdown.energyEstimated) {
      return STANDARD_FEES_TRC_20;
    }

    const sufficient =
      resourceBreakdown.energyRequired.lte(resourceBreakdown.energyAvailable) &&
      resourceBreakdown.bandwidthRequired.lte(resourceBreakdown.bandwidthAvailable);

    if (sufficient) {
      return new BigNumber(0);
    }

    const params: ChainParameters = await getChainParameters();
    return computeBandwidthFee(
      resourceBreakdown.bandwidthRequired.toNumber(),
      resourceBreakdown.networkInfo,
      params,
    ).plus(
      computeEnergyFee(
        resourceBreakdown.energyRequired.integerValue(BigNumber.ROUND_CEIL).toNumber(),
        resourceBreakdown.networkInfo,
        params,
      ),
    );
  } catch (err) {
    log("tron/getEstimatedFees", "energy-aware TRC20 fee computation failed, using flat fee", {
      err,
    });
    return STANDARD_FEES_TRC_20;
  }
};

// Special case: If activated an account, cost around 0.1 TRX
const getFeesFromAccountActivation = async (
  account: Account,
  transaction: Transaction,
  tokenAccount?: TokenAccount | null,
  breakdown?: FeeResourceBreakdown,
): Promise<BigNumber> => {
  const recipientAccounts = await getAccount(transaction.recipient);
  const recipientAccount: AccountTronAPI | undefined = recipientAccounts[0];
  const { gainedUsed, gainedLimit } = extractBandwidthInfo(transaction.networkInfo);
  const available = gainedLimit.minus(gainedUsed);
  const estimatedBandwidthCost = getEstimatedBlockSize(account, transaction);

  const hasTRC20 = Boolean(
    tokenAccount &&
    recipientAccount?.trc20?.some(trc20 => tokenAccount.token.contractAddress in trc20),
  );

  if (!recipientAccount && !hasTRC20 && available.lt(estimatedBandwidthCost)) {
    // if no token account then we are sending tron use the default activation fees.
    if (!tokenAccount) {
      return ACTIVATION_FEES; // cost is around 1 TRX
    }

    const transactionIntent: TransactionIntent = {
      intentType: "transaction",
      type: transaction.mode,
      sender: account.freshAddress,
      recipient: transaction.recipient,
      amount: BigInt(transaction.amount.toString()),
      asset:
        tokenAccount?.token.tokenType === "trc20"
          ? {
              type: "trc20",
              assetReference: tokenAccount.token.contractAddress,
            }
          : { type: "trc10", assetReference: tokenAccount?.token.id },
    };

    // if we have a token account but the recipient is either not active or the account does not have a trc20 balance for the given token.
    if (tokenAccount && tokenAccount.token.tokenType === "trc20") {
      const estimatedFees = await estimateFees(transactionIntent);
      return new BigNumber(estimatedFees.toString());
    }
  }

  // Only the active-recipient TRC20 case is energy-aware (0 when covered, real shortfall otherwise,
  // flat STANDARD_FEES_TRC_20 on any uncertainty); inactive recipients keep the prior behavior.
  if (tokenAccount?.token.tokenType === "trc20") {
    if (!recipientAccount) {
      return STANDARD_FEES_TRC_20;
    }
    return computeActiveRecipientTrc20Fee(account, transaction, tokenAccount, breakdown);
  }

  return new BigNumber(0); // no fee
};

const getEstimatedFees = async (
  account: Account,
  transaction: Transaction,
  tokenAccount?: TokenAccount | null,
  breakdown?: FeeResourceBreakdown,
) => {
  // When a breakdown is supplied it carries the networkInfo actually used (fetched if the tx was
  // unprepared); route the bandwidth/activation paths through the same data so their gating can't
  // disagree with the breakdown.
  const txForFees = breakdown
    ? { ...transaction, networkInfo: breakdown.networkInfo }
    : transaction;
  const feesFromAccountActivation =
    txForFees.mode === "send"
      ? await getFeesFromAccountActivation(account, txForFees, tokenAccount, breakdown)
      : new BigNumber(0);
  if (feesFromAccountActivation.gt(0)) {
    return feesFromAccountActivation;
  }

  const feesFromBandwidth = getFeesFromBandwidth(account, txForFees);
  return feesFromBandwidth;
};

export default getEstimatedFees;
