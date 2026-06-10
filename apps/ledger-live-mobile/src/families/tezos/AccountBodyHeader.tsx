import React from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { useFeature } from "@features/platform-feature-flags";
import LegacyAccountBodyHeader from "./LegacyAccountBodyHeader";
import TezosDelegation from "./Delegations";

type Props = Readonly<{
  account: AccountLike;
  parentAccount?: Account;
}>;

export default function TezosAccountBodyHeader({ account, parentAccount }: Props) {
  const stakingDashboard = useFeature("llmTezosStaking");
  if (stakingDashboard?.enabled) {
    return <TezosDelegation account={account} />;
  }
  return <LegacyAccountBodyHeader account={account} parentAccount={parentAccount} />;
}
