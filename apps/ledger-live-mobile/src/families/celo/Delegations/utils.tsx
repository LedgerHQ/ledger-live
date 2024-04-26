import BigNumber from "bignumber.js";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { CeloAccount } from "@ledgerhq/live-common/families/celo/types";
import { useAccountUnit } from "~/hooks/useAccountUnit";

export const formatAmount = (account: CeloAccount, amount: BigNumber) => {
  const unit = useAccountUnit(account);
  return formatCurrencyUnit(unit, new BigNumber(amount), {
    disableRounding: false,
    alwaysShowSign: false,
    showCode: true,
  });
};
