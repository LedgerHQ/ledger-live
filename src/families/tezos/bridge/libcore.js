// @flow
import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import {
  NotEnoughBalance,
  FeeNotLoaded,
  FeeTooHigh,
  InvalidAddressBecauseDestinationIsAlsoSource
} from "@ledgerhq/errors";
import { validateRecipient } from "../../../bridge/shared";
import type { Account, AccountBridge, CurrencyBridge } from "../../../types";
import type { Transaction } from "../types";
import { scanAccountsOnDevice } from "../../../libcore/scanAccountsOnDevice";
import { getAccountNetworkInfo } from "../../../libcore/getAccountNetworkInfo";
import { syncAccount } from "../../../libcore/syncAccount";
import { getFeesForTransaction } from "../../../libcore/getFeesForTransaction";
import libcoreSignAndBroadcast from "../../../libcore/signAndBroadcast";
import { inferDeprecatedMethods } from "../../../bridge/deprecationUtils";
import { makeLRUCache } from "../../../cache";
import { withLibcore } from "../../../libcore/access";
import { libcoreBigIntToBigNumber } from "../../../libcore/buildBigNumber";
import { getCoreAccount } from "../../../libcore/getCoreAccount";

type EstimateGasLimitAndStorage = (
  Account,
  string
) => Promise<{ gasLimit: BigNumber, storage: BigNumber }>;
export const estimateGasLimitAndStorage: EstimateGasLimitAndStorage = makeLRUCache(
  (account, addr) =>
    withLibcore(async core => {
      const { coreAccount } = await getCoreAccount(core, account);
      const tezosLikeAccount = await coreAccount.asTezosLikeAccount();
      const gasLimit = await libcoreBigIntToBigNumber(
        await tezosLikeAccount.getEstimatedGasLimit(addr)
      );
      const storage = await libcoreBigIntToBigNumber(
        await tezosLikeAccount.getStorage(addr)
      );
      return { gasLimit, storage };
    }),
  (a, addr) => a.id + "|" + addr
);

const calculateFees = makeLRUCache(
  async (a, t) => {
    return getFeesForTransaction({
      account: a,
      transaction: t
    });
  },
  (a, t) =>
    `${a.id}_${t.amount.toString()}_${t.recipient}_${
      t.gasLimit ? t.gasLimit.toString() : ""
    }_${t.fees ? t.fees.toString() : ""}_${
      t.storageLimit ? t.storageLimit.toString() : ""
    }`
);

const startSync = (initialAccount, _observation) => syncAccount(initialAccount);

const createTransaction = () => ({
  family: "tezos",
  mode: "send",
  amount: BigNumber(0),
  fees: null,
  gasLimit: null,
  storageLimit: null,
  recipient: "",
  networkInfo: null
  // Problem with send max feature
  // useAllAmount: false
});

const updateTransaction = (t, patch) => ({ ...t, ...patch });

const signAndBroadcast = (account, transaction, deviceId) =>
  libcoreSignAndBroadcast({
    account,
    transaction,
    deviceId
  });

const getTransactionStatus = async (a, t) => {
  const errors = {};
  const warnings = {};
  const subAcc = !t.subAccountId
    ? null
    : a.subAccounts && a.subAccounts.find(ta => ta.id === t.subAccountId);

  const account = subAcc || a;

  if (account.freshAddress === t.recipient) {
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

  let estimatedFees = BigNumber(0);
  if (!t.fees) {
    errors.fees = new FeeNotLoaded();
  } else if (!errors.recipient) {
    await calculateFees(a, t).then(
      f => {
        estimatedFees = f;
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

  let totalSpent = !t.useAllAmount
    ? t.amount.plus(estimatedFees)
    : account.balance;

  let amount = t.useAllAmount ? account.balance.minus(estimatedFees) : t.amount;

  if (
    !errors.recipient &&
    !errors.amount &&
    (amount.lt(0) || totalSpent.gt(account.balance))
  ) {
    errors.amount = new NotEnoughBalance();
    totalSpent = BigNumber(0);
    amount = BigNumber(0);
  }

  if (amount.gt(0) && estimatedFees.times(10).gt(amount)) {
    warnings.feeTooHigh = new FeeTooHigh();
  }

  return Promise.resolve({
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent
  });
};

const prepareTransaction = async (a, t) => {
  let networkInfo = t.networkInfo;
  if (!networkInfo) {
    const ni = await getAccountNetworkInfo(a);
    invariant(ni.family === "tezos", "tezos networkInfo expected");
    networkInfo = ni;
  }

  let gasLimit = t.gasLimit;
  let storageLimit = t.storageLimit;
  if ((!gasLimit || !storageLimit) && t.recipient) {
    const { recipientError } = await validateRecipient(a.currency, t.recipient);
    if (!recipientError) {
      const r = await estimateGasLimitAndStorage(a, t.recipient);
      gasLimit = r.gasLimit;
      storageLimit = r.storage;
    }
  }

  let fees = t.fees || networkInfo.fees;

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

const currencyBridge: CurrencyBridge = {
  scanAccountsOnDevice
};

const getCapabilities = () => ({
  canSync: true,
  canSend: true
});

const accountBridge: AccountBridge<Transaction> = {
  createTransaction,
  updateTransaction,
  prepareTransaction,
  getTransactionStatus,
  startSync,
  signAndBroadcast,
  getCapabilities,
  ...inferDeprecatedMethods({
    name: "LibcoreTezosAccountBridge",
    createTransaction,
    getTransactionStatus,
    prepareTransaction
  })
};

export default { currencyBridge, accountBridge };
