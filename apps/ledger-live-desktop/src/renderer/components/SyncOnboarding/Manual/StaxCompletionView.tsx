import React from "react";
import { Flex } from "@ledgerhq/react-ui";
import CompletedOnboardingDark from "./assets/completeOnboardingDark.mp4";
import CompletedOnboardingLight from "./assets/completeOnboardingLight.mp4";
import { useTheme } from "styled-components";
import { Device } from "@ledgerhq/types-devices";

const videos = {
  dark: CompletedOnboardingDark,
  light: CompletedOnboardingLight,
};

type Props = {
  device?: Device;
};

const StaxCompletionView: React.FC<Props> = () => {
  const { colors } = useTheme();
  const palette = colors.palette.type;
  return (
    <Flex height={"100vh"}>
      <video autoPlay loop height="100%">
        <source src={videos[palette]} type="video/mp4" />
      </video>
    </Flex>
  );
};

export default StaxCompletionView;
