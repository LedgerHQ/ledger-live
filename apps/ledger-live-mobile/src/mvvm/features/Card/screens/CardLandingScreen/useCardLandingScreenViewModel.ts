import { useCallback, useMemo, useState } from "react";
import { CreditCard, Screens } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTheme as useLumenTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { useWallet40Theme } from "LLM/hooks/useWallet40Theme";
import { useTranslation } from "~/context/Locale";
import type { CardLandingCta } from "../../types";
import { CARD_LANDING_TEST_IDS } from "../../testIds";
import { PAGE_NAME } from "../../constants";
import { useCardLandingActions } from "../../hooks/useCardLandingActions";
import { useNavigationBarHeights } from "LLM/hooks/useNavigationBarHeights";
import { ImageSourcePropType } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useExperimental } from "~/experimental";

const HEADER_HEIGHT = 48;

export interface CardLandingScreenViewModelResult {
  readonly title: string;
  readonly subtitle: string;
  readonly ctas: readonly CardLandingCta[];
  readonly pageName: string;
  readonly topInset: number;
  readonly bottomInset: number;
  readonly backgroundColor: string;
  readonly imageLoaded: boolean;
  readonly onImageLoaded: () => void;
  readonly backgroundImageSource: ImageSourcePropType;
}

export const useCardLandingScreenViewModel = (): CardLandingScreenViewModelResult => {
  const { t } = useTranslation();
  const { theme: lumenTheme } = useLumenTheme();
  const { isDarkMode } = useWallet40Theme();
  const [imageLoaded, setImageLoaded] = useState(false);
  const { goToExploreCards, goToIHaveACard } = useCardLandingActions();
  const { bottomBarHeight } = useNavigationBarHeights();
  const { top: safeAreaTop } = useSafeAreaInsets();
  const hasExperimentalHeader = useExperimental();

  const onImageLoaded = useCallback(() => setImageLoaded(true), []);

  const ctas: readonly CardLandingCta[] = useMemo(
    () => [
      {
        id: "explore_cards",
        label: t("cardLanding.ctas.exploreCards"),
        icon: Screens,
        onPress: goToExploreCards,
        testID: CARD_LANDING_TEST_IDS.ctas.exploreCards,
      },
      {
        id: "i_have_a_card",
        label: t("cardLanding.ctas.iHaveACard"),
        icon: CreditCard,
        onPress: goToIHaveACard,
        testID: CARD_LANDING_TEST_IDS.ctas.iHaveACard,
      },
    ],
    [t, goToExploreCards, goToIHaveACard],
  );

  const backgroundImageSource = useMemo(() => {
    if (isDarkMode) {
      return require("~/images/card/card-bg.webp");
    }
    return require("~/images/portfolio/v4-light.webp");
  }, [isDarkMode]);

  const topInset = hasExperimentalHeader ? safeAreaTop + HEADER_HEIGHT : HEADER_HEIGHT;
  const bottomInset = bottomBarHeight;

  return {
    title: t("cardLanding.title"),
    subtitle: t("cardLanding.subtitle"),
    ctas,
    pageName: PAGE_NAME,
    topInset,
    bottomInset,
    backgroundColor: lumenTheme.colors.bg.base,
    imageLoaded,
    onImageLoaded,
    backgroundImageSource,
  };
};
