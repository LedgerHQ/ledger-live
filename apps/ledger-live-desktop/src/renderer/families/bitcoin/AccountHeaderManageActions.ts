import { getMainAccount } from "@ledgerhq/live-common/account/index";

import { useHistory } from "react-router";
import { track } from "~/renderer/analytics/segment";
import { stakeDefaultTrack } from "~/renderer/screens/stake/constants";
import { BitcoinAccount } from "@ledgerhq/coin-bitcoin/lib/types";
import { TokenAccount } from "@ledgerhq/types-live";
import IconCoins from "~/renderer/icons/Coins";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { useGetStakeLabelLocaleBased } from "~/renderer/hooks/useGetStakeLabelLocaleBased";

type Props = {
  account: BitcoinAccount | TokenAccount;
  parentAccount: BitcoinAccount | undefined | null;
};

const AccountHeaderActions = ({ account, parentAccount }: Props) => {
  const stakeProgramsFeatureFlag = useFeature("stakePrograms");
  const listFlag = stakeProgramsFeatureFlag?.params?.list ?? [];
  const stakeProgramsEnabled = stakeProgramsFeatureFlag?.enabled ?? false;
  const availableOnStake = stakeProgramsEnabled && listFlag.includes("bitcoin");
  const history = useHistory();
  const label = useGetStakeLabelLocaleBased();
  const mainAccount = getMainAccount(account, parentAccount);
  const {
    bitcoinResources,
    currency: { id: currencyId },
  } = mainAccount;
  if (!bitcoinResources || parentAccount || currencyId !== "bitcoin") return null;

  const stakeOnClick = () => {
    const value = "/platform/acre";

    track("button_clicked2", {
      ...stakeDefaultTrack,
      delegation: "stake",
      page: "Page Account",
      button: "delegate",
      provider: "Acre",
      currency: "BTC",
    });
    history.push({
      pathname: value,
      state: {
        accountId: account.id,
        returnTo: `/account/${account.id}`,
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
