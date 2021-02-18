// @flow
import { getAbandonSeedAddress } from "@ledgerhq/cryptoassets";
import { log } from "@ledgerhq/logs";
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import {
  AmountRequired,
  FeeNotLoaded,
  FeeRequired,
  FeeTooHigh,
  NotEnoughBalance,
} from "@ledgerhq/errors";
import { LowerThanMinimumRelayFee } from "../../../errors";
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
import { getMinRelayFee } from "../fees";
import { isChangeOutput, perCoinLogic } from "../transaction";
import { makeAccountBridgeReceive } from "../../../bridge/jsHelpers";
import { requiresSatStackReady } from "../satstack";

const receive = makeAccountBridgeReceive({
  injectGetAddressParams: (account) => {
    const perCoin = perCoinLogic[account.currency.id];
    if (perCoin && perCoin.injectGetAddressParams) {
      return perCoin.injectGetAddressParams(account);
    }
  },
});

const calculateFees = makeLRUCache(
  async (a, t) => {
    return getFeesForTransaction({
      account: a,
      transaction: t,
    });
  },
  (a, t) =>
    `${a.id}_${a.blockHeight || 0}_${t.amount.toString()}_${String(
      t.useAllAmount
    )}_${t.recipient}_${t.feePerByte ? t.feePerByte.toString() : ""}_${
      t.utxoStrategy.pickUnconfirmedRBF ? 1 : 0
    }_${t.utxoStrategy.strategy}_${String(
      t.rbf
    )}_${t.utxoStrategy.excludeUTXOs
      .map(({ hash, outputIndex }) => `${hash}@${outputIndex}`)
      .join("+")}`
);

const createTransaction = () => ({
  family: "bitcoin",
  amount: BigNumber(0),
  utxoStrategy: {
    strategy: 0,
    pickUnconfirmedRBF: false,
    excludeUTXOs: [],
  },
  recipient: "",
  rbf: false,
  feePerByte: null,
  networkInfo: null,
  useAllAmount: false,
});

const updateTransaction = (t, patch) => {
  const updatedT = { ...t, ...patch };
  if (updatedT.recipient.toLowerCase().indexOf("bc1") === 0) {
    updatedT.recipient = updatedT.recipient.toLowerCase();
  }
  return updatedT;
};

const estimateMaxSpendable = async ({
  account,
  parentAccount,
  transaction,
}) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const t = await prepareTransaction(mainAccount, {
    // worse case scenario using a legacy address
    ...createTransaction(),
    ...transaction,
    recipient:
      transaction?.recipient || getAbandonSeedAddress(mainAccount.currency.id),
    useAllAmount: true,
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

  let txInputs;
  let txOutputs;
  let estimatedFees = BigNumber(0);
  if (!t.feePerByte) {
    errors.feePerByte = new FeeNotLoaded();
  } else if (t.feePerByte.eq(0)) {
    errors.feePerByte = new FeeRequired();
  } else if (!errors.recipient) {
    await calculateFees(a, t).then(
      (res) => {
        txInputs = res.txInputs;
        txOutputs = res.txOutputs;
        estimatedFees = res.estimatedFees;
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

  const sumOfInputs = (txInputs || []).reduce(
    (sum, input) => sum.plus(input.value),
    BigNumber(0)
  );
  const sumOfChanges = (txOutputs || [])
    .filter(isChangeOutput)
    .reduce((sum, output) => sum.plus(output.value), BigNumber(0));

  if (txInputs) {
    log("bitcoin", `${txInputs.length} inputs, sum: ${sumOfInputs.toString()}`);
  }

  if (txOutputs) {
    log(
      "bitcoin",
      `${txOutputs.length} outputs, sum of changes: ${sumOfChanges.toString()}`
    );
  }

  const totalSpent = sumOfInputs.minus(sumOfChanges);
  const amount = useAllAmount ? totalSpent.minus(estimatedFees) : t.amount;

  log(
    "bitcoin",
    `totalSpent ${totalSpent.toString()} amount ${amount.toString()}`
  );

  if (!errors.amount && !amount.gt(0)) {
    errors.amount = useAllAmount
      ? new NotEnoughBalance()
      : new AmountRequired();
  }

  if (
    process.env.EXPERIMENTAL_MIN_RELAY_FEE &&
    estimatedFees.gt(0) &&
    estimatedFees.lt(getMinRelayFee(a.currency))
  ) {
    warnings.feePerByte = new LowerThanMinimumRelayFee();
  } else if (amount.gt(0) && estimatedFees.times(10).gt(amount)) {
    warnings.feeTooHigh = new FeeTooHigh();
  }

  return Promise.resolve({
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
    txInputs,
    txOutputs,
  });
};

const prepareTransaction = async (
  a: Account,
  t: Transaction
): Promise<Transaction> => {
  if (a.currency.id === "bitcoin") {
    await requiresSatStackReady();
  }
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
    feePerByte,
  };
};

const currencyBridge: CurrencyBridge = {
  scanAccounts,
  preload: () => Promise.resolve(),
  hydrate: () => {},
};

const accountBridge: AccountBridge<Transaction> = {
  estimateMaxSpendable,
  createTransaction,
  updateTransaction,
  prepareTransaction,
  getTransactionStatus,
  receive,
  sync,
  signOperation,
  broadcast,
};

export default { currencyBridge, accountBridge };
