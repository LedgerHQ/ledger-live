/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { systemScripts } from "@nervosnetwork/ckb-sdk-utils";
import { Cell, TX } from "./types";

class Storage {
  private addressToPath: { [key: string]: string } = {};
  private txs: TX[] = [];
  private previousTxHashToTx: { [key: string]: TX } = {};
  private txHashToTx: { [key: string]: TX } = {};
  private lockArgsReceive: string[] = [];
  private lockArgsChange: string[] = [];
  private lockArgsToTxs: { [key: string]: TX[] } = {};
  private cells: Cell[] = [];
  private isCellDead: { [key: string]: boolean } = {};

  constructor(data?: any) {
    if (data) {
      this.addressToPath = data.addressToPath;
      this.txs = data.txs;
      this.previousTxHashToTx = data.previousTxHashToTx;
      this.txHashToTx = data.txHashToTx;
      this.lockArgsReceive = data.lockArgsReceive;
      this.lockArgsChange = data.lockArgsChange;
      this.lockArgsToTxs = data.lockArgsToTxs;
      this.cells = data.cells;
      this.isCellDead = data.isCellDead;
    }
  }

  export() {
    return {
      addressToPath: this.addressToPath,
      txs: this.txs,
      previousTxHashToTx: this.previousTxHashToTx,
      txHashToTx: this.txHashToTx,
      lockArgsReceive: this.lockArgsReceive,
      lockArgsChange: this.lockArgsChange,
      lockArgsToTxs: this.lockArgsToTxs,
      cells: this.cells,
      isCellDead: this.isCellDead,
    };
  }

  getAddressPath(address: string) {
    return this.addressToPath[address];
  }

  getTransactions() {
    return { txs: this.txs, previousTxHashToTx: this.previousTxHashToTx };
  }

  getLiveCells() {
    return this.cells.filter(
      (cell) =>
        !this.isCellDead[`${cell.outPoint.txHash}-${cell.outPoint.index}`]
    );
  }

  addLiveCellsFromTx(tx: TX, lockArgs?: string) {
    let i = 0;
    for (const output of tx.outputs) {
      if (
        output.lock.hashType === systemScripts.SECP256K1_BLAKE160.hashType &&
        output.lock.codeHash === systemScripts.SECP256K1_BLAKE160.codeHash &&
        (!lockArgs || output.lock.args === lockArgs) &&
        this.lockArgsToTxs[output.lock.args]
      ) {
        // Found a live cell
        this.lockArgsToTxs[output.lock.args].push(tx);
        this.cells.push({
          outPoint: { txHash: tx.hash, index: `0x${i.toString(16)}` },
          output,
          outputData: tx.outputsData[i],
        });
      }
      i++;
    }
  }

  addAddress(path: string, address: string) {
    this.addressToPath[address] = path;
  }

  addTxs(txs: TX[], previousTxs: TX[]) {
    for (const tx of txs) {
      if (this.txHashToTx[tx.hash.toLowerCase()]) {
        // TX already stored. Just update status.
        if (this.txHashToTx[tx.hash.toLowerCase()].status == tx.status)
          continue;
        this.txHashToTx[tx.hash.toLowerCase()].status = tx.status;
      } else {
        this.txs.push(tx);
        this.txHashToTx[tx.hash.toLowerCase()] = tx;
      }
      if (tx.status == "committed") {
        for (const input of tx.inputs) {
          this.isCellDead[
            `${input.previousOutput?.txHash}-${input.previousOutput?.index}`
          ] = true;
        }
        this.addLiveCellsFromTx(tx);
      }
    }
    for (const previousTx of previousTxs) {
      this.previousTxHashToTx[previousTx.hash.toLowerCase()] = previousTx;
    }
  }

  addLockArgs(lockArgs: string, isChange: boolean): void {
    if (this.lockArgsToTxs[lockArgs]) return;
    this.lockArgsToTxs[lockArgs] = [];
    if (isChange) {
      this.lockArgsChange.push(lockArgs);
    } else {
      this.lockArgsReceive.push(lockArgs);
    }
    for (const tx of this.txs) {
      if (tx.status == "committed") {
        this.addLiveCellsFromTx(tx, lockArgs);
      }
    }
  }

  getLockArgs() {
    return {
      lockArgsReceive: this.lockArgsReceive,
      lockArgsChange: this.lockArgsChange,
    };
  }

  hasTxByLockArgs(lockArgs: string) {
    return !!this.lockArgsToTxs[lockArgs]?.length;
  }

  getLastConfirmedTx(lockArgs: string) {
    const txs = this.lockArgsToTxs[lockArgs];
    if (!txs?.length) return undefined;
    let txSelected: TX | undefined;
    for (const tx of txs) {
      if (tx.status !== "committed") continue;
      if (!tx.blockNumber) continue;
      if (txSelected && txSelected.blockNumber! > tx.blockNumber) continue;
      txSelected = tx;
    }
    return txSelected;
  }
}

export default Storage;
