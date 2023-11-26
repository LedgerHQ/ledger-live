import BigNumber from "bignumber.js";
import {
  CardanoAccount,
  Token,
  Transaction as CardanoTransaction,
  TransactionStatus,
} from "../types";
import { utils as TyphonUtils } from "@stricahq/typhonjs";
import type { AccountBridge, CurrencyBridge, Account } from "@ledgerhq/types-live";
import { decodeTokenAssetId, decodeTokenCurrencyId } from "../buildSubAccounts";
import {
  AmountRequired,
  FeeNotLoaded,
  InvalidAddress,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import { CardanoMinAmountError, CardanoNotEnoughFunds } from "../errors";
import { buildTransaction } from "../js-buildTransaction";
import { defaultUpdateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import {
  scanAccounts,
  signOperation,
  broadcast,
  sync,
  makeAccountBridgeReceive,
} from "../../../bridge/mockHelpers";

const receive = makeAccountBridgeReceive();

const createTransaction = (): CardanoTransaction => {
  return {
    family: "cardano",
    mode: "send",
    amount: new BigNumber(100),
    recipient: "",
    poolId: "",
  };
};

const estimateMaxSpendable = ({ account }) => {
  return account.balance;
};

const isValidAddress = (address: string) => {
  return address.length > 0;
};

const getTransactionStatus = async (
  account: CardanoAccount,
  transaction: CardanoTransaction,
): Promise<TransactionStatus> => {
  const errors = { fees: new Error(), recipient: new Error(), amount: new Error() };
  const warnings = {};
  const estimatedFees = transaction.fees || new BigNumber(0);

  const tokenAccount =
    transaction.subAccountId && account.subAccounts
      ? account.subAccounts.find(a => {
          return a.id === transaction.subAccountId;
        })
      : undefined;

  const mockAccount = tokenAccount || account;
  let amount = transaction.useAllAmount
    ? await estimateMaxSpendable({ account: mockAccount })
    : transaction.amount;

  let totalSpent = transaction.amount.plus(estimatedFees);

  const useAllAmount = Boolean(transaction.useAllAmount);

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
    amount = transaction.useAllAmount ? await estimateMaxSpendable({ account }) : amount;
    totalSpent = amount.plus(estimatedFees);
  }

  const minTransactionAmount = TyphonUtils.calculateMinUtxoAmount(
    tokensToSend,
    new BigNumber(account.cardanoResources.protocolParams.lovelacePerUtxoWord),
    false,
  );

  if (!transaction.fees) {
    errors.fees = new FeeNotLoaded();
  }

  if (!transaction.recipient) {
    errors.recipient = new RecipientRequired();
  } else if (!isValidAddress(transaction.recipient)) {
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
};

const prepareTransaction = async (account: Account, transaction: CardanoTransaction) => {
  transaction.fees = new BigNumber(100);
  return transaction;
};

const accountBridge: AccountBridge<CardanoTransaction> = {
  createTransaction,
  updateTransaction: defaultUpdateTransaction,
  getTransactionStatus,
  estimateMaxSpendable,
  prepareTransaction,
  sync,
  receive,
  signOperation,
  broadcast,
};

const currencyBridge: CurrencyBridge = {
  preload: () => Promise.resolve({}),
  hydrate: () => {},
  scanAccounts,
};

export default {
  accountBridge,
  currencyBridge,
};
