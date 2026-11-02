import React from "react";
import type { TokenAccount } from "@ledgerhq/types-live";
import type { SolanaAccount } from "@ledgerhq/live-common/families/solana/types";
import { AccountDelegations } from "@features/flow-account-detail-delegations";
import { useSolanaDelegationsViewModel } from "./useSolanaDelegationsViewModel";

const SolanaDelegations = ({ account }: { account: SolanaAccount }) => {
  const props = useSolanaDelegationsViewModel(account);
  return props ? <AccountDelegations {...props} /> : null;
};

const AccountDetailDelegations = ({ account }: { account: SolanaAccount | TokenAccount }) =>
  account.type === "Account" ? <SolanaDelegations account={account} /> : null;

export default AccountDetailDelegations;
