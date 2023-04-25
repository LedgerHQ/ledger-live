import React from "react";
import Lottie from "react-lottie";
import { Flex } from "@ledgerhq/react-ui";
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
  animation: any;
  width?: string;
  height?: string;
  loop?: boolean;
  autoplay?: boolean;
  rendererSettings?: any;
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
        isStopped={isStopped}
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
