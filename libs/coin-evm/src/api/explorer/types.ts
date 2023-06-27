import { Operation } from "@ledgerhq/types-live";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

type ExplorerBasicRequest = (
  currency: CryptoCurrency,
  address: string,
  accountId: string,
  fromBlock: number,
  toBlock?: number,
) => Promise<Operation[]>;

export type ExplorerApi = {
  getLastOperations: (...args: Parameters<ExplorerBasicRequest>) => Promise<{
    lastCoinOperations: Operation[];
    lastTokenOperations: Operation[];
    lastNftOperations: Operation[];
  }>;

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
