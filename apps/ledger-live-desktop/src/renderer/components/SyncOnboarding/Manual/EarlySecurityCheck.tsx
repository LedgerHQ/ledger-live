import React, { useEffect } from "react";
import { Flex, Text } from "@ledgerhq/react-ui";
import { Device } from "@ledgerhq/live-common/hw/actions/types";

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
  // TODO: To implement
  // const [currentStep, setCurrentStep] = useState<
  //   "idle" | "genuine-check" | "firmware-update-check" | "firmware-updating"
  // >("idle");

  // FIXME: For now short circuiting the ESC step
  useEffect(() => {
    notifyOnboardingEarlyCheckEnded();
  }, [notifyOnboardingEarlyCheckEnded]);

  return (
    <Flex height="100%" width="100%" justifyContent="center" alignItems="center">
      <Text>Early Security Check placeholder</Text>
    </Flex>
  );
};
