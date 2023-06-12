import { CacheRes } from "@ledgerhq/live-network/cache";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Operation } from "@ledgerhq/types-live";
import etherscanLikeApi from "./etherscan";

type ExplorerApi = {
  getLastCoinOperations: CacheRes<
    [currency: CryptoCurrency, address: string, accountId: string, fromBlock: number],
    Operation[]
  >;
  getLastTokenOperations: CacheRes<
    [currency: CryptoCurrency, address: string, accountId: string, fromBlock: number],
    {
      tokenCurrency: TokenCurrency;
      operation: Operation;
    }[]
  >;
};

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
