import { isTestnet } from "../logic";
import { CARDANO_API_ENDPOINT, CARDANO_TESTNET_API_ENDPOINT } from "../constants";
import { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import network from "@ledgerhq/live-network/network";
import { APIGetDRepList } from "./api-types";

export async function fetchDRepList(
  currency: CryptoCurrency,
  search: string,
  pageNo: number,
  limit: number,
): Promise<APIGetDRepList> {
  const res = await network({
    method: "GET",
    url: isTestnet(currency)
      ? `${CARDANO_TESTNET_API_ENDPOINT}/v1/dRep/list`
      : `${CARDANO_API_ENDPOINT}/v1/dRep/list`,
    params: { search, pageNo, limit },
  });

  return res && (res.data as APIGetDRepList);
}
