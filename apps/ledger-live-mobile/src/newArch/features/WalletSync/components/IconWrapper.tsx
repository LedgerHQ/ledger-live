import { Flex } from "@ledgerhq/native-ui";
import { rgba } from "@ledgerhq/native-ui/styles/helpers";
import React, { PropsWithChildren } from "react";
import { useTheme } from "styled-components/native";

const IconWrapper = ({ children, opacity = "0.7" }: PropsWithChildren & { opacity?: string }) => {
  const { colors } = useTheme();
  const bg = rgba(colors.primary.c80, 0.08);
  return (
    <Flex padding="9px" borderRadius="13px" border={`1px solid ${colors.opacityDefault.c05}`}>
      <Flex borderRadius="9px" backgroundColor={bg} padding="5px" opacity={opacity}>
        {children}
      </Flex>
    </Flex>
  );
};

export default IconWrapper;
