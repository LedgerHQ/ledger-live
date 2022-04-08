import URL from "url";
import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import { LedgerAPINotAvailable } from "@ledgerhq/errors";
import JSONBigNumber from "@ledgerhq/json-bignumber";
import type { CryptoCurrency, NFTMetadataResponse } from "../types";
import type { EthereumGasLimitRequest } from "../families/ethereum/types";
import network from "../network";
import { blockchainBaseURL } from "./Ledger";
import { FeeEstimationFailed } from "../errors";
import { makeLRUCache } from "../cache";
import { getEnv } from "../env";

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
  getNFTMetadata: (input: NFTMetadataInput) => Promise<NFTMetadataResponse[]>;
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

    async getNFTMetadata(input) {
      const { data }: { data: NFTMetadataResponse[] } = await network({
        method: "POST",
        url:
          getEnv("NFT_ETH_METADATA_SERVICE") +
          "/v1/ethereum/1/contracts/tokens/infos",
        data: input,
      });

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

    async getDryRunGasLimit(address, request) {
      const post: Record<string, any> = { ...request };
      // .to not needed by backend as it's part of URL:
      delete post.to;
      // backend use gas_price casing:
      post.gas_price = request.gasPrice;
      delete post.gasPrice;
      const { data } = await network({
        method: "POST",
        url: `${baseURL}/addresses/${address}/estimate-gas-limit`,
        data: post,
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
  };
};
