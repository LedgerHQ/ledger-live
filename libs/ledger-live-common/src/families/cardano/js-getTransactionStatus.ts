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
import { isValidAddress } from "./logic";
import { utils as TyphonUtils } from "@stricahq/typhonjs";
import { CardanoMinAmountError, CardanoNotEnoughFunds } from "./errors";
import { AccountAwaitingSendPendingOperations } from "../../errors";
import { getNetworkParameters } from "./networks";
import { decodeTokenAssetId, decodeTokenCurrencyId } from "./buildSubAccounts";
import estimateMaxSpendable from "./js-estimateMaxSpendable";
import { buildTransaction } from "./js-buildTransaction";

const getTransactionStatus = async (
  a: CardanoAccount,
  t: Transaction
): Promise<TransactionStatus> => {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};
  const useAllAmount = !!t.useAllAmount;

  const cardanoResources = a.cardanoResources as CardanoResources;
  const networkParams = getNetworkParameters(a.currency.id);

  if (a.pendingOperations.length > 0) {
    throw new AccountAwaitingSendPendingOperations();
  }

  const estimatedFees = t.fees || new BigNumber(0);
  let amount = t.amount;
  let totalSpent = estimatedFees;

  const tokenAccount =
    t.subAccountId && a.subAccounts
      ? a.subAccounts.find((a) => {
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
    amount = t.useAllAmount
      ? await estimateMaxSpendable({ account: a, transaction: t })
      : amount;
    totalSpent = amount.plus(estimatedFees);
  }

  const minTransactionAmount = TyphonUtils.calculateMinUtxoAmount(
    tokensToSend,
    new BigNumber(cardanoResources.protocolParams.lovelacePerUtxoWord),
    false
  );

  if (!t.fees) {
    errors.fees = new FeeNotLoaded();
  }

  if (!t.recipient) {
    errors.recipient = new RecipientRequired();
  } else if (!isValidAddress(t.recipient, networkParams.networkId)) {
    errors.recipient = new InvalidAddress();
  }

  if (!amount.gt(0)) {
    errors.amount = useAllAmount
      ? new CardanoNotEnoughFunds()
      : new AmountRequired();
  } else if (!t.subAccountId && amount.lt(minTransactionAmount)) {
    errors.amount = new CardanoMinAmountError("", {
      amount: minTransactionAmount.div(1e6).toString(),
    });
  } else if (
    tokenAccount
      ? totalSpent.gt(tokenAccount.balance)
      : totalSpent.gt(a.balance)
  ) {
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
      }
      throw e;
    }
  }

  return Promise.resolve({
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  });
};

export default getTransactionStatus;
