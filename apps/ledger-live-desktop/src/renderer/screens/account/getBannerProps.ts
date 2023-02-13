import { TFunction } from "react-i18next";
import { useHistory } from "react-router";
import { useDispatch } from "react-redux";
import { Account } from "@ledgerhq/types-live";
import { getAccountBannerState as getCosmosBannerState } from "@ledgerhq/live-common/families/cosmos/banner";
import { getAccountBannerProps as getCosmosBannerProps } from "~/renderer/families/cosmos/utils";
import { getAccountBannerProps as getEthereumBannerProps } from "~/renderer/families/ethereum/utils";
import { getAccountBannerState as getEthereumBannerState } from "@ledgerhq/live-common/families/ethereum/banner";
import { BannerProps } from "~/renderer/screens/account/AccountBanner";
import { CosmosAccount } from "@ledgerhq/live-common/lib/families/cosmos/types";

export type Hooks = {
  t: TFunction;
  ethStakingProviders: null | { params: { listProvider: { name: string; liveAppId: string }[] } };
  history: ReturnType<typeof useHistory>;
  dispatch: ReturnType<typeof useDispatch>;
};

export const getBannerProps = (
  account: Account,
  hooks: Hooks,
): BannerProps | { display: false } => {
  switch (account.currency.family) {
    case "cosmos": {
      const state = getCosmosBannerState(account as CosmosAccount);
      const props = getCosmosBannerProps(state, account, hooks);
      return props;
    }
    case "ethereum": {
      const state = getEthereumBannerState(account);
      const props = getEthereumBannerProps(state, account, hooks);
      return props;
    }
    default: {
      return { display: false };
    }
  }
};
