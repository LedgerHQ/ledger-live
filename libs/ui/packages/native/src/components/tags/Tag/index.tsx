import React from "react";

import Flex, { FlexBoxProps } from "../../Layout/Flex";
import Text from "../../Text";

export interface TagProps extends FlexBoxProps {
  active?: boolean;
  uppercase?: boolean;
  children: React.ReactNode;
}

export default function Tag({ active, uppercase, children, ...props }: TagProps): JSX.Element {
  return (
    <Flex
      px={2}
      alignItems="center"
      justifyContent="center"
      borderRadius={4}
      borderWidth={1}
      borderColor={active ? "primary.c50" : "neutral.c40"}
      {...props}
    >
      <Text
        variant="tiny"
        fontWeight="semiBold"
        lineHeight="16px"
        uppercase={uppercase !== false}
        textAlign="center"
        color={active ? "primary.c70" : "neutral.c80"}
      >
        {children}
      </Text>
    </Flex>
  );
}
