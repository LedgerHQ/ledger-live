import React from "react";
import { Box, Flex } from "@ledgerhq/react-ui";
import styled from "styled-components";

const IconContainer = styled(Box)`
  background-color: ${p => p.theme.colors.opacityDefault.c05};
  border-radius: 100%;
  height: 72px;
  width: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const GradientDiv = styled(Flex)`
  background: radial-gradient(
    at top center,
    ${p => p.theme.colors.error.c10} 0%,
    ${p => p.theme.colors.background.main} 30%
  );
`;

type AppBlockerProps = {
  blocked: boolean;
  IconComponent: React.FC;
  TitleComponent: React.FC;
  DescriptionComponent: React.FC;
  CTAComponent: React.FC;
};

export function AppBlocker({
  children,
  blocked,
  IconComponent,
  TitleComponent,
  DescriptionComponent,
  CTAComponent,
}: React.PropsWithChildren<AppBlockerProps>) {
  if (blocked)
    return (
      <GradientDiv flexDirection="column" alignItems="center" justifyContent="center" height="100%">
        <IconContainer>
          <IconComponent />
        </IconContainer>
        <TitleComponent />
        <DescriptionComponent />
        <CTAComponent />
      </GradientDiv>
    );

  return children;
}
