import { useTranslation } from "react-i18next";
import useFeature from "@ledgerhq/live-config/featureFlags/useFeature";
import { AccountBanner } from "~/renderer/screens/account/AccountBanner";
import { track } from "~/renderer/analytics/segment";
import { stakeDefaultTrack } from "~/renderer/screens/stake/constants";
import React from "react";
import { StakeAccountBannerParams } from "~/renderer/screens/account/types";
import { getAccountBannerState as getNearBannerState } from "@ledgerhq/live-common/families/near/banner";
import { openModal } from "~/renderer/actions/modals";
import { useDispatch } from "react-redux";
import { NearAccount } from "@ledgerhq/live-common/families/near/types";

const StakeBanner: React.FC<{ account: NearAccount }> = ({ account }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const stakeAccountBanner = useFeature("stakeAccountBanner");
  const stakeAccountBannerParams: StakeAccountBannerParams | null =
    stakeAccountBanner?.params ?? null;
  const state = getNearBannerState(account);
  const { redelegate, display, ledgerValidator, validatorId } = state;

  if (redelegate && !stakeAccountBannerParams?.near?.redelegate) return null;
  if (!redelegate && !stakeAccountBannerParams?.near?.delegate) return null;

  const commission = ledgerValidator?.commission ? ledgerValidator?.commission * 100 : 1;

  const title = redelegate
    ? t("account.banner.redelegation.near.title")
    : t("account.banner.delegation.title");
  const description = redelegate
    ? t("account.banner.redelegation.near.description")
    : t("account.banner.delegation.near.description", {
        asset: account.currency.ticker,
        commission,
      });
  const cta = redelegate
    ? t("account.banner.redelegation.cta")
    : t("account.banner.delegation.cta");
  const linkText = redelegate
    ? t("account.banner.redelegation.linkText")
    : t("account.banner.delegation.linkText");
  const linkUrl = redelegate
    ? "https://support.ledger.com/hc/en-us/articles/7658561043613-How-to-stake-NEAR-through-Ledger-Live-and-earn-rewards"
    : "https://www.ledger.com/staking/staking-near";
  const onClick = () => {
    track("button_clicked2", {
      ...stakeDefaultTrack,
      delegation: "stake",
      page: "Page Account",
      button: "delegate",
      redelegate,
      currency: "NEAR",
    });
    if (redelegate) {
      dispatch(
        openModal("MODAL_NEAR_UNSTAKE", {
          account,
          validatorAddress: validatorId,
        }),
      );
    } else {
      dispatch(
        openModal("MODAL_NEAR_STAKE", {
          account,
        }),
      );
    }
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
