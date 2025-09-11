import type { BlockInfo } from "@ledgerhq/coin-framework/api/index";
import { getLedgerEnd as nodeGetLedgerEnd } from "../../network/node";
import { getLedgerEnd } from "../../network/gateway";
import coinConfig from "../../config";

const useGateway = () => coinConfig.getCoinConfig().useGateway === true;

export async function lastBlock(): Promise<BlockInfo> {
  return {
    height: useGateway() ? await getLedgerEnd() : await nodeGetLedgerEnd(),
  };
}
