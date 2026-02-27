import { useCallback, useMemo, useState } from "react";
import { CreditCard, Screens } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTheme as useLumenTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { useWallet40Theme } from "LLM/hooks/useWallet40Theme";
import { track } from "~/analytics";
import { useTranslation } from "~/context/Locale";
import type { CardLandingCta } from "../../types";
import { CARD_LANDING_TEST_IDS } from "../../testIds";
import { PAGE_NAME, CARD_APP_ID, CL_CARD_APP_ID } from "../../constants";
import { NavigatorName, ScreenName } from "~/const";
import { useNavigation } from "@react-navigation/core";
import { useNavigationBarHeights } from "LLM/hooks/useNavigationBarHeights";

const HEADER_HEIGHT = 48;

export interface CardLandingScreenViewModelResult {
  readonly title: string;
  readonly subtitle: string;
  readonly ctas: readonly CardLandingCta[];
  readonly pageName: string;
  readonly topInset: number;
  readonly bottomInset: number;
  readonly backgroundColor: string;
  readonly isWallet40DarkMode: boolean;
  readonly imageLoaded: boolean;
  readonly onImageLoaded: () => void;
}

const TRACKING_BUTTON_EVENT = "button_clicked";

export const useCardLandingScreenViewModel = (): CardLandingScreenViewModelResult => {
  const { t } = useTranslation();
  const { theme: lumenTheme } = useLumenTheme();
  const { isWallet40DarkMode } = useWallet40Theme("mobile");
  const [imageLoaded, setImageLoaded] = useState(false);
  const navigation = useNavigation();
  const { bottomBarHeight } = useNavigationBarHeights();

  const onImageLoaded = useCallback(() => setImageLoaded(true), []);

  const handleExploreCardsPress = useCallback(() => {
    track(TRACKING_BUTTON_EVENT, {
      button: "explore cards",
      page: PAGE_NAME,
    });
    navigation.navigate(NavigatorName.Card, {
      screen: ScreenName.Card,
      params: {
        platform: CARD_APP_ID,
        name: "Card Program",
        path: "/providers-list",
      },
    });
  }, [navigation]);

  const handleIHaveACardPress = useCallback(() => {
    track(TRACKING_BUTTON_EVENT, {
      button: "I have a card",
      page: PAGE_NAME,
    });
    navigation.navigate(NavigatorName.Card, {
      screen: ScreenName.Card,
      params: {
        platform: CL_CARD_APP_ID,
        name: "CL Card Powered by Ledger",
      },
    });
  }, [navigation]);

  const ctas: readonly CardLandingCta[] = useMemo(
    () => [
      {
        id: "explore_cards",
        label: t("cardLanding.ctas.exploreCards"),
        icon: Screens,
        onPress: handleExploreCardsPress,
        testID: CARD_LANDING_TEST_IDS.ctas.exploreCards,
      },
      {
        id: "i_have_a_card",
        label: t("cardLanding.ctas.iHaveACard"),
        icon: CreditCard,
        onPress: handleIHaveACardPress,
        testID: CARD_LANDING_TEST_IDS.ctas.iHaveACard,
      },
    ],
    [t, handleExploreCardsPress, handleIHaveACardPress],
  );

  const topInset = HEADER_HEIGHT;
  const bottomInset = bottomBarHeight;

  return {
    title: t("cardLanding.title"),
    subtitle: t("cardLanding.subtitle"),
    ctas,
    pageName: PAGE_NAME,
    topInset,
    bottomInset,
    backgroundColor: lumenTheme.colors.bg.base,
    isWallet40DarkMode,
    imageLoaded,
    onImageLoaded,
  };
};
