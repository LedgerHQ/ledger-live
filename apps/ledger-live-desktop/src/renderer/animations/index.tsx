import React from "react";
import Lottie, { LottieProps } from "react-lottie";
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
  small = false,
}: {
  animation: any;
  width?: string;
  height?: string;
  loop?: boolean;
  autoplay?: boolean;
  rendererSettings?: LottieProps["options"]["rendererSettings"];
  isPaused?: boolean;
  isStopped?: boolean;
  small?: boolean;
}) =>
  animation ? (
    <Flex
      style={{
        maxHeight: small ? "120px" : "200px",
        maxWidth: `500px`,
        marginTop: small ? 20 : undefined,
        paddingLeft: 20,
        paddingRight: 20,
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
