import type { TransactionIntent, Unit } from "@ledgerhq/coin-module-framework/api/types";
import { parseCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies";
import { log } from "@ledgerhq/logs";
import BigNumber from "bignumber.js";
import type { TronMemo, TronTxData } from "../types";
import { getEnergyProvider } from "./energyProviders";
import { getEnergyRentQuote } from "./energyRent";
import type { TronResourceBreakdown } from "./estimateFees";

type TronIntent = TransactionIntent<TronMemo, TronTxData>;

// TODO(LIVE-32892): align these with the params the real energy-rent order uses at signing time.
const SPONSORED_RENTAL_DURATION_SECONDS = 600; // 10-min fastTrade window
const SPONSORED_RENTAL_EXTRA_TRX = 0.8; // bandwidth top-up Tronify bundles in the USDT-paid flow

/**
 * The sponsored-send savings estimate (LIVE-32776), surfaced on `FeeEstimation.parameters` as plain
 * strings so it survives the untyped, `JSON.stringify`-d fee-parameters channel the generic layer
 * carries. The coin module stays fiat-agnostic: it reports the avoided native TRX energy cost (SUN)
 * and names the provider; the front end does the fiat conversion.
 */
export type SponsoredEstimate = {
  sponsoredProviderId: string;
  sponsoredProviderName: string;
  avoidedEnergyFeesSun: string;
};

/**
 * Informational savings estimate for a sponsored (Tronify) send. Purely additive — it does NOT change
 * the fee (that re-pricing is LIVE-32892). The avoided cost is the full energy cost of the transfer
 * (`energyRequired × energyFee`), independent of the user's own staked energy. Returns `undefined`
 * when the send isn't sponsored, the provider id is unknown, energy couldn't be reliably estimated,
 * or nothing is transferred — so it never surfaces a misleading zero-savings estimate on an
 * unsponsored/native/TRC10 tx.
 */
export function resolveSponsoredEstimate(
  intent: TronIntent,
  energyRequired: BigNumber,
  energyEstimated: boolean,
  energyFee: number,
): SponsoredEstimate | undefined {
  const info = intent.data?.energyProviderInfo;
  if (!info) return undefined;
  const provider = getEnergyProvider(info.providerId);
  if (!provider || !energyEstimated || energyRequired.lte(0)) return undefined;
  const avoidedEnergyFees = energyRequired
    .multipliedBy(energyFee)
    .integerValue(BigNumber.ROUND_CEIL);
  return {
    sponsoredProviderId: provider.id,
    sponsoredProviderName: provider.name,
    avoidedEnergyFeesSun: avoidedEnergyFees.toFixed(),
  };
}

/**
 * The USDT rental fee (in the token's base units) that a sponsored TRC20 send must reserve on top of
 * the transfer amount (LIVE-32777), so a send that can't cover fee + amount can't be confirmed and
 * stranded. Live Tronify quote keyed on the breakdown's `energyRequired`. Returns 0 when not
 * applicable — not sponsored, unknown provider, not a TRC20 send, no reliable energy figure, no token
 * unit to price with, or the rent is priced in a currency other than the token sent (Flow 1 / TRX).
 * Never throws: quotes throw when energy-rent is unconfigured, so a failure degrades to no
 * reservation, logged.
 *
 * The reservation is applied here in `validateIntent` (status) but NOT in "Send Max": the generic
 * `estimateMaxSpendable` short-circuits token accounts before any coin-module call, with no family
 * override seam, so a sponsored Max overshoots and is caught here at status. A Max-path reservation
 * needs a dedicated estimateMaxSpendable family-hooks seam (follow-up framework PR).
 */
export async function computeSponsoredUsdtFee(
  intent: TronIntent,
  breakdown: TronResourceBreakdown | undefined,
  tokenUnit: Unit | undefined,
): Promise<BigNumber> {
  const info = intent.data?.energyProviderInfo;
  if (!info) return new BigNumber(0);
  // Consistent with resolveSponsoredEstimate: an unknown provider id reserves nothing (and must not
  // block the send), rather than silently pricing via the config-selected provider.
  if (!getEnergyProvider(info.providerId)) return new BigNumber(0);
  if (intent.asset.type !== "trc20") return new BigNumber(0);
  if (!breakdown || !breakdown.energyEstimated) return new BigNumber(0);
  const energyRequired = new BigNumber(breakdown.energyRequired);
  if (energyRequired.lte(0)) return new BigNumber(0);
  // Without the token's unit the quoted decimal amount can't be parsed into base units — degrade to
  // no reservation rather than mis-scale it.
  if (!tokenUnit) return new BigNumber(0);

  try {
    const quote = await getEnergyRentQuote({
      payerAddress: intent.sender,
      receiverAddress: intent.sender,
      energy: BigInt(energyRequired.integerValue(BigNumber.ROUND_CEIL).toFixed()),
      durationSeconds: SPONSORED_RENTAL_DURATION_SECONDS,
      extraTrx: SPONSORED_RENTAL_EXTRA_TRX,
    });
    // Only reserve when the rent is paid in the SAME asset being sent (Flow 2 / USDT); a TRX-paid rent
    // (Flow 1) is charged to the parent account, not this token balance.
    if (quote.payCoinCode.toUpperCase() !== tokenUnit.code.toUpperCase()) {
      return new BigNumber(0);
    }
    return parseCurrencyUnit(tokenUnit, quote.payCoinAmt);
  } catch (err) {
    log("tron/computeSponsoredUsdtFee", "rent quote unavailable, skipping fee reservation", {
      err,
    });
    return new BigNumber(0);
  }
}
