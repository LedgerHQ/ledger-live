// @flow
import type { Account } from "@ledgerhq/live-common/types/index";
import React from "react";
import Votes from "./Votes";

type Props = {
  account: Account,
};

const HeliumBodyHeader = ({ account }: Props) => {
  if (!account.heliumResources) return null;

  // TODO: Enable once ledger team reviews voting feature
  return <>{/* <Votes account={account} /> */}</>;
};

export default HeliumBodyHeader;
