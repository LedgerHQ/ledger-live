import {
  AmountRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import BigNumber from "bignumber.js";
import { AccountBridge } from "@ledgerhq/types-live";
import { validateAddress, validateMemo, validatePrincipal } from "@zondax/ledger-live-icp/utils";
import { getAddress } from "./bridgeHelpers/addresses";
import {
  ICPAccount,
  ICPAccountRaw,
  InternetComputerOperation,
  Transaction,
  TransactionStatus,
} from "../types";
import {
  ICPDissolveDelayGTMax,
  ICPDissolveDelayLTCurrent,
  ICPDissolveDelayLTMin,
  InvalidMemoICP,
  ICPNeuronNotFound,
  NotEnoughTransferAmount,
  ICPInvalidHotKey,
  ICPHotKeyAlreadyExists,
  ICPSplitNotAllowed,
  ICPIncreaseStakeWarning,
  ICPCreateNeuronWarning,
} from "../errors";
import {
  ICP_FEES,
  ICP_MIN_STAKING_AMOUNT,
  MAX_DISSOLVE_DELAY,
  MIN_DISSOLVE_DELAY,
} from "../consts";
import { getNeuronDissolveDurationSeconds } from "@zondax/ledger-live-icp/neurons";
import { maxAllowedSplitAmount } from "../common-logic/neuron";

export const getTransactionStatus: AccountBridge<
  Transaction,
  ICPAccount,
  TransactionStatus,
  InternetComputerOperation,
  ICPAccountRaw
>["getTransactionStatus"] = async (account, transaction) => {
  const errors: TransactionStatus["errors"] = {};
  const warnings: TransactionStatus["warnings"] = {};

  const { balance } = account;
  const { address } = getAddress(account);
  const { recipient, useAllAmount, type, neuronId, dissolveDelay: dissolveDelayStr } = transaction;
  let { amount } = transaction;
  const neuron = account.neurons.fullNeurons.find(
    neuron => neuron.id[0]?.id.toString() === neuronId,
  );

  // If the transaction is a set dissolve delay, we need to validate the dissolve delay
  if (type === "set_dissolve_delay" && !!dissolveDelayStr) {
    const dissolveDelay = new BigNumber(dissolveDelayStr);

    // If the neuron is not found, add an error
    if (!neuron) {
      errors.neuron = new ICPNeuronNotFound();
    } else {
      const currentDissolveDelay = BigNumber(getNeuronDissolveDurationSeconds(neuron).toString());
      if (BigNumber(dissolveDelay).lt(currentDissolveDelay)) {
        errors.dissolveDelay = new ICPDissolveDelayLTCurrent();
      }
    }

    // If the dissolve delay is less than the minimum dissolve delay, add an error
    if (dissolveDelay.lt(MIN_DISSOLVE_DELAY)) {
      errors.dissolveDelay = new ICPDissolveDelayLTMin(undefined, {
        min: "182.5 days",
      });
    } else if (dissolveDelay.gt(MAX_DISSOLVE_DELAY)) {
      // If the dissolve delay is greater than the maximum dissolve delay, add an error
      errors.dissolveDelay = new ICPDissolveDelayGTMax(undefined, {
        max: "8 years",
      });
    }
  }

  // If the transaction is a split neuron, we need to validate the neuron
  if (type === "split_neuron") {
    if (!neuron) {
      errors.neuron = new ICPNeuronNotFound();
    } else {
      if (BigNumber(neuron.cached_neuron_stake_e8s.toString()).lt(amount.plus(ICP_FEES))) {
        errors.splitNeuron = new NotEnoughBalance();
      }
      if (BigNumber(amount).lte(ICP_MIN_STAKING_AMOUNT)) {
        errors.splitNeuron = new NotEnoughTransferAmount("", {
          purpose: "neuron split",
          amount:
            BigNumber(ICP_MIN_STAKING_AMOUNT)
              .div(10 ** account.currency.units[0].magnitude)
              .toString() +
            " " +
            account.currency.ticker,
        });
      }
      if (amount.gt(maxAllowedSplitAmount(neuron))) {
        errors.splitNeuron = new ICPSplitNotAllowed();
      }
    }
  }

  // If the recipient is invalid, add an error
  if (!recipient) {
    errors.recipient = new RecipientRequired();
  } else if (!validateAddress(recipient).isValid) {
    // If the recipient is invalid, add an error
    errors.recipient = new InvalidAddress("", {
      currencyName: account.currency.name,
    });
  } else if (recipient.toLowerCase() === address.toLowerCase()) {
    // If the recipient is the same as the sender, add an error
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  }

  // If the memo is invalid, add an error
  if (!validateMemo(transaction.memo).isValid) {
    errors.transaction = new InvalidMemoICP();
  }

  // If the transaction is a create neuron, add a warning
  // If the amount is less than the minimum staking amount, add an error
  if (transaction.type === "create_neuron") {
    warnings.staking = new ICPCreateNeuronWarning();
    if (transaction.amount.lt(ICP_MIN_STAKING_AMOUNT)) {
      errors.amount = new NotEnoughTransferAmount("", {
        purpose: "stake",
        amount:
          BigNumber(ICP_MIN_STAKING_AMOUNT)
            .div(10 ** account.currency.units[0].magnitude)
            .toString() +
          " " +
          account.currency.ticker,
      });
    }
  }

  // If the transaction is an increase stake, add a warning
  if (transaction.type === "increase_stake") {
    warnings.staking = new ICPIncreaseStakeWarning();
  }

  // If the transaction is an add hot key, we need to validate the hot key
  if (transaction.type === "add_hot_key" && transaction.hotKeyToAdd) {
    if (!validatePrincipal(transaction.hotKeyToAdd).isValid) {
      errors.addHotKey = new ICPInvalidHotKey();
    }

    if (neuron?.hot_keys.map(hotKey => hotKey.toString()).includes(transaction.hotKeyToAdd)) {
      errors.addHotKey = new ICPHotKeyAlreadyExists();
    }
  }

  // This is the worst case scenario (the tx won't cost more than this value)
  const estimatedFees = transaction.fees;

  let totalSpent: BigNumber;

  // If useAllAmount is true, we use the spendable balance as the total spent
  // If useAllAmount is false, we use the amount as the total spent
  if (useAllAmount) {
    totalSpent = account.spendableBalance;
    amount = totalSpent.minus(estimatedFees);
    if (amount.lte(0) || totalSpent.gt(balance)) {
      errors.amount = new NotEnoughBalance();
    }
  } else {
    totalSpent = amount.plus(estimatedFees);
    if (amount.eq(0)) {
      errors.amount = new AmountRequired();
    } else if (totalSpent.gt(account.spendableBalance)) {
      errors.amount = new NotEnoughBalance();
    }
  }

  return {
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  };
};
