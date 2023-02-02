import React from "react";

import Flex, { FlexBoxProps } from "../../Layout/Flex";
import Text from "../../Text";
import { IconType } from "../../Icon/type";
import { Box } from "../../Layout";

export interface TagProps extends FlexBoxProps {
  type?: "shade" | "color" | "warning";
  size?: "small" | "medium";
  color?: string;
  textColor?: string;
  Icon?: IconType;
  uppercase?: boolean;
  children?: React.ReactNode;
  numberOfLines?: number;
  ellipsizeMode?: "head" | "middle" | "tail" | "clip";
}

const typeColor = {
  color: "primary.c80",
  shade: "neutral.c30",
  warning: "warning.c100",
};

export default function Tag({
  type = "shade",
  size = "small",
  color,
  textColor,
  uppercase,
  Icon,
  children,
  numberOfLines,
  ellipsizeMode,
  ...props
}: TagProps): JSX.Element {
  return (
    <Flex
      px={size === "small" ? "6px" : 3}
      alignItems="center"
      justifyContent="center"
      flexDirection="row"
      borderRadius={6}
      bg={color || typeColor[type]}
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
        color={textColor || (type === "shade" ? "neutral.c90" : "neutral.c00")}
        numberOfLines={numberOfLines}
        ellipsizeMode={ellipsizeMode}
      >
        {children}
      </Text>
    </Flex>
  );
}
