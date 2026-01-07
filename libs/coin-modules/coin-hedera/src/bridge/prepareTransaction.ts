import BigNumber from "bignumber.js";
import { findSubAccountById } from "@ledgerhq/coin-framework/account/helpers";
import { getEnv } from "@ledgerhq/live-env";
import type { AccountBridge } from "@ledgerhq/types-live";
import {
  HEDERA_OPERATION_TYPES,
  HEDERA_TRANSACTION_MODES,
  MAP_STAKING_MODE_TO_MEMO,
} from "../constants";
import { estimateFees } from "../logic/estimateFees";
import { isTokenAssociateTransaction, isStakingTransaction } from "../logic/utils";
import type { EstimateFeesParams, Transaction } from "../types";
import { calculateAmount } from "./utils";

/**
 * Gather any more neccessary information for a transaction,
 * potentially from a network.
 *
 * Hedera has fully client-side transactions and the fee
 * is not possible to estimate ahead-of-time.
 *
 */
export const prepareTransaction: AccountBridge<Transaction>["prepareTransaction"] = async (
  account,
  transaction,
): Promise<Transaction> => {
  let estimateFeesParams: EstimateFeesParams;
  let operationType: HEDERA_OPERATION_TYPES;
  const subAccount = findSubAccountById(account, transaction?.subAccountId || "");
  const isHTSTokenTransaction =
    transaction.mode === HEDERA_TRANSACTION_MODES.Send && subAccount?.token.tokenType === "hts";
  const isERC20TokenTransaction =
    transaction.mode === HEDERA_TRANSACTION_MODES.Send && subAccount?.token.tokenType === "erc20";

  if (isTokenAssociateTransaction(transaction)) {
    operationType = HEDERA_OPERATION_TYPES.TokenAssociate;
  } else if (isHTSTokenTransaction) {
    operationType = HEDERA_OPERATION_TYPES.TokenTransfer;
  } else if (isERC20TokenTransaction) {
    operationType = HEDERA_OPERATION_TYPES.ContractCall;
  } else if (isStakingTransaction(transaction)) {
    operationType = HEDERA_OPERATION_TYPES.CryptoUpdate;
  } else {
    operationType = HEDERA_OPERATION_TYPES.CryptoTransfer;
  }

  // build different estimation params for ERC20 ContractCall transactions
  if (operationType === HEDERA_OPERATION_TYPES.ContractCall) {
    estimateFeesParams = {
      operationType,
      txIntent: {
        intentType: "transaction",
        type: HEDERA_TRANSACTION_MODES.Send,
        asset: {
          type: "erc20",
          assetReference: subAccount?.token.contractAddress ?? "",
          assetOwner: account.freshAddress,
        },
        amount: BigInt(transaction.amount.toString()),
        sender: account.freshAddress,
        recipient: transaction.recipient,
      },
    };
  } else {
    estimateFeesParams = {
      currency: account.currency,
      operationType,
    };
  }

  // explicitly calculate transaction amount to account for `useAllAmount` flag (send max flow)
  // i.e. if `useAllAmount` has been toggled to true, this is where it will update the transaction to reflect that action
  const [calculatedAmount, estimatedFees] = await Promise.all([
    calculateAmount({ account, transaction }),
    estimateFees(estimateFeesParams),
  ]);

  transaction.amount = calculatedAmount.amount;

  // `maxFee` must be explicitly set to avoid the @hashgraph/sdk default fallback
  // this ensures device app validation passes (e.g. during swap flow)
  // it's applied via `tx.setMaxTransactionFee` when building the transaction
  transaction.maxFee = estimatedFees.tinybars;

  // ERC20 transactions should have gas limit set (tinybars fee is calculated based on gas)
  if (isERC20TokenTransaction && estimatedFees.gas) {
    transaction.gasLimit = estimatedFees.gas;
  }

  if (isStakingTransaction(transaction)) {
    transaction.memo = MAP_STAKING_MODE_TO_MEMO[transaction.mode];

    // claiming staking rewards is triggered by sending 1 tinybar to staking reward account
    if (transaction.mode === HEDERA_TRANSACTION_MODES.ClaimRewards) {
      transaction.recipient = getEnv("HEDERA_CLAIM_REWARDS_RECIPIENT_ACCOUNT_ID");
      transaction.amount = new BigNumber(1);
    }
  }

  return transaction;
};
