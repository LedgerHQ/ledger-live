// @flow
import type { Account } from "@ledgerhq/live-common/types/index";
import React from "react";
import Validators from "./Validators";
import Votes from "./Votes";

type Props = {
  account: Account,
};

const HeliumBodyHeader = ({ account }: Props) => {
  if (!account.heliumResources) return null;

  return (
    <>
      <Validators account={account} />
      <Votes account={account} />
    </>
  );
};

export default HeliumBodyHeader;
