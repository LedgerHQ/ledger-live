import type { BlockInfo } from "@ledgerhq/coin-framework/api/index";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getLedgerEnd } from "../../network/gateway";

export async function lastBlock(currency: CryptoCurrency): Promise<BlockInfo> {
  return {
    height: await getLedgerEnd(currency),
  };
}
