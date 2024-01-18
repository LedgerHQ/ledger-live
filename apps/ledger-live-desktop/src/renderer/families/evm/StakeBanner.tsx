import { Account } from "@ledgerhq/types-live";
import { useHistory } from "react-router";
import { useTranslation } from "react-i18next";
import useFeature from "@ledgerhq/live-config/featureFlags/useFeature";
import { getAccountBannerState } from "@ledgerhq/live-common/families/evm/banner";
import { AccountBanner } from "~/renderer/screens/account/AccountBanner";
import { track } from "~/renderer/analytics/segment";
import { stakeDefaultTrack } from "~/renderer/screens/stake/constants";
import React from "react";
import { StakeAccountBannerParams } from "~/renderer/screens/account/types";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { urls } from "~/config/urls";

/**
 * This needs to stay a constant because it serves a different from
 * type AccountBannerState["stakeProvider"] possible values.
 * Type AccountBannerState["stakeProvider"] is internal to LL and used to
 * differenciate available stake providers.
 * Whereas KILN_LIVE_APP_ID and LIDO_LIVE_APP_ID are ids of the related LiveApps
 * Today they might be the same but it's not guaranteed to stay like this.
 */
const KILN_LIVE_APP_ID = "kiln";
const LIDO_LIVE_APP_ID = "lido";

const StakeBanner: React.FC<{ account: Account }> = ({ account }) => {
  const history = useHistory();
  const { t } = useTranslation();
  const stakeAccountBanner = useFeature("stakeAccountBanner");
  const ethStakingProviders = useFeature("ethStakingProviders");
  const stakeAccountBannerParams: StakeAccountBannerParams | null =
    stakeAccountBanner?.params ?? null;
  const { stakeProvider } = getAccountBannerState(account);

  const stakingUrl = useLocalizedUrl(urls.stakingEthereum);

  if (stakeProvider === "lido" && !stakeAccountBannerParams?.eth?.lido) return null;
  if (stakeProvider === "kiln" && !stakeAccountBannerParams?.eth?.kiln) return null;

  const stakeOnClick = (providerLiveAppId: string) => {
    track("button_clicked2", {
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
    stakeProvider === "kiln"
      ? () => stakeOnClick(KILN_LIVE_APP_ID)
      : () => stakeOnClick(LIDO_LIVE_APP_ID);

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
      linkUrl={stakingUrl}
    />
  );
};

export default StakeBanner;
