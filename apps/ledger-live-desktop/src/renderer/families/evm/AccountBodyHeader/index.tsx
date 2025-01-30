import React, { memo } from "react";
import EditStuckTransactionPanelBodyHeader from "../EditTransaction/EditStuckTransactionPanelBodyHeader";
import { EvmFamily } from "../types";
import Celo from "./Celo";

const CurrencySpecificAccountBodyHeader: EvmFamily["AccountBodyHeader"] = props => {
  const { account } = props;
  if (account.type !== "Account") return null;

  switch (account.currency.id) {
    case "celo_evm":
      return <Celo {...props} />;
    default:
      return null;
  }
};

const AccountBodyHeader: EvmFamily["AccountBodyHeader"] = props => {
  return (
    <>
      <EditStuckTransactionPanelBodyHeader {...props} />
      <CurrencySpecificAccountBodyHeader {...props} />
    </>
  );
};
export default memo(AccountBodyHeader);
