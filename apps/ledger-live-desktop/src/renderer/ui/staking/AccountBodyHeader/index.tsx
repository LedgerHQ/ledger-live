import React from "react";
import Delegation from "../Delegation";
import { Account, TokenAccount } from "@ledgerhq/types-live";

type Props = {
  account: Account | TokenAccount;
  parentAccount: Account | undefined | null;
};

const AccountBodyHeader = ({ account, parentAccount }: Props) => (
  <Delegation account={account} parentAccount={parentAccount} />
);

export default AccountBodyHeader;
