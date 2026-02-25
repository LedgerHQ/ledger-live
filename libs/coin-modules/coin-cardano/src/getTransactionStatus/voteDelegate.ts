import BigNumber from "bignumber.js";
import { buildTransaction } from "../buildTransaction";
import {
  CardanoInvalidDRepHex,
  CardanoNotEnoughFunds,
  CardanoStakeKeyDepositError,
} from "../errors";
import { isHexString } from "../logic";
import { FeeNotLoaded } from "@ledgerhq/errors";
import { CardanoAccount, Transaction, TransactionStatus } from "../types";

export async function getVoteDelegateTransactionStatus(
  account: CardanoAccount,
  transaction: Transaction,
): Promise<TransactionStatus> {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  const estimatedFees = transaction.fees || new BigNumber(0);

  // should must have exactly one of them defined
  const dRepCount =
    Number(transaction.dRepAbstain === true) +
    Number(transaction.dRepNoConfidence === true) +
    Number((transaction.dRepHex?.length ?? 0) > 0);
  if (dRepCount !== 1) {
    // this will never happen
    throw new Error("Exactly one of dRepAbstain, dRepNoConfidence or dRepHex must be provided.");
  }

  if (transaction.dRepHex) {
    const isValidLength = transaction.dRepHex.length === 58;
    const isValidHex = isHexString(transaction.dRepHex);
    const header = transaction.dRepHex.slice(0, 2);
    const isValidHeader = header === "22" || header === "23";

    if (!isValidLength || !isValidHex || !isValidHeader) {
      errors.dRepHex = new CardanoInvalidDRepHex();
    }
  }

  if (!errors.dRepHex) {
    try {
      await buildTransaction(account, transaction);
    } catch (e: any) {
      if (
        e.message.toLowerCase() === "not enough ada" ||
        e.message.toLowerCase() === "not enough tokens"
      ) {
        errors.amount = new CardanoNotEnoughFunds();
      } else {
        throw e;
      }
    }
  }

  if (!transaction.fees) {
    errors.fees = new FeeNotLoaded();
  }

  // stake key register deposit
  const stakeKeyRegisterDeposit = new BigNumber(
    account.cardanoResources.protocolParams.stakeKeyDeposit,
  );

  /**
   * vote delegation requires stake key to be registered
   * if it is not registered and spendable balance is less than registration deposit then show error
   */
  if (
    !account.cardanoResources.delegation?.status &&
    account.spendableBalance.isLessThan(stakeKeyRegisterDeposit)
  ) {
    errors.amount = new CardanoStakeKeyDepositError("", {
      depositAmount: stakeKeyRegisterDeposit.div(1e6).toString(),
    });
  }

  return {
    errors,
    warnings,
    estimatedFees,
    amount: new BigNumber(0),
    totalSpent: estimatedFees,
  };
}
