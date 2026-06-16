import React from "react";
import { AccountLike } from "@ledgerhq/types-live";
import { isAccount } from "@ledgerhq/live-common/account/index";
import { useLLDCoinFamily } from "~/renderer/families";

export const AccountStakeBanner = ({ account }: { account: AccountLike }) => {
  const Comp = useLLDCoinFamily(
    isAccount(account) ? account.currency.family : undefined,
  ).StakeBanner;
  if (account && isAccount(account) && Comp) return <Comp account={account} />;
  return null;
};
