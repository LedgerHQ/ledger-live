import type {
  Balance,
  FeeEstimation,
  TransactionValidation,
} from "@ledgerhq/coin-module-framework/api/types";
import {
  AmountRequired,
  FeeNotLoaded,
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
import { coinControlOf, opReturnScript } from "./intent";
import { cryptoFor, paymentDustThreshold } from "./selectUtxos";

type Validation = Pick<TransactionValidation, "errors" | "warnings">;

const NONE: Validation = { errors: {}, warnings: {} };

/**
 * The amount the transaction sends: the intent's, or for `useAllAmount` the sweep `estimateFees`
 * priced (`parameters.amount`: every spendable output minus the fee), else the value of the outputs
 * it spends under an absolute fee (`parameters.sweepValue`, coin control applied) minus the fees,
 * else the balance minus the fees.
 */
function computeAmount(
  intent: BitcoinIntent,
  nativeBalance: bigint,
  fees: bigint,
  sweep?: bigint,
  sweepValue?: bigint,
): bigint {
  if (!intent.useAllAmount) return intent.amount;
  if (sweep !== undefined) return sweep;
  const funds = sweepValue ?? nativeBalance;
  return funds > fees ? funds - fees : 0n;
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
 * Whether the funds cover the amount and the fees. A selection under an absolute fee is spent
 * exactly, so its value (`parameters.selectedValue`) must cover both: the estimate's `sufficient`
 * was priced at the relay floor, not at the caller's fee. Otherwise, when the parameters come from
 * `estimateFees`, its `sufficient` is the verdict, since the estimate selected from the outputs
 * crafting spends (confirmed ones and the address's own unconfirmed change, see
 * `getSpendableUtxos`), which a confirmed balance does not show; so is the sweep it priced. Without
 * them, the amount and the fees are checked against the native balance.
 */
function isCovered(
  intent: BitcoinIntent,
  amount: bigint,
  fees: bigint,
  nativeBalance: bigint,
  parameters: FeeEstimation["parameters"],
): boolean {
  const selectedValue = amountParameter(parameters, "selectedValue");
  if (selectedValue !== undefined && !intent.useAllAmount) return amount + fees <= selectedValue;
  if (typeof parameters?.sufficient === "boolean") return parameters.sufficient;
  if (intent.useAllAmount && amountParameter(parameters, "amount") !== undefined) return true;
  return amount + fees <= nativeBalance;
}

/**
 * The amount must be positive, covered by the funds (see `isCovered`), and above the payment's dust
 * threshold.
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

  if (!isCovered(intent, amount, fees, nativeBalance, customFees?.parameters)) {
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
 *
 * A zero fee alongside a rate imposes nothing (crafting follows the rate), but without one it is an
 * absolute fee of zero, below the relay fee too: crafting would otherwise pay the relay fee the
 * summary leaves out.
 */
function validateFees(fees: bigint, parameters: FeeEstimation["parameters"]): Validation {
  if (fees < 0n) {
    return { errors: { fees: new Error("customFees.value must not be negative") }, warnings: {} };
  }

  const relayFeePerByte = amountParameter(parameters, "relayFeePerByte");
  if (relayFeePerByte === undefined) return NONE;
  const vsize = amountParameter(parameters, "vsize");
  const feePerByte = amountParameter(parameters, "feePerByte");
  const absoluteFee = fees > 0n || feePerByte === undefined;
  const belowRelayFee = absoluteFee && vsize !== undefined && fees < vsize * relayFeePerByte;
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

/**
 * The coin control (`intent.data.utxoStrategy`) must be well formed: UTXO ids "txid:vout", none
 * both selected and excluded, a known strategy (reported under `coinControl`). Whether a selected
 * output is spendable needs the network: `estimateFees` and `craftTransaction` report it.
 */
function validateCoinControl(intent: BitcoinIntent): Validation {
  try {
    coinControlOf(intent);
    return NONE;
  } catch (error) {
    const coinControl = error instanceof Error ? error : new Error(String(error));
    return { errors: { coinControl }, warnings: {} };
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
 * Whether `customFees` imposes a fee (`parameters.fees`) its estimate was not priced with
 * (`parameters.fixedFee`). The inputs, the send-max amount and the verdict of an estimate all depend
 * on its fee, so they cannot be checked against another: the caller estimates again with that fee.
 */
function isUnpricedFee(customFees: FeeEstimation | undefined): boolean {
  const customFee = amountParameter(customFees?.parameters, "fees");
  if (customFee === undefined || customFee <= 0n) return false;
  return amountParameter(customFees?.parameters, "fixedFee") !== customFee;
}

/**
 * The fee `customFees` stands for, read in the order `craftTransaction` imposes it: the caller's
 * absolute fee (`parameters.fees`) first, else `value`, the estimate's fee at its rate. An estimate
 * priced with that same fee (`parameters.fixedFee`) keeps its `value`: crafting also pays the change
 * below the dust threshold it gives to the fee.
 */
function feeOf(customFees: FeeEstimation | undefined): bigint {
  const value = customFees?.value ?? 0n;
  const customFee = amountParameter(customFees?.parameters, "fees");
  if (customFee === undefined || customFee <= 0n) return value;
  return isUnpricedFee(customFees) || value < customFee ? customFee : value;
}

/**
 * The estimate's parameters that hold for the fee validated: under a fee it was not priced with, its
 * fee-dependent `amount` and `sufficient` are left out, so that no stale amount is reported.
 */
function parametersFor(customFees: FeeEstimation | undefined): FeeEstimation["parameters"] {
  const parameters = customFees?.parameters;
  if (!isUnpricedFee(customFees)) return parameters;
  const { amount: _amount, sufficient: _sufficient, ...feeIndependent } = parameters ?? {};
  return feeIndependent;
}

/**
 * Fee-agnostic validation of a transaction intent, from the intent and the balances passed in,
 * plus `customFees` when provided: recipient, amount (funds, dust), fees (relay minimum), OP_RETURN
 * data, coin control, and a warning when the fees are high. Makes no network call.
 */
export async function validateIntent(
  context: BitcoinContext,
  currencyId: string,
  intent: BitcoinIntent,
  balances: Balance[],
  customFees?: FeeEstimation,
): Promise<TransactionValidation> {
  const config = await context.config(currencyId);
  const fees = feeOf(customFees);
  const parameters = parametersFor(customFees);
  const nativeBalance = balances.find(balance => balance.asset.type === "native")?.value ?? 0n;
  const sweep = amountParameter(parameters, "amount");
  const sweepValue = amountParameter(parameters, "sweepValue");
  const amount = computeAmount(intent, nativeBalance, fees, sweep, sweepValue);

  const recipient = await validateRecipient(currencyId, config.name, intent);
  const funds = validateAmount(
    currencyId,
    intent,
    amount,
    fees,
    nativeBalance,
    customFees && { ...customFees, ...(parameters === undefined ? {} : { parameters }) },
  );
  const fee = validateFees(fees, customFees?.parameters);
  const opReturn = validateOpReturn(currencyId, intent);
  const coinControl = validateCoinControl(intent);
  const feeRatio = validateFeeRatio(customFees, amount, fees);
  // Reported under `fees`, after the other fee checks: estimating again with this fee clears it.
  const unpriced: Validation = isUnpricedFee(customFees)
    ? { errors: { fees: new FeeNotLoaded() }, warnings: {} }
    : NONE;

  return {
    errors: {
      ...recipient.errors,
      ...funds.errors,
      ...fee.errors,
      ...opReturn.errors,
      ...coinControl.errors,
      ...feeRatio.errors,
      ...unpriced.errors,
    },
    warnings: {
      ...recipient.warnings,
      ...funds.warnings,
      ...fee.warnings,
      ...opReturn.warnings,
      ...coinControl.warnings,
      ...feeRatio.warnings,
    },
    estimatedFees: fees,
    amount,
    totalSpent: amount + fees,
  };
}
