import { Account } from "@ledgerhq/types-live";
import { useHistory } from "react-router";
import { useTranslation } from "react-i18next";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";

import { getAccountBannerState as getEthereumBannerState } from "@ledgerhq/live-common/families/ethereum/banner";
import { AccountBanner } from "~/renderer/screens/account/AccountBanner";
import { track } from "~/renderer/analytics/segment";
import { stakeDefaultTrack } from "~/renderer/screens/stake/constants";
import React from "react";
import { StakeAccountBannerParams } from "~/renderer/screens/account/types";

const kilnAppId = "kiln";
const lidoAppId = "lido";

const StakeBanner: React.FC<{ account: Account }> = ({ account }) => {
  const history = useHistory();
  const { t } = useTranslation();
  const stakeAccountBanner = useFeature("stakeAccountBanner");
  const ethStakingProviders = useFeature("ethStakingProviders");
  const stakeAccountBannerParams: StakeAccountBannerParams | null =
    stakeAccountBanner?.params ?? null;
  const state = getEthereumBannerState(account);
  const { stakeProvider } = state;

  if (stakeProvider === "lido" && !stakeAccountBannerParams?.eth?.lido) return null;
  if (stakeProvider === "kiln" && !stakeAccountBannerParams?.eth?.kiln) return null;
  const stakeOnClick = (providerLiveAppId: string) => {
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
    stakeProvider === "kiln" ? () => stakeOnClick(kilnAppId) : () => stakeOnClick(lidoAppId);

  const display = ethStakingProviders?.params?.listProvider?.some(
    (provider: { liveAppId: string }) => provider.liveAppId === stakeProvider,
  );

  if (!display) return null;

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

export default StakeBanner;
