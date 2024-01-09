import React, { useCallback, useEffect } from "react";
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
const StepRestore = ({
  transitionTo,
  deviceInfo,
  updatedDeviceInfo,
  CLSBackup,
  setError,
  setCurrentRestoreStep,
  setCompletedRestoreSteps,
  setIsLanguagePromptOpen,
  isLanguagePromptOpen,
  confirmedPrompt,
  completedRestoreSteps,
  deviceModelId,
  nonce,
}: StepProps) => {
  const pendingRestoreLanguage = !completedRestoreSteps.includes("language");
  const pendingRestoreCLS = !completedRestoreSteps.includes("CLS");

  const onCompleteLanguageRestore = useCallback(() => {
    setCompletedRestoreSteps([...completedRestoreSteps, "language"]);
    setError(null);
  }, [completedRestoreSteps, setCompletedRestoreSteps, setError]);

  const onCompleteCLSRestore = useCallback(() => {
    setCompletedRestoreSteps([...completedRestoreSteps, "CLS"]);
    setError(null);
  }, [completedRestoreSteps, setCompletedRestoreSteps, setError]);

  useEffect(() => {
    // Still something pending restoration.
    if (pendingRestoreLanguage) {
      setCurrentRestoreStep("language");
      return;
    }

    if (pendingRestoreCLS) {
      setCurrentRestoreStep("CLS");
      return;
    }

    transitionTo("finish");
  }, [pendingRestoreCLS, pendingRestoreLanguage, setCurrentRestoreStep, transitionTo]);

  return (
    <Flex key={`nonce_${nonce}`}>
      {pendingRestoreLanguage ? (
        <Language
          key={nonce}
          deviceModelId={deviceModelId}
          deviceInfo={deviceInfo}
          updatedDeviceInfo={updatedDeviceInfo}
          onDone={onCompleteLanguageRestore}
          setError={setError}
          setIsLanguagePromptOpen={setIsLanguagePromptOpen}
          isLanguagePromptOpen={isLanguagePromptOpen}
          confirmedPrompt={confirmedPrompt}
        />
      ) : pendingRestoreCLS ? (
        <CLS CLSBackup={CLSBackup} onDone={onCompleteCLSRestore} setError={setError} />
      ) : null}
    </Flex>
  );
};

export default StepRestore;
