import React, { useEffect } from "react";
import { Flex, InfiniteLoader } from "@ledgerhq/native-ui";
import { LandingPagesNavigatorParamList } from "~/components/RootNavigator/types/LandingPagesNavigator";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import ContentCardsLocation from "~/dynamicContent/ContentCardsLocation";
import { TrackScreen } from "~/analytics";
import { LandingPageUseCase } from "~/dynamicContent/types";
import useDynamicContent from "~/dynamicContent/useDynamicContent";
import { filterCategoriesByLocation } from "~/dynamicContent/utils";
import { useSelector } from "react-redux";
import { isDynamicContentLoadingSelector } from "~/reducers/dynamicContent";

type NavigationProps = BaseComposite<
  StackNavigatorProps<LandingPagesNavigatorParamList, ScreenName.GenericLandingPage>
>;

const GenericLandingPage = (props: NavigationProps) => {
  const useCase = props.route.params?.useCase;
  const isLoading = useSelector(isDynamicContentLoadingSelector);
  const { categoriesCards } = useDynamicContent();

  useEffect(() => {
    if (!useCase || !Object.values(LandingPageUseCase).includes(useCase)) {
      props.navigation.goBack();
    }
    const categoriesToDisplay = filterCategoriesByLocation(categoriesCards, useCase);
    if (categoriesToDisplay.length === 0 && !isLoading) {
      props.navigation.goBack();
    }
  }, [categoriesCards, isLoading, props.navigation, useCase]);

  return (
    <Flex height="100%" justifyContent={isLoading ? "center" : "normal"}>
      <TrackScreen name="Landing Page" useCase={useCase} />
      {isLoading ? (
        <InfiniteLoader />
      ) : (
        <ContentCardsLocation locationId={props.route.params?.useCase} mb={8} />
      )}
    </Flex>
  );
};

export default GenericLandingPage;
