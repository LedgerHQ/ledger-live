import type { BlockInfo } from "@ledgerhq/coin-framework/api/index";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import coinConfig from "../../config";
import { getLedgerEnd as getLedgerEndGateway } from "../../network/gateway";
import { getLedgerEnd as getLedgerEndNode } from "../../network/node";

const useGateway = (currency: CryptoCurrency) =>
  coinConfig.getCoinConfig(currency).useGateway === true;

export async function lastBlock(currency: CryptoCurrency): Promise<BlockInfo> {
  return {
    height: useGateway(currency)
      ? await getLedgerEndGateway(currency)
      : await getLedgerEndNode(currency),
  };
}
