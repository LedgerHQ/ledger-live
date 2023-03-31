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

const fallbackDefaultAppsToInstall = ["Bitcoin", "Ethereum", "Polygon"];

type Props = {
  device: Device | null | undefined;
  /**
   * Optional prop that will override the apps to install if present
   */
  deviceToRestore?: DeviceModelInfo | null | undefined;
  onComplete: () => void;
  onError: (error: Error) => void;
};

/**
 * OnboardingAppInstallStep wraps the InstallSetOfApps component and handle its
 * dependencies, the display of modals and the mounting of InstallSetOfApps which
 * will then start the installation directly
 */
const OnboardingAppInstallStep = ({ device, deviceToRestore, onComplete, onError }: Props) => {
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
    if (deviceToRestore) {
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
  }, []);

  const handleCancel = useCallback(() => {
    setInProgress(false);
    setCancelModalOpen(true);
  }, []);

  const handleLocked = useCallback(() => {
    setInProgress(false);
    setLockedModalOpen(true);
  }, []);

  const handleError = useCallback(
    (error: Error) => {
      if (onError) {
        onError(error);
      }
    },
    [onError],
  );

  return (
    <>
      <CancelModal
        isOpen={isCancelModalOpen}
        productName={productName}
        onRetry={handleRetry}
        onSkip={onComplete}
      />
      <LockedModal isOpen={isLockedModalOpen} productName={productName} onClose={handleRetry} />
      {inProgress && device ? (
        <InstallSetOfApps
          device={device}
          dependencies={dependencies}
          onComplete={onComplete}
          onCancel={handleCancel}
          onLocked={handleLocked}
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
            {t(`onboardingAppInstall.${deviceToRestore ? "restore" : "default"}.subtitle`)}
          </Text>
          <Flex pt={8} pb={2} justifyContent="space-between">
            <Button flex={1} onClick={onComplete} data-test-id="skip-cta-button">
              {t(`onboardingAppInstall.${deviceToRestore ? "restore" : "default"}.skipCTA`)}
            </Button>
            <Flex px={2} />
            <Button
              flex={1}
              variant="main"
              onClick={() => setInProgress(true)}
              data-test-id="install-cta-button"
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
