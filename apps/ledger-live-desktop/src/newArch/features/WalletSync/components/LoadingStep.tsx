import React from "react";

import { Box, Flex, Text } from "@ledgerhq/react-ui";

import animation from "~/renderer/animations/common/loader.json";
import Lottie from "react-lottie";
import { getEnv } from "@ledgerhq/live-env";

type Loading = {
  title: string;
  subtitle: string;
};

const Animation = () => {
  const isPlaywright = !!getEnv("PLAYWRIGHT_RUN");

  return (
    <Box position="absolute" height="75%" bottom={0}>
      <Box
        position="absolute"
        zIndex={1}
        height={"100%"}
        width="100%"
        style={{
          backgroundImage: "linear-gradient(180deg, rgba(28, 29, 31, 1), 80%, rgba(0,0,0,0))",
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

export default function Loading({ title, subtitle }: Loading) {
  return (
    <Box position="relative" height="100%" width="500px">
      <Animation />
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
        <Text variant="body" fontSize={14} color={"hsla(0, 0%, 75%, 1)"}>
          {subtitle}
        </Text>
      </Flex>
    </Box>
  );
}
