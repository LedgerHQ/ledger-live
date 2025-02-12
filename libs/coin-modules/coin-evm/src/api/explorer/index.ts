import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { UnknownExplorer } from "../../errors";
import { getCoinConfig } from "../../config";
import etherscanLikeApi from "./etherscan";
import ledgerExplorerApi from "./ledger";
import { ExplorerApi } from "./types";
import noExplorerAPI from "./none";

/**
 * Switch to select one of the compatible explorer
 */
export const getExplorerApi = (currency: CryptoCurrency): ExplorerApi => {
  const config = getCoinConfig(currency).info;
  const apiType = config?.explorer?.type;

  switch (apiType) {
    case "etherscan":
    case "blockscout":
    case "teloscan":
    case "klaytnfinder":
      return etherscanLikeApi;
    case "ledger":
      return ledgerExplorerApi;
    case "none":
      return noExplorerAPI;

    default:
      throw new UnknownExplorer(`Unknown explorer for currency: ${currency.id}`);
  }
};
