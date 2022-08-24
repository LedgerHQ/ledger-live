import BigNumber from "bignumber.js";
import { getAccountUnit } from "@ledgerhq/live-common/account/index";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { CeloAccount } from "@ledgerhq/live-common/lib/families/celo/types";

export const formatAmount = (account: CeloAccount, amount: BigNumber) => {
  const unit = getAccountUnit(account);
  return formatCurrencyUnit(unit, new BigNumber(amount), {
    disableRounding: false,
    alwaysShowSign: false,
    showCode: true,
  });
};
