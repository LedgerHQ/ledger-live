import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { AccountBanner } from "~/renderer/screens/account/AccountBanner";
import React from "react";
import { ICPAccount } from "@ledgerhq/live-common/families/internet_computer/types";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { getBannerState } from "@ledgerhq/live-common/families/internet_computer/utils";
import { onClickConfirmFollowing, onClickManageNeurons, onClickStakeIcp } from "./common";

const defaultDescription = "description";
const bannerContent = {
  confirmFollowing: {
    descriptionKey: "altDescription",
    action: (account: ICPAccount, dispatch: Function) => onClickConfirmFollowing(account, dispatch),
  },
  syncNeurons: {
    descriptionKey: "altDescription",
    action: (account: ICPAccount, dispatch: Function) =>
      onClickManageNeurons(account, dispatch, true),
  },
  lockNeurons: {
    descriptionKey: defaultDescription,
    action: (account: ICPAccount, dispatch: Function) =>
      onClickManageNeurons(account, dispatch, false),
  },
  addFollowees: {
    descriptionKey: defaultDescription,
    action: (account: ICPAccount, dispatch: Function) =>
      onClickManageNeurons(account, dispatch, false),
  },
  stakeICP: {
    descriptionKey: defaultDescription,
    action: (account: ICPAccount, dispatch: Function) => onClickStakeIcp(account, dispatch),
  },
};

const StakeBanner: React.FC<{ account: ICPAccount }> = ({ account }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const stakeAccountBanner = useFeature("stakeAccountBanner");
  const bannerState = getBannerState(account);

  if (!stakeAccountBanner?.enabled) return null;
  const { state, data } = bannerState;

  const bannerContentKey = state;
  const description = data ? defaultDescription : bannerContent[bannerContentKey]?.descriptionKey;

  return (
    <AccountBanner
      title={t(`internetComputer.stakeBanner.${bannerContentKey}.title`)}
      description={t(`internetComputer.stakeBanner.${bannerContentKey}.${description}`, {
        days: data?.days,
        hours: data?.hours,
      })}
      cta={t(`internetComputer.stakeBanner.${bannerContentKey}.cta`)}
      onClick={() => bannerContent[bannerContentKey]?.action(account, dispatch)}
      display={true}
      linkText={t("common.learnMoreWithEllipsis")}
      linkUrl="https://internetcomputer.org/docs/current/developer-docs/daos/nns/concepts/neurons/staking-voting-rewards"
    />
  );
};

export default StakeBanner;
