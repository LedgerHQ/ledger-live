import { Box, ScrollListContainer, Text } from "@ledgerhq/native-ui";
import React from "react";
import styled, { useTheme } from "styled-components/native";
import { TrackScreen } from "~/analytics";
import SafeAreaView from "~/components/SafeAreaView";
import StyledStatusBar from "~/components/StyledStatusBar";

type OnboardingViewProps = {
  title: string;
  subTitle?: string;

  analytics: {
    tracking: {
      category: string;
      name: string;
      deviceModelId?: string;
    };
  };

  children: React.ReactNode;

  footer?: React.ReactNode;
};

function OnboardingView({ title, subTitle, children, analytics, footer }: OnboardingViewProps) {
  const { colors } = useTheme();

  return (
    <StyleSafeAreaView edges={["bottom", "left", "right"]}>
      <TrackScreen {...analytics.tracking} />
      <StyledStatusBar barStyle="dark-content" />

      <Box mb={7}>
        <Text variant="h4" fontWeight="semiBold">
          {title}
        </Text>

        {subTitle && (
          <Text variant="paragraph" mt={2} fontWeight="medium" color={colors.opacityDefault.c70}>
            {subTitle}
          </Text>
        )}
      </Box>

      <ScrollListContainer testID="onboarding-view-scroll-list-container">
        {children}
      </ScrollListContainer>

      {footer}
    </StyleSafeAreaView>
  );
}

const StyleSafeAreaView = styled(SafeAreaView)`
  flex: 1;
  background-color: ${p => p.theme.colors.background.main};
  margin: 3px 16px 0 16px;
`;

export default OnboardingView;
