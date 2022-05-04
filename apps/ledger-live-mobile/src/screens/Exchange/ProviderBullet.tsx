import React from "react";
import { Box, Flex, Text } from "@ledgerhq/native-ui";

type ProviderBulletProps = {
  text: string;
};

export default function ProviderBullet({ text }: ProviderBulletProps) {
  return (
    <Flex
      flexDirection={"row"}
      alignItems={"center"}
      justifyContent={"flex-start"}
      mt={2}
    >
      <Box width={"4px"} height={"4px"} borderRadius={2} bg={"neutral.c100"} />
      <Text variant={"paragraph"} ml={3}>
        {text}
      </Text>
    </Flex>
  );
}
