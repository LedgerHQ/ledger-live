// @flow
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import {
  AmountRequired,
  FeeNotLoaded,
  FeeRequired,
  FeeTooHigh,
  GasLessThanEstimate
} from "@ledgerhq/errors";
import type { Account, AccountLike } from "../../../types";
import type { AccountBridge, CurrencyBridge } from "../../../types/bridge";
import { scanAccounts } from "../../../libcore/scanAccounts";
import { getMainAccount } from "../../../account";
import { getAccountNetworkInfo } from "../../../libcore/getAccountNetworkInfo";
import { withLibcore } from "../../../libcore/access";
import { getGasLimit } from "../transaction";
import { getCoreAccount } from "../../../libcore/getCoreAccount";
import { sync } from "../../../libcore/syncAccount";
import { getFeesForTransaction } from "../../../libcore/getFeesForTransaction";
import { libcoreBigIntToBigNumber } from "../../../libcore/buildBigNumber";
import { makeLRUCache } from "../../../cache";
import { validateRecipient } from "../../../bridge/shared";
import type { Transaction } from "../types";
import signOperation from "../libcore-signOperation";
import broadcast from "../libcore-broadcast";

const getTransactionAccount = (a, t): AccountLike => {
  const { subAccountId } = t;
  return subAccountId
    ? (a.subAccounts || []).find(ta => ta.id === subAccountId) || a
    : a;
};

const createTransaction = a => ({
  family: "ethereum",
  amount: BigNumber(0),
  recipient: "",
  gasPrice: null,
  userGasLimit: null,
  estimatedGasLimit: null,
  networkInfo: null,
  feeCustomUnit: a.currency.units[1] || a.currency.units[0],
  useAllAmount: false
});

const updateTransaction = (t, patch) => {
  if ("recipient" in patch && patch.recipient !== t.recipient) {
    return { ...t, ...patch, userGasLimit: null, estimatedGasLimit: null };
  }
  return { ...t, ...patch };
};

const calculateFees = makeLRUCache(
  async (a, t) => {
    return getFeesForTransaction({
      account: a,
      transaction: t
    });
  },
  (a, t) =>
    `${a.id}_${a.blockHeight || 0}_${t.amount.toString()}_${
      t.recipient
    }_${getGasLimit(t).toString()}_${t.gasPrice ? t.gasPrice.toString() : ""}`
);

const getTransactionStatus = async (a, t) => {
  const errors = {};
  const warnings = {};
  const tokenAccount = !t.subAccountId
    ? null
    : a.subAccounts && a.subAccounts.find(ta => ta.id === t.subAccountId);
  const account = tokenAccount || a;

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
  const gasLimit = getGasLimit(t);

  if (!t.gasPrice) {
    errors.gasPrice = new FeeNotLoaded();
  } else if (gasLimit.eq(0)) {
    errors.gasLimit = new FeeRequired();
  } else if (!errors.recipient) {
    await calculateFees(a, t).then(
      res => {
        estimatedFees = res.estimatedFees;
      },
      error => {
        if (error.name === "NotEnoughBalance") {
          errors.amount = error;
        } else if (error.name === "NotEnoughGas") {
          errors.gasPrice = error;
        } else {
          throw error;
        }
      }
    );
  }

  if (t.estimatedGasLimit && gasLimit.lt(t.estimatedGasLimit)) {
    warnings.gasLimit = new GasLessThanEstimate();
  }

  const totalSpent = useAllAmount
    ? account.balance
    : tokenAccount
    ? BigNumber(t.amount || 0)
    : BigNumber(t.amount || 0).plus(estimatedFees);

  const amount = useAllAmount
    ? tokenAccount
      ? tokenAccount.balance
      : account.balance.minus(estimatedFees)
    : BigNumber(t.amount || 0);

  if (!tokenAccount && amount.gt(0) && estimatedFees.times(10).gt(amount)) {
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

const estimateGasLimitForERC20 = makeLRUCache(
  (account: Account, addr: string) =>
    withLibcore(async core => {
      const { coreAccount } = await getCoreAccount(core, account);
      const ethereumLikeAccount = await coreAccount.asEthereumLikeAccount();
      const r = await ethereumLikeAccount.getEstimatedGasLimit(addr);
      const bn = await libcoreBigIntToBigNumber(r);
      return bn;
    }),
  (a, addr) => a.id + "|" + addr
);

const prepareTransaction = async (a, t: Transaction): Promise<Transaction> => {
  const tAccount = getTransactionAccount(a, t);
  let networkInfo = t.networkInfo;
  if (!networkInfo) {
    const ni = await getAccountNetworkInfo(a);
    invariant(ni.family === "ethereum", "ethereum networkInfo expected");
    networkInfo = ni;
  }

  let estimatedGasLimit;
  if (tAccount.type === "TokenAccount") {
    estimatedGasLimit = await estimateGasLimitForERC20(
      a,
      tAccount.token.contractAddress
    );
  } else if (t.recipient) {
    const { recipientError } = await validateRecipient(a.currency, t.recipient);
    if (!recipientError) {
      estimatedGasLimit = await estimateGasLimitForERC20(a, t.recipient);
    }
  }
  if (
    estimatedGasLimit &&
    t.estimatedGasLimit &&
    t.estimatedGasLimit.eq(estimatedGasLimit)
  ) {
    estimatedGasLimit = t.estimatedGasLimit;
  }

  const gasPrice = t.gasPrice || networkInfo.gasPrice;

  if (
    t.gasPrice !== gasPrice ||
    t.estimatedGasLimit !== estimatedGasLimit ||
    t.networkInfo !== networkInfo
  ) {
    return { ...t, networkInfo, estimatedGasLimit, gasPrice };
  }

  return t;
};

const estimateMaxSpendable = async ({
  account,
  parentAccount,
  transaction
}) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const t = await prepareTransaction(mainAccount, {
    ...createTransaction(mainAccount),
    subAccountId: account.type === "Account" ? null : account.id,
    ...transaction,
    useAllAmount: true,
    recipient: "0x0000000000000000000000000000000000000000"
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
  signOperation,
  broadcast
};

const currencyBridge: CurrencyBridge = {
  preload: () => Promise.resolve(),
  hydrate: () => {},
  scanAccounts
};

export default { currencyBridge, accountBridge };
