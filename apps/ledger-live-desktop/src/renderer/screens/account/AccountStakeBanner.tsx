import React from "react";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { isAccount } from "@ledgerhq/live-common/account/index";
import generated from "~/renderer/generated/StakeBanner";

type Generated = Record<string, React.FC<{ account: Account }>>;

export const AccountStakeBanner = ({ account }: { account: AccountLike }) => {
  if (account && isAccount(account)) {
    const Comp = (generated as Generated)[account.currency.family];
    if (Comp) return <Comp account={account} />;
  }
  return null;
};
