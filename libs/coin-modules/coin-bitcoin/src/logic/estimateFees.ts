import type { FeeEstimation } from "@ledgerhq/coin-module-framework/api/types";
import type { BitcoinContext } from "../config";
import type { BitcoinIntent } from "./intent";
import { amountParameter } from "./feeParameters";
import { coinControlOf } from "./intent";
import { planTransaction } from "./planTransaction";
import type { UtxoSelection } from "./selectUtxos";
import { cryptoFor } from "./selectUtxos";

/**
 * Fee of the transaction an intent would produce, for a single-address account: the transaction
 * `planTransaction` plans, so the estimate prices exactly what `craftTransaction` builds.
 *
 * `customFeesParameters` may carry `feesStrategy` (`fast` | `medium` | `slow`, default `medium`, or
 * `custom`) and `feePerByte` (sat/vB): see `getFeeRate`. A caller that knows its absolute fee passes
 * it as `fees` (sat): the estimate is then priced with that fee, as `craftTransaction` will be, so its
 * `value`, send-max `amount` and `sufficient` are the transaction's. Under `custom` without a rate
 * nor `fees`, the caller imposes a fee it does not give: the estimate is priced at the network's
 * minimum relay rate and returns no `feePerByte`.
 * Without a valid recipient yet, the fee is priced with an output of the sender's own type.
 *
 * The returned `parameters` describe the priced transaction: the rate, the network's minimum relay
 * rate, the minimum rate increase of a replacement (`incrementalRelayFeePerByte`) and the virtual
 * size (with which `validateIntent` refuses a fee below the relay minimum), the number of inputs,
 * the change, whether the outputs cover the intent (`sufficient`) and, for `useAllAmount`, the exact
 * `amount` the transaction sends, or under an absolute fee the `sweepValue` of the outputs it spends;
 * under an absolute fee, a selection's `selectedValue` too.
 *
 * A replacement (see `planTransaction`) is priced like any transaction: the BIP-125 minimum fee
 * depends on the replaced transactions' fees, which the caller knows; the node refuses a lower fee
 * at `broadcast`.
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
  const fixedFee = amountParameter(customFeesParameters, "fees");
  const imposesFee = fixedFee !== undefined && fixedFee > 0n;
  const { selection, feePerByte, relayFeePerByte, incrementalRelayFeePerByte, vsize } =
    await planTransaction(
      config,
      currencyId,
      intent,
      // Under the caller's fee, a rate is ignored, as crafting ignores it: it would otherwise leave
      // out of a sweep the small outputs crafting, priced at the relay rate, spends.
      imposesFee
        ? { feesStrategy: customFeesParameters?.feesStrategy, fixedFee }
        : {
            feePerByte: customFeesParameters?.feePerByte,
            feesStrategy: customFeesParameters?.feesStrategy,
          },
      recipientScript,
    );

  // A custom absolute fee the caller does not give (custom strategy without a rate nor `fees`) is
  // only priced at the relay floor meanwhile. Its rate and send-max amount are not returned, so that
  // these parameters, passed back with the caller's fee, never impose a rate on crafting.
  const absoluteFee =
    !imposesFee &&
    customFeesParameters?.feesStrategy === "custom" &&
    customFeesParameters.feePerByte === undefined;
  return {
    value: selection.fee,
    parameters: {
      // Priced with the caller's fee: the rate it works out to is not returned, so that crafting,
      // given these parameters back, keeps the fee rather than a rate.
      ...(absoluteFee || imposesFee ? {} : { feePerByte }),
      // `fees` imposes the fee on crafting; `fixedFee` tells validation that `value` was priced with
      // it, change below the dust threshold included.
      ...(imposesFee ? { fees: fixedFee, fixedFee } : {}),
      relayFeePerByte,
      incrementalRelayFeePerByte,
      vsize: BigInt(vsize),
      inputCount: selection.inputs.length,
      change: selection.change,
      sufficient: selection.sufficient,
      ...amountParameters(intent, selection, absoluteFee),
    },
  };
}

/**
 * What `validateIntent` measures the amount against. For a send-max, the exact amount it sends,
 * which the generic bridge uses as is. Under an absolute fee the estimate was not given, the
 * caller's fee replaces this estimate's, so the value of the inputs instead, which do not depend on
 * the fee: a sweep's (`sweepValue`, the amount being what the fee leaves, coin control applied), or a
 * selection's, spent exactly (`selectedValue`, which must cover the amount and the fee).
 */
function amountParameters(
  intent: BitcoinIntent,
  selection: UtxoSelection,
  absoluteFee: boolean,
): { amount: bigint } | { sweepValue: bigint } | { selectedValue: bigint } | Record<string, never> {
  const inputsValue = () => selection.inputs.reduce((sum, utxo) => sum + BigInt(utxo.value), 0n);
  if (intent.useAllAmount) {
    return absoluteFee ? { sweepValue: inputsValue() } : { amount: selection.amount };
  }
  if (absoluteFee && coinControlOf(intent).selected.length > 0) {
    return { selectedValue: inputsValue() };
  }
  return {};
}
