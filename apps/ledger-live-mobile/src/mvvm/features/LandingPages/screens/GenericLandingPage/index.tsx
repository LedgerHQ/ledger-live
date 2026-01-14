import React from "react";
import { Button, Flex, Text, InfiniteLoader } from "@ledgerhq/native-ui";
import { LandingPagesNavigatorParamList } from "~/components/RootNavigator/types/LandingPagesNavigator";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import ContentCardsLocation from "~/dynamicContent/ContentCardsLocation";
import { TrackScreen } from "~/analytics";
import styled from "styled-components/native";
import { HookResult, useGeneralLandingPage } from "./useGeneralLandingPageViewModel";
import { useWindowDimensions } from "react-native";

type NavigationProps = BaseComposite<
  StackNavigatorProps<LandingPagesNavigatorParamList, ScreenName.GenericLandingPage>
>;

const STICKY_CTA_HEIGHT = 64;

export const GenericView = (props: HookResult) => {
  const { useCase, isLoading, landingStickyCTA, openLink } = props;
  const useCaseHeight = useWindowDimensions().height;

  return (
    <Container
      height={useCaseHeight - STICKY_CTA_HEIGHT * 2}
      justifyContent={isLoading ? "center" : "normal"}
    >
      <TrackScreen name="Landing Page" useCase={useCase} />
      {isLoading ? (
        <InfiniteLoader />
      ) : (
        <>
          <ContentCardsLocation
            locationId={useCase}
            hasStickyCta={!!landingStickyCTA}
            bottomSpacing={32}
          />
          {!!landingStickyCTA && (
            <StickyContainer alignItems="center" justifyContent="center">
              <Button onPressIn={() => openLink(landingStickyCTA)} type="main">
                <Text color="neutral.c00" variant="large" fontWeight="semiBold">
                  {landingStickyCTA.cta}
                </Text>
              </Button>
            </StickyContainer>
          )}
        </>
      )}
    </Container>
  );
};

function GenericLandingPage(props: NavigationProps) {
  return <GenericView {...useGeneralLandingPage(props)} />;
}

export default GenericLandingPage;

const Container = styled(Flex)`
  position: relative;
`;

const StickyContainer = styled(Flex)`
  position: absolute;
  bottom: 0;
  width: 100%;
  height: ${STICKY_CTA_HEIGHT}px;
`;
