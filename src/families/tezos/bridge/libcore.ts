import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import {
  AmountRequired,
  NotEnoughBalance,
  NotEnoughBalanceToDelegate,
  NotEnoughBalanceInParentAccount,
  FeeNotLoaded,
  FeeTooHigh,
  NotSupportedLegacyAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  RecommendSubAccountsToEmpty,
  RecommendUndelegation,
} from "@ledgerhq/errors";
import { validateRecipient } from "../../../bridge/shared";
import type { Account, AccountBridge, CurrencyBridge } from "../../../types";
import type { Transaction } from "../types";
import { scanAccounts } from "../../../libcore/scanAccounts";
import { getAccountNetworkInfo } from "../../../libcore/getAccountNetworkInfo";
import { sync } from "../../../libcore/syncAccount";
import { getFeesForTransaction } from "../../../libcore/getFeesForTransaction";
import broadcast from "../libcore-broadcast";
import signOperation from "../libcore-signOperation";
import { makeLRUCache } from "../../../cache";
import { isAccountBalanceSignificant, getMainAccount } from "../../../account";
import { withLibcore } from "../../../libcore/access";
import { libcoreBigIntToBigNumber } from "../../../libcore/buildBigNumber";
import { getCoreAccount } from "../../../libcore/getCoreAccount";
import { fetchAllBakers, hydrateBakers, isAccountDelegating } from "../bakers";
import { getEnv } from "../../../env";
import { makeAccountBridgeReceive } from "../../../bridge/jsHelpers";

const receive = makeAccountBridgeReceive();

type EstimateGasLimitAndStorage = (
  arg0: Account,
  arg1: string
) => Promise<{
  gasLimit: BigNumber;
  storage: BigNumber;
}>;

export const estimateGasLimitAndStorage: EstimateGasLimitAndStorage =
  makeLRUCache(
    (account, addr) =>
      withLibcore(async (core) => {
        const { coreAccount } = await getCoreAccount(core, account);
        const tezosLikeAccount = await coreAccount.asTezosLikeAccount();
        const gasLimit = await libcoreBigIntToBigNumber(
          await tezosLikeAccount.getEstimatedGasLimit(addr)
        );
        // for babylon network 257 is the current cost of sending to new account.
        const storage = new BigNumber(257);

        /*
  const storage = await libcoreBigIntToBigNumber(
    await tezosLikeAccount.getStorage(addr)
  );
  */
        return {
          gasLimit,
          storage,
        };
      }),
    (a, addr) => a.id + "|" + addr
  );
const calculateFees = makeLRUCache(
  async (a, t) => {
    return getFeesForTransaction({
      account: a,
      transaction: t,
    });
  },
  (a, t) =>
    `${a.id}_${t.amount.toString()}_${t.recipient}_${
      t.gasLimit ? t.gasLimit.toString() : ""
    }_${t.fees ? t.fees.toString() : ""}_${
      t.storageLimit ? t.storageLimit.toString() : ""
    }_${String(t.useAllAmount)}_${String(t.subAccountId)}`
);

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

const updateTransaction = (t, patch) => ({ ...t, ...patch });

const getTransactionStatus = async (a, t) => {
  const errors: {
    recipient?: Error;
    amount?: Error;
    fees?: Error;
  } = {};
  const warnings: {
    amount?: Error;
    feeTooHigh?: Error;
    recipient?: Error;
  } = {};
  const subAcc = !t.subAccountId
    ? null
    : a.subAccounts && a.subAccounts.find((ta) => ta.id === t.subAccountId);
  invariant(
    t.mode === "send" || !subAcc,
    "delegation features not supported for sub accounts"
  );
  const account = subAcc || a;

  if (t.mode !== "undelegate") {
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
  }

  if (
    !getEnv("LEGACY_KT_SUPPORT_TO_YOUR_OWN_RISK") &&
    t.recipient.startsWith("KT") &&
    !errors.recipient
  ) {
    errors.recipient = new NotSupportedLegacyAddress();
  }

  let estimatedFees = new BigNumber(0);
  let amount = t.amount;

  if (!t.fees) {
    errors.fees = new FeeNotLoaded();
  } else if (!errors.recipient) {
    await calculateFees(a, t).then(
      (res) => {
        estimatedFees = res.estimatedFees;
        amount = res.value;
      },
      (error) => {
        if (error.name === "NotEnoughBalance") {
          errors.amount = error;
        } else {
          throw error;
        }
      }
    );
  }

  if (!errors.amount && subAcc && estimatedFees.gt(a.balance)) {
    errors.amount = new NotEnoughBalanceInParentAccount();
  }

  let totalSpent = !t.useAllAmount
    ? t.amount.plus(estimatedFees)
    : account.balance;

  if (
    !errors.recipient &&
    !errors.amount &&
    (amount.lt(0) || totalSpent.gt(account.balance))
  ) {
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

    if (
      !subAcc &&
      !errors.amount &&
      account.balance.minus(totalSpent).lt(thresholdWarning)
    ) {
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
    const ni = await getAccountNetworkInfo(a);
    invariant(ni.family === "tezos", "tezos networkInfo expected");
    networkInfo = ni;
  }

  let gasLimit = t.gasLimit;
  let storageLimit = t.storageLimit;

  if (!gasLimit || !storageLimit) {
    const { recipientError } =
      t.mode === "undelegate"
        ? { recipientError: undefined }
        : await validateRecipient(a.currency, t.recipient);

    if (!recipientError) {
      const r = await estimateGasLimitAndStorage(a, t.recipient);
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

const estimateMaxSpendable = async ({
  account,
  parentAccount,
  transaction,
}) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const t = await prepareTransaction(mainAccount, {
    ...createTransaction(),
    subAccountId: account.type === "Account" ? null : account.id,
    ...transaction,
    // this seed is empty (worse case scenario is to send to new). addr from: 1. eyebrow 2. odor 3. rice 4. attack 5. loyal 6. tray 7. letter 8. harbor 9. resemble 10. sphere 11. system 12. forward 13. onion 14. buffalo 15. crumble
    recipient: transaction?.recipient || "tz1VJitLYB31fEC82efFkLRU4AQUH9QgH3q6",
    useAllAmount: true,
  });
  const s = await getTransactionStatus(mainAccount, t);
  return s.amount;
};

const preload = async () => {
  const bakers = await fetchAllBakers();
  return {
    bakers,
  };
};

const hydrate = (data: any) => {
  if (!data || typeof data !== "object") return;
  const { bakers } = data;
  if (!bakers || typeof bakers !== "object" || !Array.isArray(bakers)) return;
  hydrateBakers(bakers);
};

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
