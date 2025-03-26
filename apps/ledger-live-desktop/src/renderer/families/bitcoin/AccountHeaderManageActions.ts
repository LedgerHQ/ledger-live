import { getMainAccount } from "@ledgerhq/live-common/account/index";

import { useHistory } from "react-router";
import { track } from "~/renderer/analytics/segment";
import { stakeDefaultTrack } from "~/renderer/screens/stake/constants";
import { BitcoinAccount } from "@ledgerhq/coin-bitcoin/lib/types";
import { TokenAccount } from "@ledgerhq/types-live";
import IconCoins from "~/renderer/icons/Coins";
import { useGetStakeLabelLocaleBased } from "~/renderer/hooks/useGetStakeLabelLocaleBased";
import { useStake } from "~/newArch/hooks/useStake";
import { useSelector } from "react-redux";
import { walletSelector } from "~/renderer/reducers/wallet";

type Props = {
  account: BitcoinAccount | TokenAccount;
  parentAccount: BitcoinAccount | undefined | null;
};

const AccountHeaderActions = ({ account, parentAccount }: Props) => {
  const history = useHistory();
  const { getCanStakeCurrency, getRouteToPlatformApp } = useStake();
  const availableOnStake = getCanStakeCurrency("bitcoin") || getCanStakeCurrency("bitcoin_testnet");
  const walletState = useSelector(walletSelector);
  const label = useGetStakeLabelLocaleBased();
  const mainAccount = getMainAccount(account, parentAccount);
  const {
    bitcoinResources,
    currency: { id: currencyId },
  } = mainAccount;
  if (
    !bitcoinResources ||
    parentAccount ||
    (currencyId !== "bitcoin" && currencyId !== "bitcoin_testnet")
  )
    return null;

  const routeToPlatformApp = getRouteToPlatformApp(account, walletState, parentAccount);

  const trackingProperties = {
    ...stakeDefaultTrack,
    delegation: "stake",
    page: "Page Account",
    button: "delegate",
    provider: routeToPlatformApp?.state.appId,
    currency: mainAccount.currency.ticker,
  };

  const stakeOnClick = () => {
    track("button_clicked2", trackingProperties);

    history.push({
      pathname: routeToPlatformApp?.pathname,
      state: {
        returnTo: `/account/${account.id}`,
        ...routeToPlatformApp?.state,
      },
    });
  };

  return availableOnStake
    ? [
        {
          key: "Stake",
          icon: IconCoins,
          label,
          event: "button_clicked2",
          eventProperties: {
            button: "stake",
          },
          onClick: stakeOnClick,
        },
      ]
    : [];
};

export default AccountHeaderActions;
