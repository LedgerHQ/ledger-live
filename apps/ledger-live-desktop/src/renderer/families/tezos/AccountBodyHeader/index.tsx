import React from "react";
import Delegation from "../Delegation";
import { SubAccount } from "@ledgerhq/types-live";
import { TezosAccount } from "@ledgerhq/live-common/families/tezos/types";

type Props = {
  account: TezosAccount | SubAccount;
  parentAccount: TezosAccount | undefined | null;
};

const AccountBodyHeader = ({ account, parentAccount }: Props) => (
  <Delegation account={account} parentAccount={parentAccount} />
);

export default AccountBodyHeader;
