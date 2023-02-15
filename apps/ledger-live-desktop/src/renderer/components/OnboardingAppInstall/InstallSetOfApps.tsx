import React, { useEffect, useMemo } from "react";
import { Flex, Text } from "@ledgerhq/react-ui";
import { createAction } from "@ledgerhq/live-common/hw/actions/app";
import connectApp from "@ledgerhq/live-common/hw/connectApp";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useTranslation } from "react-i18next";
import { UserRefusedAllowManager } from "@ledgerhq/errors";

import AppInstallItem from "./AppInstallItem";
import AllowManagerModal from "./AllowManagerModal";

const action = createAction(connectApp);

type Props = {
  device: Device;
  dependencies: string[];
  onComplete: () => void;
  onCancel: () => void;
  onLocked: () => void;
  onError: (error: Error) => void;
};

const InstallSetOfApps = ({
  device,
  dependencies,
  onComplete,
  onCancel,
  onLocked,
  onError,
}: Props) => {
  const { t } = useTranslation();

  const request = useMemo(
    () => ({
      dependencies: dependencies.map(appName => ({ appName })),
      appName: "BOLOS",
      withInlineInstallProgress: true,
      skipAppInstallIfNotFound: true,
    }),
    [dependencies],
  );

  const status = action.useHook(device, request);

  const {
    isLoading,
    allowManagerGranted,
    listingApps,
    error,
    currentAppOp,
    itemProgress,
    progress,
    opened,
    installQueue,
    isLocked,
  } = status;

  useEffect(() => {
    if (isLocked) {
      onLocked();
    }
  }, [isLocked, onLocked]);

  useEffect(() => {
    if (error instanceof UserRefusedAllowManager) {
      onCancel();
    } else if (onError && error) {
      onError(error);
    }
  }, [error, onError, onCancel]);

  useEffect(() => {
    if (opened) {
      onComplete();
    }
  }, [opened, onComplete]);

  if (opened) {
    return null;
  }

  return (
    <>
      <AllowManagerModal
        isOpen={!isLoading && !allowManagerGranted && !error}
        status={status}
        request={request}
      />
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
    </>
  );
};

export default InstallSetOfApps;
