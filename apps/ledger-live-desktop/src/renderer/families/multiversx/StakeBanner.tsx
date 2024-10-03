import { useTranslation } from "react-i18next";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { getAccountBannerState as getMultiversXBannerState } from "@ledgerhq/live-common/families/multiversx/banner";
import { AccountBanner } from "~/renderer/screens/account/AccountBanner";
import React from "react";
import { StakeAccountBannerParams } from "~/renderer/screens/account/types";
import { useMultiversXPreloadData } from "@ledgerhq/live-common/families/multiversx/react";
import {
  MultiversXAccount,
  MultiversXProvider,
} from "@ledgerhq/live-common/families/multiversx/types";
import { track } from "~/renderer/analytics/segment";
import { stakeDefaultTrack } from "~/renderer/screens/stake/constants";
import { useDispatch } from "react-redux";
import { openModal } from "~/renderer/actions/modals";
import { AccountBannerState } from "@ledgerhq/live-common/families/multiversx/banner";

const StakeBanner: React.FC<{ account: MultiversXAccount }> = ({ account }) => {
  const { t } = useTranslation();
  const stakeAccountBanner = useFeature("stakeAccountBanner");
  const stakeAccountBannerParams: StakeAccountBannerParams | null =
    stakeAccountBanner?.params ?? null;

  const multiversxPreloadData = useMultiversXPreloadData();

  const dispatch = useDispatch();
  const bannerState: AccountBannerState = getMultiversXBannerState(account, multiversxPreloadData);
  const showDelegationBanner = bannerState.bannerType === "delegate";
  if (!stakeAccountBannerParams?.multiversx?.delegate && showDelegationBanner) {
    return null;
  }

  if (
    !stakeAccountBannerParams?.multiversx?.redelegate &&
    bannerState.bannerType === "redelegate"
  ) {
    return null;
  }

  const title = showDelegationBanner
    ? t("account.banner.delegation.title")
    : t("account.banner.redelegation.elrond.title");
  const description = showDelegationBanner
    ? t("account.banner.delegation.elrond.description")
    : t("account.banner.redelegation.elrond.description");
  const cta = showDelegationBanner
    ? t("account.banner.delegation.cta")
    : t("account.banner.redelegation.cta");
  const linkUrl = showDelegationBanner
    ? "https://www.ledger.com/staking"
    : "https://support.ledger.com/hc/en-us/articles/7228337345693-Staking-MultiversX-EGLD-through-Ledger-Live-?support=true";
  const linkText = showDelegationBanner
    ? t("account.banner.delegation.linkText")
    : t("account.banner.redelegation.linkText");
  const onClick = () => {
    track("button_clicked2", {
      ...stakeDefaultTrack,
      delegation: "stake",
      page: "Page Account",
      button: "delegate",
      redelegate: bannerState.bannerType === "redelegate",
      currency: "ELROND",
    });

    if (bannerState.bannerType === "redelegate") {
      const findValidator = (validator: string) =>
        multiversxPreloadData.validators.find(
          (item: MultiversXProvider) => item.contract === validator,
        );

      const mappedDelegations = account.multiversxResources.delegations.map(delegation => ({
        ...delegation,
        validator: findValidator(delegation.contract),
      }));

      dispatch(
        openModal("MODAL_MULTIVERSX_UNDELEGATE", {
          account,
          contract: bannerState.worstDelegation.contract,
          validators: multiversxPreloadData.validators,
          delegations: mappedDelegations,
          amount: bannerState.worstDelegation.userActiveStake,
        }),
      );
    } else {
      dispatch(
        openModal("MODAL_MULTIVERSX_DELEGATE", {
          account,
          validators: multiversxPreloadData.validators,
          delegations: account.multiversxResources.delegations,
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
      linkText={linkText}
      linkUrl={linkUrl}
    />
  );
};

export default StakeBanner;
