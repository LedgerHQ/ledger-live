import { useTranslation } from "react-i18next";
import useFeature from "@ledgerhq/live-config/featureFlags/useFeature";
import { getAccountBannerState } from "@ledgerhq/live-common/families/cosmos/banner";
import { canDelegate } from "@ledgerhq/live-common/families/cosmos/logic";
import { AccountBanner } from "~/renderer/screens/account/AccountBanner";
import React from "react";
import { StakeAccountBannerParams } from "~/renderer/screens/account/types";
import { CosmosAccount } from "@ledgerhq/live-common/families/cosmos/types";
import { openModal } from "~/renderer/actions/modals";
import { useDispatch } from "react-redux";
import { track } from "~/renderer/analytics/segment";
import { stakeDefaultTrack } from "~/renderer/screens/stake/constants";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { urls } from "~/config/urls";

const StakeBanner: React.FC<{ account: CosmosAccount }> = ({ account }) => {
  const dispatch = useDispatch();
  const stakingUrl = useLocalizedUrl(urls.stakingCosmos);
  const { t } = useTranslation();
  const stakeAccountBanner = useFeature("stakeAccountBanner");
  const stakeAccountBannerParams: StakeAccountBannerParams | null =
    stakeAccountBanner?.params ?? null;
  const state = getAccountBannerState(account);
  const { redelegate, ledgerValidator, validatorSrcAddress, display } = state;

  if (redelegate && !stakeAccountBannerParams?.cosmos?.redelegate) return null;
  if (!redelegate && !(stakeAccountBannerParams?.cosmos?.delegate && canDelegate(account)))
    return null;

  const commission = ledgerValidator?.commission ? ledgerValidator?.commission * 100 : 1;
  const title = redelegate
    ? t("account.banner.redelegation.title")
    : t("account.banner.delegation.title");
  const description = redelegate
    ? t("account.banner.redelegation.description")
    : t("account.banner.delegation.description", {
        asset: account.currency.ticker,
        commission,
      });
  const cta = redelegate
    ? t("account.banner.redelegation.cta")
    : t("account.banner.delegation.cta");

  const onClick = () => {
    track("button_clicked2", {
      ...stakeDefaultTrack,
      delegation: "stake",
      page: "Page Account",
      button: "delegate",
      redelegate,
      currency: account?.currency?.id?.toUpperCase(),
    });

    if (redelegate) {
      dispatch(
        openModal("MODAL_COSMOS_REDELEGATE", {
          account,
          validatorAddress: validatorSrcAddress,
          validatorDstAddress: ledgerValidator?.validatorAddress || "",
        }),
      );
    } else if (canDelegate(account)) {
      dispatch(
        openModal("MODAL_COSMOS_DELEGATE", {
          account,
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
      display={display}
      linkText={t("account.banner.delegation.linkText")}
      linkUrl={stakingUrl}
    />
  );
};

export default StakeBanner;
