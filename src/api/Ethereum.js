// @flow
import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import { LedgerAPINotAvailable } from "@ledgerhq/errors";
import JSONBigNumber from "../JSONBigNumber";
import type { CryptoCurrency } from "../types";
import type { EthereumGasLimitRequest } from "../families/ethereum/types";
import network from "../network";
import { blockchainBaseURL, getCurrencyExplorer } from "./Ledger";
import { FeeEstimationFailed } from "../errors";

export type Block = { height: number }; // TODO more fields actually

export type Tx = {
  hash: string,
  received_at: string,
  nonce: string,
  value: number,
  gas: number,
  gas_price: number,
  cumulative_gas_used: number,
  gas_used: number,
  from: string,
  to: string,
  input: string,
  index: number,
  block?: {
    hash: string,
    height: number,
    time: string,
  },
  confirmations: number,
  status: number,
};

export type API = {
  getTransactions: (
    address: string,
    blockHash: ?string
  ) => Promise<{
    truncated: boolean,
    txs: Tx[],
  }>,
  getCurrentBlock: () => Promise<Block>,
  getAccountNonce: (address: string) => Promise<number>,
  broadcastTransaction: (signedTransaction: string) => Promise<string>,
  getAccountBalance: (address: string) => Promise<BigNumber>,
  roughlyEstimateGasLimit: (address: string) => Promise<BigNumber>,
  getDryRunGasLimit: (
    address: string,
    request: EthereumGasLimitRequest
  ) => Promise<BigNumber>,
};

export const apiForCurrency = (currency: CryptoCurrency): API => {
  const baseURL = blockchainBaseURL(currency);
  if (!baseURL) {
    throw new LedgerAPINotAvailable(`LedgerAPINotAvailable ${currency.id}`, {
      currencyName: currency.name,
    });
  }
  return {
    async getTransactions(address, blockHash) {
      let { data } = await network({
        method: "GET",
        url: `${baseURL}/addresses/${address}/transactions`,
        params:
          getCurrencyExplorer(currency).version === "v2"
            ? {
                blockHash,
                noToken: 1,
              }
            : {
                batch_size: 2000,
                no_token: true,
                block_hash: blockHash,
                partial: true,
              },
      });
      // v3 have a bug that still includes the tx of the paginated block_hash, we're cleaning it up
      if (blockHash && getCurrencyExplorer(currency).version === "v3") {
        data = {
          ...data,
          txs: data.txs.filter(
            (tx) => !tx.block || tx.block.hash !== blockHash
          ),
        };
      }
      return data;
    },

    async getCurrentBlock() {
      const { data } = await network({
        method: "GET",
        url: `${baseURL}/blocks/current`,
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
        data: { tx },
      });
      return data.result;
    },

    async getAccountBalance(address) {
      const { data } = await network({
        method: "GET",
        url: `${baseURL}/addresses/${address}/balance`,
        transformResponse: JSONBigNumber.parse,
      });
      return BigNumber(data[0].balance);
    },

    async roughlyEstimateGasLimit(address) {
      if (getCurrencyExplorer(currency).version === "v2") {
        return BigNumber(21000);
      }
      const { data } = await network({
        method: "GET",
        url: `${baseURL}/addresses/${address}/estimate-gas-limit`,
        transformResponse: JSONBigNumber.parse,
      });
      return BigNumber(data.estimated_gas_limit);
    },

    async getDryRunGasLimit(address, request) {
      if (getCurrencyExplorer(currency).version === "v2") {
        return BigNumber(21000);
      }
      const { data } = await network({
        method: "POST",
        url: `${baseURL}/addresses/${address}/estimate-gas-limit`,
        data: request,
        transformResponse: JSONBigNumber.parse,
      });
      if (data.error_message) {
        throw new FeeEstimationFailed(data.error_message);
      }
      const value = BigNumber(data.estimated_gas_limit);
      invariant(!value.isNaN(), "invalid server data");
      return value;
    },
  };
};
