import { useTranslation } from "react-i18next";
import useFeature from "@ledgerhq/live-config/featureFlags/useFeature";
import { getAccountBannerState as getElrondBannerState } from "@ledgerhq/live-common/families/elrond/banner";
import { AccountBanner } from "~/renderer/screens/account/AccountBanner";
import React from "react";
import { StakeAccountBannerParams } from "~/renderer/screens/account/types";
import { useElrondPreloadData } from "@ledgerhq/live-common/families/elrond/react";
import { ElrondAccount, ElrondProvider } from "@ledgerhq/live-common/families/elrond/types";
import { track } from "~/renderer/analytics/segment";
import { stakeDefaultTrack } from "~/renderer/screens/stake/constants";
import { useDispatch } from "react-redux";
import { openModal } from "~/renderer/actions/modals";
import { AccountBannerState } from "@ledgerhq/live-common/families/elrond/banner";

const StakeBanner: React.FC<{ account: ElrondAccount }> = ({ account }) => {
  const { t } = useTranslation();
  const stakeAccountBanner = useFeature("stakeAccountBanner");
  const stakeAccountBannerParams: StakeAccountBannerParams | null =
    stakeAccountBanner?.params ?? null;

  const elrondPreloadData = useElrondPreloadData();

  const dispatch = useDispatch();
  const bannerState: AccountBannerState = getElrondBannerState(account, elrondPreloadData);
  const showDelegationBanner = bannerState.bannerType === "delegate";
  if (!stakeAccountBannerParams?.elrond?.delegate && showDelegationBanner) {
    return null;
  }

  if (!stakeAccountBannerParams?.elrond?.redelegate && bannerState.bannerType === "redelegate") {
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
        elrondPreloadData.validators.find((item: ElrondProvider) => item.contract === validator);

      const mappedDelegations = account.elrondResources.delegations.map(delegation => ({
        ...delegation,
        validator: findValidator(delegation.contract),
      }));

      dispatch(
        openModal("MODAL_ELROND_UNDELEGATE", {
          account,
          contract: bannerState.worstDelegation.contract,
          validators: elrondPreloadData.validators,
          delegations: mappedDelegations,
          amount: bannerState.worstDelegation.userActiveStake,
        }),
      );
    } else {
      dispatch(
        openModal("MODAL_ELROND_DELEGATE", {
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
      linkText={linkText}
      linkUrl={linkUrl}
    />
  );
};

export default StakeBanner;
