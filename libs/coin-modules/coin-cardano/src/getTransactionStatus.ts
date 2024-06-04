import {
  AccountAwaitingSendPendingOperations,
  RecipientRequired,
  FeeNotLoaded,
  InvalidAddress,
  AmountRequired,
  NotEnoughBalance,
} from "@ledgerhq/errors";
import { BigNumber } from "bignumber.js";
import { AccountBridge } from "@ledgerhq/types-live";
import { utils as TyphonUtils } from "@stricahq/typhonjs";
import { decodeTokenAssetId, decodeTokenCurrencyId } from "./buildSubAccounts";
import { estimateMaxSpendable } from "./estimateMaxSpendable";
import { buildTransaction } from "./buildTransaction";
import { isHexString, isValidAddress } from "./logic";
import { getNetworkParameters } from "./networks";
import {
  CardanoInvalidPoolId,
  CardanoStakeKeyDepositError,
  CardanoMinAmountError,
  CardanoNotEnoughFunds,
} from "./errors";
import type {
  CardanoAccount,
  CardanoResources,
  Token,
  Transaction,
  TransactionStatus,
} from "./types";

export const getTransactionStatus: AccountBridge<
  Transaction,
  CardanoAccount,
  TransactionStatus
>["getTransactionStatus"] = async (account, transaction) => {
  if (account.pendingOperations.length > 0) {
    throw new AccountAwaitingSendPendingOperations();
  }

  if (account.cardanoResources.utxos.length === 0) {
    const errors = {
      amount: new CardanoNotEnoughFunds(),
    };
    return Promise.resolve({
      errors,
      warnings: {},
      estimatedFees: new BigNumber(0),
      amount: new BigNumber(transaction.amount),
      totalSpent: new BigNumber(transaction.amount),
    });
  }

  if (transaction.mode === "send") {
    return getSendTransactionStatus(account, transaction);
  } else if (transaction.mode === "delegate") {
    return getDelegateTransactionStatus(account, transaction);
  } else if (transaction.mode === "undelegate") {
    return getUndelegateTransactionStatus(account, transaction);
  } else {
    throw new Error("Invalid transaction mode");
  }
};

async function getSendTransactionStatus(
  account: CardanoAccount,
  transaction: Transaction,
): Promise<TransactionStatus> {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};
  const useAllAmount = !!transaction.useAllAmount;

  const cardanoResources = account.cardanoResources;
  const networkParams = getNetworkParameters(account.currency.id);

  const estimatedFees = transaction.fees || new BigNumber(0);
  let amount = transaction.amount;
  let totalSpent = estimatedFees;

  const tokenAccount =
    transaction.subAccountId && account.subAccounts
      ? account.subAccounts.find(a => {
          return a.id === transaction.subAccountId;
        })
      : undefined;

  let tokensToSend: Array<Token> = [];
  if (transaction.subAccountId) {
    // Token transaction
    if (!tokenAccount || tokenAccount.type !== "TokenAccount") {
      throw new Error("TokenAccount not found");
    }
    const { assetId } = decodeTokenCurrencyId(tokenAccount.token.id);
    const { policyId, assetName } = decodeTokenAssetId(assetId);
    amount = transaction.useAllAmount ? tokenAccount.balance : transaction.amount;
    totalSpent = amount;
    tokensToSend = [
      {
        policyId,
        assetName,
        amount,
      },
    ];
  } else {
    // ADA transaction
    amount = transaction.useAllAmount
      ? await estimateMaxSpendable({ account: account, transaction: transaction })
      : amount;
    totalSpent = amount.plus(estimatedFees);
  }

  const minTransactionAmount = TyphonUtils.calculateMinUtxoAmount(
    tokensToSend,
    new BigNumber(cardanoResources.protocolParams.lovelacePerUtxoWord),
    false,
  );

  if (!transaction.fees) {
    errors.fees = new FeeNotLoaded();
  }

  if (!transaction.recipient) {
    errors.recipient = new RecipientRequired();
  } else if (!isValidAddress(transaction.recipient, networkParams.networkId)) {
    errors.recipient = new InvalidAddress("", {
      currencyName: account.currency.name,
    });
  }

  if (!amount.gt(0)) {
    errors.amount = useAllAmount ? new CardanoNotEnoughFunds() : new AmountRequired();
  } else if (!transaction.subAccountId && amount.lt(minTransactionAmount)) {
    errors.amount = new CardanoMinAmountError("", {
      amount: minTransactionAmount.div(1e6).toString(),
    });
  } else if (tokenAccount ? totalSpent.gt(tokenAccount.balance) : totalSpent.gt(account.balance)) {
    errors.amount = new NotEnoughBalance();
  } else {
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

  return Promise.resolve({
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  });
}

async function getDelegateTransactionStatus(
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

  const stakeKeyRegisterDeposit = new BigNumber(
    account.cardanoResources.protocolParams.stakeKeyDeposit,
  );
  if (
    !account.cardanoResources.delegation?.status &&
    account.spendableBalance.isLessThan(stakeKeyRegisterDeposit)
  ) {
    errors.amount = new CardanoStakeKeyDepositError("", {
      depositAmount: stakeKeyRegisterDeposit.div(1e6).toString(),
    });
  }

  return Promise.resolve({
    errors,
    warnings,
    estimatedFees,
    amount: new BigNumber(0),
    totalSpent: estimatedFees,
  });
}

async function getUndelegateTransactionStatus(
  account: CardanoAccount,
  transaction: Transaction,
): Promise<TransactionStatus> {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  const cardanoResources = account.cardanoResources as CardanoResources;

  const estimatedFees = transaction.fees || new BigNumber(0);

  if (!cardanoResources.delegation?.status) {
    throw new Error("StakeKey is not registered");
  }

  if (account.balance.eq(0)) {
    throw new CardanoNotEnoughFunds();
  }

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

  return Promise.resolve({
    errors,
    warnings,
    estimatedFees,
    amount: new BigNumber(0),
    totalSpent: estimatedFees,
  });
}
