import { useTranslation } from "react-i18next";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { AccountBanner } from "~/renderer/screens/account/AccountBanner";
import { track } from "~/renderer/analytics/segment";
import { stakeDefaultTrack } from "~/renderer/screens/stake/constants";
import React from "react";
import { StakeAccountBannerParams } from "~/renderer/screens/account/types";
import { getAccountBannerState as getSuiBannerState } from "@ledgerhq/live-common/families/sui/banner";
import { openModal } from "~/renderer/actions/modals";
import { useDispatch } from "react-redux";
import { SuiAccount } from "@ledgerhq/live-common/families/sui/types";

const StakeBanner: React.FC<{ account: SuiAccount }> = ({ account }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const stakeAccountBanner = useFeature("stakeAccountBanner");
  const stakeAccountBannerParams: StakeAccountBannerParams | null =
    stakeAccountBanner?.params ?? null;
  const state = getSuiBannerState(account);
  const { display, ledgerValidator } = state;

  if (!stakeAccountBannerParams?.sui?.delegate) return null;

  const commission = ledgerValidator?.commission ? ledgerValidator?.commission * 100 : 1;

  const title = t("account.banner.delegation.title");
  const description = t("account.banner.delegation.description", {
    asset: account.currency.ticker,
    commission,
  });
  const cta = t("account.banner.delegation.cta");
  const linkText = t("account.banner.delegation.linkText");
  const linkUrl = "https://www.ledger.com/staking/staking-sui";
  const onClick = () => {
    track("button_clicked2", {
      ...stakeDefaultTrack,
      delegation: "stake",
      page: "Page Account",
      button: "delegate",
      currency: "SUI",
    });
    dispatch(
      openModal("MODAL_SUI_DELEGATE", {
        account,
      }),
    );
  };

  if (!display) return null;
  return (
    <AccountBanner
      title={title}
      description={description}
      cta={cta}
      onClick={onClick}
      display={true}
      linkText={linkText}
      linkUrl={linkUrl}
    />
  );
};

export default StakeBanner;
