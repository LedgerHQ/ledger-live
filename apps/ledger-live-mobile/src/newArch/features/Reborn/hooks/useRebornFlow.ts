import { useRef } from "react";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { ABTestingVariants } from "@ledgerhq/types-live";
import { useNavigation } from "@react-navigation/native";
import {
  RootNavigationComposite,
  StackNavigatorNavigation,
} from "~/components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { NavigatorName, ScreenName } from "~/const";
import { CategoryContentCard, LandingPageUseCase } from "~/dynamicContent/types";
import { filterCategoriesByLocation, formatCategories } from "~/dynamicContent/utils";
import useDynamicContent from "~/dynamicContent/useDynamicContent";
import { ContentCard } from "@braze/react-native-sdk";
import { track } from "~/analytics";
import { useDynamicContentLogic } from "~/dynamicContent/useDynamicContentLogic";
import useFetchWithTimeout from "LLM/hooks/useFetchWithTimeout";
import RebornAnalytics from "../constants/analytics";

type NavigationProps = RootNavigationComposite<
  StackNavigatorNavigation<BaseNavigatorStackParamList>
>;

const FETCH_TIMEOUT = 3000;

export function useRebornFlow(isFromOnboarding = false) {
  const { navigate } = useNavigation<NavigationProps>();
  const rebornFeatureFlag = useFeature("llmRebornLP");
  const featureFlagEnabled = rebornFeatureFlag?.enabled;
  const variant = getVariant(rebornFeatureFlag?.params?.variant);
  const { categoriesCards, mobileCards } = useDynamicContent();
  const { fetchData, refreshDynamicContent } = useDynamicContentLogic();
  const canDisplayLP = useRef(false);

  const fetchWithTimeout = useFetchWithTimeout(FETCH_TIMEOUT);

  const fetchAllData = async () => {
    refreshDynamicContent();
    try {
      await fetchWithTimeout(fetchData);
    } catch {
      canDisplayLP.current = false;
    }
  };

  const checkIfCanDisplayLP = async (LP: LandingPageUseCase) => {
    const result = await hasContentCardToDisplay(LP, categoriesCards, mobileCards);
    canDisplayLP.current = result;
  };

  const navigateToLandingPage = async (LP: LandingPageUseCase) => {
    await checkIfCanDisplayLP(LP);
    if (!canDisplayLP.current) {
      await fetchAllData();
      await checkIfCanDisplayLP(LP);
    }

    if (canDisplayLP.current && !isFromOnboarding) {
      track(RebornAnalytics.REBORN_LP);
      navigate(NavigatorName.LandingPages, {
        screen: ScreenName.GenericLandingPage,
        params: {
          useCase: LP,
        },
      });
    } else {
      track(RebornAnalytics.FALLBACK_REBORN);
      navigate(NavigatorName.BuyDevice);
    }
  };

  const navigateToRebornFlow = () => {
    if (!featureFlagEnabled) {
      navigate(NavigatorName.BuyDevice);
      return;
    }

    switch (variant) {
      case ABTestingVariants.variantA:
        navigateToLandingPage(LandingPageUseCase.LP_Reborn1);
        break;
      case ABTestingVariants.variantB:
        navigateToLandingPage(LandingPageUseCase.LP_Reborn2);
        break;
      default:
        navigate(NavigatorName.BuyDevice);
        break;
    }
  };

  return {
    navigateToRebornFlow,
    rebornFeatureFlagEnabled: featureFlagEnabled,
    rebornVariant: variant,
  };
}

const getVariant = (variant?: ABTestingVariants): ABTestingVariants =>
  variant === ABTestingVariants.variantB ? ABTestingVariants.variantB : ABTestingVariants.variantA;

const hasContentCardToDisplay = async (
  lpLocation: LandingPageUseCase,
  categoriesCards: CategoryContentCard[],
  mobileCards: ContentCard[],
) => {
  const categoriesToDisplay = filterCategoriesByLocation(categoriesCards, lpLocation);
  const categoriesFormatted = formatCategories(categoriesToDisplay, mobileCards);

  return categoriesFormatted.length > 0;
};
