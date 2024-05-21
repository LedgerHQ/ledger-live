import { Flex } from "@ledgerhq/react-ui";
import React, { PropsWithChildren } from "react";
import { useTheme } from "styled-components";
import { rgba } from "~/renderer/styles/helpers";

export const LogoWrapper = ({
  children,
  opacity = "70%",
}: PropsWithChildren & { opacity?: string }) => {
  const { colors } = useTheme();
  const bg = rgba(colors.primary.c80, 0.08);
  return (
    <Flex padding="7px" borderRadius="13px" border={`1px solid ${colors.opacityDefault.c05}`}>
      <Flex borderRadius="9px" backgroundColor={bg} padding="5px" opacity={opacity}>
        {children}
      </Flex>
    </Flex>
  );
};
