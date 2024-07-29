import React, { useEffect } from "react";
import { Flex } from "@ledgerhq/native-ui";
import { LandingPagesNavigatorParamList } from "~/components/RootNavigator/types/LandingPagesNavigator";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import ContentCardsLocation from "~/dynamicContent/ContentCardsLocation";
import { TrackScreen } from "~/analytics";
import { LandingPageUseCase } from "~/dynamicContent/types";
import useDynamicContent from "~/dynamicContent/useDynamicContent";
import { filterCategoriesByLocation } from "~/dynamicContent/utils";

type NavigationProps = BaseComposite<
  StackNavigatorProps<LandingPagesNavigatorParamList, ScreenName.GenericLandingPage>
>;

const GenericLandingPage = (props: NavigationProps) => {
  const useCase = props.route.params?.useCase;
  const { categoriesCards } = useDynamicContent();

  useEffect(() => {
    if (!useCase || !Object.values(LandingPageUseCase).includes(useCase)) {
      props.navigation.goBack();
    }
    const categoriesToDisplay = filterCategoriesByLocation(categoriesCards, useCase);
    if (categoriesToDisplay.length === 0) {
      props.navigation.goBack();
    }
  }, [categoriesCards, props.navigation, useCase]);

  return (
    <Flex>
      <TrackScreen name="Landing Page" useCase={useCase} />
      <ContentCardsLocation locationId={props.route.params?.useCase} mb={8} />
    </Flex>
  );
};

export default GenericLandingPage;
