import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getCoinConfig } from "../../config";
import { UnknownExplorer } from "../../errors";
import etherscanLikeApi from "./etherscan";
import ledgerExplorerApi from "./ledger";
import noExplorerAPI from "./none";
import { ExplorerApi } from "./types";

/**
 * Switch to select one of the compatible explorer
 */
export const getExplorerApi = (currency: CryptoCurrency): ExplorerApi => {
  const config = getCoinConfig(currency).info;

  switch (config?.explorer?.type) {
    case "etherscan":
    case "blockscout":
    case "teloscan":
    case "klaytnfinder":
    case "corescan":
      return config.explorer.noCache
        ? etherscanLikeApi.explorerApiNoCache
        : etherscanLikeApi.explorerApi;
    case "ledger":
      return ledgerExplorerApi;
    case "none":
      return noExplorerAPI;

    default:
      throw new UnknownExplorer(`Unknown explorer for currency: ${currency.id}`);
  }
};
