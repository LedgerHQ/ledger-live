import network from "../../../network";
import { Account, CryptoCurrency } from "../../../types";
import { APINetworkInfo } from "./api-types";
import { getEpoch, isTestnet } from "../logic";
import {
  CARDANO_API_ENDPOINT,
  CARDANO_TESTNET_API_ENDPOINT,
} from "../constants";

async function fetchNetworkInfo(
  currency: CryptoCurrency
): Promise<APINetworkInfo> {
  const res = await network({
    method: "GET",
    url: isTestnet(currency)
      ? `${CARDANO_TESTNET_API_ENDPOINT}/v1/network/info`
      : `${CARDANO_API_ENDPOINT}/v1/network/info`,
  });
  return res && (res.data as APINetworkInfo);
}

export async function getNetworkInfo(
  a: Account | undefined,
  currency: CryptoCurrency
): Promise<APINetworkInfo> {
  if (a && a.cardanoResources) {
    const currencyId = a.currency.id;
    const currentEpoch = getEpoch(currencyId, new Date());
    const lastSyncedEpoch = getEpoch(currencyId, a.lastSyncDate);

    if (currentEpoch === lastSyncedEpoch) {
      return {
        protocolParams: a.cardanoResources.protocolParams,
      };
    }
  }
  return fetchNetworkInfo(currency);
}
