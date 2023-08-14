import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { UnknownExplorer } from "../../errors";
import etherscanLikeApi from "./etherscan";
import ledgerExplorerApi from "./ledger";
import { ExplorerApi } from "./types";

/**
 * Switch to select one of the compatible explorer
 */
export const getExplorerApi = (currency: CryptoCurrency): ExplorerApi => {
  const apiType = currency.ethereumLikeInfo?.explorer?.type;

  switch (apiType) {
    case "etherscan":
    case "blockscout":
    case "teloscan":
    case "klaytnfinder":
      return etherscanLikeApi;
    case "ledger":
      return ledgerExplorerApi;

    default:
      throw new UnknownExplorer(`Unknown explorer for currency: ${currency.id}`);
  }
};
