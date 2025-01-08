import React from "react";
import { useTheme } from "styled-components/native";

import GradientContainer from "~/components/GradientContainer";
import Animation from "~/components/Animation";

import lottie from "~/animations/lottie.json";

function AnimatedGradient() {
  const { colors } = useTheme();

  return (
    <GradientContainer
      color={colors.background.main}
      startOpacity={1}
      endOpacity={0}
      containerStyle={{ borderRadius: 0, position: "absolute", bottom: 0, left: 0 }}
      gradientStyle={{ zIndex: 1 }}
    >
      <Animation style={{ width: "100%" }} source={lottie} />
    </GradientContainer>
  );
}

export default AnimatedGradient;
