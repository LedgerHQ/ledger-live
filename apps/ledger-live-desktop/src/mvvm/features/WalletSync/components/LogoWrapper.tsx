import { Flex } from "@ledgerhq/react-ui";
import React, { PropsWithChildren } from "react";
import styled, { useTheme } from "styled-components";
import { rgba } from "~/renderer/styles/helpers";

export const LogoWrapper = ({
  children,
  opacity = "70%",
  deg = 0,
}: PropsWithChildren & { opacity?: string; deg?: number }) => {
  const { colors } = useTheme();
  const bg = rgba(colors.primary.c80, 0.08);
  return (
    <GradientDiv padding="7px" borderRadius="13px" deg={deg}>
      <Flex borderRadius="9px" backgroundColor={bg} padding="5px" opacity={opacity}>
        {children}
      </Flex>
    </GradientDiv>
  );
};

const GradientDiv = styled(Flex).attrs<{
  deg?: number;
}>({})<{ deg: number }>`
  background: linear-gradient(
    ${props => props.deg || 0}deg,
    ${props => props.theme.colors.background.drawer} 5%,
    ${props => props.theme.colors.opacityDefault.c05} 95%
  );
`;
