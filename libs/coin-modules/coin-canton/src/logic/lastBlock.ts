import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/index";
import { pinConfig, type CantonContext } from "../config";
import { getLedgerEnd, isGatewayEnabled } from "../network/gateway";

export async function lastBlock(context: CantonContext): Promise<BlockInfo> {
  const config = await context.config();
  if (!isGatewayEnabled(config)) throw new Error("Not implemented");
  const height = await getLedgerEnd(pinConfig(context, config));
  return {
    height,
    hash: "",
    time: new Date(),
  };
}
