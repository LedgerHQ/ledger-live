import React from "react";
import Lottie from "react-lottie";
const Animation = ({
  animation,
  width = "100%",
  height = "100%",
  loop = true,
  autoplay = true,
  rendererSettings = {
    preserveAspectRatio: "xMidYMin",
  },
  isPaused = false,
  isStopped = false,
}: {
  animation: object;
  width?: string;
  height?: string;
  loop?: boolean;
  autoplay?: boolean;
  rendererSettings?: any;
  isPaused?: boolean;
  isStopped?: boolean;
}) => (
  <Lottie
    isClickToPauseDisabled
    ariaRole="animation"
    height={height}
    width={width}
    isPaused={isPaused}
    isStopped={isStopped}
    options={{
      loop: loop,
      autoplay: autoplay,
      animationData: animation,
      rendererSettings,
    }}
  />
);
export default Animation;
