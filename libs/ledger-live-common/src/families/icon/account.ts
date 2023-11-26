import { BigNumber } from "bignumber.js";
import type { Operation } from "@ledgerhq/types-live";
import { getAccountUnit } from "../../account";
import { formatCurrencyUnit } from "../../currencies";
import type { Unit } from "@ledgerhq/types-cryptoassets";
import { IconAccount } from "./types";

function formatAccountSpecifics(account: IconAccount): string {
  const { iconResources } = account;
  if (!iconResources) {
    throw new Error("icon account expected");
  }

  const unit = getAccountUnit(account);
  const formatConfig = {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
  };

  let str = " ";

  str += formatCurrencyUnit(unit, account.spendableBalance, formatConfig) + " spendable. ";

  if (iconResources.additionalBalance.gt(0)) {
    str +=
      formatCurrencyUnit(unit, iconResources.additionalBalance, formatConfig) + " additional. ";
  }

  if (iconResources.nonce) {
    str += "\nonce : " + iconResources.nonce;
  }

  return str;
}

// function formatOperationSpecifics(op: Operation, unit: Unit | null | undefined): string {
//   const { extra }  = op;

//   let str = " ";

//   const formatConfig = {
//     disableRounding: true,
//     alwaysShowSign: false,
//     showCode: true,
//     subMagnitude: 2,
//   };

//   str +=
//   extra && !Number.isNaN(extra)
//       ? `\n    additionalField: ${
//           unit ? formatCurrencyUnit(unit, extra, formatConfig) : extra
//         }`
//       : "";

//   return str;
// }

export function fromOperationExtraRaw(extra: any | null | undefined) {
  if (extra && extra.additionalField) {
    extra = {
      ...extra,
      additionalField: new BigNumber(extra.additionalField),
    };
  }
  return extra;
}

export function toOperationExtraRaw(extra: any | null | undefined) {
  if (extra && extra.additionalField) {
    extra = {
      ...extra,
      additionalField: extra.additionalField.toString(),
    };
  }
  return extra;
}

export default {
  formatAccountSpecifics,
  //formatOperationSpecifics,
  fromOperationExtraRaw,
  toOperationExtraRaw,
};
