import { BigNumber } from "bignumber.js";
import { AmountRequired, NotEnoughBalance } from "@ledgerhq/ledger-wallet-framework/errors";
import type { AccountBridge } from "@ledgerhq/types-live";
import type { ZcashContext } from "../config";
import type { Transaction, TransactionStatus, ZcashAccount } from "../types/bridge";
import { ZcashAmountBelowDustThreshold } from "../types/errors";
import { computeRecipientError, isTransparentOutputDust } from "../bridge/statusHelpers";
import { marginalFeeFor } from "../logic/coin-selection";
import { buildLegacyTransaction, resolveWalletAccount } from "./buildTransaction";

/**
 * Status of a transparent send. The recipient is checked as an account without a
 * viewing key would be, which refuses a shielded address; the amounts come from
 * the build the send would actually sign.
 */
export const buildLegacyGetTransactionStatus =
  (
    context: ZcashContext,
  ): AccountBridge<Transaction, ZcashAccount, TransactionStatus>["getTransactionStatus"] =>
  async (account, transaction) => {
    const errors: Record<string, Error> = {};
    const warnings: Record<string, Error> = {};

    const recipientError = computeRecipientError(
      transaction.recipient,
      account.currency.name,
      false,
      account.currency.id,
    );
    if (recipientError) errors.recipient = recipientError;

    let estimatedFees = new BigNumber(0);
    let totalSpent = new BigNumber(0);
    let amount = transaction.amount;

    if (!recipientError) {
      const walletAccount = await resolveWalletAccount(context, account);
      const { zip2009 } = await context.config(account.currency.id);
      try {
        const { txInfo } = await buildLegacyTransaction(
          context.logger,
          walletAccount,
          transaction,
          marginalFeeFor(account, zip2009),
        );
        estimatedFees = new BigNumber(txInfo.fee);
        const sumOfInputs = txInfo.inputs.reduce(
          (sum, input) => sum.plus(input.value),
          new BigNumber(0),
        );
        const sumOfChanges = txInfo.outputs
          .filter(output => output.isChange)
          .reduce((sum, output) => sum.plus(output.value), new BigNumber(0));
        totalSpent = sumOfInputs.minus(sumOfChanges);
        amount = transaction.useAllAmount ? totalSpent.minus(estimatedFees) : transaction.amount;
      } catch (error) {
        if ((error as Error).name !== "NotEnoughBalance") throw error;
        errors.amount = new NotEnoughBalance();
      }
    }

    if (!errors.amount) {
      if (!amount.gt(0)) {
        errors.amount = transaction.useAllAmount ? new NotEnoughBalance() : new AmountRequired();
      } else if (isTransparentOutputDust(amount)) {
        errors.amount = new ZcashAmountBelowDustThreshold();
      }
    }

    return {
      errors,
      warnings,
      estimatedFees,
      amount,
      totalSpent,
      recipientIsReadOnly: transaction.selfTransfer === true,
    };
  };
