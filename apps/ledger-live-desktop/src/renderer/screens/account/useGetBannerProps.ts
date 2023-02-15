import { TFunction, useTranslation } from "react-i18next";
import { useHistory } from "react-router";
import { useDispatch } from "react-redux";
import { AccountLike } from "@ledgerhq/types-live";
import { getAccountBannerState as getCosmosBannerState } from "@ledgerhq/live-common/families/cosmos/banner";
import { getAccountBannerProps as getCosmosBannerProps } from "~/renderer/families/cosmos/utils";
import { getAccountBannerState as getEthereumBannerState } from "@ledgerhq/live-common/families/ethereum/banner";
import { getAccountBannerProps as getEthereumBannerProps } from "~/renderer/families/ethereum/utils";
import { BannerProps } from "~/renderer/screens/account/AccountBanner";
import { CosmosAccount } from "@ledgerhq/live-common/lib/families/cosmos/types";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { isAccount } from "@ledgerhq/live-common/account/index";

type StakeAccountBannerParams = {
  solana?: {
    redelegate: boolean;
    delegate: boolean;
  };
  eth?: {
    kiln: boolean;
    lido: boolean;
  };
  osmos?: {
    redelegate: boolean;
    delegate: boolean;
  };
  cosmos?: {
    redelegate: boolean;
    delegate: boolean;
  };
};

export type Hooks = {
  t: TFunction;
  ethStakingProviders: ReturnType<typeof useFeature>;
  history: ReturnType<typeof useHistory>;
  dispatch: ReturnType<typeof useDispatch>;
  stakeAccountBannerParams: StakeAccountBannerParams | null;
};

export const useGetBannerProps = (account: AccountLike | null): BannerProps => {
  const history = useHistory();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const stakeAccountBanner = useFeature("stakeAccountBanner");
  const ethStakingProviders = useFeature("ethStakingProviders");

  const stakeAccountBannerParams: StakeAccountBannerParams = stakeAccountBanner?.params ?? null;
  const hooks: Hooks = {
    t,
    ethStakingProviders,
    history,
    dispatch,
    stakeAccountBannerParams,
  };

  if (!account || !stakeAccountBanner?.enabled) return { display: false };

  if (isAccount(account)) {
    switch (account.currency.id) {
      case "cosmos": {
        const state = getCosmosBannerState(account as CosmosAccount);
        const props = getCosmosBannerProps(state, account as CosmosAccount, hooks);
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
  }

  return { display: false };
};
