import BigNumber from "bignumber.js";
import invariant from "invariant";
import {
  AmountRequired,
  NotEnoughBalance,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  RecipientRequired,
  ClaimRewardsFeesWarning,
} from "@ledgerhq/errors";
import { AccountId } from "@hashgraph/sdk";
import type { AccountBridge } from "@ledgerhq/types-live";
import { HederaInvalidStakingNodeIdError, HederaRedundantStakingNodeIdError } from "../errors";
import { isStakingTransaction } from "../logic";
import { getCurrentHederaPreloadData } from "../preload-data";
import type { HederaAccount, Transaction, TransactionStatus } from "../types";
import { calculateAmount, getEstimatedFees } from "./utils";

const verifyStakingFlowStatus = async (account: HederaAccount, transaction: Transaction) => {
  invariant(isStakingTransaction(transaction), "invalid transaction properties");

  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};
  const { validators } = getCurrentHederaPreloadData(account.currency);
  const estimatedFees = await getEstimatedFees(account, "CryptoUpdate");
  const amount = BigNumber(0);
  const totalSpent = amount.plus(estimatedFees);

  if (["delegate", "redelegate"].includes(transaction.properties.mode)) {
    if (typeof transaction.properties.stakingNodeId !== "number") {
      errors.missingStakinNodeId = new HederaInvalidStakingNodeIdError("Validator must be set");
    } else {
      const isValid = validators.some(validator => {
        return validator.nodeId === transaction.properties.stakingNodeId;
      });

      if (!isValid) {
        errors.stakingNodeId = new HederaInvalidStakingNodeIdError();
      }
    }

    if (account.hederaResources?.delegation?.nodeId === transaction.properties.stakingNodeId) {
      errors.stakingNodeId = new HederaRedundantStakingNodeIdError();
    }
  }

  if (transaction.properties.mode === "claimRewards") {
    const claimRewards = account.hederaResources?.delegation?.pendingReward || new BigNumber(0);
    const transactionFee = transaction.maxFee ?? new BigNumber(0);

    if (transactionFee.gt(claimRewards)) {
      warnings.claimRewardsFee = new ClaimRewardsFeesWarning();
    }
  }

  return {
    amount: new BigNumber(0),
    estimatedFees,
    totalSpent,
    errors,
    warnings,
  };
};

const verifyDefaultFlowStatus = async (account: HederaAccount, transaction: Transaction) => {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  if (!transaction.recipient || transaction.recipient.length === 0) {
    errors.recipient = new RecipientRequired("");
  } else {
    if (account.freshAddress === transaction.recipient) {
      errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource("");
    }

    try {
      AccountId.fromString(transaction.recipient);
    } catch (err) {
      errors.recipient = new InvalidAddress("", {
        currencyName: account.currency.name,
      });
    }
  }

  const { amount, totalSpent } = await calculateAmount({
    transaction,
    account,
  });

  if (transaction.amount.eq(0) && !transaction.useAllAmount) {
    errors.amount = new AmountRequired();
  } else if (account.balance.isLessThan(totalSpent)) {
    errors.amount = new NotEnoughBalance("");
  }

  const estimatedFees = await getEstimatedFees(account, "CryptoTransfer");

  return {
    amount,
    estimatedFees,
    totalSpent,
    errors,
    warnings,
  };
};

export const getTransactionStatus: AccountBridge<
  Transaction,
  HederaAccount
>["getTransactionStatus"] = async (account, transaction) => {
  let result: TransactionStatus;

  if (isStakingTransaction(transaction)) {
    result = await verifyStakingFlowStatus(account, transaction);
  } else {
    result = await verifyDefaultFlowStatus(account, transaction);
  }

  return result;
};
