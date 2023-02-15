import React from "react";
import { AccountLike } from "@ledgerhq/types-live";
import { isAccount } from "@ledgerhq/live-common/account/index";
import { EthereumStakeBanner } from "~/renderer/families/ethereum/StakeBanner";

export const AccountStakeBanner = ({ account }: { account: AccountLike | null }) => {
  if (!account) return null;

  if (isAccount(account)) {
    switch (account.currency.id) {
      case "ethereum":
        return <EthereumStakeBanner account={account} />;
      default:
        return null;
    }
  }

  return null;
};
