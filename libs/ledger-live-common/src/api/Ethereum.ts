import URL from "url";
import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import { LedgerAPINotAvailable } from "@ledgerhq/errors";
import JSONBigNumber from "@ledgerhq/json-bignumber";
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
}; // TODO more fields actually

export type Tx = {
  hash: string;
  status?: BigNumber;
  // 0: fail, 1: success
  received_at?: string;
  nonce: string;
  value: BigNumber;
  gas: BigNumber;
  gas_price: BigNumber;
  from: string;
  to: string;
  cumulative_gas_used?: BigNumber;
  gas_used?: BigNumber;
  transfer_events?: {
    list: Array<{
      contract: string;
      from: string;
      to: string;
      count: BigNumber;
      decimal?: number;
      symbol?: string;
    }>;
    truncated: boolean;
  };
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
  actions?: Array<{
    from: string;
    to: string;
    value: BigNumber;
    gas?: BigNumber;
    gas_used?: BigNumber;
  }>;
  block?: {
    hash: string;
    height: BigNumber;
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
    block_hash: string | null | undefined,
    batch_size?: number
  ) => Promise<{
    truncated: boolean;
    txs: Tx[];
  }>;
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
  roughlyEstimateGasLimit: (address: string) => Promise<BigNumber>;
  getERC20ApprovalsPerContract: (
    owner: string,
    contract: string
  ) => Promise<
    Array<{
      sender: string;
      value: string;
    }>
  >;
  getDryRunGasLimit: (
    address: string,
    transaction: { from: string; value: string; data: string }
  ) => Promise<BigNumber>;
  getGasTrackerBarometer: (currency: CryptoCurrency) => Promise<{
    low: BigNumber;
    medium: BigNumber;
    high: BigNumber;
    next_base: BigNumber;
  }>;
  getBlockByHash: (blockHash: string) => Promise<BlockByHashOutput | undefined>;
};
export const apiForCurrency = (currency: CryptoCurrency): API => {
  const baseURL = blockchainBaseURL(currency);

  if (!baseURL) {
    throw new LedgerAPINotAvailable(`LedgerAPINotAvailable ${currency.id}`, {
      currencyName: currency.name,
    });
  }

  return {
    async getTransactions(address, block_hash, batch_size = 2000) {
      let { data } = await network({
        method: "GET",
        url: URL.format({
          pathname: `${baseURL}/addresses/${address}/transactions`,
          query: {
            batch_size,
            noinput: true,
            no_input: true,
            no_token: true,
            filtering: true,
            block_hash,
          },
        }),
        transformResponse: JSONBigNumber.parse,
      });

      // v3 have a bug that still includes the tx of the paginated block_hash, we're cleaning it up
      if (block_hash) {
        data = {
          ...data,
          txs: data.txs.filter(
            (tx) => !tx.block || tx.block.hash !== block_hash
          ),
        };
      }

      return data;
    },

    async getCurrentBlock() {
      const { data } = await network({
        method: "GET",
        url: `${baseURL}/blocks/current`,
        transformResponse: JSONBigNumber.parse,
      });
      return data;
    },

    async getAccountNonce(address) {
      const { data } = await network({
        method: "GET",
        url: `${baseURL}/addresses/${address}/nonce`,
      });
      return data[0].nonce;
    },

    async broadcastTransaction(tx) {
      const { data } = await network({
        method: "POST",
        url: `${baseURL}/transactions/send`,
        data: {
          tx,
        },
      });
      return data.result;
    },

    async getAccountBalance(address) {
      const { data } = await network({
        method: "GET",
        url: `${baseURL}/addresses/${address}/balance`,
        transformResponse: JSONBigNumber.parse,
      });
      return new BigNumber(data[0].balance);
    },

    async getERC20Balances(input) {
      const { data } = await network({
        method: "POST",
        url: `${baseURL}/erc20/balances`,
        transformResponse: JSONBigNumber.parse,
        data: input,
      });
      return data;
    },

    async getNFTMetadata(input, chainId) {
      const { data }: { data: NFTMetadataResponse[] } = await network({
        method: "POST",
        url: `${getEnv(
          "NFT_ETH_METADATA_SERVICE"
        )}/v1/ethereum/${chainId}/contracts/tokens/infos`,
        data: input,
      });

      return data;
    },

    async getNFTCollectionMetadata(input, chainId) {
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

    async getERC20ApprovalsPerContract(owner, contract) {
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
            const { sender, value } = m;
            if (typeof sender !== "string" || typeof value !== "string") return;
            return {
              sender,
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

    async roughlyEstimateGasLimit(address) {
      const { data } = await network({
        method: "GET",
        url: `${baseURL}/addresses/${address}/estimate-gas-limit`,
        transformResponse: JSONBigNumber.parse,
      });
      return new BigNumber(data.estimated_gas_limit);
    },

    async getDryRunGasLimit(address, transaction) {
      const { data } = await network({
        method: "POST",
        url: `${baseURL}/addresses/${address}/estimate-gas-limit`,
        data: transaction,
        transformResponse: JSONBigNumber.parse,
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
        maxAge: 30 * 1000,
      }
    ),

    async getBlockByHash(blockHash) {
      if (!blockHash) {
        return undefined;
      }

      try {
        const { data }: { data: BlockByHashOutput[] } = await network({
          method: "GET",
          url: `${baseURL}/blocks/${blockHash}`,
          transformResponse: JSONBigNumber.parse,
        });

        return data[0];
      } catch (e) {
        return undefined;
      }
    },
  };
};
