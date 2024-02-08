import BigNumber from "bignumber.js";
import { getAccountUnit } from "../../account";
import { formatCurrencyUnit } from "../../currencies";
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

  if (iconResources.nonce) {
    str += "\nonce : " + iconResources.nonce;
  }

  return str;
}
export default {
  formatAccountSpecifics,
};
