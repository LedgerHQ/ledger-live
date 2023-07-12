import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getCurrencyConfig } from "../../logic";
import { UnknownExplorer } from "../../errors";
import etherscanLikeApi from "./etherscan";
import ledgerExplorerApi from "./ledger";
import { ExplorerApi } from "./types";

/**
 * Switch to select one of the compatible explorer
 */
export const getExplorerApi = async (currency: CryptoCurrency): Promise<ExplorerApi> => {
  const { explorer } = await getCurrencyConfig(currency);

  switch (explorer?.type) {
    case "etherscan":
    case "blockscout":
      return etherscanLikeApi;
    case "ledger":
      return ledgerExplorerApi;

    default:
      throw new UnknownExplorer(`Unknown explorer for currency: ${currency.id}`);
  }
};
