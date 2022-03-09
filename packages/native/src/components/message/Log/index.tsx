import React, { memo } from "react";
import Text, { BaseTextProps as TextProps } from "../../Text";
import Flex, { FlexBoxProps } from "../../Layout/Flex";
import { BracketTopLeft, BracketTopRight, BracketBottomLeft, BracketBottomRight } from "./Brackets";

export type Props = React.PropsWithChildren<
  FlexBoxProps & {
    extraTextProps?: TextProps;
  }
>;

function Log({ children, extraTextProps }: Props): JSX.Element {
  return (
    <Flex flexDirection="column">
      <Flex flexDirection="row" justifyContent="space-between">
        <BracketTopLeft color="neutral.c100" />
        <BracketTopRight color="neutral.c100" />
      </Flex>
      <Text
        variant="h2"
        textTransform="uppercase"
        textAlign="center"
        color="neutral.c100"
        px="16px"
        {...extraTextProps}
      >
        {children}
      </Text>
      <Flex flexDirection="row" justifyContent="space-between">
        <BracketBottomLeft color="neutral.c100" />
        <BracketBottomRight color="neutral.c100" />
      </Flex>
    </Flex>
  );
}

export default memo(Log);
