import React, { useCallback, useEffect } from "react";
import { StepProps } from "..";

import Language from "./restore/Language";
import CLS from "./restore/CLS";
import { Button, Flex } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import {
  ImageCommitRefusedOnDevice,
  ImageLoadRefusedOnDevice,
  LanguageInstallRefusedOnDevice,
} from "@ledgerhq/live-common/errors";
import { renderError } from "~/renderer/components/DeviceAction/rendering";

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
  error,
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
  const { t } = useTranslation();
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

  const isRefusedOnStaxError =
    error instanceof ImageLoadRefusedOnDevice ||
    (error as unknown) instanceof ImageCommitRefusedOnDevice;

  return (
    <Flex key={`nonce_${nonce}`}>
      {(error && error instanceof LanguageInstallRefusedOnDevice) ||
      (error && isRefusedOnStaxError) ? (
        renderError({
          t,
          error: { ...error, name: `Restore${error.name}` }, // NB reuse the thrown error but alter the wording.
          info: true,
        })
      ) : pendingRestoreLanguage ? (
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

export const StepRestoreFooter = ({
  error,
  setError,
  currentRestoreStep,
  completedRestoreSteps,
  setCompletedRestoreSteps,
  setNonce,
  nonce,
  setFirmwareUpdateCompleted,
  isLanguagePromptOpen,
  setConfirmedPrompt,
}: StepProps) => {
  const { t } = useTranslation();

  useEffect(() => {
    // Reset manager if user closes drawer to fetch latest state.
    // Avoid unexpected behavior from outdated firmware info.
    setFirmwareUpdateCompleted(true);
  }, [setFirmwareUpdateCompleted]);

  const onSkip = useCallback(() => {
    setCompletedRestoreSteps([...completedRestoreSteps, currentRestoreStep]);
    setError(null);
  }, [completedRestoreSteps, currentRestoreStep, setCompletedRestoreSteps, setError]);

  const onContinue = useCallback(() => {
    setConfirmedPrompt(true);
    setError(null);
  }, [setConfirmedPrompt, setError]);

  const onRetry = useCallback(() => {
    setNonce(++nonce);
    setError(null);
  }, [setNonce, nonce, setError]);

  return error ? (
    <>
      <Button onClick={onSkip}>{t("common.skip")}</Button>
      <Button variant="main" ml={4} onClick={onRetry}>
        {t("common.retry")}
      </Button>
    </>
  ) : isLanguagePromptOpen ? (
    <>
      <Button onClick={onSkip}>{t("common.skip")}</Button>
      <Button variant="main" ml={4} onClick={onContinue}>
        {t("common.continue")}
      </Button>
    </>
  ) : (
    <Button variant="main" ml={4} disabled>
      {t("common.continue")}
    </Button>
  );
};

export default StepRestore;
