import network from "@ledgerhq/live-network/network";
import { DEFAULT_SWAP_TIMEOUT_MS } from "../../const/timeout";
import axios from "axios";
import { LedgerAPI4xx } from "@ledgerhq/errors";
import { getEnv } from "@ledgerhq/live-env";
import BigNumber from "bignumber.js";
import { ExchangeRate, ExchangeRateV5ResponseRaw } from "../../types";
import { Unit } from "@ledgerhq/live-app-sdk";

type Props = {
  providers: Array<string>;
  currencyFrom?: string;
  toCurrencyId?: string;
  fromCurrencyAmount: string;
  unitTo: Unit;
  unitFrom: Unit;
};

export async function fetchRates({
  providers,
  currencyFrom,
  toCurrencyId,
  unitTo,
  unitFrom,
  fromCurrencyAmount,
}: Props): Promise<ExchangeRate[]> {
  const url = new URL(`${getEnv("SWAP_API_BASE_V5")}/rate`);
  const requestBody = {
    from: currencyFrom,
    to: toCurrencyId,
    amountFrom: fromCurrencyAmount, // not sure why amountFrom thinks it can be undefined here
    providers,
  };

  try {
    const { data } = await network<ExchangeRateV5ResponseRaw[]>({
      method: "POST",
      url: url.toString(),
      timeout: DEFAULT_SWAP_TIMEOUT_MS,
      data: requestBody,
    });
    return data
      .filter(r => r.status === "success")
      .map(r => {
        const rate =
          r.tradeMethod === "fixed"
            ? BigNumber(r.rate)
            : BigNumber(r.amountTo).minus(r.payoutNetworkFees).div(r.amountFrom);

        const magnitudeAwareToAmount = BigNumber(r.amountTo)
          .minus(r.payoutNetworkFees)
          .times(new BigNumber(10).pow(unitTo.magnitude));

        const magnitudeAwarePayoutNetworkFees = BigNumber(r.payoutNetworkFees).times(
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
      });
  } catch (e: unknown) {
    if (axios.isAxiosError(e)) {
      if (e.code === "ECONNABORTED") {
        // TODO: LIVE-8901 (handle request timeout)
      }
    }
    if (e instanceof LedgerAPI4xx) {
      // TODO: LIVE-8901 (handle 4xx)
    }
    throw e;
  }
}
