import type {
  Balance,
  FeeEstimation,
  TransactionValidation,
} from "@ledgerhq/coin-module-framework/api/index";
import {
  AmountRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  InvalidTransactionError,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/coin-module-framework/errors";
import { MAX_NAT64, TRANSFER_FEE } from "../consts";
import { InvalidMemoICP } from "../errors";
import { AccountIdentifier } from "./accountIdentifier";
import {
  errorFieldOf,
  type IcpIntent,
  type IcpStakingIntent,
  memoOf,
  signerPrincipalOf,
  unpayableFee,
  unsupportedIntent,
} from "./intent";
import { isNeuronCommandIntent, neuronCommandOf, unpayableCommandFee } from "./neuronCommand";
import { checkStakeAccount, isStakeTransferIntent, stakeTransferOf } from "./stakeTransfer";

const CURRENCY_NAME = "Internet Computer";

function recipientError({ sender, recipient }: IcpIntent): Error | undefined {
  if (!recipient) return new RecipientRequired();
  if (!AccountIdentifier.isValid(recipient)) {
    return new InvalidAddress("", { currencyName: CURRENCY_NAME });
  }
  if (recipient.toLowerCase() === sender.toLowerCase()) {
    return new InvalidAddressBecauseDestinationIsAlsoSource();
  }
  return undefined;
}

/**
 * A neuron command spends nothing. Only checks that need no neuron state run here, because the
 * neuron's state is not readable from the account. Governance judges the rest: it refuses most
 * commands the state does not allow, but caps a dissolve delay that an increase takes past the
 * maximum.
 */
function validateNeuronCommand(
  intent: IcpStakingIntent,
  customFees: FeeEstimation | undefined,
): TransactionValidation {
  const errors: Record<string, Error> = {};
  const command = neuronCommandOf(intent);
  if (command instanceof Error) errors[errorFieldOf(command)] = command;
  const feeRefusal = unpayableCommandFee(customFees);
  if (feeRefusal) errors.fees = new InvalidTransactionError(feeRefusal);
  if (!AccountIdentifier.isValid(intent.sender)) {
    errors.sender = new InvalidAddress("", { currencyName: CURRENCY_NAME });
  }
  // A split moves stake from the neuron to a new one, not from the account.
  const amount = intent.type === "split_neuron" ? intent.amount : 0n;
  return { errors, warnings: {}, estimatedFees: 0n, amount, totalSpent: 0n };
}

/**
 * The amount a ledger transfer moves, with its balance errors set in `errors.amount`. The available
 * balance excludes `locked`, which holds what pending operations already spend.
 */
function transferAmount(
  intent: IcpIntent,
  balances: Balance[],
  errors: Record<string, Error>,
): bigint {
  const native = balances.find(({ asset }) => asset.type === "native");
  const available = (native?.value ?? 0n) - (native?.locked ?? 0n);
  let amount = intent.amount;
  if (intent.useAllAmount) {
    amount = available > TRANSFER_FEE ? available - TRANSFER_FEE : 0n;
    if (amount === 0n) errors.amount = new NotEnoughBalance();
  } else if (amount <= 0n) {
    errors.amount = new AmountRequired();
  } else if (amount + TRANSFER_FEE > available) {
    errors.amount = new NotEnoughBalance();
  }
  if (!errors.amount && amount > MAX_NAT64) {
    errors.amount = new InvalidTransactionError(`The amount exceeds ${MAX_NAT64}`);
  }
  return amount;
}

/**
 * A stake transfer is a ledger transfer to the neuron's stake account. The checks that read the
 * stake account run in {@link validateIntentWithStakeAccount}.
 */
function validateStakeTransfer(
  intent: IcpStakingIntent,
  balances: Balance[],
  customFees: FeeEstimation | undefined,
): TransactionValidation {
  const errors: Record<string, Error> = {};
  const feeRefusal = unpayableFee(customFees);
  if (feeRefusal) errors.fees = new InvalidTransactionError(feeRefusal);
  if (!AccountIdentifier.isValid(intent.sender)) {
    errors.sender = new InvalidAddress("", { currencyName: CURRENCY_NAME });
  }
  const amount = transferAmount(intent, balances, errors);
  const transfer = stakeTransferOf(intent, amount);
  if (transfer instanceof Error) {
    const field = errorFieldOf(transfer);
    errors[field] ??= transfer;
  }
  return {
    errors,
    warnings: {},
    estimatedFees: TRANSFER_FEE,
    amount,
    totalSpent: amount + TRANSFER_FEE,
  };
}

/**
 * {@link validateIntent}, then, for a stake transfer that passes it, the checks that read its stake
 * account from governance and the ledger. They are the only ones: broadcast does not repeat them.
 * Deriving the account needs the sender's public key, so a stake transfer without a usable one does
 * not pass.
 */
export async function validateIntentWithStakeAccount(
  intent: IcpIntent,
  balances: Balance[],
  customFees?: FeeEstimation,
): Promise<TransactionValidation> {
  const validation = validateIntent(intent, balances, customFees);
  if (!isStakeTransferIntent(intent) || Object.keys(validation.errors).length > 0) {
    return validation;
  }
  const controller = signerPrincipalOf(intent);
  if (!controller) {
    validation.errors.transaction = new InvalidTransactionError(
      "A stake transfer requires the sender's public key",
    );
    return validation;
  }
  const transfer = stakeTransferOf(intent, validation.amount);
  if (transfer instanceof Error) return validation;
  const refusal = await checkStakeAccount(controller, transfer);
  if (refusal) validation.errors[errorFieldOf(refusal)] = refusal;
  return validation;
}

/** The checks of the account bridge's `getTransactionStatus` that need no network. */
export function validateIntent(
  intent: IcpIntent,
  balances: Balance[],
  customFees?: FeeEstimation,
): TransactionValidation {
  if (isNeuronCommandIntent(intent)) return validateNeuronCommand(intent, customFees);
  if (isStakeTransferIntent(intent)) return validateStakeTransfer(intent, balances, customFees);

  const errors: Record<string, Error> = {};
  const estimatedFees = TRANSFER_FEE;

  const unsupported = unsupportedIntent(intent);
  if (unsupported) errors.transaction = new InvalidTransactionError(unsupported);
  else if (memoOf(intent) === undefined) errors.transaction = new InvalidMemoICP();
  const feeRefusal = unpayableFee(customFees);
  if (feeRefusal) errors.fees = new InvalidTransactionError(feeRefusal);
  if (!AccountIdentifier.isValid(intent.sender)) {
    errors.sender = new InvalidAddress("", { currencyName: CURRENCY_NAME });
  }
  const recipient = recipientError(intent);
  if (recipient) errors.recipient = recipient;
  const amount = transferAmount(intent, balances, errors);

  return {
    errors,
    warnings: {},
    estimatedFees,
    amount,
    totalSpent: amount + estimatedFees,
  };
}
