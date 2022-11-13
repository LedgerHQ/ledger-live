/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {
  addressToScript,
  getTransactionSize,
  parseAddress,
  systemScripts,
} from "@nervosnetwork/ckb-sdk-utils";
import BigNumber from "bignumber.js";
import type { NervosAccount, Transaction, TransactionStatus } from "./types";
import { getBalance, getSpendableCells } from "./logic";
import { NervosAmountTooLow } from "./errors";
import {
  EMPTY_SECP_SIG,
  EMPTY_WITNESS_ARGS,
} from "@nervosnetwork/ckb-sdk-utils/lib/const";
import {
  AmountRequired,
  FeeNotLoaded,
  InvalidAddress,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import { AccountNeedResync } from "../../errors";

/**
 *
 * @param {NervosAccount} a
 * @param {Transaction} t
 */
export const buildTransaction = async (
  a: NervosAccount,
  t: Transaction
): Promise<{
  tx: CKBComponents.RawTransaction;
  status: TransactionStatus;
}> => {
  switch (t.mode) {
    case "SendCKB":
      return buildTransactionSendCKB(a, t);
    default:
      throw new Error(`Unknown tx mode ${t.mode}.`);
  }
};

/**
 *
 * @param {NervosAccount} a
 * @param {Transaction} t
 */
const buildTransactionSendCKB = async (
  a: NervosAccount,
  t: Transaction
): Promise<{
  tx: CKBComponents.RawTransaction;
  status: TransactionStatus;
}> => {
  const tx: CKBComponents.RawTransactionToSign = {
    version: "0x0",
    cellDeps: [],
    headerDeps: [],
    inputs: [],
    outputs: [],
    witnesses: [],
    outputsData: [],
  };
  const status: TransactionStatus = {
    errors: {},
    warnings: {},
    estimatedFees: new BigNumber(0),
    amount: new BigNumber(0),
    totalSpent: new BigNumber(0),
  };

  if (!t.feePerByte || t.feePerByte.eq(new BigNumber(0))) {
    status.errors.feePerByte = new FeeNotLoaded();
  }

  if (!t.useAllAmount) {
    if (t.amount.eq(0)) {
      status.errors.amount = new AmountRequired();
    } else if (t.amount.lt(new BigNumber("6100000000"))) {
      status.errors.amount = new NervosAmountTooLow();
    }
  }

  if (!t.recipient) {
    status.errors.recipient = new RecipientRequired();
  } else {
    try {
      parseAddress(t.recipient);
    } catch (err) {
      status.errors.recipient = new InvalidAddress();
    }
  }
  if (Object.keys(status.errors).length) {
    return { tx: { ...tx, witnesses: [] }, status };
  }

  if (!a.nervosResources) {
    throw new AccountNeedResync();
  }
  const xpub = a.nervosResources.xpub;
  const liveCells = xpub.getLiveCells();
  const spendableCells = getSpendableCells(liveCells);

  tx.cellDeps.push({
    outPoint: systemScripts.SECP256K1_BLAKE160.mainnetOutPoint,
    depType: systemScripts.SECP256K1_BLAKE160.depType,
  });

  tx.outputs.push({
    capacity: "0x0",
    lock: addressToScript(t.recipient),
  });
  tx.outputsData.push("0x");

  if (t.useAllAmount) {
    for (const cell of spendableCells) {
      tx.inputs.push({
        previousOutput: cell.outPoint,
        since: "0x0",
      });
      tx.witnesses.push({
        ...EMPTY_WITNESS_ARGS,
        lock: EMPTY_SECP_SIG,
      });
    }
    status.totalSpent = getBalance(spendableCells);
    status.estimatedFees = new BigNumber(getTransactionSize(tx)).multipliedBy(
      t.feePerByte
    );
    status.amount = status.totalSpent.minus(status.estimatedFees);
    tx.outputs[0].capacity = `0x${status.amount.toString(16)}`;
    if (status.amount.lt(new BigNumber("6100000000"))) {
      status.errors.amount = new NervosAmountTooLow();
    }
    return { tx: { ...tx, witnesses: [] }, status };
  }

  tx.outputs[0].capacity = `0x${t.amount.toString(16)}`;
  spendableCells.sort((l, r) =>
    new BigNumber(l.output.capacity).isLessThan(
      new BigNumber(r.output.capacity)
    )
      ? -1
      : 1
  );
  for (const cell of spendableCells) {
    tx.inputs.push({
      previousOutput: cell.outPoint,
      since: "0x0",
    });
    tx.witnesses.push({
      ...EMPTY_WITNESS_ARGS,
      lock: EMPTY_SECP_SIG,
    });
    status.totalSpent = status.totalSpent.plus(
      new BigNumber(cell.output.capacity)
    );
    status.estimatedFees = new BigNumber(getTransactionSize(tx)).multipliedBy(
      t.feePerByte
    );
    status.amount = status.totalSpent.minus(status.estimatedFees);
    if (status.amount.isGreaterThanOrEqualTo(t.amount)) {
      break;
    }
  }
  if (status.amount.isLessThan(t.amount)) {
    status.errors.amount = NotEnoughBalance();
    return { tx: { ...tx, witnesses: [] }, status };
  }
  tx.outputs.push({
    capacity: "0x0",
    lock: addressToScript(a.nervosResources.freshChangeAddress),
  });
  tx.outputsData.push("0x");
  const newFees = new BigNumber(getTransactionSize(tx)).multipliedBy(
    t.feePerByte
  );
  const changeAmount = status.totalSpent.minus(newFees).minus(t.amount);
  if (changeAmount.isGreaterThanOrEqualTo(new BigNumber("6100000000"))) {
    // If change is enough, add it to the change address
    tx.outputs[tx.outputs.length - 1].capacity = `0x${changeAmount.toString(
      16
    )}`;
    status.totalSpent = status.totalSpent.minus(changeAmount);
    status.estimatedFees = newFees;
    status.amount = t.amount;
  } else {
    // If change is not enough, add it to the destination address
    tx.outputs.pop();
    tx.outputsData.pop();
    tx.outputs[tx.outputs.length - 1].capacity = `0x${status.amount.toString(
      16
    )}`;
  }
  return { tx: { ...tx, witnesses: [] }, status };
};
