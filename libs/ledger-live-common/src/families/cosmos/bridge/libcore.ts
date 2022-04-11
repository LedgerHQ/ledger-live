import { BigNumber } from "bignumber.js";
import { getAbandonSeedAddress } from "@ledgerhq/cryptoassets";
import { scanAccounts } from "../../../libcore/scanAccounts";
import { sync } from "../../../libcore/syncAccount";
import type {
  Account,
  AccountBridge,
  CurrencyBridge,
  CryptoCurrency,
  AccountLike,
} from "../../../types";
import type { CosmosValidatorItem, Transaction } from "../types";
import getTransactionStatus from "../libcore-getTransactionStatus";
import signOperation from "../libcore-signOperation";
import broadcast from "../libcore-broadcast";
import { getMainAccount } from "../../../account";
import { validateRecipient } from "../../../bridge/shared";
import {
  setCosmosPreloadData,
  asSafeCosmosPreloadData,
} from "../preloadedData";
import { getValidators, hydrateValidators } from "../validators";
import { calculateFees, getMaxEstimatedBalance } from "../logic";
import { makeAccountBridgeReceive } from "../../../bridge/jsHelpers";
const receive = makeAccountBridgeReceive();

const createTransaction = (): Transaction => ({
  family: "cosmos",
  mode: "send",
  amount: new BigNumber(0),
  fees: null,
  gas: null,
  recipient: "",
  useAllAmount: false,
  networkInfo: null,
  memo: null,
  cosmosSourceValidator: null,
  validators: [],
});

const updateTransaction = (t, patch) => {
  if ("mode" in patch && patch.mode !== t.mode) {
    return { ...t, ...patch, gas: null, fees: null };
  }

  if (
    "validators" in patch &&
    patch.validators.length !== t.validators.length
  ) {
    return { ...t, ...patch, gas: null, fees: null };
  }

  return { ...t, ...patch };
};

const isTransactionValidForEstimatedFees = async (a, t) => {
  let errors: Error | undefined | null = null;

  if (t.mode === "send" && (t.amount.gt(0) || t.useAllAmount)) {
    errors = (await validateRecipient(a.currency, t.recipient)).recipientError;
  } else {
    errors =
      t.validators.some(
        (v) => !v.address || !v.address.includes("cosmosvaloper")
      ) ||
      (t.mode !== "claimReward" &&
        t.validators
          .reduce((old, current) => old.plus(current.amount), new BigNumber(0))
          .eq(0));
  }

  return errors;
};

const sameFees = (a, b) => (!a || !b ? a === b : a.eq(b));

const prepareTransaction = async (
  a: Account,
  t: Transaction
): Promise<Transaction> => {
  let memo = t.memo;
  let fees = t.fees;
  let gas = t.gas;

  if (t.recipient || t.mode !== "send") {
    const errors = await isTransactionValidForEstimatedFees(a, t);

    if (!errors) {
      let amount;

      if (t.useAllAmount) {
        amount = getMaxEstimatedBalance(a, new BigNumber(0));
      }

      if ((amount && amount.gt(0)) || !amount) {
        const res = await calculateFees({
          a,
          t: { ...t, amount: amount || t.amount },
        });
        fees = res.estimatedFees;
        gas = res.estimatedGas;
      }
    }
  }

  if (t.mode !== "send" && !memo) {
    memo = "Ledger Live";
  }

  if (t.memo !== memo || !sameFees(t.fees, fees)) {
    return { ...t, memo, fees, gas };
  }

  return t;
};

const currencyBridge: CurrencyBridge = {
  preload: async (currency: CryptoCurrency) => {
    const validators = await getValidators(currency);
    setCosmosPreloadData({
      validators,
    });
    return Promise.resolve({
      validators,
    });
  },
  hydrate: (data: { validators?: CosmosValidatorItem[] }) => {
    if (!data || typeof data !== "object") return;
    const { validators } = data;
    if (
      !validators ||
      typeof validators !== "object" ||
      !Array.isArray(validators)
    )
      return;
    hydrateValidators(validators);
    setCosmosPreloadData(asSafeCosmosPreloadData(data));
  },
  scanAccounts,
};

const estimateMaxSpendable = async ({
  account,
  parentAccount,
  transaction,
}: {
  account: AccountLike;
  parentAccount: Account;
  transaction: Transaction;
}): Promise<BigNumber> => {
  const mainAccount = getMainAccount(account, parentAccount);
  const t = await prepareTransaction(mainAccount, {
    ...createTransaction(),
    ...transaction,
    recipient:
      transaction?.recipient || getAbandonSeedAddress(mainAccount.currency.id),
    useAllAmount: true,
  });
  const s = await getTransactionStatus(mainAccount, t);
  return s.amount;
};

const accountBridge: AccountBridge<Transaction> = {
  createTransaction,
  updateTransaction,
  prepareTransaction,
  getTransactionStatus,
  estimateMaxSpendable,
  sync,
  receive,
  signOperation,
  broadcast,
};
export default {
  currencyBridge,
  accountBridge,
};
