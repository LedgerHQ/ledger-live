import type { FeeEstimation } from "@ledgerhq/coin-module-framework/api/types";
import type { BitcoinContext } from "../config";
import { getFeeRate } from "./getFeeRate";
import { getSpendableUtxos } from "./getSpendableUtxos";
import { type BitcoinIntent, opReturnScript } from "./intent";
import { cryptoFor, derivationModeOf, selectUtxos } from "./selectUtxos";

/**
 * Fee of the transaction an intent would produce, for a single-address account.
 *
 * The sender's spendable outputs (see `getSpendableUtxos`) are selected as the transaction would
 * spend them (every output worth spending for `useAllAmount`), with the OP_RETURN output when the
 * intent carries data, and the fee is the transaction's size times the fee rate.
 *
 * `customFeesParameters` may carry `feesStrategy` (`fast` | `medium` | `slow`, default `medium`, or
 * `custom`) and `feePerByte` (sat/vB): see `getFeeRate`. Under `custom` without a rate (the caller
 * imposes an absolute fee instead), the estimate is priced at the network's minimum relay rate.
 * Without a valid recipient yet, the fee is priced with an output of the sender's own type.
 *
 * The returned `parameters` describe the priced transaction: the rate, the number of inputs, the
 * change, whether the outputs cover the intent (`sufficient`) and, for `useAllAmount`, the exact
 * `amount` the transaction sends.
 */
export async function estimateFees(
  context: BitcoinContext,
  currencyId: string,
  intent: BitcoinIntent,
  customFeesParameters?: FeeEstimation["parameters"],
): Promise<FeeEstimation> {
  const crypto = cryptoFor(currencyId);
  const senderScript = crypto.toOutputScript(intent.sender);
  const derivationMode = derivationModeOf(senderScript);
  const recipientScript =
    intent.recipient && crypto.validateAddress(intent.recipient)
      ? crypto.toOutputScript(intent.recipient)
      : senderScript;
  const opReturn = opReturnScript(intent, crypto);

  const config = await context.config(currencyId);
  const [utxos, { feePerByte, relayFeePerByte }] = await Promise.all([
    getSpendableUtxos(config, currencyId, intent.sender),
    getFeeRate(config, currencyId, {
      feePerByte: customFeesParameters?.feePerByte,
      feesStrategy: customFeesParameters?.feesStrategy,
    }),
  ]);

  const selection = selectUtxos({
    utxos,
    amount: intent.amount,
    useAllAmount: !!intent.useAllAmount,
    recipientScript,
    crypto,
    derivationMode,
    feePerByte,
    relayFeePerByte,
    ...(opReturn ? { extraOutputScripts: [opReturn] } : {}),
  });

  return {
    value: selection.fee,
    parameters: {
      feePerByte,
      inputCount: selection.inputs.length,
      change: selection.change,
      sufficient: selection.sufficient,
      // Exact amount a send-max transaction sends; the generic bridge uses it as is. Not under a
      // custom absolute fee (custom strategy without a rate): the amount then follows from that
      // fee, which this estimate does not know.
      ...(intent.useAllAmount &&
      !(
        customFeesParameters?.feesStrategy === "custom" &&
        customFeesParameters.feePerByte === undefined
      )
        ? { amount: selection.amount }
        : {}),
    },
  };
}
