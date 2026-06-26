import { BigNumber } from "bignumber.js";
import { InvalidAddress, NotEnoughBalance, RecipientRequired } from "@ledgerhq/errors";
import type { Transaction } from "@ledgerhq/coin-evm/types/index";
import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import { getEvmDummyAddress } from "@ledgerhq/coin-evm/constants";
import { getMainAccount } from "../../../account";
import {
  scanAccounts,
  signOperation,
  signRawOperation,
  broadcast,
  sync,
  makeAccountBridgeReceive,
} from "../../../bridge/mockHelpers";
import {
  getSerializedAddressParameters,
  updateTransaction,
} from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { getGasLimit, isEthAddress } from "@ledgerhq/coin-evm/utils";
import { getTypedTransaction } from "@ledgerhq/coin-evm/transaction";
import { getCurrencyConfiguration } from "../../../config";
import { EvmConfigInfo, setCoinConfig } from "@ledgerhq/coin-evm/config";
import { validateAddress } from "../../../bridge/validateAddress";
import { assignFromAccountRaw, assignToAccountRaw } from "@ledgerhq/coin-evm/staking/serialization";

const receive = makeAccountBridgeReceive();
const defaultGetFees = (_a, t: any) => {
  const gasLimit = getGasLimit(t);
  if (t.type === 2 && t.maxFeePerGas) {
    return t.maxFeePerGas.times(gasLimit);
  }
  return (t.gasPrice || new BigNumber(0)).times(gasLimit);
};

const createTransaction = (): Transaction => ({
  family: "evm",
  mode: "send",
  amount: new BigNumber(10000000000),
  nonce: 0,
  recipient: "",
  gasPrice: new BigNumber(10000000000),
  gasLimit: new BigNumber(21000),
  chainId: 2222,
  useAllAmount: false,
  subAccountId: null,
});

const estimateMaxSpendable = ({ account, parentAccount, transaction }) => {
  if (parentAccount) return Promise.resolve(account.balance);
  const mainAccount = getMainAccount(account, parentAccount);
  let estimatedFees = new BigNumber(1000000000000);
  if (transaction) {
    estimatedFees = defaultGetFees(mainAccount, transaction);
  }
  return Promise.resolve(BigNumber.max(0, account.balance.minus(estimatedFees)));
};

const getTransactionStatus = (account, transaction) => {
  const errors: {
    amount?: Error;
    recipient?: Error;
  } = {};

  const warnings: {
    feeTooHigh?: Error;
    gasLimit?: Error;
  } = {};

  let tokenAccount = null;
  if (transaction.subAccountId) {
    tokenAccount = account.subAccounts?.find(ta => ta.id === transaction.subAccountId);
  }

  const currentAccount = tokenAccount || account;
  const useAllAmount = Boolean(transaction.useAllAmount);
  const estimatedFees = defaultGetFees(account, transaction);

  let totalSpent: BigNumber;
  if (useAllAmount) {
    totalSpent = currentAccount.balance;
  } else if (tokenAccount) {
    totalSpent = new BigNumber(transaction.amount);
  } else {
    totalSpent = new BigNumber(transaction.amount).plus(estimatedFees);
  }

  let amount: BigNumber;
  if (useAllAmount) {
    if (tokenAccount) {
      amount = currentAccount.balance;
    } else {
      amount = currentAccount.balance.minus(estimatedFees);
    }
  } else {
    amount = new BigNumber(transaction.amount);
  }

  // Fill up transaction errors...
  if (totalSpent.gt(currentAccount.balance)) {
    errors.amount = new NotEnoughBalance();
  }
  if (!transaction.recipient) {
    errors.recipient = new RecipientRequired("");
  } else if (!isEthAddress(transaction.recipient)) {
    errors.recipient = new InvalidAddress("", {
      currencyName: account.currency.name,
    });
  }

  return Promise.resolve({
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  });
};

const prepareTransaction = async (_a, t) => {
  if (t.feesStrategy === "custom") {
    return t;
  }

  let gasPrice: BigNumber;
  switch (t.feesStrategy) {
    case "slow":
      gasPrice = new BigNumber(20000000000);
      break;
    case "fast":
      gasPrice = new BigNumber(50000000000);
      break;
    default:
      gasPrice = new BigNumber(30000000000);
      break;
  }
  const nextBaseFee = gasPrice;
  const maxPriorityFeePerGas = gasPrice.div(2);
  return getTypedTransaction(t, {
    gasPrice,
    maxFeePerGas: nextBaseFee.plus(maxPriorityFeePerGas),
    maxPriorityFeePerGas,
    nextBaseFee,
  });
};

let isConfigLoaded = false;
const loadCoinConfig = () => {
  if (!isConfigLoaded) {
    setCoinConfig(currencyId => {
      isConfigLoaded = true;
      return { info: getCurrencyConfiguration<EvmConfigInfo>(currencyId) };
    });
  }
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
  signRawOperation,
  broadcast,
  getSerializedAddressParameters,
  validateAddress,
  getEstimationRecipient: account => getEvmDummyAddress(account.currency.id),
  assignFromAccountRaw,
  assignToAccountRaw,
};
const currencyBridge: CurrencyBridge = {
  preload: () => Promise.resolve({}),
  hydrate: () => {},
  scanAccounts,
};
export default {
  currencyBridge,
  accountBridge,
  loadCoinConfig,
};
