import React, { useEffect, useState } from "react";
import { StepProps } from "..";

import Language from "./restore/Language";
import CLS from "./restore/CLS";
import { Flex } from "@ledgerhq/react-ui";

/**
 * Different device models or versions may restore more or less settings.
 * This step provides a unified place to render the different device actions
 * that take place for the restoration. If no action is needed the component
 * will simply call the onDone method and move to the next one.
 */
const StepRestore = ({ transitionTo, deviceInfo, updatedDeviceInfo, CLSBackup }: StepProps) => {
  const [pendingRestoreLanguage, setPendingRestoreLanguage] = useState(true);
  const [pendingRestoreCLS, setPendingRestoreCLS] = useState(true);

  useEffect(() => {
    // Still something pending restoration.
    if (pendingRestoreLanguage || pendingRestoreCLS) return;

    transitionTo("finish");
  }, [pendingRestoreCLS, pendingRestoreLanguage, transitionTo]);

  return (
    <Flex>
      {pendingRestoreLanguage ? (
        <Language
          deviceInfo={deviceInfo}
          updatedDeviceInfo={updatedDeviceInfo}
          onDone={() => setPendingRestoreLanguage(false)}
        />
      ) : pendingRestoreCLS ? (
        <CLS CLSBackup={CLSBackup} onDone={() => setPendingRestoreCLS(false)} />
      ) : null}
    </Flex>
  );
};

export default StepRestore;
