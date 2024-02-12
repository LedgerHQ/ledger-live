import BigNumber from "bignumber.js";
import { ExchangeRate, ExchangeRateResponseRaw } from "../types";
import { Unit } from "@ledgerhq/types-cryptoassets";
import { inferError } from "./inferRatesError";

export function enrichRatesResponse(
  response: ExchangeRateResponseRaw[],
  unitTo: Unit,
  unitFrom: Unit,
): ExchangeRate[] {
  return response.map<ExchangeRate>(r => {
    if (r.status === "success") {
      const payoutNetworkFees = r.providerType === "DEX" ? 0 : r.payoutNetworkFees;
      const rate =
        r.tradeMethod === "fixed"
          ? BigNumber(r.rate)
          : BigNumber(r.amountTo).minus(payoutNetworkFees).div(r.amountFrom);

      const magnitudeAwareToAmount = BigNumber(r.amountTo)
        .minus(payoutNetworkFees)
        .times(new BigNumber(10).pow(unitTo.magnitude));

      const magnitudeAwarePayoutNetworkFees = BigNumber(payoutNetworkFees).times(
        new BigNumber(10).pow(unitTo.magnitude),
      );

      const magnitudeAwareRate = rate.div(
        new BigNumber(10).pow(unitFrom.magnitude - unitTo.magnitude),
      );

      return {
        ...(r.tradeMethod === "fixed" ? { expirationTime: Number(r.expirationTime) } : {}),
        magnitudeAwareRate,
        payoutNetworkFees: magnitudeAwarePayoutNetworkFees,
        provider: r.provider,
        providerType: r.providerType,
        providerURL: r.providerURL,
        rate,
        rateId: r.rateId,
        toAmount: magnitudeAwareToAmount,
        tradeMethod: r.tradeMethod,
      };
    }

    const error = r.status === "error" ? inferError(r, unitFrom) : undefined;
    return {
      magnitudeAwareRate: BigNumber(0),
      payoutNetworkFees: BigNumber(0),
      provider: r.provider,
      providerType: r.providerType,
      rate: undefined,
      toAmount: BigNumber(0),
      tradeMethod: r.tradeMethod,
      error,
    };
  });
}
