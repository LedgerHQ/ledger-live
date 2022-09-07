import React from "react";

import Flex, { FlexBoxProps } from "../../Layout/Flex";
import Text from "../../Text";
import { IconType } from "../../Icon/type";
import { Box } from "../../Layout";

export interface TagProps extends FlexBoxProps {
  type?: "shade" | "color" | "warning";
  size?: "small" | "medium";
  Icon?: IconType;
  uppercase?: boolean;
  children?: React.ReactNode;
}

const typeColor = {
  color: "primary.c80",
  shade: "neutral.c30",
  warning: "warning.c100",
};

export default function Tag({
  type = "shade",
  size = "small",
  uppercase,
  Icon,
  children,
  ...props
}: TagProps): JSX.Element {
  return (
    <Flex
      px={size === "small" ? "6px" : 3}
      alignItems="center"
      justifyContent="center"
      flexDirection="row"
      borderRadius={6}
      bg={typeColor[type]}
      height={size === "small" ? "18px" : "28px"}
      {...props}
    >
      {Icon && (
        <Box pr={2}>
          <Icon
            size={size === "small" ? 16 : 20}
            color={type === "shade" ? "neutral.c90" : "neutral.c00"}
          />
        </Box>
      )}
      <Text
        variant={size === "small" ? "subtitle" : "small"}
        fontWeight="bold"
        uppercase={uppercase !== false}
        textAlign="center"
        color={type === "shade" ? "neutral.c90" : "neutral.c00"}
      >
        {children}
      </Text>
    </Flex>
  );
}
