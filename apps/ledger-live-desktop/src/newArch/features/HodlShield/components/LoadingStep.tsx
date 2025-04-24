import React from "react";
import { useTheme } from "styled-components";
import { Box, Flex, Text } from "@ledgerhq/react-ui";
import animation from "~/renderer/animations/common/loader.json";
import Lottie from "react-lottie";
import { getEnv } from "@ledgerhq/live-env";

type Loading = {
  title: string;
  subtitle: string;
  theme: "light" | "dark";
};

type Animation = {
  theme: "light" | "dark";
};

const Animation = ({ theme }: Animation) => {
  const isPlaywright = !!getEnv("PLAYWRIGHT_RUN");
  const backgroundColor = theme === "light" ? "rgba(255, 255, 255, 1)" : "rgba(28, 29, 31, 1)";

  return (
    <Box position="absolute" height="100%" width="100%" bottom={0}>
      <Box
        position="absolute"
        zIndex={1}
        height={"100%"}
        width="100%"
        style={{
          backgroundImage: `linear-gradient(180deg, ${backgroundColor}, 80%, rgba(0,0,0,0))`,
        }}
      />

      <Lottie
        isClickToPauseDisabled
        ariaRole="animation"
        options={{
          loop: true,
          autoplay: !isPlaywright,
          animationData: animation,
          rendererSettings: { preserveAspectRatio: "xMaxYMax slice" },
        }}
      />
    </Box>
  );
};

export default function Loading({ title, subtitle, theme }: Loading) {
  const { colors } = useTheme();
  return (
    <Box position="relative" height="100%" width="500px">
      <Animation theme={theme} />
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
