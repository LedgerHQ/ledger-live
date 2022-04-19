import { findLast, filter, uniqBy, findIndex, isEmpty } from "lodash";
import Base from "../crypto/base";
import { Input, IStorage, Output, TX, Address } from "./types";

// a mock storage class that just use js objects
// sql.js would be perfect for the job
class BitcoinLikeStorage implements IStorage {
  private txs: TX[] = [];

  // indexe: address + hash -> tx
  primaryIndex: { [key: string]: number } = {};

  // indexe: account + index -> tx
  accountIndex: { [key: string]: number[] } = {};

  // accounting
  unspentUtxos: { [key: string]: Output[] } = {};

  addressCache: { [key: string]: string } = {};

  // only needed to handle the case when the input
  // is seen before the output (typically explorer
  // returning unordered tx within the same block)
  spentUtxos: { [key: string]: Input[] } = {};

  getLastTx(txFilter: { account: number; index: number; confirmed?: boolean }) {
    if (
      typeof this.accountIndex[`${txFilter.account}-${txFilter.index}`] ===
      "undefined"
    ) {
      return undefined;
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const tx: TX | undefined = findLast(
      this.accountIndex[`${txFilter.account}-${txFilter.index}`].map(
        (i) => this.txs[i]
      ),
      (t) => {
        return (
          typeof txFilter.confirmed === "undefined" ||
          (txFilter.confirmed && t.block) ||
          (!txFilter.confirmed && !t.block)
        );
      }
    );
    return tx;
  }

  getLastUnconfirmedTx() {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const tx: TX | undefined = findLast(this.txs, (t) => {
      return !t.block;
    });
    return tx;
  }

  getTx(address: string, txId: string) {
    const index = `${address}-${txId}`;
    return this.txs[this.primaryIndex[index]];
  }

  // TODO: only expose unspentUtxos
  getAddressUnspentUtxos(address: Address) {
    const indexAddress = address.address;
    return this.unspentUtxos[indexAddress];
  }

  appendTxs(txs: TX[]) {
    const lastLength = this.txs.length;

    txs.forEach((tx) => {
      const indexAddress = tx.address;
      const index = `${indexAddress}-${tx.id}`;

      // we reject already seen tx
      if (this.txs[this.primaryIndex[index]]) {
        return;
      }
      if (
        typeof this.accountIndex[`${tx.account}-${tx.index}`] === "undefined"
      ) {
        this.accountIndex[`${tx.account}-${tx.index}`] = [];
      }
      const idx = this.txs.push(tx) - 1;
      this.primaryIndex[index] = idx;
      this.accountIndex[`${tx.account}-${tx.index}`].push(idx);
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

  getUniquesAddresses(addressesFilter: { account?: number; index?: number }) {
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

  removeTxs(txsFilter: { account: number; index: number }) {
    const newTxs: TX[] = [];
    this.primaryIndex = {};
    this.accountIndex = {};
    this.txs.forEach((tx: TX) => {
      // clean
      const indexAddress = tx.address;
      const index = `${indexAddress}-${tx.id}`;

      if (tx.account !== txsFilter.account || tx.index !== txsFilter.index) {
        this.primaryIndex[index] = newTxs.push(tx) - 1;
        return;
      }

      delete this.unspentUtxos[indexAddress];
      delete this.spentUtxos[indexAddress];
    });
    this.txs = newTxs;
    this.createAccountIndex();
  }

  // We are a bit ugly because we can't rely undo unspentUTXO
  // So we clean the address and rebuild without the pendings
  removePendingTxs(txsFilter: { account: number; index: number }) {
    const newTxs: TX[] = [];
    const txsToReAdd: TX[] = [];
    this.primaryIndex = {};
    this.accountIndex = {};
    this.txs.forEach((tx: TX) => {
      // clean
      const indexAddress = tx.address;
      const index = `${indexAddress}-${tx.id}`;

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
    this.createAccountIndex();
    this.appendTxs(txsToReAdd);
  }

  addAddress(key: string, address: string): void {
    if (!this.addressCache) {
      this.addressCache = {};
    }
    this.addressCache[key] = address;
  }

  exportSync() {
    return {
      txs: this.txs,
      primaryIndex: this.primaryIndex,
      accountIndex: this.accountIndex,
      unspentUtxos: this.unspentUtxos,
      addressCache: this.addressCache,
    };
  }

  loadSync(data: {
    txs: TX[];
    primaryIndex: { [key: string]: number };
    accountIndex: { [key: string]: number[] };
    unspentUtxos: { [key: string]: Output[] };
    addressCache: { [key: string]: string };
  }) {
    this.txs = data.txs;
    this.primaryIndex = data.primaryIndex;
    this.accountIndex = data.accountIndex;
    this.unspentUtxos = data.unspentUtxos;
    this.addressCache = data.addressCache;
    Base.addressCache = { ...Base.addressCache, ...this.addressCache };
    if (!this.accountIndex || isEmpty(this.accountIndex)) {
      this.accountIndex = {};
      this.createAccountIndex();
    }
  }

  async export() {
    return this.exportSync();
  }

  async load(data: {
    txs: TX[];
    primaryIndex: { [key: string]: number };
    accountIndex: { [key: string]: number[] };
    unspentUtxos: { [key: string]: Output[] };
    addressCache: { [key: string]: string };
  }) {
    return this.loadSync(data);
  }

  private createAccountIndex() {
    this.txs.forEach((tx: TX, idx: number) => {
      if (
        typeof this.accountIndex[`${tx.account}-${tx.index}`] === "undefined"
      ) {
        this.accountIndex[`${tx.account}-${tx.index}`] = [];
      }
      this.accountIndex[`${tx.account}-${tx.index}`].push(idx);
    });
  }
}

export default BitcoinLikeStorage;
