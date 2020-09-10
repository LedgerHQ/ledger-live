// @flow
import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import {
  AmountRequired,
  NotEnoughBalance,
  FeeNotLoaded,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughSpendableBalance,
  NotEnoughBalanceBecauseDestinationNotCreated,
} from "@ledgerhq/errors";
import {
  StellarWrongMemoFormat,
  SourceHasMultiSign,
  AccountAwaitingSendPendingOperations,
} from "../../../errors";
import { validateRecipient } from "../../../bridge/shared";
import type { AccountBridge, CurrencyBridge, Account } from "../../../types";
import type { Transaction } from "../types";
import { scanAccounts } from "../../../libcore/scanAccounts";
import { getAccountNetworkInfo } from "../../../libcore/getAccountNetworkInfo";
import { sync } from "../../../libcore/syncAccount";
import broadcast from "../libcore-broadcast";
import signOperation from "../libcore-signOperation";
import { withLibcore } from "../../../libcore/access";
import type { CacheRes } from "../../../cache";
import { makeLRUCache } from "../../../cache";
import { getWalletName } from "../../../account";
import { getOrCreateWallet } from "../../../libcore/getOrCreateWallet";
import { getCoreAccount } from "../../../libcore/getCoreAccount";
import { getMainAccount } from "../../../account";
import { formatCurrencyUnit } from "../../../currencies";
import { notCreatedStellarMockAddress } from "../test-dataset";
import { makeAccountBridgeReceive } from "../../../bridge/jsHelpers";

const receive = makeAccountBridgeReceive();

export const checkRecipientExist: CacheRes<
  Array<{ account: Account, recipient: string }>,
  boolean
> = makeLRUCache(
  ({ account, recipient }) =>
    withLibcore(async (core) => {
      const { derivationMode, currency } = account;

      const walletName = getWalletName(account);

      const coreWallet = await getOrCreateWallet({
        core,
        walletName,
        currency,
        derivationMode,
      });

      const stellarLikeWallet = await coreWallet.asStellarLikeWallet();
      const recipientExist = await stellarLikeWallet.exists(recipient);
      return recipientExist;
    }),
  (extract) => extract.recipient,
  { max: 300, maxAge: 5 * 60 } // 5 minutes
);

const createTransaction = () => ({
  family: "stellar",
  amount: BigNumber(0),
  baseReserve: null,
  networkInfo: null,
  fees: null,
  recipient: "",
  memoValue: null,
  memoType: null,
  useAllAmount: false,
});

const updateTransaction = (t, patch) => ({ ...t, ...patch });

const isMemoValid = (memoType: string, memoValue: string): boolean => {
  switch (memoType) {
    case "MEMO_TEXT":
      if (memoValue.length > 28) {
        return false;
      }
      break;

    case "MEMO_ID":
      if (BigNumber(memoValue.toString()).isNaN()) {
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

const isAccountIsMultiSign = async (account) =>
  withLibcore(async (core) => {
    const { coreAccount } = await getCoreAccount(core, account);

    const stellarLikeAccount = await coreAccount.asStellarLikeAccount();
    const signers = await stellarLikeAccount.getSigners();

    return signers.length > 1;
  });

const getTransactionStatus = async (a: Account, t) => {
  const errors = {};
  const warnings = {};
  const useAllAmount = !!t.useAllAmount;

  if (a.pendingOperations.length > 0) {
    throw new AccountAwaitingSendPendingOperations();
  }

  if (a.freshAddress === t.recipient) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  } else {
    const { recipientError, recipientWarning } = await validateRecipient(
      a.currency,
      t.recipient
    );

    if (recipientError) {
      errors.recipient = recipientError;
    }

    if (recipientWarning) {
      warnings.recipient = recipientWarning;
    }
  }

  if (await isAccountIsMultiSign(a)) {
    errors.recipient = new SourceHasMultiSign("", {
      currencyName: a.currency.name,
    });
  }

  if (!t.fees || !t.baseReserve) {
    errors.fees = new FeeNotLoaded();
  }

  let estimatedFees = !t.fees ? BigNumber(0) : t.fees;
  let baseReserve = !t.baseReserve ? BigNumber(0) : t.baseReserve;

  let amount = !useAllAmount
    ? t.amount
    : a.balance.minus(baseReserve).minus(estimatedFees);
  let totalSpent = !useAllAmount
    ? amount.plus(estimatedFees)
    : a.balance.minus(baseReserve);

  if (totalSpent.gt(a.balance.minus(baseReserve))) {
    errors.amount = new NotEnoughSpendableBalance(null, {
      minimumAmount: formatCurrencyUnit(a.currency.units[0], baseReserve, {
        disableRounding: true,
        useGrouping: false,
        showCode: true,
      }),
    });
  }

  if (
    !errors.amount &&
    amount.plus(estimatedFees).plus(baseReserve).gt(a.balance)
  ) {
    errors.amount = new NotEnoughBalance();
  }

  if (
    !errors.recipient &&
    !errors.amount &&
    (amount.lt(0) || totalSpent.gt(a.balance))
  ) {
    errors.amount = new NotEnoughBalance();
    totalSpent = BigNumber(0);
    amount = BigNumber(0);
  }

  if (!errors.amount && amount.eq(0)) {
    errors.amount = new AmountRequired();
  }

  // if amount < 1.0 you can't
  if (
    t.recipient &&
    !errors.amount &&
    !(await checkRecipientExist({ account: a, recipient: t.recipient })) &&
    amount.lt(10000000)
  ) {
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
  const networkInfo = t.networkInfo || (await getAccountNetworkInfo(a));
  invariant(networkInfo.family === "stellar", "stellar networkInfo expected");

  const fees = t.fees || networkInfo.fees;
  const baseReserve = t.baseReserve || networkInfo.baseReserve;

  if (
    t.networkInfo !== networkInfo ||
    t.fees !== fees ||
    t.baseReserve !== baseReserve
  ) {
    return {
      ...t,
      networkInfo,
      fees,
      baseReserve,
    };
  }

  return t;
};

const estimateMaxSpendable = async ({
  account,
  parentAccount,
  transaction,
}) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const t = await prepareTransaction(mainAccount, {
    ...createTransaction(),
    ...transaction,
    recipient: transaction?.recipient || notCreatedStellarMockAddress, // not used address
    useAllAmount: true,
  });
  const s = await getTransactionStatus(mainAccount, t);
  return s.amount;
};

const preload = async () => {};

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
};

export default { currencyBridge, accountBridge };
