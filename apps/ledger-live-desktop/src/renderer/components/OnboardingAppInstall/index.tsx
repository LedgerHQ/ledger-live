import React, { useCallback, useEffect, useState } from "react";
import { Flex, Text, Button } from "@ledgerhq/react-ui";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DeviceModelInfo } from "@ledgerhq/types-live";
import { useTranslation } from "react-i18next";
import { getDeviceModel } from "@ledgerhq/devices";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import DefaultAppsIllustration from "./DefaultAppsIllustration";
import RestoreAppsIllustration from "./RestoreAppsIllustration";
import CancelModal from "./CancelModal";
import InstallSetOfApps from "./InstallSetOfApps";
import LockedModal from "./LockedModal";
import TrackPage from "~/renderer/analytics/TrackPage";
import { analyticsFlowName } from "../SyncOnboarding/Manual/shared";
import { track, trackPage } from "~/renderer/analytics/segment";

const fallbackDefaultAppsToInstall = ["Bitcoin", "Ethereum", "Polygon"];

type Props = {
  device: Device | null | undefined;
  /**
   * Optional prop that will override the apps to install if present
   */
  deviceToRestore?: DeviceModelInfo | null | undefined;
  setHeaderLoader: (hasLoader: boolean) => void;
  onComplete: () => void;
  onError?: (error: Error) => void;
};

/**
 * OnboardingAppInstallStep wraps the InstallSetOfApps component and handle its
 * dependencies, the display of modals and the mounting of InstallSetOfApps which
 * will then start the installation directly
 */
const OnboardingAppInstallStep = ({
  device,
  deviceToRestore,
  setHeaderLoader,
  onComplete,
  onError,
}: Props) => {
  const { t } = useTranslation();
  const deviceInitialApps = useFeature("deviceInitialApps");
  const [dependencies, setDependencies] = useState<string[]>([]);
  const [inProgress, setInProgress] = useState<boolean>(false);
  const [isCancelModalOpen, setCancelModalOpen] = useState<boolean>(false);
  const [isLockedModalOpen, setLockedModalOpen] = useState<boolean>(false);

  const productName = device ? getDeviceModel(device.modelId)?.productName : "Ledger Device";

  const deviceToRestoreName = deviceToRestore?.modelId
    ? getDeviceModel(deviceToRestore?.modelId).productName
    : deviceToRestore?.modelId;

  useEffect(() => {
    if (deviceToRestore?.apps) {
      setDependencies(deviceToRestore.apps.map(app => app.name));
    } else if (deviceInitialApps?.params?.apps) {
      setDependencies(deviceInitialApps.params.apps);
    } else {
      setDependencies(fallbackDefaultAppsToInstall);
    }
  }, [deviceInitialApps, deviceToRestore]);

  const handleRetry = useCallback(() => {
    setCancelModalOpen(false);
    setLockedModalOpen(false);
    setInProgress(true);
  }, []);

  const handleCancel = useCallback(() => {
    setInProgress(false);
    setCancelModalOpen(true);
  }, []);

  const handleError = useCallback(
    (error: Error) => {
      if (onError) {
        onError(error);
      } else {
        setHeaderLoader(false);
        setInProgress(false);
        const errorActions = new Map<string, () => void>([
          ["LockedDeviceError", () => setLockedModalOpen(true)],
          ["default", () => setCancelModalOpen(true)],
        ]);
        (errorActions.get(error.name) || errorActions.get("default"))!();
      }
    },
    [setHeaderLoader, onError],
  );

  const handlePressSkip = useCallback(() => {
    track("button_clicked2", { button: "maybe later", flow: analyticsFlowName });
    onComplete();
  }, [onComplete]);

  const handlePressInstall = useCallback(() => {
    track("button_clicked2", {
      button: deviceToRestore ? "Restore applications" : "Install applications",
      flow: analyticsFlowName,
    });
    setInProgress(true);
  }, [deviceToRestore]);

  const handleCancelModalRetryPressed = useCallback(() => {
    track("button_clicked2", {
      button: "Install now",
      flow: analyticsFlowName,
    });
    handleRetry();
  }, [handleRetry]);

  const handleCancelModalSkipPressed = useCallback(() => {
    track("button_clicked2", {
      button: "I'll do this later",
      flow: analyticsFlowName,
    });
    onComplete();
  }, [onComplete]);

  const handleInstallComplete = useCallback(() => {
    trackPage(
      `Set up ${productName}: Step 5  Successful`,
      undefined,
      { flow: analyticsFlowName },
      true,
      true,
    );
    onComplete();
  }, [onComplete, productName]);

  return (
    <>
      {isCancelModalOpen ? (
        <TrackPage
          category={`App installation was cancelled on ${productName}`}
          flow={analyticsFlowName}
          type="modal"
          refreshSource={false}
        />
      ) : null}
      <CancelModal
        isOpen={isCancelModalOpen}
        productName={productName}
        onRetry={handleCancelModalRetryPressed}
        onSkip={handleCancelModalSkipPressed}
      />
      <LockedModal isOpen={isLockedModalOpen} productName={productName} onClose={handleRetry} />
      <TrackPage
        category={
          deviceToRestore
            ? `Set up ${productName}: Step 5 Restore Apps`
            : `Set up ${productName}: Step 5 Install Apps`
        }
        flow={analyticsFlowName}
      />
      {inProgress && device ? (
        <InstallSetOfApps
          device={device}
          dependencies={dependencies}
          setHeaderLoader={setHeaderLoader}
          onComplete={handleInstallComplete}
          onCancel={handleCancel}
          onError={handleError}
        />
      ) : (
        <Flex flexDirection="column">
          <Flex justifyContent="center" alignItems="center" mb={10} mt={4}>
            {deviceToRestore ? <RestoreAppsIllustration /> : <DefaultAppsIllustration />}
          </Flex>
          <Text variant="h5Inter" fontWeight="semiBold" textAlign="center">
            {deviceToRestore
              ? deviceToRestoreName
                ? t("onboardingAppInstall.restore.title", { deviceName: deviceToRestoreName })
                : t("onboardingAppInstall.restore.titleNoDeviceName")
              : t("onboardingAppInstall.default.title", { productName })}
          </Text>
          <Text variant="paragraphLineHeight" color="neutral.c70" textAlign="center" mt={2}>
            {t(`onboardingAppInstall.${deviceToRestore ? "restore" : "default"}.subtitle`, {
              productName,
            })}
          </Text>
          <Flex pt={8} pb={2} justifyContent="space-between">
            <Button
              variant="shade"
              outline
              flex={1}
              onClick={handlePressSkip}
              data-testid="skip-cta-button"
            >
              {t(`onboardingAppInstall.${deviceToRestore ? "restore" : "default"}.skipCTA`)}
            </Button>
            <Flex px={2} />
            <Button
              flex={1}
              variant="main"
              onClick={handlePressInstall}
              data-testid="install-cta-button"
            >
              {t(`onboardingAppInstall.${deviceToRestore ? "restore" : "default"}.installCTA`)}
            </Button>
          </Flex>
        </Flex>
      )}
    </>
  );
};

export default OnboardingAppInstallStep;
