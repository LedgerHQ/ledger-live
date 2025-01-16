import { BigNumber } from "bignumber.js";
import {
  NotEnoughBalance,
  RecipientRequired,
  InvalidAddress,
  FeeTooHigh,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotSupportedLegacyAddress,
  NotEnoughBalanceInParentAccount,
  AmountRequired,
  RecommendUndelegation,
  RecommendSubAccountsToEmpty,
  NotEnoughBalanceToDelegate,
} from "@ledgerhq/errors";
import type { TezosAccount, Transaction } from "../types";
import type { Account, AccountBridge, AccountLike, CurrencyBridge } from "@ledgerhq/types-live";
import { getMainAccount } from "../../../account";
import {
  scanAccounts,
  signOperation,
  broadcast,
  sync,
  isInvalidRecipient,
  makeAccountBridgeReceive,
} from "../../../bridge/mockHelpers";
import {
  getSerializedAddressParameters,
  updateTransaction,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { isAccountDelegating } from "../staking";

const isAccountBalanceSignificant = (a: AccountLike): boolean => a.balance.gt(100);

const receive = makeAccountBridgeReceive();

const estimateGasLimitAndStorage = () => {
  const storage = new BigNumber(257);
  const gasLimit = new BigNumber(10600);
  return {
    storage,
    gasLimit,
  };
};

const defaultGetFees = (a, t: any) =>
  (t.fees || new BigNumber(0)).times(t.gasLimit || new BigNumber(0));

const estimateMaxSpendable = ({ account, parentAccount, transaction }) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const estimatedFees = transaction ? defaultGetFees(mainAccount, transaction) : new BigNumber(10);
  return Promise.resolve(BigNumber.max(0, account.balance.minus(estimatedFees)));
};

const createTransaction = (): Transaction => ({
  family: "tezos",
  mode: "send",
  amount: new BigNumber(0),
  fees: null,
  gasLimit: null,
  storageLimit: null,
  recipient: "",
  networkInfo: null,
  useAllAmount: false,
  taquitoError: null,
  estimatedFees: null,
});

const getTransactionStatus = (a: Account, t: Transaction) => {
  const errors: {
    recipient?: Error;
    amount?: Error;
  } = {};
  const warnings: {
    amount?: Error;
    feeTooHigh?: Error;
  } = {};
  const subAcc = !t.subAccountId
    ? null
    : a.subAccounts && a.subAccounts.find(ta => ta.id === t.subAccountId);
  const account = subAcc || a;

  if (t.mode !== "undelegate") {
    if ((account as TezosAccount).freshAddress === t.recipient) {
      errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
    } else {
      if (!t.recipient) {
        // Fill up recipient errors...
        errors.recipient = new RecipientRequired("");
      } else if (isInvalidRecipient(t.recipient)) {
        errors.recipient = new InvalidAddress("");
      } else if (t.recipient.startsWith("KT")) {
        errors.recipient = new NotSupportedLegacyAddress();
      }
    }
  }

  let amount = t.amount;
  // FIXME: maybe we need this
  // if (!t.fees) {
  //   errors.fees = new FeeNotLoaded();
  // } else if (!errors.recipient) {
  //   estimatedFees = defaultGetFees(a, t);
  // }
  const estimatedFees = defaultGetFees(a, t);
  const useAllAmount = !!t.useAllAmount;
  let totalSpent = useAllAmount
    ? account.balance
    : subAcc
      ? new BigNumber(t.amount)
      : new BigNumber(t.amount).plus(estimatedFees);
  amount = useAllAmount
    ? subAcc
      ? new BigNumber(t.amount)
      : account.balance.minus(estimatedFees)
    : new BigNumber(t.amount);

  if (amount.gt(0) && estimatedFees.times(10).gt(amount)) {
    warnings.feeTooHigh = new FeeTooHigh();
  }

  if (!errors.amount && subAcc && estimatedFees.gt(a.balance)) {
    errors.amount = new NotEnoughBalanceInParentAccount();
  }

  if (!errors.recipient && !errors.amount && (amount.lt(0) || totalSpent.gt(account.balance))) {
    errors.amount = new NotEnoughBalance();
    totalSpent = new BigNumber(0);
    amount = new BigNumber(0);
  }

  if (t.mode === "send") {
    if (!errors.amount && amount.eq(0)) {
      errors.amount = new AmountRequired();
    } else if (amount.gt(0) && estimatedFees.times(10).gt(amount)) {
      warnings.feeTooHigh = new FeeTooHigh();
    }

    const thresholdWarning = 0.5 * 10 ** a.currency.units[0].magnitude;

    if (!subAcc && !errors.amount && account.balance.minus(totalSpent).lt(thresholdWarning)) {
      if (isAccountDelegating(account)) {
        warnings.amount = new RecommendUndelegation();
      } else if ((a.subAccounts || []).some(isAccountBalanceSignificant)) {
        warnings.amount = new RecommendSubAccountsToEmpty();
      }
    }
  } else {
    // delegation case, we remap NotEnoughBalance to a more precise error
    if (errors.amount instanceof NotEnoughBalance) {
      errors.amount = new NotEnoughBalanceToDelegate();
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

const prepareTransaction = async (a, t) => {
  let networkInfo = t.networkInfo;

  if (!networkInfo) {
    const ni = {
      family: "tezos",
      fees: t.fees || new BigNumber(0),
    };
    networkInfo = ni;
  }

  let gasLimit = t.gasLimit;
  let storageLimit = t.storageLimit;

  if (!gasLimit || storageLimit) {
    if (t.mode === "undelegate" || isInvalidRecipient(t.recipient)) {
      const r = estimateGasLimitAndStorage();
      gasLimit = r.gasLimit;
      storageLimit = r.storage;
    }
  }

  const fees = t.fees || networkInfo.fees;

  if (
    t.networkInfo !== networkInfo ||
    t.gasLimit !== gasLimit ||
    t.storageLimit !== storageLimit ||
    t.fees !== fees
  ) {
    return { ...t, networkInfo, storageLimit, gasLimit, fees };
  }

  return t;
};

const accountBridge: AccountBridge<Transaction> = {
  createTransaction,
  updateTransaction,
  getTransactionStatus,
  estimateMaxSpendable,
  prepareTransaction,
  sync,
  receive,
  signOperation,
  broadcast,
  getSerializedAddressParameters,
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
