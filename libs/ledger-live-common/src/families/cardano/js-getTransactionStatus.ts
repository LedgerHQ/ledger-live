import { BigNumber } from "bignumber.js";
import {
  RecipientRequired,
  FeeNotLoaded,
  InvalidAddress,
  AmountRequired,
  NotEnoughBalance,
} from "@ledgerhq/errors";
import type {
  CardanoAccount,
  CardanoResources,
  Token,
  Transaction,
  TransactionStatus,
} from "./types";
import { isHexString, isValidAddress } from "./logic";
import { utils as TyphonUtils } from "@stricahq/typhonjs";
import {
  CardanoInvalidPoolId,
  CardanoStakeKeyDepositError,
  CardanoMinAmountError,
  CardanoNotEnoughFunds,
} from "./errors";
import { AccountAwaitingSendPendingOperations } from "../../errors";
import { getNetworkParameters } from "./networks";
import { decodeTokenAssetId, decodeTokenCurrencyId } from "./buildSubAccounts";
import estimateMaxSpendable from "./js-estimateMaxSpendable";
import { buildTransaction } from "./js-buildTransaction";

async function getSendTransactionStatus(
  a: CardanoAccount,
  t: Transaction,
): Promise<TransactionStatus> {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};
  const useAllAmount = !!t.useAllAmount;

  const cardanoResources = a.cardanoResources;
  const networkParams = getNetworkParameters(a.currency.id);

  const estimatedFees = t.fees || new BigNumber(0);
  let amount = t.amount;
  let totalSpent = estimatedFees;

  const tokenAccount =
    t.subAccountId && a.subAccounts
      ? a.subAccounts.find(a => {
          return a.id === t.subAccountId;
        })
      : undefined;

  let tokensToSend: Array<Token> = [];
  if (t.subAccountId) {
    // Token transaction
    if (!tokenAccount || tokenAccount.type !== "TokenAccount") {
      throw new Error("TokenAccount not found");
    }
    const { assetId } = decodeTokenCurrencyId(tokenAccount.token.id);
    const { policyId, assetName } = decodeTokenAssetId(assetId);
    amount = t.useAllAmount ? tokenAccount.balance : t.amount;
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
    amount = t.useAllAmount ? await estimateMaxSpendable({ account: a, transaction: t }) : amount;
    totalSpent = amount.plus(estimatedFees);
  }

  const minTransactionAmount = TyphonUtils.calculateMinUtxoAmount(
    tokensToSend,
    new BigNumber(cardanoResources.protocolParams.lovelacePerUtxoWord),
    false,
  );

  if (!t.fees) {
    errors.fees = new FeeNotLoaded();
  }

  if (!t.recipient) {
    errors.recipient = new RecipientRequired();
  } else if (!isValidAddress(t.recipient, networkParams.networkId)) {
    errors.recipient = new InvalidAddress("", {
      currencyName: a.currency.name,
    });
  }

  if (!amount.gt(0)) {
    errors.amount = useAllAmount ? new CardanoNotEnoughFunds() : new AmountRequired();
  } else if (!t.subAccountId && amount.lt(minTransactionAmount)) {
    errors.amount = new CardanoMinAmountError("", {
      amount: minTransactionAmount.div(1e6).toString(),
    });
  } else if (tokenAccount ? totalSpent.gt(tokenAccount.balance) : totalSpent.gt(a.balance)) {
    errors.amount = new NotEnoughBalance();
  } else {
    try {
      await buildTransaction(a, t);
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
  a: CardanoAccount,
  t: Transaction,
): Promise<TransactionStatus> {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  if (!t.fees) {
    errors.fees = new FeeNotLoaded();
  }

  const estimatedFees = t.fees || new BigNumber(0);

  if (!t.poolId || !isHexString(t.poolId) || t.poolId.length !== 56) {
    errors.poolId = new CardanoInvalidPoolId();
  } else {
    try {
      await buildTransaction(a, t);
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

  const stakeKeyRegisterDeposit = new BigNumber(a.cardanoResources.protocolParams.stakeKeyDeposit);
  if (
    !a.cardanoResources.delegation?.status &&
    a.spendableBalance.isLessThan(stakeKeyRegisterDeposit)
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
  a: CardanoAccount,
  t: Transaction,
): Promise<TransactionStatus> {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  const cardanoResources = a.cardanoResources as CardanoResources;

  const estimatedFees = t.fees || new BigNumber(0);

  if (!cardanoResources.delegation?.status) {
    throw new Error("StakeKey is not registered");
  }

  if (a.balance.eq(0)) {
    throw new CardanoNotEnoughFunds();
  }

  try {
    await buildTransaction(a, t);
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

const getTransactionStatus = async (
  a: CardanoAccount,
  t: Transaction,
): Promise<TransactionStatus> => {
  if (a.pendingOperations.length > 0) {
    throw new AccountAwaitingSendPendingOperations();
  }

  if (t.mode === "send") {
    return getSendTransactionStatus(a, t);
  } else if (t.mode === "delegate") {
    return getDelegateTransactionStatus(a, t);
  } else if (t.mode === "undelegate") {
    return getUndelegateTransactionStatus(a, t);
  } else {
    throw new Error("Invalid transaction mode");
  }
};

export default getTransactionStatus;
