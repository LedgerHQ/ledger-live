import { useCallback, useMemo } from "react";
import { useNavigation, type NavigationProp, type ParamListBase } from "@react-navigation/native";
import { useFeature } from "@features/platform-feature-flags";
import { useTranslation } from "@shared/i18n";
import type { CardProps } from "@features/flow-pay-card";
import { NavigatorName, ScreenName } from "~/const";
import { CL_CARD_APP_ID } from "LLM/features/Card";
import { useCardLandingActions } from "LLM/features/Card/hooks/useCardLandingActions";

export type PayTabCardState =
  | { readonly status: "hidden" }
  | { readonly status: "native" }
  | { readonly status: "liveApp" }
  | {
      readonly status: "disclaimer";
      readonly text: string;
      readonly link: string;
      readonly onPress: () => void;
    };

function loginForCardState(
  login: CardProps["login"],
  isLiveAppCard: boolean,
  onCreateAccount: () => void,
  onLogIn: () => void,
): CardProps["login"] {
  if (!isLiveAppCard) return login;

  return {
    ...login,
    keepLoginPage: true,
    onCreateAccount,
    onLogIn,
  };
}

export function usePayTabCardState(login: CardProps["login"]) {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const payTab = useFeature("lwmPayTab");
  const { goToExploreCards, goToIHaveACard } = useCardLandingActions();
  const isNativeCard = payTab?.params?.card_native === true;
  const isLiveAppCard = !isNativeCard && payTab?.params?.card_live_app === true;

  const onCardDisclaimerPress = useCallback(() => {
    navigation.navigate(NavigatorName.Card, {
      screen: ScreenName.Card,
      params: {
        platform: CL_CARD_APP_ID,
        name: "CL Card Powered by Ledger",
      },
    });
  }, [navigation]);

  const cardState = useMemo<PayTabCardState>(() => {
    if (isNativeCard) return { status: "native" };
    if (isLiveAppCard) return { status: "liveApp" };
    if (payTab?.enabled && payTab.params?.card_disclaimer === true) {
      return {
        status: "disclaimer",
        text: t("payTab.cardDisclaimer"),
        link: t("payTab.cardDisclaimerLink"),
        onPress: onCardDisclaimerPress,
      };
    }
    return { status: "hidden" };
  }, [isLiveAppCard, isNativeCard, onCardDisclaimerPress, payTab, t]);

  const cardLogin = useMemo(
    () => loginForCardState(login, isLiveAppCard, goToExploreCards, goToIHaveACard),
    [goToExploreCards, goToIHaveACard, isLiveAppCard, login],
  );

  return { cardState, login: cardLogin };
}
