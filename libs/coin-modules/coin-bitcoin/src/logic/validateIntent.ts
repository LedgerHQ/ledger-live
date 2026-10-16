import type {
  Balance,
  FeeEstimation,
  TransactionValidation,
} from "@ledgerhq/coin-module-framework/api/types";
import {
  AmountRequired,
  FeeTooHigh,
  InvalidAddress,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/ledger-wallet-framework/errors";
import type { BitcoinContext } from "../config";
import { DustLimit, FeeTooLow } from "../errors";
import { amountParameter } from "./feeParameters";
import { validateAddress } from "./validateAddress";
import type { BitcoinIntent } from "./intent";
import { opReturnScript } from "./intent";
import { cryptoFor, paymentDustThreshold } from "./selectUtxos";

type Validation = Pick<TransactionValidation, "errors" | "warnings">;

const NONE: Validation = { errors: {}, warnings: {} };

/**
 * The amount the transaction sends: the intent's, or for `useAllAmount` the sweep `estimateFees`
 * priced (`parameters.amount`: every spendable output minus the fee), else the balance minus the
 * fees.
 */
function computeAmount(
  intent: BitcoinIntent,
  nativeBalance: bigint,
  fees: bigint,
  sweep?: bigint,
): bigint {
  if (!intent.useAllAmount) return intent.amount;
  if (sweep !== undefined) return sweep;
  return nativeBalance > fees ? nativeBalance - fees : 0n;
}

/** The recipient must be given, and be an address of the currency. */
async function validateRecipient(
  currencyId: string,
  currencyName: string,
  intent: BitcoinIntent,
): Promise<Validation> {
  if (!intent.recipient) {
    return { errors: { recipient: new RecipientRequired() }, warnings: {} };
  }
  if (!(await validateAddress(intent.recipient, { currencyId }))) {
    return { errors: { recipient: new InvalidAddress("", { currencyName }) }, warnings: {} };
  }
  return NONE;
}

/**
 * The amount must be positive, covered by the funds, and above the payment's dust threshold.
 *
 * Funds: when `customFees` comes from `estimateFees`, its `parameters.sufficient` is the verdict,
 * since the estimate selected from the outputs crafting spends (confirmed ones and the address's
 * own unconfirmed change, see `getSpendableUtxos`), which a confirmed balance does not show; so is
 * the sweep it priced. Otherwise the amount and the fees are checked against the native balance.
 */
function validateAmount(
  currencyId: string,
  intent: BitcoinIntent,
  amount: bigint,
  fees: bigint,
  nativeBalance: bigint,
  customFees: FeeEstimation | undefined,
): Validation {
  if (amount <= 0n) {
    const error = intent.useAllAmount ? new NotEnoughBalance() : new AmountRequired();
    return { errors: { amount: error }, warnings: {} };
  }

  const sufficient = customFees?.parameters?.sufficient;
  const sweepEstimated =
    intent.useAllAmount && amountParameter(customFees?.parameters, "amount") !== undefined;
  const covered =
    typeof sufficient === "boolean" ? sufficient : sweepEstimated || amount + fees <= nativeBalance;
  if (!covered) {
    return { errors: { amount: new NotEnoughBalance() }, warnings: {} };
  }

  // Undefined while the recipient is not an address: there is no payment to measure yet.
  const dust = paymentDustThreshold(currencyId, intent.sender, intent.recipient);
  if (dust !== undefined && amount < dust) {
    return { errors: { amount: new DustLimit() }, warnings: {} };
  }
  return NONE;
}

/**
 * The fee must not be negative (validation would subtract it from the funds needed, while crafting
 * ignores it), nor below the network's minimum relay fee, as far as the parameters `estimateFees`
 * returned tell (`relayFeePerByte`, `vsize`, `feePerByte`): a node would not relay the transaction.
 */
function validateFees(fees: bigint, parameters: FeeEstimation["parameters"]): Validation {
  if (fees < 0n) {
    return { errors: { fees: new Error("customFees.value must not be negative") }, warnings: {} };
  }

  const relayFeePerByte = amountParameter(parameters, "relayFeePerByte");
  if (relayFeePerByte === undefined) return NONE;
  const vsize = amountParameter(parameters, "vsize");
  const feePerByte = amountParameter(parameters, "feePerByte");
  const belowRelayFee = fees > 0n && vsize !== undefined && fees < vsize * relayFeePerByte;
  const belowRelayRate = feePerByte !== undefined && feePerByte < relayFeePerByte;
  if (belowRelayFee || belowRelayRate) {
    return { errors: { fees: new FeeTooLow() }, warnings: {} };
  }
  return NONE;
}

/**
 * OP_RETURN data (`intent.data.opReturnData`) must be hex and within the relay limit
 * (`OpReturnDataSizeLimit`, reported under `opReturnSizeLimit`, as the bridge reports it).
 */
function validateOpReturn(currencyId: string, intent: BitcoinIntent): Validation {
  try {
    opReturnScript(intent, cryptoFor(currencyId));
    return NONE;
  } catch (error) {
    const opReturnSizeLimit = error instanceof Error ? error : new Error(String(error));
    return { errors: { opReturnSizeLimit }, warnings: {} };
  }
}

/** Warns when the fees are more than 10% of the amount. */
function validateFeeRatio(
  customFees: FeeEstimation | undefined,
  amount: bigint,
  fees: bigint,
): Validation {
  if (customFees && amount > 0n && fees * 10n > amount) {
    return { errors: {}, warnings: { feeTooHigh: new FeeTooHigh() } };
  }
  return NONE;
}

/**
 * Fee-agnostic validation of a transaction intent, from the intent and the balances passed in,
 * plus `customFees` when provided: recipient, amount (funds, dust), fees (relay minimum), OP_RETURN
 * data, and a warning when the fees are high. Makes no network call.
 */
export async function validateIntent(
  context: BitcoinContext,
  currencyId: string,
  intent: BitcoinIntent,
  balances: Balance[],
  customFees?: FeeEstimation,
): Promise<TransactionValidation> {
  const config = await context.config(currencyId);
  const fees = customFees?.value ?? 0n;
  const nativeBalance = balances.find(balance => balance.asset.type === "native")?.value ?? 0n;
  const sweep = amountParameter(customFees?.parameters, "amount");
  const amount = computeAmount(intent, nativeBalance, fees, sweep);

  const recipient = await validateRecipient(currencyId, config.name, intent);
  const funds = validateAmount(currencyId, intent, amount, fees, nativeBalance, customFees);
  const fee = validateFees(fees, customFees?.parameters);
  const opReturn = validateOpReturn(currencyId, intent);
  const feeRatio = validateFeeRatio(customFees, amount, fees);

  return {
    errors: {
      ...recipient.errors,
      ...funds.errors,
      ...fee.errors,
      ...opReturn.errors,
      ...feeRatio.errors,
    },
    warnings: {
      ...recipient.warnings,
      ...funds.warnings,
      ...fee.warnings,
      ...opReturn.warnings,
      ...feeRatio.warnings,
    },
    estimatedFees: fees,
    amount,
    totalSpent: amount + fees,
  };
}
