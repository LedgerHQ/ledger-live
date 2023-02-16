import React from "react";
import { AccountLike } from "@ledgerhq/types-live";
import { isAccount, isTokenAccount } from "@ledgerhq/live-common/account/index";
import { StakeBanner as EthereumStakeBanner } from "~/renderer/families/ethereum/StakeBanner";
import { StakeBanner as CosmosStakeBanner } from "~/renderer/families/cosmos/StakeBanner";
import { StakeBanner as SolanaStakeBanner } from "~/renderer/families/solana/StakeBanner";
import { StakeBanner as ElrondStakeBanner } from "~/renderer/families/elrond/StakeBanner";
import { StakeBanner as NearStakeBanner } from "~/renderer/families/near/StakeBanner";
import { CosmosAccount } from "@ledgerhq/live-common/families/cosmos/types";

export const AccountStakeBanner = ({ account }: { account: AccountLike | null }) => {
  if (!account) return null;

  if (isAccount(account)) {
    switch (account.currency.id) {
      case "ethereum":
        return <EthereumStakeBanner account={account} />;
      case "cosmos":
      case "osmo":
        return <CosmosStakeBanner account={account as CosmosAccount} />;
      case "solana":
        return <SolanaStakeBanner account={account} />;
      case "near":
        return <NearStakeBanner account={account} />;
      default:
        return null;
    }
  } else if (isTokenAccount(account)) {
    switch (account.token.id) {
      case "ethereum/erc20/elrond":
        return <ElrondStakeBanner account={account} />;
      default:
        return null;
    }
  }

  return null;
};
