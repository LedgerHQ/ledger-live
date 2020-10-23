// @flow
// handle send and erc20 send

import abi from "ethereumjs-abi";
import invariant from "invariant";
import eip55 from "eip55";
import { BigNumber } from "bignumber.js";
import type { ModeModule } from "../types";
import {
  NotEnoughBalance,
  FeeTooHigh,
  NotEnoughBalanceInParentAccount,
  AmountRequired,
} from "@ledgerhq/errors";
import {
  inferTokenAccount,
  getGasLimit,
  validateRecipient,
} from "../transaction";

export type Modes = "send";

const send: ModeModule = {
  fillTransactionStatus(a, t, result) {
    const tokenAccount = inferTokenAccount(a, t);
    const account = tokenAccount || a;

    validateRecipient(a.currency, t.recipient, result);

    if (!result.errors.recipient) {
      if (tokenAccount) {
        // SEND TOKEN
        result.totalSpent = t.useAllAmount ? account.balance : t.amount;
        result.amount = t.useAllAmount ? account.balance : t.amount;
      } else {
        // SEND ETHEREUM
        result.totalSpent = t.useAllAmount
          ? account.balance
          : t.amount.plus(result.estimatedFees);
        result.amount = BigNumber.max(
          t.useAllAmount
            ? account.balance.minus(result.estimatedFees)
            : t.amount,
          0
        );

        if (
          result.amount.gt(0) &&
          result.estimatedFees.times(10).gt(result.amount)
        ) {
          result.warnings.feeTooHigh = new FeeTooHigh();
        }

        if (result.estimatedFees.gt(a.balance)) {
          result.errors.amount = new NotEnoughBalanceInParentAccount();
        }
      }

      if (!t.data) {
        if (!result.errors.amount && result.amount.eq(0)) {
          result.errors.amount = new AmountRequired();
        } else if (
          !result.totalSpent.gt(0) ||
          result.totalSpent.gt(account.balance)
        ) {
          result.errors.amount = new NotEnoughBalance();
        }
      }
    }
  },

  fillTransactionData(a, t, tx) {
    const subAccount = inferTokenAccount(a, t);
    if (subAccount) {
      const { token } = subAccount;

      const data = serializeTransactionData(a, t);
      invariant(data, "serializeTransactionData provided no data");

      tx.data = "0x" + data.toString("hex");
      tx.to = token.contractAddress;
      tx.value = "0x00";
    } else {
      let amount;
      if (t.useAllAmount) {
        const gasLimit = getGasLimit(t);
        amount = a.balance.minus(gasLimit.times(t.gasPrice || 0));
      } else {
        invariant(t.amount, "amount is missing");
        amount = t.amount;
      }
      if (t.data) {
        tx.data = "0x" + t.data.toString("hex");
      }
      tx.value = `0x${BigNumber(amount).toString(16)}`;
      tx.to = t.recipient;
    }
  },

  fillDeviceTransactionConfig({ status: { amount } }, fields) {
    if (!amount.isZero()) {
      fields.push({
        type: "amount",
        label: "Amount",
      });
    }
  },

  fillOptimisticOperation(a, t, op) {
    const subAccount = inferTokenAccount(a, t);
    if (subAccount) {
      // ERC20 transfer
      op.type = "FEES";
      op.subOperations = [
        {
          id: `${subAccount.id}-${op.hash}-OUT`,
          hash: op.hash,
          transactionSequenceNumber: op.transactionSequenceNumber,
          type: "OUT",
          value: t.useAllAmount ? subAccount.balance : BigNumber(t.amount || 0),
          fee: op.fee,
          blockHash: null,
          blockHeight: null,
          senders: op.senders,
          recipients: [t.recipient],
          accountId: subAccount.id,
          date: new Date(),
          extra: {},
        },
      ];
    }
  },
};

function serializeTransactionData(account, transaction): ?Buffer {
  const { subAccountId } = transaction;
  const subAccount = subAccountId
    ? account.subAccounts &&
      account.subAccounts.find((t) => t.id === subAccountId)
    : null;
  if (!subAccount) return;
  const recipient = eip55.encode(transaction.recipient);
  const { balance } = subAccount;
  let amount;
  if (transaction.useAllAmount) {
    amount = balance;
  } else {
    if (!transaction.amount) return;
    amount = BigNumber(transaction.amount);
    if (amount.gt(subAccount.balance)) {
      throw new NotEnoughBalance();
    }
  }
  return abi.simpleEncode(
    "transfer(address,uint256)",
    recipient,
    amount.toString(10)
  );
}

export const modes: { [_: Modes]: ModeModule } = {
  send,
};
