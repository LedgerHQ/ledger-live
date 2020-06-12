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
  RecommendUndelegation,
} from "@ledgerhq/errors";
import {
  CosmosRedelegationInProgress,
  CosmosClaimRewardsFeesWarning,
  CosmosDelegateAllFundsWarning,
  CosmosTooManyValidators,
  NotEnoughDelegationBalance,
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
  COSMOS_MAX_DELEGATIONS,
} from "../logic";

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

const isDelegable = (a, address, amount) => {
  const { cosmosResources } = a;
  invariant(cosmosResources, "cosmosResources should exist");
  if (
    cosmosResources.delegations.some(
      (delegation) =>
        delegation.validatorAddress === address && delegation.amount.lt(amount)
    )
  ) {
    return new NotEnoughDelegationBalance();
  }

  return null;
};

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

    if (t.cosmosSourceValidator === t.validators[0].address)
      return new InvalidAddressBecauseDestinationIsAlsoSource();
  }

  return isDelegable(a, t.cosmosSourceValidator, t.validators[0].amount);
};

const getEstimatedFees = async (a, t, errors) => {
  let estimatedFees = BigNumber(0);

  if (!errors.recipient && !errors.amount) {
    if (t.useAllAmount) {
      t.amount = getMaxEstimatedBalance(a, estimatedFees);
    }
    const res = await calculateFees({ a, t });
    estimatedFees = res.estimatedFees;
  }
  return estimatedFees;
};

const getSendTransactionStatus = async (a, t) => {
  const errors = {};
  const warnings = {};

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

  let amount = t.amount;

  if (amount.lte(0)) {
    errors.amount = new AmountRequired();
  }

  const estimatedFees = await getEstimatedFees(a, t, errors);

  amount = t.useAllAmount ? getMaxEstimatedBalance(a, estimatedFees) : amount;

  let totalSpent = amount.plus(estimatedFees);

  if (
    !errors.recipient &&
    !errors.amount &&
    totalSpent.gt(a.spendableBalance)
  ) {
    errors.amount = new NotEnoughBalance();
  }

  if (
    a.cosmosResources &&
    a.cosmosResources.delegations.length > 0 &&
    t.useAllAmount
  ) {
    warnings.amount = new RecommendUndelegation();
  }

  return Promise.resolve({
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  });
};

const getDelegateTransactionStatus = async (a, t) => {
  const errors = {};
  const warnings = {};

  if (
    t.validators.some(
      (v) => !v.address || !v.address.includes("cosmosvaloper")
    ) ||
    t.validators.length === 0
  )
    errors.recipient = new InvalidAddress(null, {
      currencyName: a.currency.name,
    });

  if (t.validators.length > COSMOS_MAX_DELEGATIONS) {
    errors.validators = new CosmosTooManyValidators();
  }

  let amount = t.validators.reduce(
    (old, current) => old.plus(current.amount),
    BigNumber(0)
  );

  if (amount.eq(0)) {
    errors.amount = new AmountRequired();
  }

  const estimatedFees = await getEstimatedFees(a, t, errors);

  let totalSpent = amount.plus(estimatedFees);

  if (totalSpent.eq(a.spendableBalance)) {
    warnings.delegate = new CosmosDelegateAllFundsWarning();
  }

  if (
    !errors.recipient &&
    !errors.amount &&
    (amount.lt(0) || totalSpent.gt(a.spendableBalance))
  ) {
    errors.amount = new NotEnoughBalance();
    amount = BigNumber(0);
    totalSpent = BigNumber(0);
  }

  return Promise.resolve({
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  });
};

const getTransactionStatus = async (a, t) => {
  if (t.mode === "send") {
    // We isolate the send transaction that it's a little bit different from the rest
    return await getSendTransactionStatus(a, t);
  } else if (t.mode === "delegate") {
    return await getDelegateTransactionStatus(a, t);
  }

  const errors = {};
  const warnings = {};

  // here we only treat about all other mode than delegate and send
  if (
    t.validators.some(
      (v) => !v.address || !v.address.includes("cosmosvaloper")
    ) ||
    t.validators.length === 0
  )
    errors.recipient = new InvalidAddress(null, {
      currencyName: a.currency.name,
    });
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
    if (t.validators.length === 0)
      errors.recipient = new InvalidAddress(null, {
        currencyName: a.currency.name,
      });
    const unbondingError = isDelegable(
      a,
      t.validators[0].address,
      t.validators[0].amount
    );
    if (unbondingError) {
      errors.unbonding = unbondingError;
    }
  }

  let validatorAmount = t.validators.reduce(
    (old, current) => old.plus(current.amount),
    BigNumber(0)
  );

  if (t.mode !== "claimReward" && validatorAmount.lte(0)) {
    errors.amount = new AmountRequired();
  }

  const estimatedFees = await getEstimatedFees(a, t, errors);

  let totalSpent = estimatedFees;

  if (["claimReward", "claimRewardCompound"].includes(t.mode)) {
    const { cosmosResources } = a;
    invariant(cosmosResources, "cosmosResources should exist");
    const claimReward = cosmosResources.delegations.find(
      (delegation) => delegation.validatorAddress === t.validators[0].address
    );
    if (claimReward && estimatedFees.gt(claimReward.pendingRewards)) {
      warnings.claimReward = new CosmosClaimRewardsFeesWarning();
    }
  }

  if (
    !errors.recipient &&
    !errors.amount &&
    (validatorAmount.lt(0) || totalSpent.gt(a.spendableBalance))
  ) {
    errors.amount = new NotEnoughBalance();
    totalSpent = BigNumber(0);
  }

  return Promise.resolve({
    errors,
    warnings,
    estimatedFees,
    amount: BigNumber(0),
    totalSpent,
  });
};

const prepareTransaction = async (a, t) => {
  let memo = t.memo;

  if (t.mode !== "send" && !memo) {
    memo = "Ledger Live";
  }

  if (t.memo !== memo) {
    return { ...t, memo };
  }

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
