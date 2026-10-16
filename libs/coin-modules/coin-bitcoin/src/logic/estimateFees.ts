import { maxTxVBytesCeil } from "@ledgerhq/wallet-btc/utils";
import type { FeeEstimation } from "@ledgerhq/coin-module-framework/api/types";
import type { Explorer } from "../network/explorer";
import { cryptoFor } from "./currency";
import {
  derivationModeOf,
  feeInputs,
  opReturnBuffer,
  recipientScript,
  resolveIntent,
  shapeOf,
  type BitcoinIntent,
  type ResolvedIntent,
} from "./intent";
import type { TxShape } from "./shape";
import type { BitcoinFeeParameters } from "./types";
import { ESTIMATION_RECIPIENTS } from "../constants";

const toBigInt = (n: { toFixed: () => string }): bigint => BigInt(n.toFixed());

function baseParameters(resolved: ResolvedIntent): BitcoinFeeParameters {
  const { rates, feePerByte, replacement } = resolved;
  return {
    feePerByte: toBigInt(feePerByte.integerValue()),
    feeRates: {
      slow: toBigInt(rates.slow),
      medium: toBigInt(rates.medium),
      fast: toBigInt(rates.fast),
    },
    relayFeePerByte: toBigInt(rates.relay),
    inputs: [],
    outputs: [],
    ...(replacement
      ? {
          minReplacementFee: replacement.minReplacementFee,
          originalFeePerByte: toBigInt(replacement.original.feePerByte),
          originalFee: replacement.originalFee,
          minReplacementFeePerByte: toBigInt(replacement.minReplacementFeePerByte),
          replacedInputs: replacement.original.inputs.map(({ txid, vout, value, address }) => ({
            txid,
            vout,
            value,
            address,
          })),
          replacedOutputs: replacement.original.outputs.map(({ address, value }) => ({
            address,
            value,
          })),
        }
      : {}),
  };
}

/**
 * Fee of a transaction whose inputs could not be laid out (not enough funds, recipient still being
 * typed): what spending the given inputs, or a single one, would cost. Validation reports why.
 */
function nominalFee(currencyId: string, intent: BitcoinIntent, resolved: ResolvedIntent): bigint {
  const { data, feePerByte } = resolved;
  const crypto = cryptoFor(currencyId);
  const scripts = [
    recipientScript(currencyId, intent.recipient),
    (() => {
      const opReturn = opReturnBuffer(data);
      return opReturn ? crypto.toOpReturnOutputScript(opReturn) : undefined;
    })(),
  ].filter((s): s is Buffer => s !== undefined);
  const inputCount = Math.max(1, data.inputs?.length ?? 0);
  const rate = Math.max(1, Math.ceil(feePerByte.toNumber()));
  return BigInt(rate * maxTxVBytesCeil(inputCount, scripts, true, crypto, derivationModeOf(data)));
}

function shapeParameters(shape: TxShape, useAllAmount: boolean): Partial<BitcoinFeeParameters> {
  return {
    inputs: shape.inputs.map(i => ({
      txid: i.txid,
      vout: i.vout,
      value: i.value,
      address: i.address,
    })),
    outputs: shape.outputs.map(o => ({ address: o.address, value: o.value, isChange: o.isChange })),
    ...(useAllAmount ? { amount: shape.amount } : {}),
  };
}

/**
 * Prices the transaction spending the intent's inputs. Without inputs — the caller has not
 * selected any yet — it returns the fee rates and the cost of a one-input transaction, which is
 * what a coin selection needs to start from.
 */
export async function estimateFees(
  explorer: Explorer,
  currencyId: string,
  intent: BitcoinIntent,
  customFeesParameters?: FeeEstimation["parameters"],
): Promise<FeeEstimation> {
  const resolved = await resolveIntent(
    explorer,
    currencyId,
    intent,
    feeInputs(intent, customFeesParameters),
  );
  const parameters = baseParameters(resolved);

  // A recipient still being typed is priced as the currency's estimation recipient: send-max needs
  // a figure before the recipient is valid, and output sizes only differ by the script type.
  const pricedIntent = recipientScript(currencyId, intent.recipient)
    ? intent
    : { ...intent, recipient: ESTIMATION_RECIPIENTS[currencyId] ?? intent.recipient };

  if (resolved.data.inputs?.length && recipientScript(currencyId, pricedIntent.recipient)) {
    try {
      const shape = shapeOf(currencyId, pricedIntent, resolved);
      return {
        value: shape.fee,
        parameters: { ...parameters, ...shapeParameters(shape, !!intent.useAllAmount) },
      };
    } catch {
      // Reported by validateIntent; the estimation stays usable meanwhile.
    }
  }

  const value = nominalFee(currencyId, pricedIntent, resolved);
  return {
    value,
    parameters: {
      ...parameters,
      ...(intent.useAllAmount ? { amount: 0n } : {}),
    },
  };
}
