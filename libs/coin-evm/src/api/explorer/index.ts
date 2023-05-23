import { CacheRes } from "@ledgerhq/live-network/cache";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Operation } from "@ledgerhq/types-live";
import etherscanLikeApi from "./etherscan";

type ExplorerApi = {
  getLastCoinOperations: (currency: CryptoCurrency, address: string, accountId: string, fromBlock: number) => Promise<Operation[]>;
  getLastTokenOperations: (currency: CryptoCurrency, address: string, accountId: string, fromBlock: number) => Promise<Operation[]>;
  getLastERC721Operations: (currency: CryptoCurrency, address: string, accountId: string, fromBlock: number) => Promise<Operation[]>;
  getLastERC1155Operations: (currency: CryptoCurrency, address: string, accountId: string, fromBlock: number) => Promise<Operation[]>;
  getLastNftOperations: (currency: CryptoCurrency, address: string, accountId: string, fromBlock: number) => Promise<Operation[]>;
  getLastOperations: CacheRes<
    [currency: CryptoCurrency, address: string, accountId: string, fromBlock: number],
    {
      lastCoinOperations: Operation[];
      lastTokenOperations: Operation[];
      lastNftOperations: Operation[];
    }
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
