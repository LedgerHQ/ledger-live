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
import { DustLimit } from "../errors";
import { validateAddress } from "./validateAddress";
import { type BitcoinIntent, opReturnScript } from "./intent";
import { cryptoFor, paymentDustThreshold } from "./selectUtxos";

/**
 * Fee-agnostic validation of a transaction intent, from the intent and the balances passed in,
 * plus `customFees` when provided. Makes no network call.
 *
 * A `useAllAmount` intent sends the amount `estimateFees` priced for that sweep, when `customFees`
 * carries it (`parameters.amount`): every spendable output minus the fee. Otherwise, as under a
 * custom fee, it sends the native balance minus `customFees`.
 *
 * Funds: when `customFees` comes from `estimateFees`, its `parameters.sufficient` is the verdict,
 * since the estimate selected from the outputs crafting spends (confirmed ones and the address's
 * own unconfirmed change, see `getSpendableUtxos`), which a confirmed balance does not show.
 * Otherwise the amount and the fee are checked against the native balance passed in.
 *
 * An amount below the dust threshold of the payment is refused (`DustLimit`). OP_RETURN data
 * (`intent.data.opReturnData`) over the relay limit is refused (`OpReturnDataSizeLimit`, under
 * `opReturnSizeLimit`, as the bridge reports it), as is data that is not hex.
 */
export async function validateIntent(
  currencyId: string,
  intent: BitcoinIntent,
  balances: Balance[],
  customFees?: FeeEstimation,
): Promise<TransactionValidation> {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  const fees = customFees?.value ?? 0n;
  const nativeBalance = balances.find(balance => balance.asset.type === "native")?.value ?? 0n;
  // The exact amount of a send-max, when the estimate behind `customFees` priced one; otherwise the
  // balance minus the fees.
  const estimatedSweep = customFees?.parameters?.amount;
  const maxAmount =
    typeof estimatedSweep === "bigint"
      ? estimatedSweep
      : nativeBalance > fees
        ? nativeBalance - fees
        : 0n;
  const amount = intent.useAllAmount ? maxAmount : intent.amount;
  const sufficientParameter = customFees?.parameters?.sufficient;
  const estimatedSufficient =
    typeof sufficientParameter === "boolean" ? sufficientParameter : undefined;

  if (!intent.recipient) {
    errors.recipient = new RecipientRequired();
  } else if (!(await validateAddress(intent.recipient, { currencyId }))) {
    errors.recipient = new InvalidAddress("", { currencyName: currencyId });
  }

  const dust =
    errors.recipient === undefined
      ? paymentDustThreshold(currencyId, intent.sender, intent.recipient)
      : undefined;
  if (amount <= 0n) {
    errors.amount = intent.useAllAmount ? new NotEnoughBalance() : new AmountRequired();
  } else if (
    estimatedSufficient === false ||
    (estimatedSufficient === undefined &&
      !(intent.useAllAmount && typeof estimatedSweep === "bigint") &&
      amount + fees > nativeBalance)
  ) {
    errors.amount = new NotEnoughBalance();
  } else if (dust !== undefined && amount < dust) {
    errors.amount = new DustLimit();
  }

  try {
    opReturnScript(intent, cryptoFor(currencyId));
  } catch (error) {
    errors.opReturnSizeLimit = error instanceof Error ? error : new Error(String(error));
  }

  if (customFees && amount > 0n && fees * 10n > amount) {
    warnings.feeTooHigh = new FeeTooHigh();
  }

  return { errors, warnings, estimatedFees: fees, amount, totalSpent: amount + fees };
}
