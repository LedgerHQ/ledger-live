import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import etherscanLikeApi from "./etherscan";
import { ExplorerApi } from "./types";

/**
 * Switch to select one of the compatible explorer
 */
export const getExplorerApi = (currency: CryptoCurrency): ExplorerApi => {
  const apiType = currency.ethereumLikeInfo?.explorer?.type;

  switch (apiType) {
    case "etherscan":
    case "blockscout":
      return etherscanLikeApi;

    default:
      throw new Error(`No explorer found for currency "${currency.id}"`);
  }
};
