import {
  AmountRequired,
  FeeNotLoaded,
  InvalidAddress,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import { utils as TyphonUtils } from "@stricahq/typhonjs";
import { BigNumber } from "bignumber.js";
import { decodeTokenAssetId, decodeTokenCurrencyId } from "./buildSubAccounts";
import { buildTransaction } from "./buildTransaction";
import { CARDANO_MAX_SUPPLY } from "./constants";
import { CardanoMinAmountError, CardanoNotEnoughFunds } from "./errors";
import { estimateMaxSpendable } from "./estimateMaxSpendable";
import { isValidAddress } from "./logic";
import { getNetworkParameters } from "./networks";
import type { CardanoAccount, Token, Transaction, TransactionStatus } from "./types";

export async function getSendTransactionStatus(
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
  const isTokenTx = !!transaction.subAccountId;
  if (isTokenTx) {
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

  let minTransactionAmount = new BigNumber(0);

  if (!transaction.fees) {
    errors.fees = new FeeNotLoaded();
  }

  if (!transaction.recipient) {
    errors.recipient = new RecipientRequired();
  } else if (!isValidAddress(transaction.recipient, networkParams.networkId)) {
    errors.recipient = new InvalidAddress("", {
      currencyName: account.currency.name,
    });
  } else {
    // minTransactionAmount can only be calculated with valid recipient
    const recipient = TyphonUtils.getAddressFromString(transaction.recipient);
    minTransactionAmount = TyphonUtils.calculateMinUtxoAmountBabbage(
      {
        address: recipient,
        amount: new BigNumber(CARDANO_MAX_SUPPLY),
        tokens: tokensToSend,
      },
      new BigNumber(cardanoResources.protocolParams.utxoCostPerByte),
    );
  }

  if (!amount.gt(0)) {
    errors.amount = useAllAmount ? new CardanoNotEnoughFunds() : new AmountRequired();
  } else if (!isTokenTx && amount.lt(minTransactionAmount)) {
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

  return {
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  };
}
