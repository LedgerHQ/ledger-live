import React from "react";
import { AccountLike } from "@ledgerhq/types-live";
import { isAccount } from "@ledgerhq/live-common/account/index";
import { StakeBanner as EthereumStakeBanner } from "~/renderer/families/ethereum/StakeBanner";
import { StakeBanner as CosmosStakeBanner } from "~/renderer/families/cosmos/StakeBanner";
import { CosmosAccount } from "@ledgerhq/live-common/families/cosmos/types";

export const AccountStakeBanner = ({ account }: { account: AccountLike | null }) => {
  if (!account) return null;

  if (isAccount(account)) {
    switch (account.currency.id) {
      case "ethereum":
        return <EthereumStakeBanner account={account} />;
      case "cosmos":
        return <CosmosStakeBanner account={account as CosmosAccount} />;
      default:
        return null;
    }
  }

  return null;
};
