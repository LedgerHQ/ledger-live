import { Operation } from "@ledgerhq/types-live";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { etherscanOperationToOperation } from "../adapters";
import { EtherscanOperation } from "../types";
import { makeLRUCache } from "../../../cache";
import network from "../../../network";

/**
 * Get all the latest "normal" transactions (no tokens / NFTs)
 */
export const getLatestTransactions = makeLRUCache<
  [
    currency: CryptoCurrency,
    address: string,
    accountId: string,
    fromBlock: number
  ],
  Operation[]
>(
  async (currency, address, accountId, fromBlock) => {
    const apiDomain = currency.ethereumLikeInfo?.explorer?.uri;
    if (!apiDomain) {
      return [];
    }

    let url = `${apiDomain}/api?module=account&action=txlist&address=${address}&tag=latest&page=1`;
    if (fromBlock) {
      url += `&startBlock=${fromBlock}`;
    }

    try {
      const { data }: { data: { result: EtherscanOperation[] } } =
        await network({
          method: "GET",
          url,
        });

      return data.result
        .map((tx) => etherscanOperationToOperation(accountId, address, tx))
        .filter(Boolean) as Operation[];
    } catch (e) {
      return [];
    }
  },
  (currency, address, accountId) => accountId,
  { maxAge: 6 * 1000 }
);

export default {
  getLatestTransactions,
};
