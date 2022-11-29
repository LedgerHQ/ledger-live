import BigNumber from "bignumber.js";
import type { Operation } from "@ledgerhq/types-live";
import { formatAccountSpecifics } from "../cosmos/account";
import { CosmosExtraTxInfo } from "../cosmos/types";

function formatOperationSpecifics(op: Operation): string {
  const { memo, validators, autoClaimedRewards } = op.extra;
  let str = " ";
  if (validators && validators.length > 0) {
    str += validators
      .map((v) => {
        `\n    to ${v.address} ${v.amount}`;
      })
      .join("");
  }

  if (autoClaimedRewards) {
    str += `\n auto claimed rewards is: ${autoClaimedRewards.toString()}`;
  }
  if (memo) {
    str += `\n    Memo: ${memo}`;
  }
  return str;
}

export function fromOperationExtraRaw(
  extra: Record<string, any> | null | undefined
): CosmosExtraTxInfo | Record<string, any> | null | undefined {
  let e = {};
  if (extra && extra.validators) {
    e = {
      ...extra,
      validators: extra.validators.map((o) => ({
        ...o,
        amount: new BigNumber(o.amount),
      })),
    };
  }

  return e;
}
export function toOperationExtraRaw(
  extra: Record<string, any> | null | undefined
): CosmosExtraTxInfo | Record<string, any> | null | undefined {
  let e = {};

  if (extra && extra.validators) {
    e = {
      ...extra,
      validators: extra.validators.map((o) => ({
        ...o,
        amount: o.amount.toString(),
      })),
    };
  }

  return e;
}

export default {
  formatOperationSpecifics,
  fromOperationExtraRaw,
  toOperationExtraRaw,
  formatAccountSpecifics,
};
