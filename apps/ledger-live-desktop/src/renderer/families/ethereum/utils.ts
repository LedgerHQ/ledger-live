import { AccountBannerState } from "@ledgerhq/live-common/lib/families/ethereum/banner";
import { Account } from "@ledgerhq/types-live";
import { useHistory } from "react-router";
import { TFunction } from "react-i18next";

type Hooks = {
  t: TFunction;
  ethStakingProviders: null | { params: { listProvider: { name: string; liveAppId: string }[] } };
  history: ReturnType<typeof useHistory>;
};

const kilnAppId = "kiln";
const lidoAppId = "lido";

const getAccountBannerProps = (
  state: AccountBannerState,
  account: Account,
  { t, ethStakingProviders, history }: Hooks,
) => {
  const { stakeProvider } = state;

  console.log(ethStakingProviders);
  const stakeOnClick = (providerLiveAppId: string) => {
    // tracking goes here.no
    history.push({
      pathname: `/platform/${providerLiveAppId}`,
      params: { //todo: fix this type issue
        returnTo: `/account/${account.id}`,
      },
      state: { accountId: account.id },
    });
  };

  // const lidoStakeProvider = ethStakingProviders?.listProvider?.find(
  //   provider => provider.

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
    provider => provider.liveAppId === stakeProvider,
  );

  return {
    title,
    description,
    cta,
    onClick,
    display,
    linkText: "Learn more",
    linkUrl: "https://www.ledger.com/staking-ethereum",
  };
};

export { getAccountBannerProps };
