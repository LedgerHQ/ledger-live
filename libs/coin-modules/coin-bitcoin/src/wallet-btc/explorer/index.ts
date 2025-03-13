import { Address, Block, TX } from "../storage/types";
import network from "@ledgerhq/live-network/network";
import { IExplorer } from "./types";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { blockchainBaseURL } from "../../explorer";

type ExplorerParams = {
  batch_size?: number;
  from_height?: number;
  to_height?: number;
  token?: string;
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
    this.baseUrl = "http://localhost:3000"
    // this.baseUrl =
    //   forcedExplorerURI != null ? forcedExplorerURI : blockchainBaseURL(cryptoCurrency);
  }

  async broadcast(tx: string): Promise<{ data: { result: string } }> {
    const url = `${this.baseUrl}/tx`;
    // TODO: check
    const res = await network({
      method: "POST",
      url,
      data: tx,
    });
    return res;
  }

  async getTxHex(txId: string): Promise<string> {
    // TODO add a test for failure (at the sync level)
    const { data } = await network({
      method: "GET",
      url: `${this.baseUrl}/tx/${txId}/hex`,
    });
    console.log({ data });
    return data;// data.hex;
  }

  async getCurrentBlock(): Promise<Block | null> {
    // const url = `${this.baseUrl}/block/current`;
    const res = await network({
      method: "GET",
      url: `${this.baseUrl}/blocks/tip/hash`,
    });
    const hash = res.data;
    // console.log({ res, hash });
    const { data } = await network({
      method: "GET",
      url: `${this.baseUrl}/block/${hash}`,
    });
    return data ? { height: data.height, hash: data.hash, time: data.timestamp } : null;

  }

  async getBlockByHeight(height: number): Promise<Block | null> {
    const res = await network({
      method: "GET",
      url: `${this.baseUrl}/block-height/${height}`,
    });
    // console.log({res})

    const hash = res.data;
    const { data } = await network({
      method: "GET",
      url: `${this.baseUrl}/block/${hash}`,
    });
    return  { height: data.height, hash , time: data.timestamp };
  }

  async getFees(): Promise<{ [key: string]: number }> {
    // TODO add a test for failure (at the sync level)
    // const { data } = await network({
    //   method: "GET",
    //   url: `${this.baseUrl}/fees`,
    // });
    // return data;
    
    return {
      "2": 0,//2004,
      "4": 0,//1600,
      "6": 0,//1197,
      "last_updated": 1741171856
    }
  }

  async getPendings(address: Address, nbMax = 1000): Promise<TX[]> {
    const params: ExplorerParams = {
      batch_size: nbMax,
    };
    const pendingsTxs = await this.fetchPendingTxs(address, params);
    // console.log({pendingsTxs})
    // const txsMassaged =  txs.map(tx => this.transformEsploraTxToLedger(tx, currentBlockHeight));
    pendingsTxs.forEach(tx => this.hydrateTx(address, tx));
    // console.log({pendingsTxs})
    return pendingsTxs;
  }

  async fetchTxs(
    address: Address,
    params: ExplorerParams,
  ): Promise<{ txs: TX[]; nextPageToken: string | null }> {
    // console.log({params})
    const res = await network({
      method: "GET",
      url: `${this.baseUrl}/address/${address.address}/txs`,
      params: { verbosity: "Minimal", ...params },
    });
    if (address.address == "mm2Zu8sBttErVbhrDzN9okeqGwcFWZaK3A") {
      // console.log({RESHERE: res})
    }
    // console.log({res})
    const txs = res.data;
    const nextPageToken = null;// data.token;
    // console.log({txs})
    if (!txs) {
      return { nextPageToken, txs: [] };
    }
    return { nextPageToken, txs };
  }

  async fetchPendingTxs(address: Address, params: ExplorerParams): Promise<TX[]> {
    // TODO: will fail
    const { data } = await network({
      method: "GET",
      url: `${this.baseUrl}/address/${address.address}/txs/mempool`,
      params: { verbosity: "Minimal", ...params },
    });
    // console.log({data})
    if (!data) {
      return []
    }
    return data;
  }

  /**
   * When we get a raw tx from the explorer,
   * we need to remove some fields that are not needed and fill up some fields that are required
   * to be consistent with our transaction model
   */
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
    tx.inputs.forEach(input => {
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

    // A transaction is RBF-enabled if any of its inputs have sequence < 0xfffffffe.
    const rbf = tx.inputs.some(input => input.sequence < 0xfffffffe);
    tx.outputs.forEach(output => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      delete output.script_hex;
      // eslint-disable-next-line no-param-reassign
      output.output_hash = tx.id;
      // eslint-disable-next-line no-param-reassign
      output.block_height = tx.block ? tx.block.height : null;
      // Definition of replaceable, per the standard: https://github.com/bitcoin/bips/blob/61ccc84930051e5b4a99926510d0db4a8475a4e6/bip-0125.mediawiki#summary
      output.rbf = rbf;
    });
  }
  
  transformEsploraTxToLedger(tx: any, currentBlockHeight: number): any {
    // console.log({txstatus: tx.status})
    return {
      id: tx.txid,
      hash: tx.txid,
      // NOTE: if received_at is undefined, the received utxos aren't displayed
      // we're mak
      received_at: tx.status.confirmed ? new Date(tx.status.block_time * 1000).toISOString() : new Date().toISOString(),// undefined, // Convert timestamp to ISO format
      lock_time: tx.locktime,
      fees: tx.fee.toString(),
      inputs: tx.vin.map((input: any) => ({
        output_hash: input.txid,
        output_index: input.vout,
        input_index: tx.vin.indexOf(input),
        value: input.prevout?.value.toString(),
        address: input.prevout?.scriptpubkey_address || null,
        script_signature: input.scriptsig || "",
        txinwitness: input.witness || [],
        sequence: input.sequence,
      })),
      outputs: tx.vout.map((output: any, index: number) => ({
        output_index: index,
        value: output.value.toString(),
        address: output.scriptpubkey_address || null,
        script_hex: output.scriptpubkey,
        spent_at_height: null, // Ledger Explorer provides spent_at_height, but Esplora doesn’t track spent outputs
      })),
      block: tx.status.confirmed
        ? {
            hash: tx.status.block_hash,
            height: tx.status.block_height,
            time: new Date(tx.status.block_time * 1000).toISOString(),
          // NOTE: should default on this one also?
          }
        : null,
      tx_index: 0, // Not provided by Esplora
      confirmations: tx.status.confirmed ? currentBlockHeight - tx.status.block_height + 1 : 0,
    };
  }

  /**
   * Get transactions for an address since a block height
   * @param batchSize number of transactions to fetch
   * @param address address to fetch transactions for
   * @param fromBlockheight block height to fetch transactions from
   * @param toBlockheight block height to fetch transactions to
   * @param isPending whether to fetch only pending transactions or only confirmed transactions
   * @param token pagination token
   */
  async getTxsSinceBlockheight(
    batchSize: number,
    address: Address,
    fromBlockheight: number,
    toBlockheight: number | undefined,
    isPending: boolean,
    token: string | null,
  ): Promise<{ txs: TX[]; nextPageToken: string | null }> {
    const currentBlockHeight = (await this.getCurrentBlock())?.height || 0;
    // console.log({currentBlockHeight, isPending})
    const params: ExplorerParams = {
      batch_size: batchSize,
    };
    // when isPending = false,
    // we use https://explorers.api.live.ledger.com/blockchain/v4/btc/address/{address}/txs?batch_size={batch_size}&from_height={fromBlockheight}&order=ascending&to_height={toBlockheight} to fetch confirmed txs
    // when isPending = true,
    // we use https://explorers.api.live.ledger.com/blockchain/v4/btc/address/{address}/txs/pending?batch_size={batch_size} to fetch pending txs
    if (!isPending) {
      // toBlockheight is height of the current block
      // but in some cases, we don't set this value (e.g. integration tests), so toBlockheight = undefined and we skip this optimization
      if (toBlockheight && fromBlockheight > toBlockheight) {
        return { txs: [], nextPageToken: null };
      }
      params.from_height = fromBlockheight;
      params.order = "ascending";
      if (toBlockheight) {
        params.to_height = toBlockheight;
      }
      if (token) {
        params.token = token;
      }
    }
    let txs: TX[] = [];
    let nextPageToken: string | null = null;
    if (isPending) {
      if (address.address == "mm2Zu8sBttErVbhrDzN9okeqGwcFWZaK3A") {
        // debugger;
      }
      txs = await this.fetchPendingTxs(address, params);
    } else {
      const result = await this.fetchTxs(address, params);
      txs = result.txs;
      nextPageToken = result.nextPageToken;
    }

    const hydratedTxs: TX[] = [];
    
    // console.log(`before tx massage`)
    const txsMassaged =  txs.map(tx => this.transformEsploraTxToLedger(tx, currentBlockHeight));
    // console.log({txsMassaged})

    // faster than mapping
    txsMassaged.forEach(tx => {
      this.hydrateTx(address, tx);
      hydratedTxs.push(tx);
    });

    if (address.address == "mm2Zu8sBttErVbhrDzN9okeqGwcFWZaK3A") {
      // console.log({txs, txsMassaged, hydratedTxs, nextPageToken})
    }
    return { txs: hydratedTxs, nextPageToken };
  }
}

export default BitcoinLikeExplorer;
