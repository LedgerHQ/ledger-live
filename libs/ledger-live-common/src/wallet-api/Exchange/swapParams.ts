import BigNumber from "bignumber.js";
import { parseFiniteBigNumber } from "@ledgerhq/ledger-wallet-framework/bignumber";
import { isValidGasLimit } from "../../families/evm/utils";
import { createWrongSwapParams, ExchangeError } from "./error";

type TransformableObject = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

/** Custom fee config keys holding numbers, across families (see getCustomFeesPerFamily). */
const NUMERIC_FEE_KEYS: ReadonlySet<string> = new Set([
  "gasPrice",
  "maxFeePerGas",
  "maxPriorityFeePerGas",
  "gasLimit",
  "feePerByte",
  "fees",
]);

function wrongSwapParam(name: string, value: unknown): ExchangeError {
  return new ExchangeError(createWrongSwapParams({ [name]: value }));
}

/** A required decimal Live App number, rejected as wrong swap params when unreadable. */
export function parseSwapNumericParam(name: string, value: unknown): BigNumber {
  const parsed = parseFiniteBigNumber(value);
  if (!parsed) throw wrongSwapParam(name, value);
  return parsed;
}

/** A Live App custom fee value: nullish or "" is 0 (as in v9), decimal or hex is read, anything else is rejected. */
export function parseSwapFeeValue(name: string, value: unknown): BigNumber {
  if (value === undefined || value === null || value === "") return new BigNumber(0);
  const parsed = parseFiniteBigNumber(value, { allowHex: true });
  if (!parsed) throw wrongSwapParam(name, value);
  return parsed;
}

/** Reads the known numeric fee keys of a Live App custom fee config: nullish kept, "" is undefined, garbage rejected. */
export function transformToBigNumbers(
  obj: TransformableObject,
  path = "customFeeConfig",
): TransformableObject {
  const transformedObj: TransformableObject = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      const valuePath = `${path}.${key}`;
      if (value === undefined || value === null) {
        transformedObj[key] = value;
      } else if (NUMERIC_FEE_KEYS.has(key)) {
        transformedObj[key] = value === "" ? undefined : parseSwapFeeValue(valuePath, value);
      } else if (
        typeof value === "object" &&
        !BigNumber.isBigNumber(value) &&
        key !== "utxoStrategy"
      ) {
        transformedObj[key] = transformToBigNumbers(value, valuePath);
      } else {
        transformedObj[key] = value;
      }
    }
  }

  return transformedObj;
}

/** The amount and gas limit of a fee estimate; no amount yet is 0, an invalid one is rejected. */
export function parseSwapFeeParams({
  fromAmount,
  gasLimit,
}: {
  fromAmount?: string | null;
  gasLimit?: string;
}) {
  const amount = fromAmount ? parseSwapNumericParam("fromAmount", fromAmount) : new BigNumber(0);
  if (amount.isNegative()) throw wrongSwapParam("fromAmount", fromAmount);
  if (!gasLimit) return { fromAmount: amount, gasLimit: null };
  const parsedGasLimit = parseFiniteBigNumber(gasLimit, { allowHex: true });
  if (!parsedGasLimit || !isValidGasLimit(parsedGasLimit))
    throw wrongSwapParam("gasLimit", gasLimit);
  return { fromAmount: amount, gasLimit: parsedGasLimit };
}

/** Reads the amounts of a swap already broadcast: never throws, so the history entry is always saved. */
export function parseSwapHistoryAmounts({
  fromAmount,
  toAmount,
  finalAmount,
}: {
  fromAmount: string;
  toAmount: string;
  finalAmount?: string;
}): { fromAmount: BigNumber; toAmount: BigNumber; finalAmount: BigNumber | undefined } {
  const from = parseFiniteBigNumber(fromAmount);
  const to = parseFiniteBigNumber(toAmount);
  const final = finalAmount ? parseFiniteBigNumber(finalAmount) : undefined;
  if (!from || !to || (finalAmount && !final)) {
    console.warn("Swap history saved with fallback amounts for unreadable values", {
      fromAmount,
      toAmount,
      finalAmount,
    });
  }
  return {
    fromAmount: from ?? new BigNumber(0),
    toAmount: to ?? new BigNumber(0),
    finalAmount: final,
  };
}
