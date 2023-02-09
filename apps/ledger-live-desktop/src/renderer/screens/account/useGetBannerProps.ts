import { TFunction, useTranslation } from "react-i18next";
import { useHistory } from "react-router";
import { useDispatch } from "react-redux";
import { Account } from "@ledgerhq/types-live";
import { getAccountBannerState as getCosmosBannerState } from "@ledgerhq/live-common/families/cosmos/banner";
import { getAccountBannerProps as getCosmosBannerProps } from "~/renderer/families/cosmos/utils";
import { getAccountBannerProps as getEthereumBannerProps } from "~/renderer/families/ethereum/utils";
import { getAccountBannerState as getEthereumBannerState } from "@ledgerhq/live-common/families/ethereum/banner";
import { BannerProps } from "~/renderer/screens/account/AccountBanner";
import { CosmosAccount } from "@ledgerhq/live-common/lib/families/cosmos/types";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";

export type Hooks = {
  t: TFunction;
  ethStakingProviders: ReturnType<typeof useFeature>;
  history: ReturnType<typeof useHistory>;
  dispatch: ReturnType<typeof useDispatch>;
};

export const useGetBannerProps = (account: Account | null): BannerProps | { display: false } => {
  const history = useHistory();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const ethStakingProviders = useFeature("ethStakingProviders");

  const hooks: Hooks = {
    t,
    ethStakingProviders,
    history,
    dispatch,
  };

  if (!account) return { display: false };

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
