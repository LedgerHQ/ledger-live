import { AccountBannerState } from "@ledgerhq/live-common/lib/families/ethereum/banner";
import { Account } from "@ledgerhq/types-live";
import { track } from "~/renderer/analytics/segment";
import { stakeDefaultTrack } from "~/renderer/screens/stake/constants";
import { Hooks } from "~/renderer/screens/account/useGetBannerProps";
import { BannerProps } from "~/renderer/screens/account/AccountBanner";

const kilnAppId = "kiln";
const lidoAppId = "lido";

const getAccountBannerProps = (
  state: AccountBannerState,
  account: Account,
  { t, ethStakingProviders, history, stakeAccountBannerParams }: Hooks,
): BannerProps | { display: false } => {
  const { stakeProvider } = state;

  if (stakeProvider === "lido" && !stakeAccountBannerParams?.eth?.lido) return { display: false };
  if (stakeProvider === "kiln" && !stakeAccountBannerParams?.eth?.kiln) return { display: false };

  const stakeOnClick = (providerLiveAppId: string) => {
    track("button_clicked", {
      ...stakeDefaultTrack,
      delegation: "stake",
      page: "Page Account",
      button: "delegate",
      provider: stakeProvider,
      token: "ETH",
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

  return {
    title,
    description,
    cta,
    onClick,
    display,
    linkText: t("account.banner.delegation.linkText"),
    linkUrl: "https://www.ledger.com/staking-ethereum",
  };
};

export { getAccountBannerProps };
