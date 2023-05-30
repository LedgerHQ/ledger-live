import { Address, Block, TX } from "../storage/types";
import network from "@ledgerhq/live-network/network";
import { IExplorer } from "./types";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { blockchainBaseURL } from "../../../../explorer";

type ExplorerParams = {
  batch_size?: number;
  from_height?: number;
  order?: "ascending" | "descending";
};

class BitcoinLikeExplorer implements IExplorer {
  baseUrl: string;
  constructor({
    cryptoCurrency,
    forcedExplorerURI,
  }: {
    cryptoCurrency: CryptoCurrency;
    forcedExplorerURI?: string;
  }) {
    this.baseUrl =
      forcedExplorerURI != null
        ? forcedExplorerURI
        : blockchainBaseURL(cryptoCurrency);
  }

  async broadcast(tx: string): Promise<{ data: { result: string } }> {
    const url = `${this.baseUrl}/tx/send`;
    const res = await network({
      method: "POST",
      url,
      data: { tx },
    });
    return res;
  }

  async getTxHex(txId: string): Promise<string> {
    // TODO add a test for failure (at the sync level)
    const { data } = await network({
      method: "GET",
      url: `${this.baseUrl}/tx/${txId}/hex`,
    });
    return data.hex;
  }

  async getCurrentBlock(): Promise<Block | null> {
    const url = `${this.baseUrl}/block/current`;
    const { data } = await network({
      method: "GET",
      url,
    });
    return data
      ? { height: data.height, hash: data.hash, time: data.time }
      : null;
  }

  async getBlockByHeight(height: number): Promise<Block | null> {
    const { data } = await network({
      method: "GET",
      url: `${this.baseUrl}/block/${height}`,
    });
    return data[0]
      ? { height: data[0].height, hash: data[0].hash, time: data[0].time }
      : null;
  }

  async getFees(): Promise<{ [key: string]: number }> {
    // TODO add a test for failure (at the sync level)
    const { data } = await network({
      method: "GET",
      url: `${this.baseUrl}/fees`,
    });
    return data;
  }

  async getRelayFee(): Promise<number> {
    const { data } = await network({
      method: "GET",
      url: `${this.baseUrl}/network`,
    });
    return parseFloat(data["relay_fee"]);
  }

  async getPendings(address: Address, nbMax = 1000): Promise<TX[]> {
    const params: ExplorerParams = {
      batch_size: nbMax,
    };
    const pendingsTxs = await this.fetchPendingTxs(address, params);
    pendingsTxs.forEach((tx) => this.hydrateTx(address, tx));
    return pendingsTxs;
  }

  async fetchTxs(address: Address, params: ExplorerParams): Promise<TX[]> {
    const { data } = await network({
      method: "GET",
      url: `${this.baseUrl}/address/${address.address}/txs`,
      params,
    });
    return data.data;
  }

  async fetchPendingTxs(
    address: Address,
    params: ExplorerParams
  ): Promise<TX[]> {
    const { data } = await network({
      method: "GET",
      url: `${this.baseUrl}/address/${address.address}/txs/pending`,
      params,
    });
    return data;
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

  async getTxsSinceBlockheight(
    batchSize: number,
    address: Address,
    startingBlockheight: number,
    isPending: boolean
  ): Promise<TX[]> {
    const params: ExplorerParams = {
      batch_size: batchSize,
    };
    if (!isPending) {
      params.from_height = startingBlockheight;
      params.order = "ascending";
    }
    const txs = isPending
      ? await this.fetchPendingTxs(address, params)
      : await this.fetchTxs(address, params);

    const hydratedTxs: TX[] = [];

    // faster than mapping
    txs.forEach((tx) => {
      this.hydrateTx(address, tx);
      hydratedTxs.push(tx);
    });

    return hydratedTxs;
  }
}

export default BitcoinLikeExplorer;
