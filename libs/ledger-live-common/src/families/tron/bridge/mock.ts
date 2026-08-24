import { BigNumber } from "bignumber.js";
import {
  NotEnoughBalance,
  RecipientRequired,
  InvalidAddress,
} from "@ledgerhq/ledger-wallet-framework/errors";
import type { Transaction } from "../types";
import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import { TRON_DUMMY_ADDRESS } from "@ledgerhq/coin-tron/constants";
import { getSerializedAddressParameters } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import {
  scanAccounts,
  signOperation,
  signRawOperation,
  broadcast,
  sync,
  isInvalidRecipient,
  makeAccountBridgeReceive,
} from "../../../bridge/mockHelpers";
import { validateAddress } from "../../../bridge/validateAddress";

const receive = makeAccountBridgeReceive();

// Each member is typed from the bridge it implements, so the callback parameters below are
// contextually typed rather than implicitly `any`.
type TronMockBridge = AccountBridge<Transaction>;

const createTransaction = (): Transaction => ({
  family: "tron",
  amount: new BigNumber(0),
  useAllAmount: false,
  mode: "send",
  recipient: "",
  // Same defaults the real bridge seeds (generic-coin-framework/createTransaction.ts), so a mock
  // staking flow doesn't start with an undefined bag.
  familySpecificData: { resource: null, duration: 3, votes: [] },
});

const updateTransaction: TronMockBridge["updateTransaction"] = (t, patch) => ({ ...t, ...patch });

const estimateMaxSpendable: TronMockBridge["estimateMaxSpendable"] = async ({ account }) =>
  account.balance;

const getTransactionStatus: TronMockBridge["getTransactionStatus"] = (a, t) => {
  const errors: {
    amount?: Error;
    recipient?: Error;
  } = {};
  const warnings: {
    feeTooHigh?: Error;
    gasLimit?: Error;
  } = {};
  const tokenAccount = !t.subAccountId
    ? null
    : a.subAccounts && a.subAccounts.find(ta => ta.id === t.subAccountId);
  const account = tokenAccount || a;
  const useAllAmount = !!t.useAllAmount;
  const estimatedFees = BigNumber(0);
  const totalSpent = useAllAmount
    ? account.balance
    : tokenAccount
      ? new BigNumber(t.amount)
      : new BigNumber(t.amount).plus(estimatedFees);
  const amount = useAllAmount
    ? tokenAccount
      ? new BigNumber(t.amount)
      : account.balance.minus(estimatedFees)
    : new BigNumber(t.amount);

  // Fill up transaction errors...
  if (totalSpent.gt(account.balance)) {
    errors.amount = new NotEnoughBalance();
  }

  // Fill up recipient errors...
  if (!t.recipient) {
    errors.recipient = new RecipientRequired("");
  } else if (isInvalidRecipient(t.recipient)) {
    errors.recipient = new InvalidAddress("");
  }

  return Promise.resolve({
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  });
};

// Nothing to fill in: mock fees are 0, and the transaction shape carries no `networkInfo`.
const prepareTransaction: TronMockBridge["prepareTransaction"] = async (_account, transaction) =>
  transaction;

const accountBridge: TronMockBridge = {
  createTransaction,
  updateTransaction,
  getTransactionStatus,
  estimateMaxSpendable,
  prepareTransaction,
  sync,
  receive,
  signOperation,
  signRawOperation,
  broadcast,
  getSerializedAddressParameters,
  validateAddress,
  getEstimationRecipient: () => TRON_DUMMY_ADDRESS,
};

const currencyBridge: CurrencyBridge = {
  preload: () => Promise.resolve({}),
  hydrate: () => {},
  scanAccounts,
};

export default {
  currencyBridge,
  accountBridge,
};
