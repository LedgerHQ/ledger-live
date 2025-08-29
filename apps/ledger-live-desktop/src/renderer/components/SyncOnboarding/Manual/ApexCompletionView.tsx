import React from "react";
import { Flex } from "@ledgerhq/react-ui";
import { useTheme } from "styled-components";
import onboardingSuccessDark from "./assets/apex/onboardingSuccessDark.mp4";
import onboardingSuccessLight from "./assets/apex/onboardingSuccessLight.mp4";

export default function ApexCompletionView() {
  const {
    colors: {
      palette: { type: theme },
    },
  } = useTheme();
  return (
    <Flex height={"100vh"}>
      <video autoPlay loop height="100%">
        <source
          src={theme === "dark" ? onboardingSuccessDark : onboardingSuccessLight}
          type="video/mp4"
        />
      </video>
    </Flex>
  );
}
