import { findLast, filter, uniqBy, findIndex, has } from "lodash";
import { Input, IStorage, Output, TX, Address } from "./types";

// a mock storage class that just use js objects
// sql.js would be perfect for the job
class BitcoinLikeStorage implements IStorage {
  txs: TX[] = [];

  // indexes
  primaryIndex: { [key: string]: number } = {};

  // accounting
  unspentUtxos: { [key: string]: Output[] } = {};

  // only needed to handle the case when the input
  // is seen before the output (typically explorer
  // returning unordered tx within the same block)
  spentUtxos: { [key: string]: Input[] } = {};

  async getLastTx(txFilter: {
    account?: number;
    index?: number;
    address?: string;
    confirmed?: boolean;
  }) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const tx: TX | undefined = findLast(this.txs, (t) => {
      return (
        (!has(txFilter, "account") || t.account === txFilter.account) &&
        (!has(txFilter, "index") || t.index === txFilter.index) &&
        (!has(txFilter, "address") || t.address === txFilter.address) &&
        (!has(txFilter, "confirmed") ||
          (txFilter.confirmed && t.block) ||
          (!txFilter.confirmed && !t.block))
      );
    });
    return tx;
  }

  async getTx(address: string, hash: string) {
    const index = `${address}-${hash}`;
    return this.txs[this.primaryIndex[index]];
  }

  // TODO: only expose unspentUtxos
  async getAddressUnspentUtxos(address: Address) {
    const indexAddress = address.address;
    return this.unspentUtxos[indexAddress];
  }

  async appendTxs(txs: TX[]) {
    const lastLength = this.txs.length;

    txs.forEach((tx) => {
      const indexAddress = tx.address;
      const index = `${indexAddress}-${tx.hash}`;

      // we reject already seen tx
      if (this.txs[this.primaryIndex[index]]) {
        return;
      }

      this.primaryIndex[index] = this.txs.push(tx) - 1;
      this.unspentUtxos[indexAddress] = this.unspentUtxos[indexAddress] || [];
      this.spentUtxos[indexAddress] = this.spentUtxos[indexAddress] || [];

      tx.outputs.forEach((output) => {
        if (output.address === tx.address) {
          this.unspentUtxos[indexAddress].push(output);
        }
      });

      tx.inputs.forEach((input) => {
        if (input.address === tx.address) {
          this.spentUtxos[indexAddress].push(input);
        }
      });

      this.unspentUtxos[indexAddress] = this.unspentUtxos[indexAddress].filter(
        (output) => {
          const matchIndex = findIndex(
            this.spentUtxos[indexAddress],
            (input: Input) =>
              input.output_hash === output.output_hash &&
              input.output_index === output.output_index
          );
          if (matchIndex > -1) {
            this.spentUtxos[indexAddress].splice(matchIndex, 1);
            return false;
          }
          return true;
        }
      );
    });

    return this.txs.length - lastLength;
  }

  async getUniquesAddresses(addressesFilter: {
    account?: number;
    index?: number;
  }) {
    // TODO: to speed up, create more useful indexes in appendTxs
    return uniqBy(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      filter(this.txs, addressesFilter).map((tx: TX) => ({
        address: tx.address,
        account: tx.account,
        index: tx.index,
      })),
      "address"
    );
  }

  async removeTxs(txsFilter: { account: number; index: number }) {
    const newTxs: TX[] = [];
    this.primaryIndex = {};

    this.txs.forEach((tx: TX) => {
      // clean
      const indexAddress = tx.address;
      const index = `${indexAddress}-${tx.hash}`;

      if (tx.account !== txsFilter.account || tx.index !== txsFilter.index) {
        this.primaryIndex[index] = newTxs.push(tx) - 1;
        return;
      }

      delete this.unspentUtxos[indexAddress];
      delete this.spentUtxos[indexAddress];
    });

    this.txs = newTxs;
  }

  // We are a bit ugly because we can't rely undo unspentUTXO
  // So we clean the address and rebuild without the pendings
  async removePendingTxs(txsFilter: { account: number; index: number }) {
    const newTxs: TX[] = [];
    const txsToReAdd: TX[] = [];
    this.primaryIndex = {};

    this.txs.forEach((tx: TX) => {
      // clean
      const indexAddress = tx.address;
      const index = `${indexAddress}-${tx.hash}`;

      if (tx.account !== txsFilter.account || tx.index !== txsFilter.index) {
        this.primaryIndex[index] = newTxs.push(tx) - 1;
        return;
      }

      if (tx.block) {
        txsToReAdd.push(tx);
      }

      delete this.unspentUtxos[indexAddress];
      delete this.spentUtxos[indexAddress];
    });

    this.txs = newTxs;
    await this.appendTxs(txsToReAdd);
  }

  exportSync() {
    return {
      txs: this.txs,
      primaryIndex: this.primaryIndex,
      unspentUtxos: this.unspentUtxos,
    };
  }

  loadSync(data: {
    txs: TX[];
    primaryIndex: { [key: string]: number };
    unspentUtxos: { [key: string]: Output[] };
  }) {
    this.txs = data.txs;
    this.primaryIndex = data.primaryIndex;
    this.unspentUtxos = data.unspentUtxos;
  }

  async export() {
    return this.exportSync();
  }

  async load(data: {
    txs: TX[];
    primaryIndex: { [key: string]: number };
    unspentUtxos: { [key: string]: Output[] };
  }) {
    return this.loadSync(data);
  }
}

export default BitcoinLikeStorage;
