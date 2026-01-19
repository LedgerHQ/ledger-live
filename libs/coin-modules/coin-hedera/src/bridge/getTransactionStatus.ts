import BigNumber from "bignumber.js";
import invariant from "invariant";
import {
  AmountRequired,
  NotEnoughBalance,
  InvalidAddressBecauseDestinationIsAlsoSource,
  RecipientRequired,
  ClaimRewardsFeesWarning,
} from "@ledgerhq/errors";
import type { Account, AccountBridge, TokenAccount } from "@ledgerhq/types-live";
import { findSubAccountById } from "@ledgerhq/coin-framework/account";
import { getEnv } from "@ledgerhq/live-env";
import { HEDERA_OPERATION_TYPES, HEDERA_TRANSACTION_MODES } from "../constants";
import {
  HederaInsufficientFundsForAssociation,
  HederaRecipientTokenAssociationRequired,
  HederaRecipientTokenAssociationUnverified,
  HederaRecipientEvmAddressVerificationRequired,
  HederaInvalidStakingNodeIdError,
  HederaRedundantStakingNodeIdError,
  HederaNoStakingRewardsError,
  HederaMemoExceededSizeError,
} from "../errors";
import { estimateFees } from "../logic/estimateFees";
import {
  isTokenAssociateTransaction,
  isTokenAssociationRequired,
  getCurrencyToUSDRate,
  checkAccountTokenAssociationStatus,
  safeParseAccountId,
  isStakingTransaction,
} from "../logic/utils";
import { getCurrentHederaPreloadData } from "../preload-data";
import type {
  HederaAccount,
  Transaction,
  TransactionStatus,
  TransactionTokenAssociate,
} from "../types";
import { calculateAmount } from "./utils";
import { validateMemo } from "../logic/validateMemo";

type Errors = Record<string, Error>;
type Warnings = Record<string, Error>;

function validateRecipient(account: Account, recipient: string): Error | null {
  if (!recipient || recipient.length === 0) {
    return new RecipientRequired();
  }

  const [parsingError, parsingResult] = safeParseAccountId(recipient);

  if (parsingError) {
    return parsingError;
  }

  const recipientWithoutChecksum = parsingResult.accountId;

  if (account.freshAddress === recipientWithoutChecksum) {
    return new InvalidAddressBecauseDestinationIsAlsoSource();
  }

  return null;
}

async function handleTokenAssociateTransaction(
  account: Account,
  transaction: TransactionTokenAssociate,
): Promise<TransactionStatus> {
  const errors: Errors = {};
  const warnings: Warnings = {};

  const [usdRate, estimatedFees] = await Promise.all([
    getCurrencyToUSDRate(account.currency),
    estimateFees({
      currency: account.currency,
      operationType: HEDERA_OPERATION_TYPES.TokenAssociate,
    }),
  ]);

  const amount = BigNumber(0);
  const totalSpent = amount.plus(estimatedFees.tinybars);
  const isAssociationFlow = isTokenAssociationRequired(account, transaction.properties.token);

  if (!validateMemo(transaction.memo)) {
    errors.transaction = new HederaMemoExceededSizeError();
  }

  if (isAssociationFlow) {
    const hbarBalance = account.balance.dividedBy(10 ** account.currency.units[0].magnitude);
    const currentWorthInUSD = usdRate ? hbarBalance.multipliedBy(usdRate) : new BigNumber(0);
    const requiredWorthInUSD = getEnv("HEDERA_TOKEN_ASSOCIATION_MIN_USD");

    if (currentWorthInUSD.isLessThan(requiredWorthInUSD)) {
      errors.insufficientAssociateBalance = new HederaInsufficientFundsForAssociation("", {
        requiredWorthInUSD,
      });
    }
  }

  return {
    amount,
    totalSpent,
    estimatedFees: estimatedFees.tinybars,
    errors,
    warnings,
  };
}

async function handleHTSTokenTransaction(
  account: Account,
  subAccount: TokenAccount,
  transaction: Transaction,
): Promise<TransactionStatus> {
  const errors: Errors = {};
  const warnings: Warnings = {};

  const [calculatedAmount, estimatedFees] = await Promise.all([
    calculateAmount({ transaction, account }),
    estimateFees({
      currency: account.currency,
      operationType: HEDERA_OPERATION_TYPES.TokenTransfer,
    }),
  ]);

  const recipientError = validateRecipient(account, transaction.recipient);

  if (recipientError) {
    errors.recipient = recipientError;
  }

  if (!validateMemo(transaction.memo)) {
    errors.transaction = new HederaMemoExceededSizeError();
  }

  if (!errors.recipient) {
    try {
      const hasRecipientTokenAssociated = await checkAccountTokenAssociationStatus(
        transaction.recipient,
        subAccount.token,
      );

      if (!hasRecipientTokenAssociated) {
        warnings.missingAssociation = new HederaRecipientTokenAssociationRequired();
      }
    } catch {
      warnings.unverifiedAssociation = new HederaRecipientTokenAssociationUnverified();
    }
  }

  if (transaction.amount.eq(0)) {
    errors.amount = new AmountRequired();
  }

  if (subAccount.balance.isLessThan(calculatedAmount.totalSpent)) {
    errors.amount = new NotEnoughBalance();
  }

  if (account.balance.isLessThan(estimatedFees.tinybars)) {
    errors.amount = new NotEnoughBalance();
  }

  return {
    amount: calculatedAmount.amount,
    totalSpent: calculatedAmount.totalSpent,
    estimatedFees: estimatedFees.tinybars,
    errors,
    warnings,
  };
}

async function handleERC20TokenTransaction(
  account: Account,
  subAccount: TokenAccount,
  transaction: Transaction,
): Promise<TransactionStatus> {
  const errors: Errors = {};
  const warnings: Warnings = {
    unverifiedEvmAddress: new HederaRecipientEvmAddressVerificationRequired(),
  };

  const [calculatedAmount, estimatedFees] = await Promise.all([
    calculateAmount({ transaction, account }),
    estimateFees({
      operationType: HEDERA_OPERATION_TYPES.ContractCall,
      txIntent: {
        intentType: "transaction",
        type: HEDERA_TRANSACTION_MODES.Send,
        asset: {
          type: "erc20",
          assetReference: subAccount.token.contractAddress,
          assetOwner: account.freshAddress,
        },
        amount: BigInt(transaction.amount.toString()),
        sender: account.freshAddress,
        recipient: transaction.recipient,
      },
    }),
  ]);

  const recipientError = validateRecipient(account, transaction.recipient);

  if (recipientError) {
    errors.recipient = recipientError;
  }

  if (!validateMemo(transaction.memo)) {
    errors.transaction = new HederaMemoExceededSizeError();
  }

  if (transaction.amount.eq(0)) {
    errors.amount = new AmountRequired();
  }

  if (subAccount.balance.isLessThan(calculatedAmount.totalSpent)) {
    errors.amount = new NotEnoughBalance();
  }

  if (account.balance.isLessThan(estimatedFees.tinybars)) {
    errors.amount = new NotEnoughBalance();
  }

  return {
    amount: calculatedAmount.amount,
    totalSpent: calculatedAmount.totalSpent,
    estimatedFees: estimatedFees.tinybars,
    errors,
    warnings,
  };
}

async function handleCoinTransaction(
  account: Account,
  transaction: Transaction,
): Promise<TransactionStatus> {
  const errors: Errors = {};
  const warnings: Warnings = {};

  const [calculatedAmount, estimatedFees] = await Promise.all([
    calculateAmount({ transaction, account }),
    estimateFees({
      currency: account.currency,
      operationType: HEDERA_OPERATION_TYPES.CryptoTransfer,
    }),
  ]);

  const recipientError = validateRecipient(account, transaction.recipient);

  if (recipientError) {
    errors.recipient = recipientError;
  }

  if (transaction.amount.eq(0) && !transaction.useAllAmount) {
    errors.amount = new AmountRequired();
  }

  if (account.balance.isLessThan(calculatedAmount.totalSpent)) {
    errors.amount = new NotEnoughBalance("");
  }

  if (!validateMemo(transaction.memo)) {
    errors.transaction = new HederaMemoExceededSizeError();
  }

  return {
    amount: calculatedAmount.amount,
    totalSpent: calculatedAmount.totalSpent,
    estimatedFees: estimatedFees.tinybars,
    errors,
    warnings,
  };
}

async function handleStakingTransaction(account: HederaAccount, transaction: Transaction) {
  invariant(isStakingTransaction(transaction), "invalid transaction properties");

  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};
  const { validators } = getCurrentHederaPreloadData(account.currency);
  const estimatedFees = await estimateFees({
    operationType: HEDERA_OPERATION_TYPES.CryptoUpdate,
    currency: account.currency,
  });
  const amount = BigNumber(0);
  const totalSpent = amount.plus(estimatedFees.tinybars);

  if (!validateMemo(transaction.memo)) {
    errors.transaction = new HederaMemoExceededSizeError();
  }

  if (
    transaction.mode === HEDERA_TRANSACTION_MODES.Delegate ||
    transaction.mode === HEDERA_TRANSACTION_MODES.Redelegate
  ) {
    if (typeof transaction.properties?.stakingNodeId === "number") {
      const isValid = validators.some(validator => {
        return validator.nodeId === transaction.properties?.stakingNodeId;
      });

      if (!isValid) {
        errors.stakingNodeId = new HederaInvalidStakingNodeIdError();
      }
    } else {
      errors.missingStakingNodeId = new HederaInvalidStakingNodeIdError("Validator must be set");
    }

    if (account.hederaResources?.delegation?.nodeId === transaction.properties?.stakingNodeId) {
      errors.stakingNodeId = new HederaRedundantStakingNodeIdError();
    }
  }

  if (transaction.mode === HEDERA_TRANSACTION_MODES.ClaimRewards) {
    const rewardsToClaim = account.hederaResources?.delegation?.pendingReward || new BigNumber(0);
    const transactionFee = transaction.maxFee ?? new BigNumber(0);

    if (rewardsToClaim.lte(0)) {
      errors.noRewardsToClaim = new HederaNoStakingRewardsError();
    }

    if (transactionFee.gt(rewardsToClaim)) {
      warnings.claimRewardsFee = new ClaimRewardsFeesWarning();
    }
  }

  if (account.balance.isLessThan(totalSpent)) {
    errors.fee = new NotEnoughBalance("");
  }

  return {
    amount: new BigNumber(0),
    estimatedFees: estimatedFees.tinybars,
    totalSpent,
    errors,
    warnings,
  };
}

export const getTransactionStatus: AccountBridge<
  Transaction,
  Account,
  TransactionStatus
>["getTransactionStatus"] = async (account, transaction) => {
  const subAccount = findSubAccountById(account, transaction?.subAccountId || "");
  const isHTSTokenTransaction =
    transaction.mode === HEDERA_TRANSACTION_MODES.Send && subAccount?.token.tokenType === "hts";
  const isERC20TokenTransaction =
    transaction.mode === HEDERA_TRANSACTION_MODES.Send && subAccount?.token.tokenType === "erc20";

  if (isTokenAssociateTransaction(transaction)) {
    return handleTokenAssociateTransaction(account, transaction);
  } else if (isHTSTokenTransaction) {
    return handleHTSTokenTransaction(account, subAccount, transaction);
  } else if (isERC20TokenTransaction) {
    return handleERC20TokenTransaction(account, subAccount, transaction);
  } else if (isStakingTransaction(transaction)) {
    return handleStakingTransaction(account, transaction);
  } else {
    return handleCoinTransaction(account, transaction);
  }
};
