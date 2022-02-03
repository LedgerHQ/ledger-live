import type { AxiosRequestConfig } from "axios";
import axios, { AxiosInstance } from "axios";
import axiosRetry, { isNetworkOrIdempotentRequestError } from "axios-retry";
import BigNumber from "bignumber.js";
import genericPool, { Pool } from "generic-pool";

import JSONBigNumber from "@ledgerhq/json-bignumber";
import { Address, Block, TX } from "../storage/types";
import EventEmitter from "../utils/eventemitter";
import { IExplorer } from "./types";
import {
  requestInterceptor,
  responseInterceptor,
  errorInterceptor,
} from "../../../../network";

class BitcoinLikeExplorer extends EventEmitter implements IExplorer {
  client: Pool<{ client: AxiosInstance }>;

  underlyingClient: AxiosInstance;

  disableBatchSize = false;

  explorerVersion: "v2" | "v3";

  constructor({
    explorerURI,
    explorerVersion,
    disableBatchSize,
  }: {
    explorerURI: string;
    explorerVersion: "v2" | "v3";
    disableBatchSize?: boolean;
  }) {
    super();

    const clientParams: AxiosRequestConfig = {
      baseURL: explorerURI,
    };

    // not react native
    if (
      !(typeof navigator !== "undefined" && navigator.product === "ReactNative")
    ) {
      // eslint-disable-next-line global-require,@typescript-eslint/no-var-requires
      const https = require("https");
      // uses max 20 keep alive request in parallel
      clientParams.httpsAgent = new https.Agent({
        keepAlive: true,
        maxSockets: 20,
      });
    }

    const client = axios.create(clientParams);
    this.underlyingClient = client;
    // 3 retries per request
    axiosRetry(client, {
      retries: 3,
      retryCondition: (e) =>
        isNetworkOrIdempotentRequestError(e) ||
        // workaround for explorers v3 that sometimes returns 4xx instead of 5xx
        (e.code !== "ECONNABORTED" &&
          (!e.response ||
            (e.response.status >= 400 && e.response.status <= 499))),
    });
    // max 20 requests
    this.client = genericPool.createPool(
      {
        create: () => Promise.resolve({ client }),
        destroy: () => Promise.resolve(),
      },
      { max: 20 }
    );

    this.explorerVersion = explorerVersion;
    if (disableBatchSize) {
      this.disableBatchSize = disableBatchSize;
    }

    // Logging
    client.interceptors.request.use(requestInterceptor);
    client.interceptors.response.use(responseInterceptor, errorInterceptor);
  }

  async broadcast(tx: string) {
    const url = "/transactions/send";
    const client = await this.client.acquire();
    const res = await client.client.post(url, { tx });
    await this.client.release(client);
    return res;
  }

  async getTxHex(txId: string) {
    const url = `/transactions/${txId}/hex`;

    this.emit("fetching-transaction-tx", { url, txId });

    // TODO add a test for failure (at the sync level)
    const client = await this.client.acquire();
    const res: any = (await client.client.get(url)).data;
    await this.client.release(client);

    this.emit("fetched-transaction-tx", { url, tx: res[0] });

    return res[0].hex;
  }

  async getCurrentBlock() {
    const url = `/blocks/current`;

    this.emit("fetching-block", { url });

    const client = await this.client.acquire();
    const res: any = (await client.client.get(url)).data;
    await this.client.release(client);

    this.emit("fetched-block", { url, block: res });

    if (!res) {
      return null;
    }

    const block: Block = {
      height: res.height,
      hash: res.hash,
      time: res.time,
    };

    return block;
  }

  async getBlockByHeight(height: number) {
    const url = `/blocks/${height}`;

    this.emit("fetching-block", { url, height });

    const client = await this.client.acquire();
    const res: any = (await client.client.get(url)).data;
    await this.client.release(client);

    this.emit("fetched-block", { url, block: res[0] });

    if (!res[0]) {
      return null;
    }

    const block: Block = {
      height: res[0].height,
      hash: res[0].hash,
      time: res[0].time,
    };

    return block;
  }

  async getFees() {
    const url = `/fees`;

    this.emit("fetching-fees", { url });

    // TODO add a test for failure (at the sync level)
    const client = await this.client.acquire();
    const fees = (await client.client.get(url)).data;
    await this.client.release(client);

    this.emit("fetching-fees", { url, fees });

    return fees;
  }

  async getRelayFee() {
    const client = await this.client.acquire();
    const fees = (await client.client.get(`/network`)).data;
    await this.client.release(client);
    return parseFloat(fees["relay_fee"]);
  }

  async getPendings(address: Address, nbMax?: number) {
    const params: {
      no_token?: string;
      noToken?: string;
      batch_size?: number;
      block_hash?: string;
      blockHash?: string;
    } =
      this.explorerVersion === "v2"
        ? {
            noToken: "true",
          }
        : {
            no_token: "true",
          };
    if (!this.disableBatchSize) {
      params.batch_size = nbMax || 1000;
    }
    const res = await this.fetchTxs(address, params);
    const pendingsTxs = res.txs.filter((tx) => !tx.block);
    pendingsTxs.forEach((tx) => this.hydrateTx(address, tx));
    return pendingsTxs;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async fetchTxs(address: Address, params: any) {
    const url = `/addresses/${address.address}/transactions`;

    this.emit("fetching-address-transaction", { url, params });

    // TODO add a test for failure (at the sync level)
    const client = await this.client.acquire();
    const res = (
      await client.client.get(url, {
        params,
        // some altcoin may have outputs with values > MAX_SAFE_INTEGER
        transformResponse: (string) =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          JSONBigNumber.parse(string, (key: string, value: any) => {
            if (BigNumber.isBigNumber(value)) {
              if (key === "value") {
                return value.toString();
              }

              return value.toNumber();
            }
            return value;
          }),
      })
    ).data as { txs: TX[] };
    await this.client.release(client);

    this.emit("fetched-address-transaction", { url, params, res });

    return res;
  }

  // eslint-disable-next-line class-methods-use-this,@typescript-eslint/no-explicit-any
  hydrateTx(address: Address, tx: TX) {
    // no need to keep those as they change
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line no-param-reassign
    delete tx.confirmations;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    delete tx.id;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    delete tx.lock_time;

    // eslint-disable-next-line no-param-reassign
    tx.account = address.account;
    // eslint-disable-next-line no-param-reassign
    tx.index = address.index;
    // eslint-disable-next-line no-param-reassign
    tx.address = address.address;
    tx.inputs.forEach((input) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      delete input.txinwitness;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      delete input.script_signature;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      delete input.input_index;
    });
    tx.outputs.forEach((output) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      delete output.script_hex;
      // eslint-disable-next-line no-param-reassign
      output.output_hash = tx.hash;
      // eslint-disable-next-line no-param-reassign
      output.block_height = tx.block ? tx.block.height : null;
      // Definition of replaceable, per the standard: https://github.com/bitcoin/bips/blob/61ccc84930051e5b4a99926510d0db4a8475a4e6/bip-0125.mediawiki#summary
      output.rbf = tx.inputs[0] ? tx.inputs[0].sequence < 0xffffffff : false;
    });
  }

  async getAddressTxsSinceLastTxBlock(
    batchSize: number,
    address: Address,
    lastTx: TX | undefined
  ) {
    const params: {
      no_token?: string;
      noToken?: string;
      batch_size?: number;
      block_hash?: string;
      blockHash?: string;
    } =
      this.explorerVersion === "v2"
        ? {
            noToken: "true",
          }
        : {
            no_token: "true",
          };
    if (!this.disableBatchSize) {
      params.batch_size = batchSize;
    }
    if (lastTx) {
      if (this.explorerVersion === "v2") {
        params.blockHash = lastTx.block.hash;
      } else {
        params.block_hash = lastTx.block.hash;
      }
    }

    const res = await this.fetchTxs(address, params);

    const hydratedTxs: TX[] = [];

    // faster than mapping
    res.txs.forEach((tx) => {
      this.hydrateTx(address, tx);
      hydratedTxs.push(tx);
    });

    return hydratedTxs;
  }
}

export default BitcoinLikeExplorer;
