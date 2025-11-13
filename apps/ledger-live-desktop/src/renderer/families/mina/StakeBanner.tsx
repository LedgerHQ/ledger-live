import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { AccountBanner } from "~/renderer/screens/account/AccountBanner";
import { track } from "~/renderer/analytics/segment";
import { stakeDefaultTrack } from "~/renderer/screens/stake/constants";
import React from "react";
import { openModal } from "~/renderer/actions/modals";
import { useDispatch } from "react-redux";
import { MinaAccount } from "@ledgerhq/live-common/families/mina/types";
import { useGetStakeLabelLocaleBased } from "~/renderer/hooks/useGetStakeLabelLocaleBased";
import { useTranslation } from "react-i18next";

const linkUrl = "https://www.ledger.com/staking/staking-mina";
const StakeBanner: React.FC<{ account: MinaAccount }> = ({ account }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const stakeAccountBanner = useFeature("stakeAccountBanner");
  const cta = useGetStakeLabelLocaleBased();

  if (!stakeAccountBanner?.enabled) return null;

  const hasDelegation = account.resources?.stakingActive;

  const title = hasDelegation ? t("mina.stakeBanner.altTitle") : t("mina.stakeBanner.title");

  const description = hasDelegation
    ? t("mina.stakeBanner.altDescription")
    : t("mina.stakeBanner.description");

  const linkText = t("common.learnMore");

  const onClick = () => {
    track("button_clicked", {
      ...stakeDefaultTrack,
      delegation: hasDelegation ? "manage_delegation" : "stake",
      page: "Page Account",
      button: hasDelegation ? "manage" : "delegate",
      currency: "MINA",
    });

    dispatch(
      openModal("MODAL_MINA_STAKE", {
        account,
      }),
    );
  };

  return (
    <AccountBanner
      title={title}
      description={description}
      cta={!hasDelegation ? cta : t("mina.stakeBanner.changeCTA")}
      onClick={onClick}
      display={true}
      linkText={linkText}
      linkUrl={linkUrl}
    />
  );
};

export default StakeBanner;
