import React from "react";
import type { TokenAccount } from "@ledgerhq/types-live";
import type { TronAccount } from "@ledgerhq/live-common/families/tron/types";
import { AccountDelegations } from "@features/flow-account-detail-delegations";
import { useTronDelegationsViewModel } from "./useTronDelegationsViewModel";

const TronDelegations = ({ account }: { account: TronAccount }) => (
  <AccountDelegations {...useTronDelegationsViewModel(account)} />
);

const AccountDetailDelegations = ({ account }: { account: TronAccount | TokenAccount }) =>
  account.type === "Account" && account.tronResources ? (
    <TronDelegations account={account} />
  ) : null;

export default AccountDetailDelegations;
