import network from "@ledgerhq/live-network/network";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { CARDANO_API_ENDPOINT, CARDANO_TESTNET_API_ENDPOINT } from "../constants";
import { isTestnet } from "../logic";
import { APIGetPoolList, APIGetPoolsDetail } from "./api-types";

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
): Promise<APIGetPoolsDetail> {
  const { data } = await network<APIGetPoolsDetail>({
    method: "GET",
    url: isTestnet(currency)
      ? `${CARDANO_TESTNET_API_ENDPOINT}/v1/pool/detail`
      : `${CARDANO_API_ENDPOINT}/v1/pool/detail`,
    params: { poolIds },
  });
  return data;
}
