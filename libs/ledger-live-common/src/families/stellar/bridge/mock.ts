import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import {
  AmountRequired,
  NotEnoughBalance,
  FeeNotLoaded,
  RecipientRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalanceBecauseDestinationNotCreated,
  NotEnoughSpendableBalance,
} from "@ledgerhq/errors";
import type { Account, AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import { getSerializedAddressParameters } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import type { Transaction } from "@ledgerhq/coin-stellar/types/index";
import { StellarSourceHasMultiSign, StellarWrongMemoFormat } from "@ledgerhq/coin-stellar/errors";
import { getMainAccount } from "../../../account";
import { formatCurrencyUnit } from "../../../currencies";
import {
  scanAccounts,
  signOperation,
  broadcast,
  sync,
  isInvalidRecipient,
  makeAccountBridgeReceive,
} from "../../../bridge/mockHelpers";

const receive = makeAccountBridgeReceive();

const notCreatedStellarMockAddress = "GAW46JE3SHIAYLNNNQCAZFQ437WB5ZH7LDRDWR5LVDWHCTHCKYB6RCCH";

const multisignStellarMockAddress = "GCDDN6T2LJN3T7SPWJQV6BCCL5KNY5GBN7X4CMSZLDEXDHXAH32TOAHS";

const notCreatedAddresses: string[] = [];
const multiSignAddresses: string[] = [];

export function addNotCreatedStellarMockAddresses(addr: string) {
  notCreatedAddresses.push(addr);
}
export function addMultisignStellarMockAddresses(addr: string) {
  multiSignAddresses.push(addr);
}

addNotCreatedStellarMockAddresses(notCreatedStellarMockAddress);
addMultisignStellarMockAddresses(multisignStellarMockAddress);

const createTransaction = (): Transaction => ({
  family: "stellar",
  amount: new BigNumber(0),
  baseReserve: null,
  networkInfo: null,
  fees: null,
  recipient: "",
  memoValue: null,
  memoType: null,
  useAllAmount: false,
  mode: "send",
  assetCode: "",
  assetIssuer: "",
});

const updateTransaction = (t, patch) => {
  return { ...t, ...patch };
};

const isMemoValid = (memoType: string, memoValue: string): boolean => {
  switch (memoType) {
    case "MEMO_TEXT":
      if (memoValue.length > 28) {
        return false;
      }

      break;

    case "MEMO_ID":
      if (new BigNumber(memoValue.toString()).isNaN()) {
        return false;
      }

      break;

    case "MEMO_HASH":
    case "MEMO_RETURN":
      if (!memoValue.length || memoValue.length !== 32) {
        return false;
      }

      break;
  }

  return true;
};

const getTransactionStatus = async (a: Account, t: Transaction) => {
  const errors: {
    recipient?: Error;
    fees?: Error;
    amount?: Error;
    transaction?: Error;
  } = {};
  const warnings = {};
  const useAllAmount = !!t.useAllAmount;

  if (a.freshAddress === t.recipient) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  } else {
    if (!t.recipient) {
      errors.recipient = new RecipientRequired("");
    } else if (isInvalidRecipient(t.recipient)) {
      errors.recipient = new InvalidAddress("");
    }
  }

  if (multiSignAddresses.includes(a.freshAddress)) {
    errors.recipient = new StellarSourceHasMultiSign("", {
      currencyName: a.currency.name,
    });
  }

  if (!t.fees || !t.baseReserve) {
    errors.fees = new FeeNotLoaded();
  }

  const estimatedFees = !t.fees ? new BigNumber(0) : t.fees;
  const baseReserve = !t.baseReserve ? new BigNumber(0) : t.baseReserve;
  let amount = !useAllAmount ? t.amount : a.balance.minus(baseReserve).minus(estimatedFees);
  let totalSpent = !useAllAmount ? amount.plus(estimatedFees) : a.balance.minus(baseReserve);

  if (totalSpent.gt(a.balance.minus(baseReserve))) {
    errors.amount = new NotEnoughSpendableBalance("", {
      minimumAmount: formatCurrencyUnit(a.currency.units[0], baseReserve, {
        disableRounding: true,
        useGrouping: false,
        showCode: true,
      }),
    });
  }

  if (!errors.amount && amount.plus(estimatedFees).plus(baseReserve).gt(a.balance)) {
    errors.amount = new NotEnoughBalance();
  }

  if (!errors.recipient && !errors.amount && (amount.lt(0) || totalSpent.gt(a.balance))) {
    errors.amount = new NotEnoughBalance();
    totalSpent = new BigNumber(0);
    amount = new BigNumber(0);
  }

  if (!errors.amount && amount.eq(0)) {
    errors.amount = new AmountRequired();
  }

  // if amount < 1.0 you can't
  if (!errors.amount && notCreatedAddresses.includes(t.recipient) && amount.lt(10000000)) {
    errors.amount = new NotEnoughBalanceBecauseDestinationNotCreated("", {
      minimalAmount: "1 XLM",
    });
  }

  if (t.memoType && t.memoValue && !isMemoValid(t.memoType, t.memoValue)) {
    errors.transaction = new StellarWrongMemoFormat();
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
  const networkInfo = t.networkInfo || {
    family: "stellar",
    fees: new BigNumber("100"),
    baseReserve: new BigNumber("100000"),
  };
  invariant(networkInfo.family === "stellar", "stellar networkInfo expected");
  const fees = t.fees || networkInfo.fees;
  const baseReserve = t.baseReserve || networkInfo.baseReserve;

  if (t.networkInfo !== networkInfo || t.fees !== fees || t.baseReserve !== baseReserve) {
    return { ...t, networkInfo, fees, baseReserve };
  }

  return t;
};

const estimateMaxSpendable = async ({ account, parentAccount, transaction }) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const t = await prepareTransaction(mainAccount, {
    ...createTransaction(),
    recipient: notCreatedAddresses[0],
    // not used address
    ...transaction,
    useAllAmount: true,
  });
  const s = await getTransactionStatus(mainAccount, t);
  return s.amount;
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
