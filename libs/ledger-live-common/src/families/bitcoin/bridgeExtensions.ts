import {
  isEditableOperation,
  isStuckOperation,
  getStuckAccountAndOperation,
} from "./editTransaction/operation";
import type {
  Transaction as BitcoinTransaction,
  TransactionStatus as BitcoinTransactionStatus,
} from "@ledgerhq/coin-bitcoin/types";
import type { AccountBridgeExtensions, Account, AccountLike } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { defaultClearAccount } from "../../bridge/defaultBridgeExtensions";
import { clearAccount as bitcoinClearAccount } from "./clearAccount";
import {
  getEditTransactionPatch,
  getEditTransactionStatus,
  getFormattedFeeFields,
  hasMinimumFundsToCancel,
  hasMinimumFundsToSpeedUp,
  isStrategyDisabled,
  isTransactionConfirmed,
} from "./editTransaction";

const extensions: AccountBridgeExtensions<BitcoinTransaction> = {
  clearAccount: <A extends AccountLike>(account: A): A =>
    defaultClearAccount(account, bitcoinClearAccount as (account: Account) => void),
  isEditableOperation,
  isStuckOperation,
  getStuckAccountAndOperation,
  getEditTransactionPatch,
  getEditTransactionStatus: args =>
    getEditTransactionStatus({ ...args, status: args.status as BitcoinTransactionStatus }),
  getFormattedFeeFields,
  hasMinimumFundsToCancel,
  hasMinimumFundsToSpeedUp,
  isStrategyDisabled: ({ transaction, feeData }) =>
    isStrategyDisabled({ transaction, feesStrategy: feeData as BigNumber }),
  isTransactionConfirmed,
};

export default extensions;
