import React from "react";
import { Flex } from "@ledgerhq/react-ui";
import onboardingSuccess from "../assets/apex/onboardingSuccess.mp4";

export default function ApexCompletionView() {
  return (
    <Flex height={"100vh"}>
      <video autoPlay loop height="100%">
        <source src={onboardingSuccess} type="video/mp4" />
      </video>
    </Flex>
  );
}
