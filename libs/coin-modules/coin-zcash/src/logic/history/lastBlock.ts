import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/index";
import { getZainoEndpoint } from "../../constants";
import { getZCashClient } from "../engineClient";

/** CoinModuleApi-level lastBlock: current chain tip from the Zaino gRPC endpoint. */
export async function lastBlock(): Promise<BlockInfo> {
  const { grpcUrl, network } = getZainoEndpoint();
  const client = await getZCashClient({ grpcUrl, network });
  const height = await client.getChainTip();
  return { height, hash: "", time: new Date() };
}
