// @flow
import { scanAccounts } from "../../../libcore/scanAccounts";
import { sync } from "../../../libcore/syncAccount";
import type { AccountBridge, CurrencyBridge } from "../../../types";
import type { Transaction } from "../types";
import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import broadcast from "../libcore-broadcast";
import signOperation from "../libcore-signOperation";
import { getMainAccount } from "../../../account";
import { validateRecipient } from "../../../bridge/shared";
import {
  NotEnoughBalance,
  InvalidAddressBecauseDestinationIsAlsoSource,
  InvalidAddress,
  AmountRequired,
} from "@ledgerhq/errors";
import {
  CosmosRedelegationInProgress,
  CosmosClaimRewardsFeesWarning,
  CosmosDelegateAllFundsWarning,
} from "../../../errors";
import {
  setCosmosPreloadData,
  asSafeCosmosPreloadData,
} from "../preloadedData";
import { getValidators, hydrateValidators } from "../validators";
import {
  calculateFees,
  getMaxEstimatedBalance,
  COSMOS_MAX_REDELEGATIONS,
  COSMOS_MAX_UNBONDINGS,
} from "../utils";

const createTransaction = () => ({
  family: "cosmos",
  mode: "send",
  amount: BigNumber(0),
  fees: null,
  gasLimit: null,
  recipient: "",
  useAllAmount: false,
  networkInfo: null,
  memo: null,
  cosmosSourceValidator: null,
  validators: [],
});

const updateTransaction = (t, patch) => ({ ...t, ...patch });

const redelegationStatusError = (a, t) => {
  if (a.cosmosResources) {
    const redelegations = a.cosmosResources.redelegations;

    invariant(
      redelegations.length < COSMOS_MAX_REDELEGATIONS,
      "redelegation should not have more than 6 entries"
    );

    if (
      redelegations.some((redelegation) => {
        let dstValidator = redelegation.validatorDstAddress;
        return (
          dstValidator === t.cosmosSourceValidator &&
          redelegation.completionDate > new Date()
        );
      })
    )
      return new CosmosRedelegationInProgress();
  }

  return null;
};

const getTransactionStatus = async (a, t) => {
  const errors = {};
  const warnings = {};

  if (t.mode === "redelegate") {
    const redelegationError = redelegationStatusError(a, t);
    if (redelegationError) {
      // Note : note sure if I have to put this error on this field
      errors.redelegation = redelegationError;
    }
  } else if (t.mode === "undelegate") {
    invariant(
      a.cosmosResources &&
        a.cosmosResources.unbondings.length < COSMOS_MAX_UNBONDINGS,
      "unbondings should not have more than 6 entries"
    );
  } else if (
    ["delegate", "claimReward", "claimRewardCompound"].includes(t.mode)
  ) {
    if (
      t.validators.some(
        (v) => !v.address || !v.address.includes("cosmosvaloper")
      ) ||
      t.validators.length === 0
    )
      errors.recipient = new InvalidAddress(null, {
        currencyName: a.currency.name,
      });
  } else {
    if (a.freshAddress === t.recipient) {
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

  let estimatedFees = BigNumber(0);

  let amount =
    t.mode !== "send"
      ? t.validators.reduce(
          (old, current) => old.plus(current.amount),
          BigNumber(0)
        )
      : t.amount;

  if (amount.eq(0) && t.mode !== "claimReward") {
    errors.amount = new AmountRequired();
  }

  if (!errors.recipient && !errors.amount) {
    if (t.useAllAmount) {
      t.amount = getMaxEstimatedBalance(a, estimatedFees);
    }
    const res = await calculateFees({ a, t });
    estimatedFees = res.estimatedFees;
  }

  amount =
    t.mode === "send" && t.useAllAmount
      ? getMaxEstimatedBalance(a, estimatedFees)
      : amount.eq(a.spendableBalance)
      ? amount.minus(estimatedFees)
      : amount;

  let totalSpent = amount.plus(estimatedFees);

  if (t.mode === "claimReward") {
    const { cosmosResources } = a;
    invariant(cosmosResources, "cosmosResources should exist");
    const claimReward = cosmosResources.delegations.find(
      (delegation) => delegation.validatorAddress === t.validators[0].address
    );
    if (claimReward && estimatedFees.gt(claimReward.pendingRewards)) {
      warnings.claimReward = new CosmosClaimRewardsFeesWarning();
    }
  } else if (t.mode === "delegate" && totalSpent.eq(a.spendableBalance)) {
    warnings.delegate = new CosmosDelegateAllFundsWarning();
  }

  if (
    !errors.recipient &&
    !errors.amount &&
    (amount.lt(0) || totalSpent.gt(a.spendableBalance))
  ) {
    errors.amount = new NotEnoughBalance();
    totalSpent = BigNumber(0);
    amount = BigNumber(0);
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
  return t;
};

const currencyBridge: CurrencyBridge = {
  preload: async () => {
    const validators = await getValidators();
    setCosmosPreloadData({ validators });
    return Promise.resolve({ validators });
  },
  hydrate: (data: mixed) => {
    if (!data || typeof data !== "object") return;
    const { validators } = data;
    if (
      !validators ||
      typeof validators !== "object" ||
      !Array.isArray(validators)
    )
      return;
    hydrateValidators(validators);
    setCosmosPreloadData(asSafeCosmosPreloadData(data));
  },
  scanAccounts,
};

const estimateMaxSpendable = async ({
  account,
  parentAccount,
  transaction,
}) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const t = await prepareTransaction(mainAccount, {
    ...createTransaction(),
    recipient: "cosmos19rl4cm2hmr8afy4kldpxz3fka4jguq0auqdal4", // abandon seed generate with ledger-live-bot
    ...transaction,
    useAllAmount: true,
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
  broadcast,
};

export default { currencyBridge, accountBridge };
