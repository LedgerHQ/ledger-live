import React from "react";

import { Flex, Text } from "@ledgerhq/react-ui";

type Loading = {
  title: string;
  subtitle: string;
};

export default function Loading({ title, subtitle }: Loading) {
  return (
    <Flex
      height={"100%"}
      width={"500px"}
      flexDirection={"column"}
      alignItems={"center"}
      justifyContent={"center"}
      rowGap={14}
      style={{
        background: "linear-gradient(180deg, rgba(30,29,32,1) 35%, rgba(189,179,255,1) 100%)",
      }}
    >
      <Text variant="h5Inter" fontSize={20} fontWeight="600">
        {title}
      </Text>
      <Text variant="body" fontSize={14} color={"hsla(0, 0%, 75%, 1)"}>
        {subtitle}
      </Text>
    </Flex>
  );
}
