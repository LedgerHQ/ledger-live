import { useCallback, useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CreditCard, Screens } from "@ledgerhq/lumen-ui-rnative/symbols";
import { track } from "~/analytics";
import { useTranslation } from "~/context/Locale";
import type { CardLandingCta } from "../../types";
import { CARD_LANDING_TEST_IDS } from "../../testIds";
import { PAGE_NAME } from "../../constants";

const HEADER_HEIGHT = 48;

export interface CardLandingScreenViewModelResult {
  readonly title: string;
  readonly subtitle: string;
  readonly ctas: readonly CardLandingCta[];
  readonly pageName: string;
  readonly topInset: number;
}

export const useCardLandingScreenViewModel = (): CardLandingScreenViewModelResult => {
  const { t } = useTranslation();

  const handleExploreCardsPress = useCallback(() => {
    track("button_clicked", {
      button: "explore cards",
      page: PAGE_NAME,
    });
    // TODO: Navigate to country selector when available
  }, []);

  const handleIHaveACardPress = useCallback(() => {
    track("button_clicked", {
      button: "I have a card",
      page: PAGE_NAME,
    });
    // TODO: Navigate to card activation flow when available
  }, []);

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

  const insets = useSafeAreaInsets();
  const topInset = insets.top + HEADER_HEIGHT;

  return {
    title: t("cardLanding.title"),
    subtitle: t("cardLanding.subtitle"),
    ctas,
    pageName: PAGE_NAME,
    topInset,
  };
};
