/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Cell, TX } from "./types";
import type { Operation } from "@ledgerhq/types-live";
import { scriptToAddress, systemScripts } from "@nervosnetwork/ckb-sdk-utils";
import { encodeOperationId } from "../../operation";
import BigNumber from "bignumber.js";

export const getSpendableCells = (liveCells: Cell[]) => {
  return liveCells.filter(
    (cell) =>
      !cell.output.type && (!cell.outputData || cell.outputData === "0x")
  );
};

export const getBalance = (liveCells: Cell[]) => {
  return getSpendableCells(liveCells).reduce(
    (balance, cell) => balance.plus(new BigNumber(cell.output.capacity)),
    new BigNumber(0)
  );
};

export const getFee = (tx: TX, previousTxHashToTx) => {
  return tx.inputs.reduce(
    (value, input) =>
      value.minus(
        new BigNumber(
          previousTxHashToTx[input.previousOutput?.txHash || ""]?.outputs[
            parseInt(input.previousOutput?.index || "0", 16) || 0
          ]?.capacity || 0
        )
      ),
    tx.outputs.reduce(
      (value, output) => value.plus(new BigNumber(output.capacity)),
      new BigNumber(0)
    )
  );
};

export const getSenders = (tx: TX, previousTxHashToTx) => {
  return tx.inputs
    .map((input) => {
      const lock =
        previousTxHashToTx[input.previousOutput?.txHash || ""]?.outputs[
          parseInt(input.previousOutput?.index || "0", 16) || 0
        ]?.lock;
      return lock ? scriptToAddress(lock) : "";
    })
    .filter((address) => address)
    .filter((value, index, self) => self.indexOf(value) === index);
};

export const getRecipients = (
  tx: TX,
  lockArgsReceive: string[],
  lockArgsChange: string[],
  ourReceiveAddress: boolean
) => {
  return tx.outputs
    .filter(
      (output) =>
        output.lock.hashType !== systemScripts.SECP256K1_BLAKE160.hashType ||
        output.lock.codeHash !== systemScripts.SECP256K1_BLAKE160.codeHash ||
        (!lockArgsChange.includes(output.lock.args) &&
          ((ourReceiveAddress && lockArgsReceive.includes(output.lock.args)) ||
            (!ourReceiveAddress &&
              !lockArgsReceive.includes(output.lock.args))))
    )
    .map((output) => scriptToAddress(output.lock))
    .filter((address) => address)
    .filter((value, index, self) => self.indexOf(value) === index);
};

export const mapTxToOperations = (
  accountId: string,
  tx: TX,
  previousTxHashToTx: { [key: string]: TX },
  lockArgsReceive: string[],
  lockArgsChange: string[]
) => {
  const operations: Operation[] = [];
  let outAmount = new BigNumber(0);
  let inAmount = new BigNumber(0);
  for (const input of tx.inputs) {
    if (!input.previousOutput) continue;
    const previousTx =
      previousTxHashToTx[input.previousOutput.txHash.toLowerCase()];
    if (!previousTx) continue;
    const previousOutput =
      previousTx.outputs[parseInt(input.previousOutput.index, 16)];
    const previousOutputData =
      previousTx.outputsData[parseInt(input.previousOutput.index, 16)];
    if (!previousOutput) continue;
    if (
      previousOutput.lock.hashType ==
        systemScripts.SECP256K1_BLAKE160.hashType &&
      previousOutput.lock.codeHash ==
        systemScripts.SECP256K1_BLAKE160.codeHash &&
      (lockArgsReceive.includes(previousOutput.lock.args) ||
        lockArgsChange.includes(previousOutput.lock.args)) &&
      !previousOutput.type &&
      (!previousOutputData || previousOutputData == "0x")
    ) {
      outAmount = outAmount.plus(new BigNumber(previousOutput.capacity));
    }
  }
  let i = 0;
  for (const output of tx.outputs) {
    if (
      output.lock.hashType == systemScripts.SECP256K1_BLAKE160.hashType &&
      output.lock.codeHash == systemScripts.SECP256K1_BLAKE160.codeHash &&
      !output.type &&
      (!tx.outputsData[i] || tx.outputsData[i] == "0x")
    ) {
      if (lockArgsReceive.includes(output.lock.args)) {
        // This is not change output
        inAmount = inAmount.plus(new BigNumber(output.capacity));
      } else if (lockArgsChange.includes(output.lock.args)) {
        // This is change output
        outAmount = outAmount.minus(new BigNumber(output.capacity));
      }
    }
    i++;
  }
  if (!outAmount.eq(new BigNumber(0))) {
    const type = "OUT";
    operations.push({
      id: encodeOperationId(accountId, tx.hash, type),
      hash: tx.hash,
      type,
      value: outAmount,
      fee: getFee(tx, previousTxHashToTx),
      senders: getSenders(tx, previousTxHashToTx),
      recipients: getRecipients(tx, lockArgsReceive, lockArgsChange, false),
      blockHeight: tx.blockNumber,
      blockHash: tx.blockHash,
      accountId,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      date: new Date(tx.timestamp!),
      extra: {},
    });
  }
  if (!inAmount.eq(new BigNumber(0))) {
    const type = "IN";
    operations.push({
      id: encodeOperationId(accountId, tx.hash, type),
      hash: tx.hash,
      type,
      value: inAmount,
      fee: getFee(tx, previousTxHashToTx),
      senders: getSenders(tx, previousTxHashToTx),
      recipients: getRecipients(tx, lockArgsReceive, lockArgsChange, true),
      blockHeight: tx.blockNumber,
      blockHash: tx.blockHash,
      accountId,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      date: new Date(tx.timestamp!),
      extra: {},
    });
  }
  return operations;
};
