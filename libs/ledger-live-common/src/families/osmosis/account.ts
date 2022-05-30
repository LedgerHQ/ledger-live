import { BigNumber } from "bignumber.js";
import type { Operation } from "../../types";
import { OsmosisExtraTxInfo } from "./types";

function formatOperationSpecifics(op: Operation): string {
  const { memo, validators } = op.extra;
  let str = " ";
  if (validators && validators.length > 0) {
    str += validators
      .map((v) => {
        `\n    to ${v.address} ${v.amount}`; //TODO add proper formatting based on unit being passed
      })
      .join("");
  }
  if (memo) {
    str += `\n    Memo: ${memo}`;
  }
  return str;
}

// TODO verify if this is actually used
export function fromOperationExtraRaw(
  extra: Record<string, any> | null | undefined
): OsmosisExtraTxInfo | Record<string, any> | null | undefined {
  if (extra && extra.validators) {
    return {
      ...extra,
      validators: extra.validators.map((o) => ({
        ...o,
        amount: new BigNumber(o.amount),
      })),
    };
  }

  return extra;
}

// TODO verify if this is actually used
export function toOperationExtraRaw(
  extra: Record<string, any> | null | undefined
): OsmosisExtraTxInfo | Record<string, any> | null | undefined {
  if (extra && extra.validators) {
    return {
      ...extra,
      validators: extra.validators.map((o) => ({
        ...o,
        amount: o.amount.toString(),
      })),
    };
  }

  return extra;
}

export default {
  formatOperationSpecifics,
  fromOperationExtraRaw,
  toOperationExtraRaw,
};
