import React from "react";
import type { AccountLike } from "@ledgerhq/types-live";
import type { SolanaAccount } from "@ledgerhq/live-common/families/solana/types";
import { AccountDelegations } from "@features/flow-account-detail-delegations";
import { useSolanaDelegationsViewModel } from "./useSolanaDelegationsViewModel";

const SolanaDelegations = ({ account }: Readonly<{ account: SolanaAccount }>) => (
  <AccountDelegations {...useSolanaDelegationsViewModel(account)} />
);

const AccountDetailDelegations = ({ account }: Readonly<{ account: AccountLike }>) =>
  (account as SolanaAccount).stakingResources ? (
    <SolanaDelegations account={account as SolanaAccount} />
  ) : null;

export default AccountDetailDelegations;
