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
  EIP1559ShouldBeUsed,
} from "../transaction";
export type Modes = "send";
const send: ModeModule = {
  fillTransactionStatus(a, t, result) {
    const tokenAccount = inferTokenAccount(a, t);
    const account = tokenAccount || a;

    if (!result.errors.recipient) {
      if (tokenAccount) {
        // SEND TOKEN
        result.totalSpent = t.useAllAmount
          ? account.spendableBalance
          : t.amount;
        result.amount = t.useAllAmount ? account.spendableBalance : t.amount;
      } else {
        // SEND ETHEREUM
        result.totalSpent = t.useAllAmount
          ? account.spendableBalance
          : t.amount.plus(result.estimatedFees);
        result.amount = BigNumber.max(
          t.useAllAmount
            ? account.spendableBalance.minus(result.estimatedFees)
            : t.amount,
          0
        );

        if (
          result.amount.gt(0) &&
          result.estimatedFees.times(10).gt(result.amount)
        ) {
          result.warnings.feeTooHigh = new FeeTooHigh();
        }

        if (result.estimatedFees.gt(a.spendableBalance)) {
          result.errors.amount = new NotEnoughBalanceInParentAccount();
        }
      }

      if (!t.data) {
        if (
          !t.allowZeroAmount &&
          !result.errors.amount &&
          result.amount.eq(0)
        ) {
          result.errors.amount = new AmountRequired();
        } else if (
          !result.totalSpent.gt(0) ||
          result.totalSpent.gt(account.spendableBalance)
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
      tx.data = "0x" + (data as Buffer).toString("hex");
      tx.to = token.contractAddress;
      tx.value = "0x00";
    } else {
      let amount;

      if (t.useAllAmount) {
        const gasLimit = getGasLimit(t);
        const feePerGas = EIP1559ShouldBeUsed(a.currency)
          ? t.maxFeePerGas
          : t.gasPrice;
        // Prevents a send max with a negative amount
        amount = BigNumber.maximum(
          a.spendableBalance.minus(gasLimit.times(feePerGas || 0)),
          0
        );
      } else {
        invariant(t.amount, "amount is missing");
        amount = t.amount;
      }

      if (t.data) {
        tx.data = "0x" + t.data.toString("hex");
      }

      tx.value = `0x${new BigNumber(amount).toString(16)}`;
      tx.to = t.recipient;
    }
  },

  fillDeviceTransactionConfig({ transaction, status: { amount } }, fields) {
    if (!amount.isZero()) {
      fields.push({
        type: "amount",
        label: "Amount",
      });
    }

    if (transaction.data?.length) {
      /*
      TODO: LL-4219
       import uniq from "lodash/uniq";
      import { findTokenByAddress } from "../../../currencies";
      import { getAccountCurrency, getAccountUnit } from "../../../account";
       const token = findTokenByAddress(transaction.recipient);
      // $FlowFixMe (transaction data is not null, you flow)
      const method = transaction.data.slice(0, 4).toString("hex");
       if (method === "095ea7b3" && token) {
        fields.push({
          type: "text",
          label: "Type",
          value: `Approve`,
        });
        fields.push({
          type: "text",
          label: "Amount (1/2)",
          value: token.ticker,
        });
         // $FlowFixMe (transaction data is not null, you flow)
        const amountHex = transaction.data.slice(36, 36 + 32).toString("hex");
         if (uniq(amountHex.split("")) === ["f"]) {
          fields.push({
            type: "text",
            label: "Amount (2/2)",
            value: "Unlimited " + getAccountCurrency(account).ticker,
          });
        } else {
          const amount = BigNumber(`0x${amountHex}`).dividedBy(
            BigNumber(10).pow(getAccountUnit(account).magnitude)
          );
          fields.push({
            type: "text",
            label: "Amount (2/2)",
            value: amount.toString(),
          });
        }
      } else {
        fields.push({
          type: "text",
          label: "Data",
          value: `Present`,
        });
      }
      */
      fields.push({
        type: "text",
        label: "Data",
        value: `Present`,
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
          value: t.useAllAmount
            ? subAccount.spendableBalance
            : new BigNumber(t.amount || 0),
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

  // This is resolution config is necessary for plugins like Lido and stuff cause they use the send mode
  getResolutionConfig: () => ({
    erc20: true,
    externalPlugins: true,
    nft: true,
  }),
};

function serializeTransactionData(
  account,
  transaction
): Buffer | null | undefined {
  const tokenAccount = inferTokenAccount(account, transaction);
  if (!tokenAccount) return;
  const recipient = eip55.encode(transaction.recipient);
  const { spendableBalance } = tokenAccount;
  let amount;

  if (transaction.useAllAmount) {
    amount = spendableBalance;
  } else {
    if (!transaction.amount) return;
    amount = new BigNumber(transaction.amount);

    if (amount.gt(tokenAccount.spendableBalance)) {
      throw new NotEnoughBalance();
    }
  }

  return abi.simpleEncode(
    "transfer(address,uint256)",
    recipient,
    amount.toString(10)
  );
}

export const modes: Record<Modes, ModeModule> = {
  send,
};
