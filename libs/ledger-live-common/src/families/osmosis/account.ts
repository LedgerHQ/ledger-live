import BigNumber from "bignumber.js";
import type { Operation } from "../../types";
import {
  //   fromOperationExtraRaw,
  //   toOperationExtraRaw,
  formatAccountSpecifics,
} from "../cosmos/account";
import { CosmosExtraTxInfo } from "../cosmos/types";

function formatOperationSpecifics(op: Operation): string {
  const { memo, validators, autoClaimedRewards } = op.extra;
  let str = " ";
  if (validators && validators.length > 0) {
    str += validators
      .map((v) => {
        `\n    to ${v.address} ${v.amount}`; //TODO add proper formatting based on unit being passed
      })
      .join("");
  }

  if (autoClaimedRewards) {
    str += `\n auto claimed rewards is: ${autoClaimedRewards.toString()}`;
    // str += autoClaimedRewards
    //   .map((r) => `\n -> -> auto claimed reward: ${r}`)
    //   .join("");
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
  if (extra && extra.autoClaimedRewards) {
    // console.log(
    //   `fromOperationExtraRaw hit. extra.autoClaimedRewards is not undefined, therefore, extra is: ${JSON.stringify(
    //     extra
    //   )}`
    // );
  }

  // if (extra && extra.autoClaimedRewards) {
  //   e = {
  //     ...extra,
  //     autoClaimedRewards: extra.autoClaimedRewards.map((o) => ({
  //       ...o,
  //       amount: new BigNumber(o),
  //       hello: "something else",
  //     })),
  //   };
  // }

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
  if (extra && extra.autoClaimedRewards) {
    // console.log(
    //   `extra.autoClaimedRewards is not undefined, therefore, extra is: ${JSON.stringify(
    //     extra
    //   )}`
    // );
  }
  //   e = {
  //     ...extra,
  //     autoClaimedRewards: extra.autoClaimedRewards.map((o) => ({
  //       ...o,
  //       hello: "something",
  //     })),
  //   };
  // }

  return e;
}

export default {
  formatOperationSpecifics,
  fromOperationExtraRaw,
  toOperationExtraRaw,
  formatAccountSpecifics,
};
