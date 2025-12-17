import React from "react";
import DelegatedPositions from "~/renderer/families/hedera/DelegatedPositions";
import type { HederaFamily } from "~/renderer/families/hedera/types";

const AccountBodyHeader: HederaFamily["AccountBodyHeader"] = ({ account }) => {
  return <DelegatedPositions account={account} />;
};

export default AccountBodyHeader;
