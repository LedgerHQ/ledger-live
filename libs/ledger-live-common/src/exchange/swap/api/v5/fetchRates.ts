import network from "@ledgerhq/live-network/network";
import { DEFAULT_SWAP_TIMEOUT_MS } from "../../const/timeout";
import axios from "axios";
import { LedgerAPI4xx } from "@ledgerhq/errors";
import { areAllItemsDefined } from "../../utils/areAllItemsDefined";
import { getEnv } from "@ledgerhq/live-env";

type Props = {
  providers: Array<string>;
  currencyFrom?: string;
  toCurrencyId?: string;
  fromCurrencyAmount: string;
};

type ProviderType = "DEX" | "CEX" | "DISABLED";

type CommonProperties = {
  provider: string;
  providerType: ProviderType;
  from: string;
  to: string;
  amountFrom: string;
  amountTo: string;
  payoutNetworkFees: string;
  status: string;
  providerURL?: string;
};

type FloatRate = CommonProperties & {
  tradeMethod: "float";
  rateId?: string;
  minAmountFrom: string;
  maxAmountFrom?: string;
};

type FixedRate = CommonProperties & {
  tradeMethod: "fixed";
  rateId: string;
  expirationTime: string;
};

type ResponseDataRaw = Array<FloatRate | FixedRate>;

export async function fetchRates({
  providers,
  currencyFrom,
  toCurrencyId,
  fromCurrencyAmount,
}: Props) {
  // if (isIntegrationTestEnv()) return Promise.resolve(fetchCurrencyAllMock);
  if (!areAllItemsDefined(providers, currencyFrom, toCurrencyId)) {
    return Promise.resolve([]);
  }

  const url = new URL(`${getEnv("SWAP_API_BASE_V5")}/rate`);
  const requestBody = {
    from: currencyFrom,
    to: toCurrencyId,
    amountFrom: fromCurrencyAmount, // not sure why amountFrom thinks it can be undefined here
    providers,
  };

  try {
    const { data } = await network<ResponseDataRaw>({
      method: "POST",
      url: url.toString(),
      timeout: DEFAULT_SWAP_TIMEOUT_MS,
      data: requestBody,
    });
    return data.filter(d => d.status === "success");
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
