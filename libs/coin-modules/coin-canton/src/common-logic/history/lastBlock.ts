import type { BlockInfo } from "@ledgerhq/coin-framework/api/index";
import { getLedgerEnd as nodeGetLedgerEnd } from "../../network/node";
import { getLedgerEnd } from "../../network/gateway";
import coinConfig from "../../config";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

const useGateway = (currency: CryptoCurrency) =>
  coinConfig.getCoinConfig(currency).useGateway === true;

export async function lastBlock(currency: CryptoCurrency): Promise<BlockInfo> {
  return {
    height: useGateway(currency) ? await getLedgerEnd(currency) : await nodeGetLedgerEnd(),
    hash: "",
    time: new Date(),
  };
}
