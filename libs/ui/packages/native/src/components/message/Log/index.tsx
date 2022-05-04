import React, { memo } from "react";
import Text, { BaseTextProps as TextProps } from "../../Text";
import Flex, { FlexBoxProps } from "../../Layout/Flex";
import { BracketTopLeft, BracketTopRight, BracketBottomLeft, BracketBottomRight } from "./Brackets";
import { Platform } from "react-native";

export type Props = React.PropsWithChildren<
  FlexBoxProps & {
    extraTextProps?: Omit<TextProps, "children">;
  }
>;

function Log({ children, extraTextProps }: Props): JSX.Element {
  return (
    <Flex flexDirection="column">
      <Flex
        flexDirection="row"
        justifyContent="space-between"
        mb={Platform.OS === "android" ? "-2px" : "-6px"}
      >
        <BracketTopLeft color="neutral.c100" />
        <BracketTopRight color="neutral.c100" />
      </Flex>
      <Text
        variant="h2"
        lineHeight="28px"
        textTransform="uppercase"
        textAlign="center"
        color="neutral.c100"
        px="15.5px"
        style={{ overflow: "visible" }}
        {...extraTextProps}
      >
        {children}
      </Text>
      <Flex
        mt={Platform.OS === "android" ? "-9.5px" : "-5px"}
        flexDirection="row"
        justifyContent="space-between"
      >
        <BracketBottomLeft color="neutral.c100" />
        <BracketBottomRight color="neutral.c100" />
      </Flex>
    </Flex>
  );
}

export default memo(Log);
