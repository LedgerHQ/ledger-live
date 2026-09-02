import {
  AmountRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/ledger-wallet-framework/errors";
import { Account, AccountBridge } from "@ledgerhq/types-live";
import { Principal } from "@dfinity/principal";
import BigNumber from "bignumber.js";
import {
  getNeuronDissolveDurationSeconds,
  neuronCanBeSplit,
  neuronStake,
} from "../common-logic/neuron";
import {
  ICP_FEES,
  MIN_NEURON_STAKE,
  NNS_MAXIMUM_DISSOLVE_DELAY,
  NNS_MINIMUM_DISSOLVE_DELAY,
  SECONDS_IN_DAY,
} from "../consts";
import {
  ICPCreateNeuronWarning,
  ICPDissolveDelayGTMax,
  ICPDissolveDelayLTCurrent,
  ICPDissolveDelayLTMin,
  ICPHotKeyAlreadyExists,
  ICPIncreaseStakeWarning,
  ICPInvalidDissolveDelayIncrease,
  ICPInvalidHotKey,
  ICPInvalidPercentage,
  ICPNeuronNotFound,
  ICPSplitNotAllowed,
  ICPStakeMemoNotRecoverable,
  InvalidMemoICP,
  NotEnoughTransferAmount,
} from "../errors";
import { validateAddress } from "../logic/validation";
import { validateMemo } from "../logic/validateMemo";
import {
  ICPAccount,
  ICPNeuron,
  ICPTransactionType,
  TRANSFER_TYPES,
  Transaction,
  TransactionStatus,
} from "../types";
import { getAddress } from "./bridgeHelpers/addresses";

// Governance ops that act on an existing neuron and therefore require a resolvable neuronId.
// `send` and `list_neurons` also reach the switch default but need no neuron.
const NEURON_REQUIRED_OPS = new Set<ICPTransactionType>([
  "start_dissolving",
  "stop_dissolving",
  "disburse",
  "spawn_neuron",
  "spawn_neuron_from_maturity",
  "stake_maturity",
  "auto_stake_maturity",
  "refresh_voting_power",
  "follow",
]);

const isValidPrincipal = (text?: string): boolean => {
  if (!text) return false;
  try {
    Principal.fromText(text);
    return true;
  } catch {
    return false;
  }
};

const validateRecipient = (
  recipient: string,
  address: string,
  currencyName: string,
): Error | undefined => {
  if (!recipient) return new RecipientRequired();
  if (!validateAddress(recipient).isValid) return new InvalidAddress("", { currencyName });
  if (recipient.toLowerCase() === address.toLowerCase()) {
    return new InvalidAddressBecauseDestinationIsAlsoSource();
  }
  return undefined;
};

// The bounds are protocol seconds, but every surface that reports them talks in whole days, so each
// error carries both. A minimum rounds up and a maximum rounds down, keeping the quoted day count
// one the canister would actually accept.
// `count` repeats the day figure because that is the field i18next selects a plural form on, and the
// apps hand the whole error to `t()`. Dropping it would fall the copy back to the generic message.
const belowMin = (minSeconds: number) => {
  const minDays = Math.ceil(minSeconds / SECONDS_IN_DAY);
  return new ICPDissolveDelayLTMin("", { minSeconds, minDays, count: minDays });
};

const aboveMax = (maxSeconds: number) => {
  const maxDays = Math.floor(maxSeconds / SECONDS_IN_DAY);
  return new ICPDissolveDelayGTMax("", { maxSeconds, maxDays, count: maxDays });
};

// New dissolve delay must be >= the current one and within the network bounds (Mission 70).
const validateSetDissolveDelay = (
  neuron: ICPNeuron | undefined,
  dissolveDelay?: string,
): Error | undefined => {
  if (!neuron) return new ICPNeuronNotFound();
  const seconds = Number(dissolveDelay);
  if (!Number.isInteger(seconds) || seconds < 0) {
    return belowMin(NNS_MINIMUM_DISSOLVE_DELAY);
  }
  const requested = BigInt(seconds);
  if (requested < getNeuronDissolveDurationSeconds(neuron)) return new ICPDissolveDelayLTCurrent();
  if (requested < BigInt(NNS_MINIMUM_DISSOLVE_DELAY)) {
    return belowMin(NNS_MINIMUM_DISSOLVE_DELAY);
  }
  if (requested > BigInt(NNS_MAXIMUM_DISSOLVE_DELAY)) {
    return aboveMax(NNS_MAXIMUM_DISSOLVE_DELAY);
  }
  return undefined;
};

const validateIncreaseDissolveDelay = (
  neuron: ICPNeuron | undefined,
  additional?: string,
): Error | undefined => {
  if (!neuron) return new ICPNeuronNotFound();
  const value = Number(additional);
  // Not belowMin: the network minimum is not what an empty or zero entry violates, and quoting it
  // would name a bound the user never crossed.
  if (!Number.isInteger(value) || value <= 0) return new ICPInvalidDissolveDelayIncrease();
  if (
    getNeuronDissolveDurationSeconds(neuron) + BigInt(value) >
    BigInt(NNS_MAXIMUM_DISSOLVE_DELAY)
  ) {
    return aboveMax(NNS_MAXIMUM_DISSOLVE_DELAY);
  }
  return undefined;
};

const validateAddHotKey = (neuron: ICPNeuron | undefined, hotKey?: string): Error | undefined => {
  if (!neuron) return new ICPNeuronNotFound();
  if (!isValidPrincipal(hotKey)) return new ICPInvalidHotKey();
  if (neuron.hotKeys.includes(hotKey!)) return new ICPHotKeyAlreadyExists();
  return undefined;
};

const validateRemoveHotKey = (
  neuron: ICPNeuron | undefined,
  hotKey?: string,
): Error | undefined => {
  if (!neuron) return new ICPNeuronNotFound();
  if (!isValidPrincipal(hotKey)) return new ICPInvalidHotKey();
  return undefined;
};

type NeuronOpResult = { transaction?: Error; amount?: Error; warning?: Error };

// Build a result omitting undefined slots (keeps the optional props exactly-optional).
const opResult = (transaction?: Error, amount?: Error, warning?: Error): NeuronOpResult => ({
  ...(transaction && { transaction }),
  ...(amount && { amount }),
  ...(warning && { warning }),
});

// The split amount must leave >= MIN on the parent and give the child (amount - fee) >= MIN, i.e.
// MIN + fee <= amount <= mintedStake - MIN (dfinity/ic governance.rs split_neuron).
const validateSplitNeuron = (neuron: ICPNeuron | undefined, amount: BigNumber): NeuronOpResult => {
  if (!neuron) return opResult(new ICPNeuronNotFound());
  // getTransactionStatus must return a structured error, never throw: reject a non-finite/non-integer
  // amount up front instead of letting BigInt(amount.toFixed(0)) throw on "NaN".
  if (!amount.isFinite() || !amount.isInteger())
    return opResult(undefined, new NotEnoughTransferAmount());
  const fee = BigInt(ICP_FEES);
  const amt = BigInt(amount.toFixed(0));
  if (!neuronCanBeSplit(neuron, fee)) return opResult(undefined, new ICPSplitNotAllowed());
  if (amt < BigInt(MIN_NEURON_STAKE) + fee)
    return opResult(undefined, new NotEnoughTransferAmount());
  if (amt > neuronStake(neuron) - BigInt(MIN_NEURON_STAKE))
    return opResult(undefined, new ICPSplitNotAllowed());
  return opResult();
};

// Percentage is optional (absent ⇒ full maturity); if present it must be an integer 1–100. Validated
// here for a clear error rather than a low-signal candid-encode failure downstream.
const validatePercentage = (percentage?: string | number): Error | undefined => {
  // Absent (undefined / "") ⇒ full maturity; a numeric 0 is an explicit out-of-range value, not "absent".
  if (percentage === undefined || percentage === "") return undefined;
  const value = Number(percentage);
  return Number.isInteger(value) && value >= 1 && value <= 100
    ? undefined
    : new ICPInvalidPercentage();
};

// Op-specific validation. Governance ops that target a neuron report ICPNeuronNotFound when it is
// unresolved (which also covers a missing neuronId).
const validateNeuronOp = (transaction: Transaction, neuron?: ICPNeuron): NeuronOpResult => {
  switch (transaction.type) {
    case "create_neuron":
      return opResult(
        undefined,
        transaction.amount.lt(MIN_NEURON_STAKE) ? new NotEnoughTransferAmount() : undefined,
        new ICPCreateNeuronWarning(),
      );
    case "increase_stake":
      return opResult(
        transaction.stakeNonce ? undefined : new ICPStakeMemoNotRecoverable(),
        undefined,
        new ICPIncreaseStakeWarning(),
      );
    case "set_dissolve_delay":
      return opResult(validateSetDissolveDelay(neuron, transaction.dissolveDelay));
    case "increase_dissolve_delay":
      return opResult(validateIncreaseDissolveDelay(neuron, transaction.additionalDissolveDelay));
    case "add_hot_key":
      return opResult(validateAddHotKey(neuron, transaction.hotKeyToAdd));
    case "remove_hot_key":
      return opResult(validateRemoveHotKey(neuron, transaction.hotKeyToRemove));
    case "split_neuron":
      return validateSplitNeuron(neuron, transaction.amount);
    case "spawn_neuron":
    case "spawn_neuron_from_maturity":
      return opResult(
        neuron ? validatePercentage(transaction.percentageToSpawn) : new ICPNeuronNotFound(),
      );
    case "stake_maturity":
      return opResult(
        neuron ? validatePercentage(transaction.percentageToStake) : new ICPNeuronNotFound(),
      );
    default:
      return NEURON_REQUIRED_OPS.has(transaction.type) && !neuron
        ? opResult(new ICPNeuronNotFound())
        : opResult();
  }
};

type Spend = {
  amount: BigNumber;
  estimatedFees: BigNumber;
  totalSpent: BigNumber;
  error: Error | undefined;
};

// Governance calls don't debit the ledger, so only transfers carry a fee/amount to spend.
const computeSpend = (account: Account, transaction: Transaction, isTransfer: boolean): Spend => {
  const estimatedFees = isTransfer ? transaction.fees : new BigNumber(0);
  if (isTransfer && transaction.useAllAmount) {
    const totalSpent = account.spendableBalance;
    const amount = totalSpent.minus(estimatedFees);
    const error =
      amount.lte(0) || totalSpent.gt(account.balance) ? new NotEnoughBalance() : undefined;
    return { amount, estimatedFees, totalSpent, error };
  }
  if (isTransfer) {
    const { amount } = transaction;
    const totalSpent = amount.plus(estimatedFees);
    let error: Error | undefined;
    if (amount.eq(0)) error = new AmountRequired();
    else if (totalSpent.gt(account.spendableBalance)) error = new NotEnoughBalance();
    return { amount, estimatedFees, totalSpent, error };
  }
  return { amount: transaction.amount, estimatedFees, totalSpent: estimatedFees, error: undefined };
};

export const getTransactionStatus: AccountBridge<Transaction>["getTransactionStatus"] = async (
  account,
  transaction,
) => {
  const errors: TransactionStatus["errors"] = {};
  const warnings: TransactionStatus["warnings"] = {};

  const { type, recipient } = transaction;
  const { address } = getAddress(account);
  const neurons = (account as ICPAccount).neurons?.fullNeurons ?? [];
  const neuron = transaction.neuronId
    ? neurons.find(n => n.id?.toString() === transaction.neuronId)
    : undefined;
  const isTransfer = TRANSFER_TYPES.has(type);

  if (!validateAddress(address).isValid) {
    errors.sender = new InvalidAddress("", { currencyName: account.currency.name });
  }
  if (isTransfer) {
    // memo is carried only on ledger-canister transfers; governance ops never send it, so a stale
    // memo value must not block them.
    if (!validateMemo(transaction.memo)) errors.transaction = new InvalidMemoICP();
    const recipientError = validateRecipient(recipient, address, account.currency.name);
    if (recipientError) errors.recipient = recipientError;
  }

  const op = validateNeuronOp(transaction, neuron);
  if (op.transaction) errors.transaction = op.transaction;
  if (op.amount) errors.amount = op.amount;
  if (op.warning) warnings.staking = op.warning;

  const spend = computeSpend(account, transaction, isTransfer);
  if (spend.error && !errors.amount) errors.amount = spend.error;

  return {
    errors,
    warnings,
    estimatedFees: spend.estimatedFees,
    amount: spend.amount,
    totalSpent: spend.totalSpent,
  };
};
