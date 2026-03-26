import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/index";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { isGatewayEnabled } from "../../config";
import { getLedgerEnd } from "../../network/gateway";

export async function lastBlock(currency: CryptoCurrency): Promise<BlockInfo> {
  if (!isGatewayEnabled(currency)) throw new Error("Not implemented");
  const height = await getLedgerEnd(currency);
  return {
    height,
    hash: "",
    time: new Date(),
  };
}
