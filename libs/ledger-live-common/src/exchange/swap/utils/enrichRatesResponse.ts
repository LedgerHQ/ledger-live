import BigNumber from "bignumber.js";
import { parseFiniteBigNumber } from "@ledgerhq/ledger-wallet-framework/bignumber";
import { SwapGenericAPIError } from "../../../errors";
import { ExchangeRate, ExchangeRateResponseRaw } from "../types";
import { Unit } from "@domain/entity-currency-unit";
import { inferError } from "./inferRatesError";

export function enrichRatesResponse(
  response: ExchangeRateResponseRaw[],
  unitTo: Unit,
  unitFrom: Unit,
): ExchangeRate[] {
  return response.map<ExchangeRate>(r => {
    if (r.status === "success") {
      const payoutNetworkFees =
        r.providerType === "DEX" ? new BigNumber(0) : parseFiniteBigNumber(r.payoutNetworkFees);
      const amountTo = parseFiniteBigNumber(r.amountTo);
      const netAmountTo = payoutNetworkFees && amountTo?.minus(payoutNetworkFees);
      const amountFrom = parseFiniteBigNumber(r.amountFrom);
      const rate =
        r.tradeMethod === "fixed"
          ? parseFiniteBigNumber(r.rate)
          : amountFrom && netAmountTo?.div(amountFrom);
      // An unreadable provider rate becomes an errored entry, which callers filter out
      if (!payoutNetworkFees || !netAmountTo || !rate)
        return erroredRate(r, new SwapGenericAPIError());

      const magnitudeAwareToAmount = netAmountTo.shiftedBy(unitTo.magnitude);
      const magnitudeAwarePayoutNetworkFees = payoutNetworkFees.shiftedBy(unitTo.magnitude);
      const magnitudeAwareRate = rate.shiftedBy(unitTo.magnitude - unitFrom.magnitude);

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

    return erroredRate(r, r.status === "error" ? inferError(r, unitFrom) : undefined);
  });
}

function erroredRate(r: ExchangeRateResponseRaw, error: Error | undefined): ExchangeRate {
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
}
