import URL from "url";
import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import { LedgerAPINotAvailable } from "@ledgerhq/errors";
import type { EthereumGasLimitRequest } from "../families/ethereum/types";
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
  status?: BigNumber;
  // 0: fail, 1: success
  confirmations?: number;
  received_at?: string;
  nonce: string;
  value: BigNumber;
  gas: BigNumber;
  gas_price: BigNumber;
  from: string;
  to: string;
  cumulative_gas_used?: BigNumber;
  gas_used?: BigNumber;
  transfer_events?: Array<{
    contract: string;
    from: string;
    to: string;
    count: BigNumber;
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
    value: BigNumber;
    gas?: BigNumber;
    gas_used?: BigNumber;
    error?: string;
    input?: string;
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
  ) => Promise<{ txs: Tx[] }>;
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
    request: EthereumGasLimitRequest
  ) => Promise<BigNumber>;
  getGasTrackerBarometer: () => Promise<{
    low: BigNumber;
    medium: BigNumber;
    high: BigNumber;
  }>;
  getBlockByHash: (blockHash: string) => Promise<BlockByHashOutput | undefined>;
};

function adaptTx(apiTx): Tx {
  return {
    ...apiTx,
    value: new BigNumber(apiTx.value),
    gas: new BigNumber(apiTx.gas),
    gas_price: new BigNumber(apiTx.gas_price),
    cumulative_gas_used: new BigNumber(apiTx.cumulative_gas_used),
    gas_used: new BigNumber(apiTx.gas_used),
    block: {
      ...apiTx.block,
      height: new BigNumber(apiTx.block.height),
    },
    transfer_events: apiTx.transfer_events.map((event) => ({
      ...event,
      count: new BigNumber(event.count),
    })),
    actions: apiTx.actions.map((action) => ({
      ...action,
      value: new BigNumber(action.count),
      gas: new BigNumber(action.gas),
      gas_used: new BigNumber(action.gas_used),
    })),
  };
}

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
          pathname: `${baseURL}/address/${address}/txs`,
          query: {
            batch_size,
            noinput: true,
            no_input: true,
            no_token: true,
            filtering: true,
            block_hash,
          },
        }),
      });

      return { txs: data.data.map((tx) => adaptTx(tx)) };
    },

    async getCurrentBlock() {
      const { data } = await network({
        method: "GET",
        url: `${baseURL}/block/current`,
      });
      return {
        ...data,
        height: new BigNumber(data.height),
      };
    },

    async getAccountNonce(address) {
      const { data } = await network({
        method: "GET",
        url: `${baseURL}/address/${address}/nonce`,
      });
      return data.nonce;
    },

    async broadcastTransaction(tx) {
      const { data } = await network({
        method: "POST",
        url: `${baseURL}/tx/send`,
        data: {
          tx,
        },
      });
      return data.result;
    },

    async getAccountBalance(address) {
      const { data } = await network({
        method: "GET",
        url: `${baseURL}/address/${address}/balance`,
      });
      return new BigNumber(data.balance);
    },

    async getERC20Balances(input) {
      const { data } = await network({
        method: "POST",
        url: `${baseURL}/erc20/balances`,
        data: input,
      });
      return data.map((erc20Balance) => ({
        ...erc20Balance,
        balance: new BigNumber(erc20Balance.balance),
      }));
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
            const { spender, value } = m;
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

    async roughlyEstimateGasLimit(address) {
      const { data } = await network({
        method: "GET",
        url: `${baseURL}/address/${address}/estimate-gas-limit`,
      });
      return new BigNumber(data.estimated_gas_limit);
    },

    async getDryRunGasLimit(address, request) {
      const post: Record<string, any> = { ...request };
      // .to not needed by backend as it's part of URL:
      delete post.to;
      // backend use gas_price casing:
      post.gas_price = request.gasPrice;
      delete post.gasPrice;
      const { data } = await network({
        method: "POST",
        url: `${baseURL}/address/${address}/estimate-gas-limit`,
        data: post,
      });

      if (data.error_message) {
        throw new FeeEstimationFailed(data.error_message);
      }

      const value = new BigNumber(data.estimated_gas_limit);
      invariant(!value.isNaN(), "invalid server data");
      return value;
    },

    getGasTrackerBarometer: makeLRUCache(
      async () => {
        const { data } = await network({
          method: "GET",
          url: `${baseURL}/gastracker/barometer`,
        });
        return {
          low: new BigNumber(data.low),
          medium: new BigNumber(data.medium),
          high: new BigNumber(data.high),
        };
      },
      () => "",
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
          url: `${baseURL}/block/${blockHash}`,
        });

        return data[0];
      } catch (e) {
        return undefined;
      }
    },
  };
};
