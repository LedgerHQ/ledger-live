import { APIGetPoolList, APIGetPoolsDetail } from "./api-types";
import { isTestnet } from "../logic";
import { CARDANO_API_ENDPOINT, CARDANO_TESTNET_API_ENDPOINT } from "../constants";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import network from "@ledgerhq/live-network/network";

export async function fetchPoolList(
  currency: CryptoCurrency,
  search: string,
  pageNo: number,
  limit: number,
): Promise<APIGetPoolList> {
  const res = await network({
    method: "GET",
    url: isTestnet(currency)
      ? `${CARDANO_TESTNET_API_ENDPOINT}/v1/pool/list`
      : `${CARDANO_API_ENDPOINT}/v1/pool/list`,
    params: { search, pageNo, limit },
  });
  return res && (res.data as APIGetPoolList);
}

export async function fetchPoolDetails(
  currency: CryptoCurrency,
  poolIds: Array<string>,
  ledgerPoolIds?: Array<string>,
): Promise<APIGetPoolsDetail> {
  const currentPoolIds = poolIds.length == 0 ? ledgerPoolIds : poolIds;
  const res = await network({
    method: "GET",
    url: isTestnet(currency)
      ? `${CARDANO_TESTNET_API_ENDPOINT}/v1/pool/detail`
      : `${CARDANO_API_ENDPOINT}/v1/pool/detail`,
    params: { poolIds: currentPoolIds },
  });
  if (!res || (res.data as APIGetPoolsDetail).pools.length === 0) {
    const newRes = await network({
      method: "GET",
      url: isTestnet(currency)
        ? `${CARDANO_TESTNET_API_ENDPOINT}/v1/pool/detail`
        : `${CARDANO_API_ENDPOINT}/v1/pool/detail`,
      params: { poolIds: ledgerPoolIds },
    });
    return newRes && (newRes.data as APIGetPoolsDetail);
  }
  return res && (res.data as APIGetPoolsDetail);
}
