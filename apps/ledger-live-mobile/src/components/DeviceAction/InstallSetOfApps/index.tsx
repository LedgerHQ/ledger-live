import React, { useCallback, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { createAction } from "@ledgerhq/live-common/hw/actions/app";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { SkipReason } from "@ledgerhq/live-common/apps/types";
import withRemountableWrapper from "@ledgerhq/live-common/hoc/withRemountableWrapper";
import connectApp from "@ledgerhq/live-common/hw/connectApp";
import {
  Alert,
  Flex,
  ProgressLoader,
  VerticalTimeline,
} from "@ledgerhq/native-ui";
import { getDeviceModel } from "@ledgerhq/devices";
import { DeviceModelInfo } from "@ledgerhq/types-live";

import { TrackScreen, track } from "../../../analytics";
import { DeviceActionDefaultRendering } from "..";
import QueuedDrawer from "../../QueuedDrawer";

import Item, { ItemState } from "./Item";
import Confirmation from "./Confirmation";
import Restore from "./Restore";
import { lastSeenDeviceSelector } from "../../../reducers/settings";

type Props = {
  restore?: boolean;
  dependencies?: string[];
  device: Device;
  onResult: (done: boolean) => void;
  onError?: (error: Error) => void;
};

const action = createAction(connectApp);

/**
 * This component overrides the default rendering for device actions in some
 * cases, falling back to the default one for the rest. Actions such as user blocking
 * requests, errors and such will be rendered in a QueuedDrawer whereas installation
 * progress and loading states will be handled inline as part of the screen where this
 * this is rendered.
 */
const InstallSetOfApps = ({
  restore = false,
  dependencies = [],
  device: selectedDevice,
  onResult,
  onError,
  remountMe,
}: Props & { remountMe: () => void }) => {
  const { t } = useTranslation();
  const [userConfirmed, setUserConfirmed] = useState(false);
  const productName = getDeviceModel(selectedDevice.modelId).productName;
  const lastSeenDevice: DeviceModelInfo | null | undefined = useSelector(
    lastSeenDeviceSelector,
  );
  const lastDeviceProductName = lastSeenDevice?.modelId
    ? getDeviceModel(lastSeenDevice?.modelId).productName
    : lastSeenDevice?.modelId;

  const shouldRestoreApps = restore && !!lastSeenDevice;

  const dependenciesToInstall = useMemo(() => {
    if (shouldRestoreApps && lastSeenDevice) {
      return lastSeenDevice.apps.map(app => app.name);
    }
    if (shouldRestoreApps && !lastSeenDevice) {
      return [];
    }
    return dependencies;
  }, [shouldRestoreApps, dependencies, lastSeenDevice]);

  const commandRequest = useMemo(
    () => ({
      dependencies: dependenciesToInstall.map(appName => ({ appName })),
      appName: "BOLOS",
      withInlineInstallProgress: true,
      allowPartialDependencies: true,
    }),
    [dependenciesToInstall],
  );

  const status = action.useHook(
    userConfirmed ? selectedDevice : undefined,
    commandRequest,
  );

  const {
    allowManagerRequestedWording,
    skippedAppOps,
    installQueue,
    listedApps,
    error,
    currentAppOp,
    itemProgress,
    progress,
    opened,
  } = status;

  const onWrappedError = useCallback(() => {
    if (error) {
      if (onError) {
        onError(error);
      }
      // We force the component to remount for action.useHook to re-run from
      // scratch and reset the status value
      remountMe();
    }
  }, [remountMe, error, onError]);

  const installing = !opened && typeof progress === "number" && currentAppOp;
  const missingApps = skippedAppOps?.some(
    skippedAppOp => skippedAppOp.reason === SkipReason.NoSuchAppOnProvider,
  );

  if (opened) {
    onResult(true);
    return error ? null : (
      <TrackScreen category="Step 5: Install apps - successful" />
    );
  }

  return userConfirmed ? (
    <Flex height="100%">
      <Flex flex={1} alignItems="flex-start">
        <Flex
          style={{ width: "100%" }}
          flexDirection="row"
          justifyContent="space-between"
          mb={6}
        >
          {installing ? (
            <VerticalTimeline.BodyText>
              {t("installSetOfApps.ongoing.progress")}
            </VerticalTimeline.BodyText>
          ) : (
            <>
              <VerticalTimeline.BodyText>
                {t("installSetOfApps.ongoing.resolving")}
              </VerticalTimeline.BodyText>
              <ProgressLoader infinite radius={10} strokeWidth={2} />
            </>
          )}
        </Flex>
        {missingApps ? (
          <Alert
            title={t("installSetOfApps.ongoing.skippedInfo", { productName })}
          />
        ) : null}
        {!!missingApps && <Flex mb={6} />}
        {dependenciesToInstall?.map((appName, i) => {
          const skipped = skippedAppOps.find(
            skippedAppOp => skippedAppOp.appOp.name === appName,
          );

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
            <>
              {!shouldRestoreApps && currentAppOp?.name === appName && (
                <TrackScreen category={`Installing ${appName}`} />
              )}
              <Item
                key={appName}
                i={i}
                appName={appName}
                state={state}
                productName={productName}
                itemProgress={itemProgress}
              />
            </>
          );
        })}
      </Flex>
      <QueuedDrawer
        isRequestingToBeOpened={!!allowManagerRequestedWording || !!error}
        onClose={onWrappedError}
        onModalHide={onWrappedError}
      >
        <Flex alignItems="center">
          <Flex flexDirection="row">
            <DeviceActionDefaultRendering
              status={status}
              device={selectedDevice}
            />
          </Flex>
        </Flex>
      </QueuedDrawer>
    </Flex>
  ) : shouldRestoreApps ? (
    <>
      <TrackScreen category="Restore Applications Start" />
      <Restore
        deviceName={lastDeviceProductName}
        onConfirm={() => {
          track("button_clicked", { button: "Restore applications" });
          setUserConfirmed(true);
        }}
        onReject={() => {
          track("button_clicked", { button: "I'll do this later" });
          onResult(false);
        }}
      />
    </>
  ) : (
    <>
      <TrackScreen category="Install Applications Start" />
      <Confirmation
        productName={productName}
        onConfirm={() => {
          track("button_clicked", { button: "Install applications" });
          setUserConfirmed(true);
        }}
        onReject={() => {
          track("button_clicked", { button: "I'll do this later" });
          onResult(false);
        }}
      />
    </>
  );
};

export default withRemountableWrapper(InstallSetOfApps);
