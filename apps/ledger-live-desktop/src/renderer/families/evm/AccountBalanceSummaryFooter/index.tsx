import React, { memo } from "react";
import { EvmFamily } from "../types";
import Celo from "./Celo";

const AccountBalanceSummaryFooter: EvmFamily["AccountBalanceSummaryFooter"] = ({
  account,
  counterValue,
  discreetMode,
}) => {
  if (account.type !== "Account") return null;

  switch (account.currency.id) {
    case "celo_evm":
      return <Celo account={account} counterValue={counterValue} discreetMode={discreetMode} />;
    default:
      return;
  }
};

export default memo(AccountBalanceSummaryFooter);
