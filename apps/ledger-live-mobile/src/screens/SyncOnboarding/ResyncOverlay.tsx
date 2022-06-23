import React from "react";
import { Flex, InfiniteLoader, Text } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";

type Props = {
  isOpen: boolean;
};

const ResyncOverlay = ({ isOpen }: Props) => {
  const { colors, radii } = useTheme();

  if (!isOpen) {
    return null;
  }

  return (
    <Flex
      zIndex={100}
      position="absolute"
      background={colors.constant.overlay}
      top={0}
      left={0}
      height="100%"
      width="100%"
    >
      <Flex position="absolute" width="100%" bottom={0} padding={4}>
        <Flex
          width="100%"
          background={colors.warning.c100}
          borderRadius={radii[2]}
          p={6}
          flexDirection="row"
          justifyContent="space-between"
        >
          <Text pr={3} variant="body" textBreakStrategy="balanced">
            {`It looks like connection to your Nano was lost. We're trying to reconnect.`}
          </Text>
          <InfiniteLoader color="black" size={24} />
        </Flex>
      </Flex>
    </Flex>
  );
};

export default ResyncOverlay;
