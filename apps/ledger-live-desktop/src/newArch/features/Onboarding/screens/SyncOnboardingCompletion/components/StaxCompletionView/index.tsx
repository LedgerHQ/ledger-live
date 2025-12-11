import React from "react";
import { Flex } from "@ledgerhq/react-ui";
import { useTheme } from "styled-components";
import onboardingSuccessDark from "../../assets/stax/onboardingSuccessDark.mp4";
import onboardingSuccessLight from "../../assets/stax/onboardingSuccessLight.mp4";

export default function StaxCompletionView() {
  const {
    colors: {
      palette: { type: theme },
    },
  } = useTheme();
  return (
    <Flex height={"100vh"} data-testid="stax-completion-view">
      <video autoPlay loop height="100%">
        <source
          src={theme === "dark" ? onboardingSuccessDark : onboardingSuccessLight}
          type="video/mp4"
        />
      </video>
    </Flex>
  );
}
