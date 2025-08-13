import React, { useEffect, useRef } from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
/*
 * Constants
 */

const READY_REDIRECT_DELAY_MS = 2500;

const DeviceSeededSuccessPanel = ({ handleNextStep }: { handleNextStep: () => void }) => {
  /*
   * Refs
   */
  const readyRedirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handle move to second step
  useEffect(() => {
    readyRedirectTimerRef.current = setTimeout(handleNextStep, READY_REDIRECT_DELAY_MS);

    return () => {
      if (readyRedirectTimerRef.current) {
        clearTimeout(readyRedirectTimerRef.current);
        readyRedirectTimerRef.current = null;
      }
    };
  }, [handleNextStep]);

  return (
    <Flex height="50px" justifyContent="center" alignItems="center">
      <Text size="h4">Success Panel</Text>
    </Flex>
  );
};

export default DeviceSeededSuccessPanel;
