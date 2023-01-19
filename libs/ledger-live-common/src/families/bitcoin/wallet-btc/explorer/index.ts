import BigNumber from "bignumber.js";
import JSONBigNumber from "@ledgerhq/json-bignumber";
import { Address, Block, TX } from "../storage/types";
import { IExplorer } from "./types";
import { getNetwork } from "../../../../network";

type ExplorerParams = {
  no_token?: string;
  noToken?: string;
  batch_size?: number;
  block_hash?: string;
  blockHash?: string;
};

class BitcoinLikeExplorer implements IExplorer {
  network: ReturnType<typeof getNetwork>;

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
    const network = getNetwork().url(explorerURI);
    this.network = network;

    this.explorerVersion = explorerVersion;
    if (disableBatchSize) {
      this.disableBatchSize = disableBatchSize;
    }
  }

  async broadcast(tx: string): Promise<{ result: string }> {
    const network = this.network;
    const url = "/transactions/send";
    const res = await network
      .headers({
        "Content-Type": "application/json",
      })
      .post(url, JSON.stringify({ tx }))
      .json<any>();
    return res;
  }

  async getTxHex(txId: string): Promise<string> {
    const network = this.network;
    const url = `/transactions/${txId}/hex`;
    const res = await network.get(url).json<any>();
    return res[0].hex;
  }

  async getCurrentBlock(): Promise<Block | null> {
    const network = this.network;
    const url = `/blocks/current`;
    const res = await network.get(url).json<any>();
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

  async getBlockByHeight(height: number): Promise<Block | null> {
    const network = this.network;
    const url = `/blocks/${height}`;
    const res = await network.get(url).json<any>();
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

  async getFees(): Promise<{ [key: string]: number }> {
    const network = this.network;
    const url = `/fees`;
    const fees = await network.get(url).json<any>();
    return fees;
  }

  async getRelayFee(): Promise<number> {
    const network = this.network;
    const fees = await network.get(`/network`).json<any>();
    return parseFloat(fees["relay_fee"]);
  }

  async getPendings(address: Address, nbMax?: number): Promise<TX[]> {
    const params: ExplorerParams =
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

  async fetchTxs(
    address: Address,
    params: ExplorerParams
  ): Promise<{ txs: TX[] }> {
    const network = this.network;
    const url = `/addresses/${address.address}/transactions`;
    const text = await network.query(params).get(url).text<any>();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = JSONBigNumber.parse(text, (key: string, value: any) => {
      if (BigNumber.isBigNumber(value)) {
        if (key === "value") {
          return value.toString();
        }
        return value.toNumber();
      }
      return value;
    });

    return res;
  }

  hydrateTx(address: Address, tx: TX): void {
    // no need to keep those as they change
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line no-param-reassign
    delete tx.confirmations;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    delete tx.hash;
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
      output.output_hash = tx.id;
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
  ): Promise<TX[]> {
    const params: ExplorerParams =
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
