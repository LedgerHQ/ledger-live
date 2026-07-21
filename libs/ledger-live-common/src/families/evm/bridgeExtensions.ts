import {
  isEditableOperation,
  isStuckOperation,
  getStuckAccountAndOperation,
} from "./editTransaction/operation";
import { getEvmDummyAddress } from "@ledgerhq/coin-evm/constants";
import type { EvmConfigInfo } from "@ledgerhq/coin-evm/config";
import type {
  FeeData,
  Transaction as EvmTransaction,
  TransactionStatus as EvmTransactionStatus,
} from "@ledgerhq/coin-evm/types/index";
import type { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import type { Account, AccountBridgeExtensions, AccountLike } from "@ledgerhq/types-live";
import { getCurrencyConfiguration } from "../../config";
import {
  getEditTransactionPatch,
  getEditTransactionStatus,
  getFormattedFeeFields,
  hasMinimumFundsToCancel,
  hasMinimumFundsToSpeedUp,
  isStrategyDisabled,
  isTransactionConfirmed,
} from "./editTransaction";

function hasGasTracker(currency: CryptoCurrency): boolean {
  const config = getCurrencyConfiguration<EvmConfigInfo>(currency.id);
  return !!config.gasTracker;
}

const extensions: AccountBridgeExtensions<EvmTransaction> = {
  getEstimationRecipient: account => getEvmDummyAddress(account.currency.id),
  isEditableOperation: (account: Account, operation) =>
    isEditableOperation(account, operation, hasGasTracker),
  isStuckOperation,
  getStuckAccountAndOperation: (account: AccountLike, parentAccount) =>
    getStuckAccountAndOperation(account, parentAccount, hasGasTracker),
  getEditTransactionPatch,
  getEditTransactionStatus: args =>
    getEditTransactionStatus({ ...args, status: args.status as EvmTransactionStatus }),
  getFormattedFeeFields,
  hasMinimumFundsToCancel,
  hasMinimumFundsToSpeedUp,
  isStrategyDisabled: args => isStrategyDisabled({ ...args, feeData: args.feeData as FeeData }),
  isTransactionConfirmed,
};

export default extensions;
