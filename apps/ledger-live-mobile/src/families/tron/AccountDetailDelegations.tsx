import React from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { TronAccount } from "@ledgerhq/live-common/families/tron/types";
import { AccountDelegations } from "@features/flow-account-detail-delegations";
import { useTronDelegationsViewModel } from "./useTronDelegationsViewModel";

const TronDelegations = ({ account }: Readonly<{ account: TronAccount }>) => {
  const props = useTronDelegationsViewModel(account);
  return props ? <AccountDelegations {...props} /> : null;
};

const AccountDetailDelegations = ({
  account,
}: Readonly<{ account: AccountLike; parentAccount?: Account }>) =>
  account.type === "Account" && (account as TronAccount).tronResources ? (
    <TronDelegations account={account as TronAccount} />
  ) : null;

export default AccountDetailDelegations;
