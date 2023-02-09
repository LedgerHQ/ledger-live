import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Flex, Text } from "@ledgerhq/react-ui";
import { createAction } from "@ledgerhq/live-common/hw/actions/app";
import connectApp from "@ledgerhq/live-common/hw/connectApp";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DeviceModelInfo } from "@ledgerhq/types-live";
import { useTranslation } from "react-i18next";
import { getDeviceModel } from "@ledgerhq/devices";
import { useDispatch } from "react-redux";
import { UserRefusedAllowManager } from "@ledgerhq/errors";

import Button from "../ButtonV3";
import DefaultAppsIllustration from "./DefaultAppsIllustration";
import RestoreAppsIllustration from "./RestoreAppsIllustration";
import AppInstallItem from "./AppInstallItem";
import OnboardingAppInstallModal from "./OnboardingAppInstallModal";
import InstallCancelledModal from "./InstallCancelledModal";

const DEFAULT_APPS_TO_INSTALL_FALLBACK = ["Ethereum", "Polygon"];

const action = createAction(connectApp);

type Props = {
  device?: Device;
  restoreDevice?: DeviceModelInfo;
  onComplete: () => void;
  onError?: (error: Error) => void;
};

const OnboardingAppInstallStep = ({ device, restoreDevice, onComplete, onError }: Props) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const [dependencies, setDependencies] = useState<string[]>(DEFAULT_APPS_TO_INSTALL_FALLBACK);
  const [inProgress, setInProgress] = useState<boolean>(false);
  const [isAllowManagerModalOpen, setAllowManagerModalOpen] = useState<boolean>(false);
  const [isInstallCancelledModalOpen, setInstallCancelledModalOpen] = useState<boolean>(false);

  const productName = device ? getDeviceModel(device.modelId)?.productName : "Ledger Device";

  useEffect(() => {
    if (restoreDevice) {
      setDependencies(restoreDevice.apps.map(app => app.name));
    }
  }, [restoreDevice]);

  const restoreDeviceName = restoreDevice?.modelId
    ? getDeviceModel(restoreDevice?.modelId).productName
    : restoreDevice?.modelId;

  const commandRequest = useMemo(
    () => ({
      dependencies: dependencies.map(appName => ({ appName })),
      appName: "BOLOS",
      withInlineInstallProgress: true,
      skipAppInstallIfNotFound: true,
    }),
    [dependencies],
  );

  const status = action.useHook(inProgress ? device : undefined, commandRequest);

  const {
    allowManagerRequestedWording,
    listingApps,
    error,
    currentAppOp,
    itemProgress,
    progress,
    opened,
    installQueue,
  } = status;

  const handleCancel = useCallback(() => {
    setInProgress(false);
    setAllowManagerModalOpen(false);
    setInstallCancelledModalOpen(true);
  }, []);

  const handleRetry = useCallback(() => {
    setInstallCancelledModalOpen(false);
    setInProgress(true);
  }, []);

  useEffect(() => {
    if (error instanceof UserRefusedAllowManager) {
      handleCancel();
    } else if (onError && error) {
      onError(error);
    }
  }, [dispatch, error, onError, handleCancel]);

  useEffect(() => {
    if (allowManagerRequestedWording) {
      setAllowManagerModalOpen(true);
    }
  }, [allowManagerRequestedWording]);

  const handleSkip = useCallback(() => {
    setInstallCancelledModalOpen(false);
    if (onComplete) {
      onComplete();
    }
  }, [onComplete]);

  if (opened) {
    setInProgress(false);
    if (onComplete) {
      onComplete();
    }
    return null;
  }

  const renderInstallsInProgress = () => {
    return (
      <Flex height="100%" flexDirection="column">
        <Flex flex={1} alignItems="center">
          <Flex mb={2} alignSelf="flex-start">
            <Text mb={5} variant="paragraphLineHeight">
              {listingApps
                ? t("onboardingAppInstall.progress.resolving")
                : typeof progress === "number" && currentAppOp
                ? t("onboardingAppInstall.progress.progress", {
                    progress: Math.round(progress * 100),
                  })
                : t("onboardingAppInstall.progress.loading")}
            </Text>
          </Flex>
        </Flex>
        <Flex flexDirection="column" mt={2} mb={4}>
          {itemProgress !== undefined
            ? dependencies.map((appName, index) => (
                <AppInstallItem
                  key={appName}
                  appName={appName}
                  index={index}
                  isActive={currentAppOp?.name === appName}
                  installed={progress ? !installQueue?.includes(appName) : undefined}
                  itemProgress={itemProgress}
                />
              ))
            : null}
        </Flex>
        <Text variant="paragraphLineHeight" color="neutral.c70">
          {t("onboardingAppInstall.progress.disclaimer")}
        </Text>
      </Flex>
    );
  };

  const renderRestoreAppsConfirmation = () => {
    return (
      <Flex flexDirection="column">
        <Flex justifyContent="center" alignItems="center" mb={10} mt={4}>
          <RestoreAppsIllustration />
        </Flex>
        <Text variant="h5Inter" fontWeight="semiBold" textAlign="center">
          {restoreDeviceName
            ? t("onboardingAppInstall.restore.title", { deviceName: restoreDeviceName })
            : t("onboardingAppInstall.restore.titleNoDeviceName")}
        </Text>
        <Text variant="paragraphLineHeight" color="neutral.c70" textAlign="center" mt={2}>
          {t("onboardingAppInstall.restore.subtitle")}
        </Text>
        <Flex pt={8} pb={2} justifyContent="space-between">
          <Button flex={1} size="small" onClick={handleSkip}>
            {t("onboardingAppInstall.restore.skipCTA")}
          </Button>
          <Flex px={2} />
          <Button flex={1} variant="main" size="small" onClick={() => setInProgress(true)}>
            {t("onboardingAppInstall.restore.installCTA")}
          </Button>
        </Flex>
      </Flex>
    );
  };

  const renderDefaultAppsConfirmation = () => {
    return (
      <Flex flexDirection="column">
        <Flex justifyContent="center" alignItems="center" mb={10} mt={4}>
          <DefaultAppsIllustration />
        </Flex>
        <Text variant="h5Inter" fontWeight="semiBold" textAlign="center">
          {t("onboardingAppInstall.default.title", { productName })}
        </Text>
        <Text variant="paragraphLineHeight" color="neutral.c70" textAlign="center" mt={2}>
          {t("onboardingAppInstall.default.subtitle")}
        </Text>
        <Flex pt={8} pb={2} justifyContent="space-between">
          <Button flex={1} size="small" onClick={handleSkip}>
            {t("onboardingAppInstall.default.skipCTA")}
          </Button>
          <Flex px={2} />
          <Button flex={1} variant="main" size="small" onClick={() => setInProgress(true)}>
            {t("onboardingAppInstall.default.installCTA")}
          </Button>
        </Flex>
      </Flex>
    );
  };

  return (
    <>
      <OnboardingAppInstallModal
        isOpen={isAllowManagerModalOpen}
        status={status}
        request={commandRequest}
      />
      <InstallCancelledModal
        isOpen={isInstallCancelledModalOpen}
        productName={productName}
        onRetry={handleRetry}
        onSkip={handleSkip}
      />
      {inProgress
        ? renderInstallsInProgress()
        : restoreDevice
        ? renderRestoreAppsConfirmation()
        : renderDefaultAppsConfirmation()}
    </>
  );
};

export default OnboardingAppInstallStep;
