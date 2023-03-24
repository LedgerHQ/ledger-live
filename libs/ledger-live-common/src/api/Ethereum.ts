import URL from "url";
import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import { LedgerAPINotAvailable } from "@ledgerhq/errors";
import { EIP1559ShouldBeUsed } from "../families/ethereum/transaction";
import network from "../network";
import { blockchainBaseURL } from "./Ledger";
import { FeeEstimationFailed } from "../errors";
import { makeLRUCache } from "../cache";
import { getEnv } from "../env";
import {
  NFTCollectionMetadataResponse,
  NFTMetadataResponse,
} from "@ledgerhq/types-live";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

export type Block = {
  height: BigNumber;
  hash: string;
  time: string;
  txs: string[];
};

export type Tx = {
  hash: string;
  transaction_type: number;
  status?: string;
  // 0: fail, 1: success
  confirmations?: number;
  received_at?: string;
  nonce: string;
  value: string;
  gas: string;
  gas_price: string;
  from: string;
  to: string;
  cumulative_gas_used?: string;
  gas_used?: string;
  transfer_events?: Array<{
    contract: string;
    from: string;
    to: string;
    count: string;
    decimal?: number;
    symbol?: string;
  }>;
  erc721_transfer_events?: Array<{
    contract: string;
    sender: string;
    receiver: string;
    token_id: string;
  }>;
  erc1155_transfer_events?: Array<{
    contract: string;
    sender: string;
    operator: string;
    receiver: string;
    transfers: Array<{
      id: string;
      value: string;
    }>;
  }>;
  approval_events?: Array<{
    contract: string;
    owner: string;
    spender: string;
    count: string;
  }>;
  actions?: Array<{
    from: string;
    to: string;
    value: string;
    gas?: string;
    gas_used?: string;
    error?: string;
    input?: string;
  }>;
  block?: {
    hash: string;
    height: number;
    time: string;
  };
};

export type ERC20BalancesInput = Array<{
  address: string;
  contract: string;
}>;

export type ERC20BalanceOutput = Array<{
  address: string;
  contract: string;
  balance: BigNumber;
}>;

export type NFTMetadataInput = Readonly<
  Array<{
    contract: string;
    tokenId: string;
  }>
>;

export type NFTCollectionMetadataInput = Readonly<
  Array<{
    contract: string;
  }>
>;

export type BlockByHashOutput = {
  hash: string;
  height: number;
  time: string;
  txs: string[];
};

export type API = {
  getTransactions: (
    address: string,
    blockHeight?: number | null,
    batchSize?: number,
    token?: string
  ) => Promise<{ txs: Tx[]; nextPageToken: string | undefined }>;
  getCurrentBlock: () => Promise<Block>;
  getAccountNonce: (address: string) => Promise<number>;
  broadcastTransaction: (signedTransaction: string) => Promise<string>;
  getERC20Balances: (input: ERC20BalancesInput) => Promise<ERC20BalanceOutput>;
  getNFTMetadata: (
    input: NFTMetadataInput,
    chainId: string
  ) => Promise<NFTMetadataResponse[]>;
  getNFTCollectionMetadata: (
    input: NFTCollectionMetadataInput,
    chainId: string
  ) => Promise<NFTCollectionMetadataResponse[]>;
  getAccountBalance: (address: string) => Promise<BigNumber>;
  getERC20ApprovalsPerContract: (
    owner: string,
    contract: string
  ) => Promise<
    Array<{
      sender: string;
      value: string;
    }>
  >;
  getDryRunGasLimit: (transaction: {
    from: string;
    value: string;
    data: string;
    to: string;
  }) => Promise<BigNumber>;
  getFallbackGasLimit: (address: string) => Promise<BigNumber>;
  getGasTrackerBarometer: (currency: CryptoCurrency) => Promise<{
    low: BigNumber;
    medium: BigNumber;
    high: BigNumber;
    next_base: BigNumber;
  }>;
  getBlockByHash: (
    blockHash: string | null | undefined
  ) => Promise<BlockByHashOutput | undefined>;
};

export const apiForCurrency = (currency: CryptoCurrency): API => {
  const baseURL = blockchainBaseURL(currency);

  if (!baseURL) {
    throw new LedgerAPINotAvailable(`LedgerAPINotAvailable ${currency.id}`, {
      currencyName: currency.name,
    });
  }

  return {
    async getTransactions(
      address,
      blockHeight,
      batchSize = 2000,
      token
    ): Promise<{ txs: Tx[]; nextPageToken: string | undefined }> {
      const query: any = {
        batch_size: batchSize,
        filtering: true,
        noinput: true,
      };
      if (blockHeight) {
        query.from_height = blockHeight;
        query.order = "descending";
      }
      if (token) {
        query.token = token;
      }
      const txData = await network({
        method: "GET",
        url: URL.format({
          pathname: `${baseURL}/address/${address}/txs`,
          query,
        }),
      });
      return { txs: txData.data.data, nextPageToken: txData.data.token };
    },

    async getCurrentBlock(): Promise<Block> {
      const { data } = await network({
        method: "GET",
        url: `${baseURL}/block/current`,
      });
      const { height, hash, time, txs } = data;
      return {
        hash,
        time,
        txs,
        height: new BigNumber(height),
      };
    },

    async getAccountNonce(address): Promise<number> {
      const { data } = await network({
        method: "GET",
        url: `${baseURL}/address/${address}/nonce`,
      });
      return data.nonce;
    },

    async broadcastTransaction(tx): Promise<string> {
      const { data } = await network({
        method: "POST",
        url: `${baseURL}/tx/send`,
        data: {
          tx,
        },
      });
      return data.result;
    },

    async getAccountBalance(address): Promise<BigNumber> {
      const { data } = await network({
        method: "GET",
        url: `${baseURL}/address/${address}/balance`,
      });
      return new BigNumber(data.balance);
    },

    async getERC20Balances(input): Promise<ERC20BalanceOutput> {
      const { data } = await network({
        method: "POST",
        url: `${baseURL}/erc20/balances`,
        data: input,
      });
      return data.map(({ address, contract, balance }) => ({
        address,
        contract,
        balance: new BigNumber(balance),
      }));
    },

    async getNFTMetadata(input, chainId): Promise<NFTMetadataResponse[]> {
      const { data }: { data: NFTMetadataResponse[] } = await network({
        method: "POST",
        url: `${getEnv(
          "NFT_ETH_METADATA_SERVICE"
        )}/v1/ethereum/${chainId}/contracts/tokens/infos`,
        data: input,
      });

      return data;
    },

    async getNFTCollectionMetadata(
      input,
      chainId
    ): Promise<NFTCollectionMetadataResponse[]> {
      const { data }: { data: NFTCollectionMetadataResponse[] } = await network(
        {
          method: "POST",
          url: `${getEnv(
            "NFT_ETH_METADATA_SERVICE"
          )}/v1/ethereum/${chainId}/contracts/infos`,
          data: input,
        }
      );

      return data;
    },

    async getERC20ApprovalsPerContract(
      owner,
      contract
    ): Promise<
      {
        sender: string;
        value: string;
      }[]
    > {
      try {
        const { data } = await network({
          method: "GET",
          url: URL.format({
            pathname: `${baseURL}/erc20/approvals`,
            query: {
              owner,
              contract,
            },
          }),
        });
        return data
          .map((m: any) => {
            if (!m || typeof m !== "object") return;
            const { spender, count: value } = m;
            if (typeof spender !== "string" || typeof value !== "string")
              return;
            return {
              sender: spender,
              value,
            };
          })
          .filter(Boolean);
      } catch (e: any) {
        if (e.status === 404) {
          return [];
        }

        throw e;
      }
    },

    // FIXME: Dirty fix that calls v3 gas limit estimation while we find a better solution
    async getFallbackGasLimit(address: string): Promise<BigNumber> {
      const { data } = await network({
        method: "GET",
        url: `${baseURL.replace(
          "v4",
          "v3"
        )}/addresses/${address}/estimate-gas-limit`,
      });
      return new BigNumber(data.estimated_gas_limit);
    },

    async getDryRunGasLimit(transaction): Promise<BigNumber> {
      const { data } = await network({
        method: "POST",
        url: `${baseURL}/tx/estimate-gas-limit`,
        data: transaction,
      });

      if (data.error_message) {
        throw new FeeEstimationFailed(data.error_message);
      }

      const value = new BigNumber(data.estimated_gas_limit);
      invariant(!value.isNaN(), "invalid server data");
      return value;
    },

    getGasTrackerBarometer: makeLRUCache(
      async (currency) => {
        const { data } = await network({
          method: "GET",
          url: `${baseURL}/gastracker/barometer${
            EIP1559ShouldBeUsed(currency) ? "?display=eip1559" : ""
          }`,
        });
        return {
          low: new BigNumber(data.low),
          medium: new BigNumber(data.medium),
          high: new BigNumber(data.high),
          next_base: new BigNumber(data.next_base),
        };
      },
      (currency) => currency.id,
      {
        ttl: 30 * 1000,
      }
    ),

    async getBlockByHash(blockHash): Promise<BlockByHashOutput | undefined> {
      if (!blockHash) {
        return undefined;
      }

      try {
        const { data }: { data: BlockByHashOutput[] } = await network({
          method: "GET",
          url: `${baseURL}/block/${blockHash}`,
        });

        return data[0];
      } catch (e) {
        return undefined;
      }
    },
  };
};
