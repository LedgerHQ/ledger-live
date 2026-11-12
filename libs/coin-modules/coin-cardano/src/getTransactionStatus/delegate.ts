import { FeeNotLoaded } from "@ledgerhq/ledger-wallet-framework/errors";
import BigNumber from "bignumber.js";
import { buildTransaction } from "../buildTransaction";
import {
  CardanoInvalidPoolId,
  CardanoInvalidProtoParams,
  CardanoNotEnoughFunds,
  CardanoStakeKeyDepositError,
} from "../errors";
import { isHexString, parseAtomicAmount } from "../logic";
import type { CardanoAccount, Transaction, TransactionStatus } from "../types";
import { isRecoverableBuildError } from "./buildErrors";

export async function getDelegateTransactionStatus(
  account: CardanoAccount,
  transaction: Transaction,
): Promise<TransactionStatus> {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  if (!transaction.fees) {
    errors.fees = new FeeNotLoaded();
  }

  const estimatedFees = transaction.fees || new BigNumber(0);

  if (!transaction.poolId || !isHexString(transaction.poolId) || transaction.poolId.length !== 56) {
    errors.poolId = new CardanoInvalidPoolId();
  } else {
    try {
      await buildTransaction(account, transaction);
    } catch (e: unknown) {
      if (isRecoverableBuildError(e)) {
        errors.amount = new CardanoNotEnoughFunds();
      } else if (e instanceof CardanoInvalidProtoParams) {
        errors.amount = e;
      } else {
        throw e;
      }
    }
  }

  const stakeKeyRegisterDeposit = parseAtomicAmount(
    (transaction.protocolParams ?? account.cardanoResources.protocolParams).stakeKeyDeposit,
  );
  if (!stakeKeyRegisterDeposit) {
    errors.amount = new CardanoInvalidProtoParams();
  } else if (
    !(errors.amount instanceof CardanoInvalidProtoParams) &&
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
