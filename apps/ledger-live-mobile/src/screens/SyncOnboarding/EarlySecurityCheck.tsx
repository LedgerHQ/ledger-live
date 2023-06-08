import React, { useEffect } from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import { Device } from "@ledgerhq/types-devices";

// Only while the ESC implementation is missing
/* eslint-disable i18next/no-literal-string */

export type EarlySecurityCheckProps = {
  /**
   * A `Device` object
   */
  device: Device;
  /**
   * Function called once the ESC step is finished
   */
  notifyOnboardingEarlyCheckEnded: () => void;
};

/**
 * Component representing the early security checks step, which polls the current device state
 * to display correctly information about the onboarding to the user
 */
export const EarlySecurityCheck: React.FC<EarlySecurityCheckProps> = ({
  device: _device,
  notifyOnboardingEarlyCheckEnded,
}) => {
  // To implement
  // const [currentStep, setCurrentStep] = useState<
  //   "idle" | "genuine-check" | "firmware-update-check" | "firmware-updating"
  // >("idle");

  // For now short circuiting the ESC step
  useEffect(() => {
    notifyOnboardingEarlyCheckEnded();
  }, [notifyOnboardingEarlyCheckEnded]);

  return (
    <Flex
      height="100%"
      width="100%"
      justifyContent="center"
      alignItems="center"
    >
      <Text>Early Security Check placeholder</Text>
    </Flex>
  );
};
