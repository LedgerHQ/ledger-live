import type { Operation } from "../../types";
import {
  fromOperationExtraRaw,
  toOperationExtraRaw,
  formatAccountSpecifics,
} from "../cosmos/account";

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

export default {
  formatOperationSpecifics,
  fromOperationExtraRaw,
  toOperationExtraRaw,
  formatAccountSpecifics,
};
