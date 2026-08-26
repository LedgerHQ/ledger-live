import type { ICPBannerState } from "@ledgerhq/live-common/families/internet_computer/neuron";
import type { ICPAccount } from "@ledgerhq/live-common/families/internet_computer/types";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback } from "react";
import { track } from "~/analytics";
import AccountBanner from "~/components/AccountBanner";
import { NavigatorName, ScreenName } from "~/const";
import { useTranslation } from "~/context/Locale";

export type ActiveBannerState = Exclude<ICPBannerState, "none">;

// Where each state sends the user. `stakeICP` starts a new neuron; `confirmFollowing` goes straight
// to the confirmation list, since that is the single action it asks for; the rest are all resolved by
// looking at the neurons, so they open the list.
const target = (state: ActiveBannerState) => {
  if (state === "stakeICP") {
    return [
      NavigatorName.InternetComputerStakingFlow,
      ScreenName.InternetComputerStakingStarted,
    ] as const;
  }
  return [
    NavigatorName.InternetComputerNeuronManageFlow,
    state === "confirmFollowing"
      ? ScreenName.InternetComputerNeuronRefreshVotingPower
      : ScreenName.InternetComputerNeuronList,
  ] as const;
};

type Props = Readonly<{ account: ICPAccount; state: ActiveBannerState }>;

/**
 * The account-page prompt for whatever is keeping the account from earning: no neuron yet, a stale
 * snapshot, decaying voting power, a dissolve delay too short to vote, or a neuron following nobody.
 * `getBannerState` picks one, in that order of urgency.
 */
export default function StakeBanners({ account, state }: Props) {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const onPress = useCallback(() => {
    const [navigator, screen] = target(state);
    track("button_clicked2", { button: state, page: "Account", flow: "stake", currency: "ICP" });
    (navigation as NativeStackNavigationProp<Record<string, object>>).navigate(navigator, {
      screen,
      params: { accountId: account.id },
    });
  }, [account.id, navigation, state]);

  return (
    <AccountBanner
      description={t(`internetComputer.stakeBanner.${state}.description`)}
      cta={t(`internetComputer.stakeBanner.${state}.cta`)}
      onPress={onPress}
    />
  );
}
