import { Account } from "@ledgerhq/types-live";
import { useHistory } from "react-router";
import { useTranslation } from "react-i18next";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { getAccountBannerState } from "@ledgerhq/live-common/families/evm/banner";
import { AccountBanner } from "~/renderer/screens/account/AccountBanner";
import { track } from "~/renderer/analytics/segment";
import { stakeDefaultTrack } from "~/renderer/screens/stake/constants";
import React from "react";
import { StakeAccountBannerParams } from "~/renderer/screens/account/types";
import { urls } from "~/config/urls";

const StakeBanner: React.FC<{ account: Account }> = ({ account }) => {
  const history = useHistory();
  const { t } = useTranslation();
  const stakeAccountBanner = useFeature("stakeAccountBanner");
  const ethStakingProviders = useFeature("ethStakingProviders");
  const stakeAccountBannerParams: StakeAccountBannerParams = stakeAccountBanner?.params;
  const { stakeProvider } = getAccountBannerState(account);

  if (stakeProvider === "lido" && !stakeAccountBannerParams?.eth?.lido) return null;
  if (stakeProvider === "kiln" && !stakeAccountBannerParams?.eth?.kiln) return null;

  const stakeOnClick = (providerLiveAppId: typeof stakeProvider) => {
    track("button_clicked", {
      ...stakeDefaultTrack,
      delegation: "stake",
      page: "Page Account",
      button: "delegate",
      provider: stakeProvider,
      currency: "ETH",
    });
    history.push({
      pathname: `/platform/${providerLiveAppId}`,
      state: { accountId: account.id, returnTo: `/account/${account.id}` },
    });
  };

  const title =
    stakeProvider === "kiln"
      ? t("account.banner.delegation.ethereum.kiln.title")
      : t("account.banner.delegation.ethereum.lido.title");
  const description =
    stakeProvider === "kiln"
      ? t("account.banner.delegation.ethereum.kiln.description")
      : t("account.banner.delegation.ethereum.lido.description");
  const cta =
    stakeProvider === "kiln"
      ? t("account.banner.delegation.ethereum.kiln.cta")
      : t("account.banner.delegation.ethereum.lido.cta");

  const onClick =
    stakeProvider === "kiln" ? () => stakeOnClick("kiln") : () => stakeOnClick("lido");

  const display = ethStakingProviders?.params?.listProvider?.some(
    (provider: { liveAppId: string }) => provider.liveAppId === stakeProvider,
  );

  if (!display) {
    return null;
  }

  return (
    <AccountBanner
      display
      title={title}
      description={description}
      cta={cta}
      onClick={onClick}
      linkText={t("account.banner.delegation.linkText")}
      linkUrl={urls.stakingEthereum}
    />
  );
};

export default StakeBanner;
