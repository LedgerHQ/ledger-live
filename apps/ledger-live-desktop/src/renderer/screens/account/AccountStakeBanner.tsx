import React from "react";
import { AccountLike } from "@ledgerhq/types-live";
import { isAccount } from "@ledgerhq/live-common/account/index";
import { getLLDCoinFamily } from "~/renderer/families";

export const AccountStakeBanner = ({ account }: { account: AccountLike }) => {
  if (account && isAccount(account)) {
    const Comp = getLLDCoinFamily(account.currency.family).StakeBanner;
    if (Comp) return <Comp account={account} />;
  }
  return null;
};
