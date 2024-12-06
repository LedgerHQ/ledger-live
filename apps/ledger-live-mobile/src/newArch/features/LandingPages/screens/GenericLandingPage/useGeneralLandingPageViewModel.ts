import { useEffect } from "react";
import { Linking } from "react-native";
import { useSelector } from "react-redux";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { LandingPagesNavigatorParamList } from "~/components/RootNavigator/types/LandingPagesNavigator";
import { ScreenName } from "~/const";
import {
  CategoryContentCard,
  LandingPageStickyCtaContentCard,
  LandingPageUseCase,
} from "~/dynamicContent/types";
import useDynamicContent from "~/dynamicContent/useDynamicContent";
import { filterCategoriesByLocation } from "~/dynamicContent/utils";
import { isDynamicContentLoadingSelector } from "~/reducers/dynamicContent";

export type NavigationProps = BaseComposite<
  StackNavigatorProps<LandingPagesNavigatorParamList, ScreenName.GenericLandingPage>
>;

export type HookResult = {
  isLoading: boolean;
  openLink: (card: LandingPageStickyCtaContentCard) => void;
  categoriesCards: CategoryContentCard[];
  landingStickyCTA?: LandingPageStickyCtaContentCard;
  useCase: LandingPageUseCase;
};

export const useGeneralLandingPage = (props: NavigationProps) => {
  const useCase = props.route.params?.useCase;
  const isLoading = useSelector(isDynamicContentLoadingSelector);
  const { categoriesCards, getStickyCtaCardByLandingPage, trackContentCardEvent } =
    useDynamicContent();

  const landingStickyCTA = getStickyCtaCardByLandingPage(useCase);

  const openLink = (card: LandingPageStickyCtaContentCard) => {
    trackContentCardEvent("contentcard_clicked", {
      campaign: card.id,
      link: card.link,
      contentcard: card.cta,
      landingPage: useCase,
    });
    Linking.openURL(card.link);
  };

  useEffect(() => {
    if (!useCase || !Object.values(LandingPageUseCase).includes(useCase)) {
      props.navigation.goBack();
    }
    const categoriesToDisplay = filterCategoriesByLocation(categoriesCards, useCase);
    if (categoriesToDisplay.length === 0 && !isLoading) {
      props.navigation.goBack();
    }
  }, [categoriesCards, isLoading, props.navigation, useCase]);

  return {
    isLoading,
    openLink,
    categoriesCards,
    landingStickyCTA,
    useCase,
  };
};
