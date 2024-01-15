import React from "react";
import Lottie, { LottieProps } from "react-lottie";
import { Flex } from "@ledgerhq/react-ui";
import { getEnv } from "@ledgerhq/live-env";
const Animation = ({
  className = "",
  animation,
  loop = true,
  autoplay = true,
  width = "100%",
  height = "auto",
  rendererSettings = {
    preserveAspectRatio: "xMidYMin",
  },
  isPaused = false,
  isStopped = false,
}: {
  className?: string;
  animation: unknown;
  width?: string;
  height?: string;
  loop?: boolean;
  autoplay?: boolean;
  rendererSettings?: LottieProps["options"]["rendererSettings"];
  isPaused?: boolean;
  isStopped?: boolean;
}) => {
  // in case of playwright tests, we want to completely stop the animation
  const isPlaywright = !!getEnv("PLAYWRIGHT_RUN");
  return animation ? (
    <Flex
      className={className}
      style={{
        maxHeight: `200px`,
        maxWidth: `500px`,
      }}
    >
      <Lottie
        style={{ width, height }}
        isClickToPauseDisabled
        ariaRole="animation"
        isPaused={isPaused}
        isStopped={isStopped}
        options={{
          loop,
          autoplay: !isPlaywright && autoplay,
          animationData: animation,
          rendererSettings,
        }}
      />
    </Flex>
  ) : null;
};
export default Animation;
