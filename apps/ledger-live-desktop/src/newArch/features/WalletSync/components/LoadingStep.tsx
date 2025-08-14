import { Box, Flex, Text } from "@ledgerhq/react-ui";
import React from "react";
import { useTheme } from "styled-components";
import { LoadingOverlay } from "LLD/components/LoadingOverlay";

type Loading = {
  title: string;
  subtitle: string;
  theme: "light" | "dark";
};

export default function Loading({ title, subtitle, theme }: Loading) {
  const { colors } = useTheme();
  return (
    <Box position="relative" height="100%" width="500px">
      <LoadingOverlay theme={theme} />
      <Flex
        position={"relative"}
        zIndex={2}
        height={"100%"}
        flexDirection={"column"}
        alignItems={"center"}
        justifyContent={"center"}
        rowGap={14}
      >
        <Text variant="h5Inter" fontSize={20} fontWeight="600">
          {title}
        </Text>
        <Text
          variant="body"
          fontSize={14}
          color={colors.neutral.c80}
          whiteSpace="pre-line"
          textAlign="center"
        >
          {subtitle}
        </Text>
      </Flex>
    </Box>
  );
}
