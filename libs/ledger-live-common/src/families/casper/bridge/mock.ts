import { BigNumber } from "bignumber.js";
import {
  AmountRequired,
  NotEnoughBalance,
  RecipientRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
} from "@ledgerhq/errors";
import type { Account, AccountBridge, AccountLike, CurrencyBridge } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "../types";
import {
  scanAccounts,
  signOperation,
  broadcast,
  sync,
  makeAccountBridgeReceive,
} from "../../../bridge/mockHelpers";
import { getEstimatedFees } from "./bridgeHelpers/fee";
import {
  getSerializedAddressParameters,
  updateTransaction,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { getAddress, isAddressValid } from "./bridgeHelpers/addresses";
import { isTransferIdValid } from "./bridgeHelpers/transferId";
import { CasperInvalidTransferId, InvalidMinimumAmount, MayBlockAccount } from "../errors";
import {
  CASPER_FEES_CSPR,
  CASPER_MAX_TRANSFER_ID,
  CASPER_MINIMUM_VALID_AMOUNT_CSPR,
  CASPER_MINIMUM_VALID_AMOUNT_MOTES,
} from "../consts";
import { getMainAccount } from "../../../account";

const receive = makeAccountBridgeReceive();

const createTransaction = (): Transaction => ({
  family: "casper",
  amount: new BigNumber(0),
  fees: getEstimatedFees(),
  recipient: "",
  useAllAmount: false,
});

const getTransactionStatus = async (a: Account, t: Transaction): Promise<TransactionStatus> => {
  const errors: TransactionStatus["errors"] = {};
  const warnings: TransactionStatus["warnings"] = {};

  const { balance, spendableBalance } = a;
  const { address } = getAddress(a);
  const { recipient, useAllAmount } = t;
  let { amount } = t;

  if (!recipient) errors.recipient = new RecipientRequired();
  else if (!isAddressValid(recipient))
    errors.recipient = new InvalidAddress("", {
      currencyName: a.currency.name,
    });
  else if (recipient.toLowerCase() === address.toLowerCase())
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();

  if (!isAddressValid(address))
    errors.sender = new InvalidAddress("", {
      currencyName: a.currency.name,
    });
  else if (!isTransferIdValid(t.transferId)) {
    errors.sender = new CasperInvalidTransferId("", {
      maxTransferId: CASPER_MAX_TRANSFER_ID,
    });
  }

  const estimatedFees = t.fees;

  let totalSpent = BigNumber(0);

  if (useAllAmount) {
    totalSpent = a.spendableBalance;
    amount = totalSpent.minus(estimatedFees);
    if (amount.lte(0) || totalSpent.gt(balance)) {
      errors.amount = new NotEnoughBalance();
    }
  }

  if (!useAllAmount) {
    totalSpent = amount.plus(estimatedFees);
    if (amount.eq(0)) {
      errors.amount = new AmountRequired();
    }

    if (totalSpent.gt(a.spendableBalance)) {
      errors.amount = new NotEnoughBalance();
    }
  }

  if (amount.lt(CASPER_MINIMUM_VALID_AMOUNT_MOTES) && !errors.amount)
    errors.amount = new InvalidMinimumAmount("", {
      minAmount: `${CASPER_MINIMUM_VALID_AMOUNT_CSPR} CSPR`,
    });

  if (spendableBalance.minus(totalSpent).minus(estimatedFees).lt(CASPER_MINIMUM_VALID_AMOUNT_MOTES))
    warnings.amount = new MayBlockAccount("", {
      minAmount: `${CASPER_MINIMUM_VALID_AMOUNT_CSPR + CASPER_FEES_CSPR} CSPR`,
    });

  return {
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  };
};

const prepareTransaction = async (a: Account, t: Transaction): Promise<Transaction> => {
  const { address } = getAddress(a);
  const { recipient } = t;

  if (recipient && address) {
    if (t.useAllAmount) {
      const amount = a.spendableBalance.minus(t.fees);
      return { ...t, amount };
    }
  }

  return t;
};

const estimateMaxSpendable = async ({
  account,
  parentAccount,
  transaction,
}: {
  account: AccountLike;
  parentAccount?: Account | null | undefined;
  transaction?: Transaction | null | undefined;
}): Promise<BigNumber> => {
  const a = getMainAccount(account, parentAccount);
  let balance = a.spendableBalance;

  if (balance.eq(0)) return balance;

  const estimatedFees = transaction?.fees ?? getEstimatedFees();

  if (balance.lte(estimatedFees)) return new BigNumber(0);

  balance = balance.minus(estimatedFees);

  return balance;
};
const preload = async () => ({});

const hydrate = () => {};

const currencyBridge: CurrencyBridge = {
  preload,
  hydrate,
  scanAccounts,
};
const accountBridge: AccountBridge<Transaction> = {
  createTransaction,
  updateTransaction,
  prepareTransaction,
  getTransactionStatus,
  sync,
  receive,
  signOperation,
  broadcast,
  estimateMaxSpendable,
  getSerializedAddressParameters,
};
export default {
  currencyBridge,
  accountBridge,
};
