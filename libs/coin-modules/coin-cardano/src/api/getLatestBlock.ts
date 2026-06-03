import network from "@ledgerhq/live-network/network";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { CARDANO_API_ENDPOINT, CARDANO_TESTNET_API_ENDPOINT } from "../constants";
import { isTestnet } from "../logic";
import { APILatestBlock } from "./api-types";

export async function fetchLatestBlock(currency: CryptoCurrency): Promise<APILatestBlock> {
  const res = await network({
    method: "GET",
    url: isTestnet(currency)
      ? `${CARDANO_TESTNET_API_ENDPOINT}/v1/block/latest`
      : `${CARDANO_API_ENDPOINT}/v1/block/latest`,
  });
  return res && (res.data as APILatestBlock);
}
