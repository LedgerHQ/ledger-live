import network from "../../../network";
import { APIGetPoolList, APINetworkInfo } from "./api-types";
import { isTestnet } from "../logic";
import {
  CARDANO_API_ENDPOINT,
  CARDANO_TESTNET_API_ENDPOINT,
} from "../constants";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

export async function fetchPoolList(
  currency: CryptoCurrency,
  search: string,
  pageNo: number,
  limit: number
): Promise<APINetworkInfo> {
  const res = await network({
    method: "GET",
    url: isTestnet(currency)
      ? `${CARDANO_TESTNET_API_ENDPOINT}/v1/pool/list`
      : `${CARDANO_API_ENDPOINT}/v1/pool/list`,
    params: { search, pageNo, limit },
  });
  return res && (res.data as APIGetPoolList);
}
