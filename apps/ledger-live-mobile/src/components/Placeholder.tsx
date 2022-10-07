import React, { memo } from "react";
import { Flex } from "@ledgerhq/native-ui";

type Props = {
  width?: number;
  containerHeight?: number;
  style?: any;
};

function Placeholder({ width, containerHeight, style }: Props) {
  return (
    <Flex
      justifyContent="center"
      {...(containerHeight ? { height: containerHeight } : {})}
    >
      <Flex
        height={8}
        borderRadius={4}
        width={width || 100}
        backgroundColor="neutral.c70"
        style={[style]}
      />
    </Flex>
  );
}

export default memo<Props>(Placeholder);
