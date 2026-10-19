import type { FeeEstimation } from "@ledgerhq/coin-module-framework/api/types";
import type { BitcoinContext } from "../config";
import type { BitcoinIntent } from "./intent";
import { planTransaction } from "./planTransaction";
import { cryptoFor } from "./selectUtxos";

/**
 * Fee of the transaction an intent would produce, for a single-address account: the transaction
 * `planTransaction` plans, so the estimate prices exactly what `craftTransaction` builds.
 *
 * `customFeesParameters` may carry `feesStrategy` (`fast` | `medium` | `slow`, default `medium`, or
 * `custom`) and `feePerByte` (sat/vB): see `getFeeRate`. Under `custom` without a rate (the caller
 * imposes an absolute fee instead), the estimate is priced at the network's minimum relay rate and
 * returns no `feePerByte`.
 * Without a valid recipient yet, the fee is priced with an output of the sender's own type.
 *
 * The returned `parameters` describe the priced transaction: the rate, the network's minimum relay
 * rate and the virtual size (with which `validateIntent` refuses a fee below the relay minimum), the
 * number of inputs, the change, whether the outputs cover the intent (`sufficient`) and, for
 * `useAllAmount`, the exact `amount` the transaction sends.
 */
export async function estimateFees(
  context: BitcoinContext,
  currencyId: string,
  intent: BitcoinIntent,
  customFeesParameters?: FeeEstimation["parameters"],
): Promise<FeeEstimation> {
  const crypto = cryptoFor(currencyId);
  const recipientScript =
    intent.recipient && crypto.validateAddress(intent.recipient)
      ? crypto.toOutputScript(intent.recipient)
      : crypto.toOutputScript(intent.sender);

  const config = await context.config(currencyId);
  const { selection, feePerByte, relayFeePerByte, vsize } = await planTransaction(
    config,
    currencyId,
    intent,
    {
      feePerByte: customFeesParameters?.feePerByte,
      feesStrategy: customFeesParameters?.feesStrategy,
    },
    recipientScript,
  );

  // A custom absolute fee (custom strategy without a rate) is the caller's: this estimate is only
  // priced at the relay floor meanwhile. Its rate and send-max amount are not returned, so that
  // these parameters, passed back with the caller's fee, never impose a rate on crafting.
  const absoluteFee =
    customFeesParameters?.feesStrategy === "custom" &&
    customFeesParameters.feePerByte === undefined;
  return {
    value: selection.fee,
    parameters: {
      ...(absoluteFee ? {} : { feePerByte }),
      relayFeePerByte,
      vsize: BigInt(vsize),
      inputCount: selection.inputs.length,
      change: selection.change,
      sufficient: selection.sufficient,
      // Exact amount a send-max transaction sends; the generic bridge uses it as is.
      ...(intent.useAllAmount && !absoluteFee ? { amount: selection.amount } : {}),
    },
  };
}
