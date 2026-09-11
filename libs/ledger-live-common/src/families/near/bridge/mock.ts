import { BigNumber } from "bignumber.js";
import {
  NotEnoughBalance,
  InvalidAddress,
  RecipientRequired,
  AmountRequired,
} from "@ledgerhq/ledger-wallet-framework/errors";
import type { Account, AccountBridge, AccountLike, CurrencyBridge } from "@ledgerhq/types-live";
import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/index";
import {
  getSerializedAddressParameters,
  updateTransaction,
} from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import {
  scanAccounts,
  signOperation,
  signRawOperation,
  broadcast,
  sync,
  makeAccountBridgeReceive,
} from "../../../bridge/mockHelpers";
import { validateAddress } from "../../../bridge/validateAddress";
import { isValidAddress } from "@ledgerhq/coin-near/logic";
import { NEAR_DUMMY_ADDRESS } from "@ledgerhq/coin-near/constants";
import type { Transaction, TransactionStatus } from "../types";

// Typical NEAR transfer fee: ~0.001 NEAR (10^21 yoctoNEAR)
const DEFAULT_FEE = new BigNumber("1000000000000000000000");

const receive = makeAccountBridgeReceive();

const createTransaction = (): Transaction => ({
  family: "near",
  mode: "send",
  amount: new BigNumber(0),
  recipient: "",
  fees: DEFAULT_FEE,
  useAllAmount: false,
});

const getTransactionStatus = async (a: Account, t: Transaction): Promise<TransactionStatus> => {
  const errors: TransactionStatus["errors"] = {};
  const warnings: TransactionStatus["warnings"] = {};
  const { recipient, useAllAmount } = t;
  let { amount } = t;
  const estimatedFees = t.fees ?? DEFAULT_FEE;

  if (!recipient) {
    errors.recipient = new RecipientRequired();
  } else if (!isValidAddress(recipient)) {
    errors.recipient = new InvalidAddress("", { currencyName: a.currency.name });
  }

  let totalSpent: BigNumber;
  if (useAllAmount) {
    totalSpent = a.spendableBalance;
    amount = totalSpent.minus(estimatedFees);
    if (amount.lte(0)) errors.amount = new NotEnoughBalance();
  } else {
    if (amount.eq(0)) errors.amount = new AmountRequired();
    totalSpent = amount.plus(estimatedFees);
    if (totalSpent.gt(a.spendableBalance)) errors.amount = new NotEnoughBalance();
  }

  return { errors, warnings, estimatedFees, amount, totalSpent };
};

const prepareTransaction = async (a: Account, t: Transaction): Promise<Transaction> => {
  if (t.useAllAmount) {
    const fees = t.fees ?? DEFAULT_FEE;
    return { ...t, amount: a.spendableBalance.minus(fees) };
  }
  return t;
};

const estimateMaxSpendable = async ({
  account,
  parentAccount,
  transaction,
}: {
  account: AccountLike;
  parentAccount?: Account | null;
  transaction?: Transaction | null;
}): Promise<BigNumber> => {
  const a = getMainAccount(account, parentAccount);
  const fees = transaction?.fees ?? DEFAULT_FEE;
  return BigNumber.max(0, a.spendableBalance.minus(fees));
};

const currencyBridge: CurrencyBridge = {
  preload: async () => ({}),
  hydrate: () => {},
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
  signRawOperation,
  broadcast,
  estimateMaxSpendable,
  getSerializedAddressParameters,
  validateAddress,
  getEstimationRecipient: () => NEAR_DUMMY_ADDRESS,
};

export default {
  currencyBridge,
  accountBridge,
};
