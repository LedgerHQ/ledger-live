import React, { useEffect, useMemo } from "react";
import { Alert, Flex, InfiniteLoader, Text } from "@ledgerhq/react-ui";
import { createAction } from "@ledgerhq/live-common/hw/actions/app";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { SkipReason } from "@ledgerhq/live-common/apps/types";
import connectApp from "@ledgerhq/live-common/hw/connectApp";
import { getDeviceModel } from "@ledgerhq/devices";

import { useTranslation } from "react-i18next";
import { UserRefusedAllowManager } from "@ledgerhq/errors";
import { mockedEventEmitter } from "~/renderer/components/debug/DebugMock";

import AppInstallItem, { ItemState } from "./AppInstallItem";
import AllowManagerModal from "./AllowManagerModal";
import { getEnv } from "@ledgerhq/live-common/env";

const action = createAction(getEnv("MOCK") ? mockedEventEmitter : connectApp);

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
  const productName = getDeviceModel(device.modelId).productName;

  const commandRequest = useMemo(
    () => ({
      dependencies: dependencies.map(appName => ({ appName })),
      appName: "BOLOS",
      withInlineInstallProgress: true,
      allowPartialDependencies: true,
    }),
    [dependencies],
  );

  const status = action.useHook(device, commandRequest);

  const {
    skippedAppOps,
    installQueue,
    listedApps,
    error,
    currentAppOp,
    itemProgress,
    progress,
    opened,

    isLocked,
    allowManagerGranted,
    isLoading,
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

  const installing = !opened && typeof progress === "number" && currentAppOp;
  const missingApps = skippedAppOps?.some(
    skippedAppOp => skippedAppOp.reason === SkipReason.NoSuchAppOnProvider,
  );

  if (opened) {
    onComplete();
    return null;
  }

  return (
    <>
      <AllowManagerModal
        isOpen={!isLoading && !allowManagerGranted && !error}
        status={status}
        request={commandRequest}
      />
      <Flex height="100%">
        <Flex flex={1} alignItems="flex-start" flexDirection="column">
          <Flex style={{ width: "100%" }} flexDirection="row" justifyContent="space-between" mb={6}>
            {installing ? (
              <Text data-test-id="installing-text">
                {t("onboardingAppInstall.progress.progress")}
              </Text>
            ) : (
              <>
                <Text>{t("onboardingAppInstall.progress.resolving")}</Text>
                <InfiniteLoader size={20} />
              </>
            )}
          </Flex>
          {missingApps ? (
            <Alert title={t("onboardingAppInstall.progress.skippedInfo", { productName })} />
          ) : null}
          {!!missingApps && <Flex mb={6} />}
          {dependencies?.map((appName, i) => {
            const skipped = skippedAppOps.find(skippedAppOp => skippedAppOp.appOp.name === appName);

            const state = !listedApps
              ? ItemState.Idle
              : currentAppOp?.name === appName
              ? ItemState.Active
              : skipped?.reason === SkipReason.NoSuchAppOnProvider
              ? ItemState.Skipped
              : !installQueue?.includes(appName) ||
                skipped?.reason === SkipReason.AppAlreadyInstalled
              ? ItemState.Installed
              : ItemState.Idle;

            return (
              <AppInstallItem
                key={appName}
                i={i}
                appName={appName}
                state={state}
                productName={productName}
                itemProgress={itemProgress}
              />
            );
          })}
        </Flex>
      </Flex>
    </>
  );
};

export default InstallSetOfApps;
