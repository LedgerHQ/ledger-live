import {
  isEditableOperation,
  isStuckOperation,
  getStuckAccountAndOperation,
} from "./editTransaction/operation";
import type {
  Transaction as BitcoinTransaction,
  TransactionStatus as BitcoinTransactionStatus,
} from "@ledgerhq/coin-bitcoin/types";
import type { BitcoinCoinConfig } from "@ledgerhq/coin-bitcoin/config";
import { getTransactionCheckPayload } from "@ledgerhq/coin-bitcoin/transactionCheck";
import type { AccountBridgeExtensions, Account, AccountLike } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { defaultClearAccount } from "../../bridge/defaultBridgeExtensions";
import { buildContext } from "../../bridge/generic-coin-framework/api/context";
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

const context = buildContext<BitcoinCoinConfig>("bitcoin");

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
  isStrategyDisabled: ({ mainAccount, transaction, feeData }) =>
    isStrategyDisabled({ mainAccount, transaction, feesStrategy: feeData as BigNumber }),
  isTransactionConfirmed,
  getTransactionCheckPayload: async (account, transaction) =>
    getTransactionCheckPayload(
      await context.config(account.currency.id),
      context.logger,
      account,
      transaction,
    ),
};

export default extensions;
