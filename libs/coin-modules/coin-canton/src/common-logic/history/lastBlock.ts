import type { BlockInfo } from "@ledgerhq/coin-framework/api/index";
import { getLedgerEnd } from "../../network/node";

export async function lastBlock(): Promise<BlockInfo> {
  return {
    height: await getLedgerEnd(),
  };
}
