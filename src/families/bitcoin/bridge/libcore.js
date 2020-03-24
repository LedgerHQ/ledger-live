// @flow
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import {
  AmountRequired,
  FeeNotLoaded,
  FeeRequired,
  FeeTooHigh,
  NotEnoughBalance
} from "@ledgerhq/errors";
import { validateRecipient } from "../../../bridge/shared";
import type { AccountBridge, CurrencyBridge } from "../../../types/bridge";
import type { Account } from "../../../types/account";
import type { Transaction } from "../types";
import { sync } from "../../../libcore/syncAccount";
import { scanAccounts } from "../../../libcore/scanAccounts";
import { getAccountNetworkInfo } from "../../../libcore/getAccountNetworkInfo";
import { getFeesForTransaction } from "../../../libcore/getFeesForTransaction";
import { makeLRUCache } from "../../../cache";
import broadcast from "../libcore-broadcast";
import signOperation from "../libcore-signOperation";
import { getMainAccount } from "../../../account";
import { abandonSeedLegacyPerCurrency } from "../publicAddresses";

const calculateFees = makeLRUCache(
  async (a, t) => {
    return getFeesForTransaction({
      account: a,
      transaction: t
    });
  },
  (a, t) =>
    `${a.id}_${a.blockHeight || 0}_${t.amount.toString()}_${t.recipient}_${
      t.feePerByte ? t.feePerByte.toString() : ""
    }`
);

const createTransaction = () => ({
  family: "bitcoin",
  amount: BigNumber(0),
  recipient: "",
  feePerByte: null,
  networkInfo: null,
  useAllAmount: false
});

const updateTransaction = (t, patch) => ({ ...t, ...patch });

const worseCaseCostEstimationAddresses = abandonSeedLegacyPerCurrency;

const estimateMaxSpendable = async ({
  account,
  parentAccount,
  transaction
}) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const t = await prepareTransaction(mainAccount, {
    // worse case scenario using a legacy address
    ...createTransaction(),
    ...transaction,
    useAllAmount: true,
    recipient: worseCaseCostEstimationAddresses[mainAccount.currency.id]
  });
  const s = await getTransactionStatus(mainAccount, t);
  return s.amount;
};

const getTransactionStatus = async (a, t) => {
  const errors = {};
  const warnings = {};
  const useAllAmount = !!t.useAllAmount;

  let { recipientError, recipientWarning } = await validateRecipient(
    a.currency,
    t.recipient
  );

  if (recipientError) {
    errors.recipient = recipientError;
  }

  if (recipientWarning) {
    warnings.recipient = recipientWarning;
  }

  let estimatedFees = BigNumber(0);
  if (!t.feePerByte) {
    errors.feePerByte = new FeeNotLoaded();
  } else if (t.feePerByte.eq(0)) {
    errors.feePerByte = new FeeRequired();
  } else if (!errors.recipient) {
    await calculateFees(a, t).then(
      res => {
        estimatedFees = res.estimatedFees;
      },
      error => {
        if (error.name === "NotEnoughBalance") {
          errors.amount = error;
        } else {
          throw error;
        }
      }
    );
  }

  const totalSpent = useAllAmount ? a.balance : t.amount.plus(estimatedFees);
  const amount = useAllAmount ? a.balance.minus(estimatedFees) : t.amount;

  // FIXME libcore have a bug that don't detect some cases like when doing send max!
  if (!errors.amount && useAllAmount && !amount.gt(0)) {
    errors.amount = new NotEnoughBalance();
  }

  if (amount.gt(0) && estimatedFees.times(10).gt(amount)) {
    warnings.feeTooHigh = new FeeTooHigh();
  }

  if (!errors.amount && amount.eq(0)) {
    errors.amount = new AmountRequired();
  }

  return Promise.resolve({
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent
  });
};

const prepareTransaction = async (
  a: Account,
  t: Transaction
): Promise<Transaction> => {
  let networkInfo = t.networkInfo;
  if (!networkInfo) {
    networkInfo = await getAccountNetworkInfo(a);
    invariant(networkInfo.family === "bitcoin", "bitcoin networkInfo expected");
  }
  const feePerByte = t.feePerByte || networkInfo.feeItems.defaultFeePerByte;
  if (
    t.networkInfo === networkInfo &&
    (feePerByte === t.feePerByte || feePerByte.eq(t.feePerByte || 0))
    // nothing changed
  ) {
    return t;
  }
  return {
    ...t,
    networkInfo,
    feePerByte
  };
};

const currencyBridge: CurrencyBridge = {
  scanAccounts,
  preload: () => Promise.resolve(),
  hydrate: () => {}
};

const accountBridge: AccountBridge<Transaction> = {
  estimateMaxSpendable,
  createTransaction,
  updateTransaction,
  prepareTransaction,
  getTransactionStatus,
  sync,
  signOperation,
  broadcast
};

export default { currencyBridge, accountBridge };
