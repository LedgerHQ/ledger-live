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

const fallbackDefaultAppsToInstall = ["Bitcoin", "Ethereum", "Polygon"];

type Props = {
  device: Device;
  restoreDevice?: DeviceModelInfo;
  onComplete?: () => void;
  onError?: (error: Error) => void;
};

const OnboardingAppInstallStep = ({ device, restoreDevice, onComplete, onError }: Props) => {
  const { t } = useTranslation();
  const deviceInitialApps = useFeature("deviceInitialApps");
  const [dependencies, setDependencies] = useState<string[]>([]);
  const [inProgress, setInProgress] = useState<boolean>(false);
  const [isCancelModalOpen, setCancelModalOpen] = useState<boolean>(false);

  const productName = device ? getDeviceModel(device.modelId)?.productName : "Ledger Device";

  const restoreDeviceName = restoreDevice?.modelId
    ? getDeviceModel(restoreDevice?.modelId).productName
    : restoreDevice?.modelId;

  useEffect(() => {
    if (restoreDevice) {
      setDependencies(restoreDevice.apps.map(app => app.name));
    } else if (deviceInitialApps?.params?.apps) {
      setDependencies(deviceInitialApps.params.apps);
    } else {
      setDependencies(fallbackDefaultAppsToInstall);
    }
  }, [deviceInitialApps, restoreDevice]);

  const handleRetry = useCallback(() => {
    setCancelModalOpen(false);
  }, []);

  const handleSkip = useCallback(() => {
    if (onComplete) {
      onComplete();
    }
  }, [onComplete]);

  const handleComplete = useCallback(() => {
    if (onComplete) {
      onComplete();
    }
  }, [onComplete]);

  const handleCancel = useCallback(() => {
    setInProgress(false);
    setCancelModalOpen(true);
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
        onSkip={handleSkip}
      />
      {inProgress ? (
        <InstallSetOfApps
          device={device}
          dependencies={dependencies}
          onComplete={handleComplete}
          onCancel={handleCancel}
          onError={handleError}
        />
      ) : (
        <Flex flexDirection="column">
          <Flex justifyContent="center" alignItems="center" mb={10} mt={4}>
            {restoreDevice ? <RestoreAppsIllustration /> : <DefaultAppsIllustration />}
          </Flex>
          <Text variant="h5Inter" fontWeight="semiBold" textAlign="center">
            {restoreDevice
              ? restoreDeviceName
                ? t("onboardingAppInstall.restore.title", { deviceName: restoreDeviceName })
                : t("onboardingAppInstall.restore.titleNoDeviceName")
              : t("onboardingAppInstall.default.title", { productName })}
          </Text>
          <Text variant="paragraphLineHeight" color="neutral.c70" textAlign="center" mt={2}>
            {t(`onboardingAppInstall.${restoreDevice ? "restore" : "default"}.subtitle`)}
          </Text>
          <Flex pt={8} pb={2} justifyContent="space-between">
            <Button flex={1} onClick={handleSkip}>
              {t(`onboardingAppInstall.${restoreDevice ? "restore" : "default"}.skipCTA`)}
            </Button>
            <Flex px={2} />
            <Button flex={1} variant="main" onClick={() => setInProgress(true)}>
              {t(`onboardingAppInstall.${restoreDevice ? "restore" : "default"}.installCTA`)}
            </Button>
          </Flex>
        </Flex>
      )}
    </>
  );
};

export default OnboardingAppInstallStep;
