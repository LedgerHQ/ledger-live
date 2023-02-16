import { Account } from "@ledgerhq/types-live";
import { useTranslation } from "react-i18next";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";

import { getAccountBannerState as getElrondBannerState } from "@ledgerhq/live-common/families/elrond/banner";
import { AccountBanner } from "~/renderer/screens/account/AccountBanner";
import React from "react";
import { StakeAccountBannerParams } from "~/renderer/screens/account/types";
import { useElrondPreloadData } from "@ledgerhq/live-common/families/elrond/react";
import { ElrondAccount } from "@ledgerhq/live-common/families/elrond/types";

export const StakeBanner: React.FC<{ account: Account }> = ({ account }) => {
  const { t } = useTranslation();
  const stakeAccountBanner = useFeature("stakeAccountBanner");
  const stakeAccountBannerParams: StakeAccountBannerParams | null =
    stakeAccountBanner?.params ?? null;

  const elrondPreloadData = useElrondPreloadData();
  const bannerState = getElrondBannerState(account as ElrondAccount, elrondPreloadData);
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
  const cta = "TODO";

  const onClick = () => alert("TODO");

  return (
    <AccountBanner
      title={title}
      description={description}
      cta={cta}
      onClick={onClick}
      display={true}
      linkText={t("account.banner.delegation.linkText")}
      linkUrl={"https://www.ledger.com/staking-ethereum"}
    />
  );
};
