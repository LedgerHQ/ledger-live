import { useTranslation } from "react-i18next";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";

import { getAccountBannerState as getElrondBannerState } from "@ledgerhq/live-common/families/elrond/banner";
import { AccountBanner } from "~/renderer/screens/account/AccountBanner";
import React from "react";
import { StakeAccountBannerParams } from "~/renderer/screens/account/types";
import { useElrondPreloadData } from "@ledgerhq/live-common/families/elrond/react";
import { ElrondAccount } from "@ledgerhq/live-common/families/elrond/types";
import { track } from "~/renderer/analytics/segment";
import { stakeDefaultTrack } from "~/renderer/screens/stake/constants";
import { useDispatch } from "react-redux";
import { openModal } from "~/renderer/actions/modals";
import { modals } from "~/renderer/families/elrond/modals";
import { AccountBannerState } from "@ledgerhq/live-common/lib/families/elrond/banner";

export const StakeBanner: React.FC<{ account: ElrondAccount }> = ({ account }) => {
  const { t } = useTranslation();
  const stakeAccountBanner = useFeature("stakeAccountBanner");
  const stakeAccountBannerParams: StakeAccountBannerParams | null =
    stakeAccountBanner?.params ?? null;

  const elrondPreloadData = useElrondPreloadData();
  const dispatch = useDispatch();
  const bannerState: AccountBannerState = getElrondBannerState(account, elrondPreloadData);
  if (
    stakeAccountBannerParams?.elrond?.delegate === false &&
    bannerState.bannerType === "delegate"
  ) {
    return null;
  }

  if (
    stakeAccountBannerParams?.elrond?.redelegate === false &&
    bannerState.bannerType === "redelegate"
  ) {
    return null;
  }

  const title = "TODO";
  const description = "DESCRIPTION";
  const cta = bannerState.bannerType === "delegate" ? "DELEGATE" : "REDELEGATE";
  const onClick = () => {
    track("button_clicked", {
      ...stakeDefaultTrack,
      delegation: "stake",
      page: "Page Account",
      button: "delegate",
      redelegate: bannerState.bannerType === "redelegate",
      token: "ELROND",
    });

    if (bannerState.bannerType === "redelegate") {
      dispatch(
        openModal(modals.unstake, {
          account,
          contract: bannerState.selectedDelegation.contract,
          validators: elrondPreloadData.validators,
          delegations: bannerState.mappedDelegations,
          amount: bannerState.selectedDelegation.userActiveStake,
        }),
      );
    } else {
      dispatch(
        openModal(modals.stake, {
          account,
          validators: elrondPreloadData.validators,
          delegations: account.elrondResources.delegations,
        }),
      );
    }
  };

  return (
    <AccountBanner
      title={title}
      description={description}
      cta={cta}
      onClick={onClick}
      display={bannerState.bannerType !== "hidden"}
      linkText={t("account.banner.delegation.linkText")}
      linkUrl={"https://www.ledger.com/staking-ethereum"}
    />
  );
};
