import React from "react";
import { AccountLike } from "@ledgerhq/types-live";
import { isAccount, getMainAccount } from "@ledgerhq/live-common/account/index";
import { getLLDCoinFamily } from "~/renderer/families";
import { useCoinModuleFeature } from "@ledgerhq/live-common/featureFlags/useCoinModuleFeature";
import type { CoinFamily } from "@ledgerhq/live-common/bridge/features";

export const AccountStakeBanner = ({
  account,
  parentAccount,
}: {
  account: AccountLike;
  parentAccount?: AccountLike | null;
}) => {
  const mainAccount =
    account && isAccount(account)
      ? getMainAccount(
          account,
          parentAccount && isAccount(parentAccount) ? parentAccount : undefined,
        )
      : null;
  const family = (mainAccount?.currency.family as CoinFamily) || "";
  const stakingCraftEnabled = useCoinModuleFeature("stakingTxs", family);

  if (!account || !isAccount(account)) return null;
  if (!stakingCraftEnabled) return null;

  const Comp = getLLDCoinFamily(account.currency.family).StakeBanner;
  if (Comp) return <Comp account={account} />;
  return null;
};
