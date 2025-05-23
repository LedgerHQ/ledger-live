import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { BigNumber } from "bignumber.js";
import {
  NotEnoughSpendableBalance,
  NotEnoughBalanceBecauseDestinationNotCreated,
  InvalidAddressBecauseDestinationIsAlsoSource,
  InvalidAddress,
  RecipientRequired,
  FeeTooHigh,
  AmountRequired,
} from "@ledgerhq/errors";
import type { Transaction } from "@ledgerhq/coin-xrp/types";
import type { Account, AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import { getMainAccount } from "@ledgerhq/coin-framework/account/index";
import {
  getSerializedAddressParameters,
  updateTransaction,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import {
  scanAccounts,
  signOperation,
  broadcast,
  sync,
  isInvalidRecipient,
  makeAccountBridgeReceive,
} from "../../../bridge/mockHelpers";

const receive = makeAccountBridgeReceive();
const notCreatedAddresses: string[] = [];

export function addNotCreatedRippleMockAddress(addr: string) {
  notCreatedAddresses.push(addr);
}

const defaultGetFees = (a: Account, t: any) => t.fee || new BigNumber(0);

const createTransaction = (): Transaction => ({
  family: "xrp",
  amount: new BigNumber(0),
  recipient: "",
  fee: new BigNumber(10),
  feeCustomUnit: getCryptoCurrencyById("ripple").units[1],
  tag: undefined,
  networkInfo: null,
  useAllAmount: false,
});

const estimateMaxSpendable = ({ account, parentAccount, transaction }) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const estimatedFees = transaction ? defaultGetFees(mainAccount, transaction) : new BigNumber(10);
  return Promise.resolve(BigNumber.max(0, account.balance.minus(estimatedFees)));
};

const getTransactionStatus = (a, t) => {
  const minimalBaseAmount = 10 ** a.currency.units[0].magnitude * 20;
  const errors: {
    amount?: Error;
    recipient?: Error;
  } = {};
  const warnings: {
    feeTooHigh?: Error;
  } = {};
  const useAllAmount = !!t.useAllAmount;
  const estimatedFees = defaultGetFees(a, t);
  const totalSpent = useAllAmount ? a.balance : new BigNumber(t.amount).plus(estimatedFees);
  const amount = useAllAmount ? a.balance.minus(estimatedFees) : new BigNumber(t.amount);

  if (amount.gt(0) && estimatedFees.times(10).gt(amount)) {
    warnings.feeTooHigh = new FeeTooHigh();
  }

  if (totalSpent.gt(a.balance)) {
    errors.amount = new NotEnoughSpendableBalance("", {
      minimumAmount: formatCurrencyUnit(a.currency.units[0], new BigNumber(minimalBaseAmount), {
        disableRounding: true,
        useGrouping: false,
        showCode: true,
      }),
    });
  } else if (minimalBaseAmount && a.balance.minus(totalSpent).lt(minimalBaseAmount)) {
    errors.amount = new NotEnoughSpendableBalance("", {
      minimumAmount: formatCurrencyUnit(a.currency.units[0], new BigNumber(minimalBaseAmount), {
        disableRounding: true,
        useGrouping: false,
        showCode: true,
      }),
    });
  } else if (
    minimalBaseAmount &&
    (t.recipient.includes("new") || notCreatedAddresses.includes(t.recipient)) &&
    amount.lt(minimalBaseAmount)
  ) {
    // mimic XRP base minimal for new addresses
    errors.amount = new NotEnoughBalanceBecauseDestinationNotCreated("", {
      minimalAmount: `XRP Minimum reserve`,
    });
  }

  if (!t.recipient) {
    errors.recipient = new RecipientRequired("");
  } else if (isInvalidRecipient(t.recipient)) {
    errors.recipient = new InvalidAddress("");
  } else if (a.freshAddress === t.recipient) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  }

  if (!errors.amount && amount.eq(0)) {
    errors.amount = new AmountRequired();
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
  // TODO it needs to set the fee if not in t as well
  if (!t.networkInfo) {
    return {
      ...t,
      networkInfo: {
        family: "xrp",
        serverFee: new BigNumber(10),
        baseReserve: new BigNumber(20),
      },
    };
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
