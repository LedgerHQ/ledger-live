import { CacheRes } from "@ledgerhq/live-network/cache";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Operation } from "@ledgerhq/types-live";
import etherscanLikeApi from "./etherscan";

type ExplorerBasicRequest = (
  currency: CryptoCurrency,
  address: string,
  accountId: string,
  fromBlock: number,
  toBlock?: number,
) => Promise<Operation[]>;

type ExplorerApi = {
  getLastOperations: CacheRes<
    Parameters<ExplorerBasicRequest>,
    {
      lastCoinOperations: Operation[];
      lastTokenOperations: Operation[];
      lastNftOperations: Operation[];
    }
  >;
  // For now every other exported function should be considered as internal
  // methods as they're unecessary to the synchronization it self.
  // This can be updated with new sync requirements.
  // & { [key in
  //   | "getLastCoinOperations"
  //   | "getLastTokenOperations"
  //   | "getLastERC721Operations"
  //   | "getLastERC1155Operations"
  //   | "getLastNftOperations"]: ExplorerBasicRequest; }
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
