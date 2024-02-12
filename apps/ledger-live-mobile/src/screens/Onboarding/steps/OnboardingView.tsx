import { Box, ScrollListContainer, Text } from "@ledgerhq/native-ui";
import React from "react";
import { useTheme } from "styled-components/native";
import { TrackScreen } from "~/analytics";
import StyledStatusBar from "~/components/StyledStatusBar";

type OnboardingViewProps = {
  title: string;
  subTitle?: string;

  analytics: {
    tracking: {
      category: string;
      name: string;
    };
  };

  children: React.ReactNode;

  footer?: React.ReactNode;
};

function OnboardingView({ title, subTitle, children, analytics, footer }: OnboardingViewProps) {
  const { colors } = useTheme();

  return (
    <Box flex={1} mx={6} mt={3}>
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

      <ScrollListContainer>{children}</ScrollListContainer>

      {footer}
    </Box>
  );
}

export default OnboardingView;
