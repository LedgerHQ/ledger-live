import React from "react";
import Lottie, { LottieProps } from "react-lottie";
import { Flex } from "@ledgerhq/react-ui";
import { getEnv } from "@ledgerhq/live-env";
const Animation = ({
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
  animation: unknown;
  width?: string;
  height?: string;
  loop?: boolean;
  autoplay?: boolean;
  rendererSettings?: LottieProps["options"]["rendererSettings"];
  isPaused?: boolean;
  isStopped?: boolean;
}) =>
  animation ? (
    <Flex
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
        isStopped={
          // in case of playwright tests, we want to completely stop the animation
          !!getEnv("PLAYWRIGHT_RUN") || isStopped
        }
        options={{
          loop: loop,
          autoplay: autoplay,
          animationData: animation,
          rendererSettings,
        }}
      />
    </Flex>
  ) : null;
export default Animation;
