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
  type IcpIntent,
  type IcpStakingIntent,
  memoOf,
  unpayableFee,
  unsupportedIntent,
} from "./intent";
import {
  errorFieldOf,
  isNeuronCommandIntent,
  neuronCommandOf,
  unpayableCommandFee,
} from "./neuronCommand";

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
 * The send checks of the account bridge's `getTransactionStatus`. The available balance excludes
 * `locked`, which holds what pending operations already spend.
 */
export function validateIntent(
  intent: IcpIntent,
  balances: Balance[],
  customFees?: FeeEstimation,
): TransactionValidation {
  if (isNeuronCommandIntent(intent)) return validateNeuronCommand(intent, customFees);

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

  const native = balances.find(({ asset }) => asset.type === "native");
  const available = (native?.value ?? 0n) - (native?.locked ?? 0n);
  let amount = intent.amount;
  if (intent.useAllAmount) {
    amount = available > estimatedFees ? available - estimatedFees : 0n;
    if (amount === 0n) errors.amount = new NotEnoughBalance();
  } else if (amount <= 0n) {
    errors.amount = new AmountRequired();
  } else if (amount + estimatedFees > available) {
    errors.amount = new NotEnoughBalance();
  }
  if (!errors.amount && amount > MAX_NAT64) {
    errors.amount = new InvalidTransactionError(`The amount exceeds ${MAX_NAT64}`);
  }

  return {
    errors,
    warnings: {},
    estimatedFees,
    amount,
    totalSpent: amount + estimatedFees,
  };
}
