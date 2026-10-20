import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { Lottie } from "LLM/components/Lottie";
import {
  getAnimationBoxSize,
  getAnimationSize,
  stateAnimations,
  type AnimationTheme,
  type StateAnimation,
} from "../animations";

type SpotAnimationProps = {
  animation: StateAnimation;
  theme: AnimationTheme;
  /** Size of the spot when it does not move. */
  spotSize: number;
  loop: boolean;
  testID?: string;
};

/** Renders an animation centred in a square that is the same for every animation, so that the spot stays in place. */
export function SpotAnimation({
  animation,
  theme,
  spotSize,
  loop,
  testID,
}: Readonly<SpotAnimationProps>): React.ReactNode {
  const boxSize = getAnimationBoxSize(spotSize);

  return (
    <Box
      lx={{ alignItems: "center", justifyContent: "center" }}
      style={{ width: boxSize, height: boxSize }}
    >
      <Lottie
        source={stateAnimations[animation][theme]}
        loop={loop}
        style={getAnimationSize(animation, spotSize)}
        testID={testID}
      />
    </Box>
  );
}
