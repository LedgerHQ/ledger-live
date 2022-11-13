/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { range, some } from "lodash";
import {
  scriptToAddress,
  pubkeyToAddress,
  addressToScript,
} from "@nervosnetwork/ckb-sdk-utils";
import BIP32 from "../bitcoin/wallet-btc/crypto/bip32";
import Storage from "./storage";
import {
  getBlockHeaders,
  getTransactionsByHashes,
  getTransactionsByLockArgs,
} from "./api";

class Xpub {
  private basePath: string;
  private publicKey: string;
  private chainCode: string;
  private storage: Storage;
  private freshReceiveAddress: string;
  private freshReceiveAddressIndex: number;
  private freshChangeAddress: string;
  private freshChangeAddressIndex: number;
  private GAP = 20;

  export() {
    return {
      basePath: this.basePath,
      publicKey: this.publicKey,
      chainCode: this.chainCode,
      storage: this.storage.export(),
      freshReceiveAddress: this.freshReceiveAddress,
      freshReceiveAddressIndex: this.freshReceiveAddressIndex,
      freshChangeAddress: this.freshChangeAddress,
      freshChangeAddressIndex: this.freshChangeAddressIndex,
    };
  }

  constructor(params: {
    data?: any;
    basePath?: string;
    publicKey?: string;
    chainCode?: string;
  }) {
    if (params.data) {
      const { data } = params;
      this.basePath = data.basePath;
      this.publicKey = data.publicKey;
      this.chainCode = data.chainCode;
      this.storage = new Storage(data.storage);
      this.freshReceiveAddress = data.freshReceiveAddress;
      this.freshReceiveAddressIndex = data.freshReceiveAddressIndex;
      this.freshChangeAddress = data.freshChangeAddress;
      this.freshChangeAddressIndex = data.freshChangeAddressIndex;
    } else {
      this.basePath = params.basePath || "";
      this.publicKey = params.publicKey || "";
      this.chainCode = params.chainCode || "";
      this.storage = new Storage();
      this.freshReceiveAddress = "";
      this.freshReceiveAddressIndex = 0;
      this.freshChangeAddress = "";
      this.freshChangeAddressIndex = 0;
    }
  }

  getFreshReceiveAddress() {
    return this.freshReceiveAddress;
  }

  getFreshReceiveAddressIndex() {
    return this.freshReceiveAddressIndex;
  }

  getFreshChangeAddress() {
    return this.freshChangeAddress;
  }

  getFreshChangeAddressIndex() {
    return this.freshChangeAddressIndex;
  }

  async getPublicKey(account: number, index: number) {
    const bip32Root = new BIP32(
      Buffer.from(this.publicKey.slice(2), "hex"),
      Buffer.from(this.chainCode.slice(2), "hex"),
      ""
    );
    const bip32Account = await bip32Root.derive(account);
    const bip32Leaf = await bip32Account.derive(index);
    const publicKey = bip32Leaf.publicKey;
    return `0x${publicKey.toString("hex")}`;
  }

  async getAddress(account: number, index: number) {
    const publicKey = await this.getPublicKey(account, index);
    const lock = addressToScript(pubkeyToAddress(publicKey));
    const address = scriptToAddress(lock);
    return { lockArgs: lock.args, address };
  }

  private async syncAddress(account: number, index: number) {
    const { lockArgs, address } = await this.getAddress(account, index);

    this.storage.addAddress(`${this.basePath}/${account}/${index}`, address);
    this.storage.addLockArgs(lockArgs, account === 1);

    const lastConfirmedTx = this.storage.getLastConfirmedTx(lockArgs);
    const txs = await getTransactionsByLockArgs(
      lockArgs,
      lastConfirmedTx?.blockNumber || 1
    );
    const previousTxsHashes = txs
      .map((tx) =>
        tx.inputs
          .filter((input) => input.previousOutput)
          .map((input) => input.previousOutput!.txHash)
      )
      .flat()
      .filter((value, index, self) => self.indexOf(value) === index);
    const previousTxs = await getTransactionsByHashes(previousTxsHashes);
    const blockHeadersHashes = txs
      .map((tx) => tx.blockHash || "")
      .filter((blockHash) => blockHash)
      .filter((value, index, self) => self.indexOf(value) === index);
    const blockHeaders = await getBlockHeaders(blockHeadersHashes);
    const blockHashToHeader: { [key: string]: CKBComponents.BlockHeader } = {};
    for (const blockHeader of blockHeaders) {
      blockHashToHeader[blockHeader.hash.toLowerCase()] = blockHeader;
    }
    for (const tx of txs) {
      if (!tx.blockHash) continue;
      const blockHeader = blockHashToHeader[tx.blockHash.toLowerCase()];
      if (!blockHeader) continue;
      tx.timestamp = parseInt(blockHeader.timestamp, 16);
    }
    this.storage.addTxs(txs, previousTxs);

    const foundTx = this.storage.hasTxByLockArgs(lockArgs);
    if (foundTx) {
      if (account === 0) {
        this.freshReceiveAddressIndex = Math.max(
          this.freshReceiveAddressIndex,
          index + 1
        );
      } else if (account === 1) {
        this.freshChangeAddressIndex = Math.max(
          this.freshChangeAddressIndex,
          index + 1
        );
      }
    }

    return foundTx;
  }

  private async syncAddressesBlock(account: number, index: number) {
    const addressesResults = await Promise.all(
      range(this.GAP).map((_, key) => this.syncAddress(account, index + key))
    );
    return some(addressesResults, (foundTx) => foundTx);
  }

  private async syncAccount(account: number) {
    let index = 0;
    // eslint-disable-next-line no-await-in-loop
    while (await this.syncAddressesBlock(account, index)) {
      index += this.GAP;
    }
    return index;
  }

  async sync() {
    this.freshReceiveAddressIndex = 0;
    this.freshChangeAddressIndex = 0;
    await this.syncAccount(0);
    await this.syncAccount(1);
    const { address: freshReceiveAddress } = await this.getAddress(
      0,
      this.freshReceiveAddressIndex
    );
    this.freshReceiveAddress = freshReceiveAddress;
    const { address: freshChangeAddress } = await this.getAddress(
      1,
      this.freshChangeAddressIndex
    );
    this.freshChangeAddress = freshChangeAddress;
  }

  getAddressPath(address: string) {
    return this.storage.getAddressPath(address);
  }

  getLiveCells() {
    return this.storage.getLiveCells();
  }

  getTransactions() {
    return this.storage.getTransactions();
  }

  getLockArgs() {
    return this.storage.getLockArgs();
  }
}

export default Xpub;
