import React from "react";
import { AccountLike } from "@ledgerhq/types-live";
import { isAccount } from "@ledgerhq/live-common/account/index";
import { getLLDCoinFamily } from "~/renderer/families";

export const AccountIncompleteHistoryBanner = ({ account }: { account: AccountLike }) => {
  if (account && isAccount(account)) {
    const Comp = getLLDCoinFamily(account.currency.family).IncompleteHistoryBanner;

    if (Comp) {
      return <Comp account={account} />;
    }
  }

  return null;
};
